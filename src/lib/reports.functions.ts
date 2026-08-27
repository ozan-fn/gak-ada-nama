import type { Prisma } from "@prisma/client";
import { createServerFn } from "@tanstack/react-start";
import { ensureSession } from "#/lib/auth.functions";
import {
	EnvironmentProviderError,
	fetchAQIByCoordinates,
	fetchWeatherByCoordinates,
} from "#/lib/environment.server";
import { prisma } from "#/lib/prisma";
import {
	ACTIVE_REPORT_STATUSES,
	assessReportRisk,
	getReportSearchBounds,
	getReportSearchCutoff,
	getReportSearchPolicy,
	haversineDistanceMeters,
	resolveRiskAssessmentStatus,
	toValidCoordinates,
} from "#/lib/report-risk-assessment.server";
import type {
	NearbyReportRiskContext,
	ReportAssessmentSummary,
	RiskAssessmentStatus,
	RiskAssessmentView,
} from "#/types/report-assessment";

const ENVIRONMENT_TIMEOUT_MS = 4_000;
const ASSESSMENT_RETRY_COOLDOWN_MS = 5_000;
const MAX_NEARBY_QUERY_CANDIDATES = 100;

const reportResultInclude = {
	ecolensAnalysis: true,
	riskAssessment: true,
	user: {
		select: {
			id: true,
			name: true,
			email: true,
			image: true,
		},
	},
} satisfies Prisma.ReportInclude;

type ReportResult = Prisma.ReportGetPayload<{
	include: typeof reportResultInclude;
}>;

type StoredRiskAssessmentSource = Pick<
	NonNullable<ReportResult["riskAssessment"]>,
	| "score"
	| "level"
	| "confidence"
	| "summary"
	| "horizons"
	| "factors"
	| "potentialImpacts"
	| "recommendedActions"
>;

type EnvironmentCollection = {
	snapshot: Prisma.InputJsonObject;
	providerStatus: Prisma.InputJsonObject;
	providerErrors: string[];
};

type AssessmentComputation = EnvironmentCollection & {
	status: RiskAssessmentStatus;
	risk: RiskAssessmentView | null;
	model: string | null;
	errorCode: string | null;
	attempted: boolean;
};

type NearbyReportCandidate = NearbyReportRiskContext & {
	incidentClusterId: string | null;
};

export type CreateReportResult = {
	report: ReportResult;
	assessment: ReportAssessmentSummary;
};

function providerErrorCode(error: unknown): string {
	if (error instanceof EnvironmentProviderError) {
		return `${error.provider}:${error.code}`;
	}

	if (error instanceof DOMException && error.name === "TimeoutError") {
		return "PROVIDER:TIMEOUT";
	}

	return "PROVIDER:UNAVAILABLE";
}

async function collectEnvironmentSnapshot(
	latitude: number,
	longitude: number,
): Promise<EnvironmentCollection> {
	const coordinates = { latitude, longitude };
	const [weatherResult, aqiResult] = await Promise.allSettled([
		fetchWeatherByCoordinates(coordinates, {
			signal: AbortSignal.timeout(ENVIRONMENT_TIMEOUT_MS),
		}),
		fetchAQIByCoordinates(coordinates, {
			signal: AbortSignal.timeout(ENVIRONMENT_TIMEOUT_MS),
		}),
	]);

	const providerErrors: string[] = [];
	const weather =
		weatherResult.status === "fulfilled" ? weatherResult.value : null;
	const aqi = aqiResult.status === "fulfilled" ? aqiResult.value.data : null;

	if (weatherResult.status === "rejected") {
		providerErrors.push(providerErrorCode(weatherResult.reason));
	}
	if (aqiResult.status === "rejected") {
		providerErrors.push(providerErrorCode(aqiResult.reason));
	}

	return {
		snapshot: {
			observedAt: new Date().toISOString(),
			coordinates,
			openMeteo: weather,
			aqicn: aqi,
		},
		providerStatus: {
			openMeteo:
				weatherResult.status === "fulfilled" ? "AVAILABLE" : "UNAVAILABLE",
			aqicn: aqiResult.status === "fulfilled" ? "AVAILABLE" : "UNAVAILABLE",
			errors: providerErrors,
		},
		providerErrors,
	};
}

async function findNearbyReports({
	category,
	latitude,
	longitude,
	excludeReportId,
}: {
	category: string;
	latitude: number;
	longitude: number;
	excludeReportId?: string;
}): Promise<NearbyReportCandidate[]> {
	const policy = getReportSearchPolicy(category);
	const bounds = getReportSearchBounds(
		latitude,
		longitude,
		policy.radiusMeters,
	);
	const reports = await prisma.report.findMany({
		where: {
			category,
			status: { in: [...ACTIVE_REPORT_STATUSES] },
			createdAt: { gte: getReportSearchCutoff(category) },
			latitude: { gte: bounds.minLatitude, lte: bounds.maxLatitude },
			longitude: { gte: bounds.minLongitude, lte: bounds.maxLongitude },
			...(excludeReportId ? { id: { not: excludeReportId } } : {}),
		},
		orderBy: { createdAt: "desc" },
		take: MAX_NEARBY_QUERY_CANDIDATES,
		select: {
			id: true,
			title: true,
			description: true,
			category: true,
			urgency: true,
			status: true,
			locationName: true,
			latitude: true,
			longitude: true,
			createdAt: true,
			incidentClusterId: true,
		},
	});

	return reports
		.flatMap((report) => {
			const coordinates = toValidCoordinates(report.latitude, report.longitude);
			if (!coordinates) return [];

			const distanceMeters = haversineDistanceMeters(
				latitude,
				longitude,
				coordinates.latitude,
				coordinates.longitude,
			);
			if (distanceMeters > policy.radiusMeters) return [];

			return [
				{
					...report,
					latitude: coordinates.latitude,
					longitude: coordinates.longitude,
					distanceMeters,
				},
			];
		})
		.sort((reportA, reportB) => reportA.distanceMeters - reportB.distanceMeters)
		.slice(0, 20);
}

async function computeAssessment({
	report,
	nearbyReports,
	rateLimitKey,
	previousAttemptCount = 0,
}: {
	report: {
		id?: string;
		title: string;
		description: string;
		category: string;
		urgency: string;
		locationName: string;
		latitude?: number | null;
		longitude?: number | null;
		ecolensSummary?: string | null;
	};
	nearbyReports: NearbyReportRiskContext[];
	rateLimitKey: string;
	previousAttemptCount?: number;
}): Promise<AssessmentComputation> {
	const coordinates = toValidCoordinates(report.latitude, report.longitude);
	if (!coordinates) {
		return {
			status: "PENDING",
			risk: null,
			model: null,
			errorCode: "LOCATION_UNAVAILABLE",
			attempted: false,
			snapshot: {
				observedAt: new Date().toISOString(),
				coordinates: null,
			},
			providerStatus: {
				openMeteo: "SKIPPED",
				aqicn: "SKIPPED",
				errors: ["LOCATION_UNAVAILABLE"],
			},
			providerErrors: ["LOCATION_UNAVAILABLE"],
		};
	}

	const environment = await collectEnvironmentSnapshot(
		coordinates.latitude,
		coordinates.longitude,
	);
	const result = await assessReportRisk({
		rateLimitKey,
		report,
		nearbyReports,
		environmentSnapshot: environment.snapshot,
	});

	if (result.success) {
		return {
			...environment,
			status: resolveRiskAssessmentStatus({
				hasRisk: true,
				providerErrorCount: environment.providerErrors.length,
				attemptCount: previousAttemptCount + 1,
			}),
			risk: result.risk,
			model: result.model,
			errorCode: null,
			attempted: true,
		};
	}

	return {
		...environment,
		status: resolveRiskAssessmentStatus({
			hasRisk: false,
			providerErrorCount: environment.providerErrors.length,
			attemptCount: previousAttemptCount + 1,
		}),
		risk: null,
		model: result.model,
		errorCode: result.errorCode,
		attempted: true,
	};
}

function storedRiskToView(
	assessment: StoredRiskAssessmentSource | null,
): RiskAssessmentView | null {
	if (
		!assessment ||
		assessment.score === null ||
		assessment.level === null ||
		assessment.confidence === null ||
		assessment.summary === null ||
		assessment.horizons === null
	) {
		return null;
	}

	return {
		score: assessment.score,
		level: assessment.level as RiskAssessmentView["level"],
		confidence: assessment.confidence,
		summary: assessment.summary,
		factors: assessment.factors,
		potentialImpacts: assessment.potentialImpacts,
		recommendedActions: assessment.recommendedActions,
		horizons: assessment.horizons as RiskAssessmentView["horizons"],
	};
}

function providerErrorsFromRecord(
	providerStatus: Prisma.JsonValue | null,
): string[] {
	if (
		typeof providerStatus !== "object" ||
		providerStatus === null ||
		Array.isArray(providerStatus)
	) {
		return [];
	}

	const errors = providerStatus.errors;
	return Array.isArray(errors)
		? errors.filter((error): error is string => typeof error === "string")
		: [];
}

function storedAssessmentStatusToView(status: string): RiskAssessmentStatus {
	switch (status) {
		case "COMPLETE":
		case "PARTIAL":
		case "PENDING":
		case "FAILED":
			return status;
		default:
			return "PENDING";
	}
}

function resultToPublicView(report: ReportResult): CreateReportResult {
	const assessment = report.riskAssessment;
	return {
		report,
		assessment: {
			status: (assessment?.status ?? "PENDING") as RiskAssessmentStatus,
			nearbyReportCount: assessment?.nearbyReportCount ?? 0,
			incidentClusterId: report.incidentClusterId,
			risk: storedRiskToView(assessment),
			providerErrors: providerErrorsFromRecord(
				assessment?.providerStatus ?? null,
			),
		},
	};
}

export type CreateReportInput = {
	title: string;
	description: string;
	category: string;
	urgency?: string;
	locationName: string;
	latitude?: number;
	longitude?: number;
	images?: string[];
	ecolensAnalysis?: {
		category: string;
		urgency: string;
		summary: string;
		suggestedDescription: string;
		confidence?: number;
		visionModel?: string;
	};
};

export const createReportFn = createServerFn({ method: "POST" })
	.validator((data: CreateReportInput) => {
		if (!data.title?.trim()) {
			throw new Error("Judul laporan wajib diisi");
		}
		if (!data.description?.trim()) {
			throw new Error("Deskripsi laporan wajib diisi");
		}
		if (!data.category?.trim()) {
			throw new Error("Kategori laporan wajib diisi");
		}
		if (!data.locationName?.trim()) {
			throw new Error("Lokasi kejadian wajib diisi");
		}
		const hasLatitude = data.latitude !== undefined;
		const hasLongitude = data.longitude !== undefined;
		if (hasLatitude !== hasLongitude) {
			throw new Error("Koordinat laporan harus lengkap");
		}
		if (hasLatitude && !toValidCoordinates(data.latitude, data.longitude)) {
			throw new Error("Koordinat laporan tidak valid");
		}
		return data;
	})
	.handler(async ({ data }) => {
		const session = await ensureSession();
		const title = data.title.trim();
		const description = data.description.trim();
		const category = data.category.trim();
		const urgency = data.urgency?.trim() || "Sedang";
		const locationName = data.locationName.trim();
		const coordinates = toValidCoordinates(data.latitude, data.longitude);
		const nearbyReports = coordinates
			? await findNearbyReports({
					category,
					latitude: coordinates.latitude,
					longitude: coordinates.longitude,
				})
			: [];
		const computation = await computeAssessment({
			report: {
				title,
				description,
				category,
				urgency,
				locationName,
				latitude: data.latitude,
				longitude: data.longitude,
				ecolensSummary: data.ecolensAnalysis?.summary,
			},
			nearbyReports,
			rateLimitKey: session.user.id,
		});
		// Pilih cluster dari laporan terdekat yang sudah memiliki clusterId.
		// nearbyReports sudah terurut berdasarkan distanceMeters (ascending) dari findNearbyReports,
		// sehingga laporan pertama dengan clusterId adalah kandidat terdekat sesuai plan.
		const nearestWithCluster = nearbyReports.find(
			(report) => report.incidentClusterId !== null,
		);
		const existingClusterId = nearestWithCluster?.incidentClusterId ?? null;
		const shouldCreateCluster =
			coordinates !== null && nearbyReports.length > 0 && !existingClusterId;

		const report = await prisma.report.create({
			data: {
				title,
				description,
				category,
				urgency,
				locationName,
				latitude: data.latitude,
				longitude: data.longitude,
				images: data.images ?? [],
				user: { connect: { id: session.user.id } },
				...(existingClusterId
					? {
							incidentCluster: {
								connect: { id: existingClusterId },
							},
						}
					: shouldCreateCluster && coordinates
						? {
								incidentCluster: {
									create: {
										category,
										centerLatitude: coordinates.latitude,
										centerLongitude: coordinates.longitude,
									},
								},
							}
						: {}),
				riskAssessment: {
					create: {
						status: computation.status,
						score: computation.risk?.score,
						level: computation.risk?.level,
						confidence: computation.risk?.confidence,
						summary: computation.risk?.summary,
						horizons: computation.risk?.horizons as
							| Prisma.InputJsonValue
							| undefined,
						factors: computation.risk?.factors ?? [],
						potentialImpacts: computation.risk?.potentialImpacts ?? [],
						recommendedActions: computation.risk?.recommendedActions ?? [],
						environmentSnapshot: computation.snapshot,
						nearbyReportCount: nearbyReports.length,
						nearbyReportIds: nearbyReports.map((item) => item.id),
						providerStatus: computation.providerStatus,
						model: computation.model,
						attemptCount: computation.attempted ? 1 : 0,
						lastAttemptAt: computation.attempted ? new Date() : undefined,
						errorCode: computation.errorCode,
					},
				},
				...(data.ecolensAnalysis
					? {
							ecolensAnalysis: {
								create: {
									category: data.ecolensAnalysis.category,
									urgency: data.ecolensAnalysis.urgency,
									summary: data.ecolensAnalysis.summary,
									suggestedDescription:
										data.ecolensAnalysis.suggestedDescription,
									confidence: data.ecolensAnalysis.confidence,
									visionModel: data.ecolensAnalysis.visionModel,
								},
							},
						}
					: {}),
			},
			include: reportResultInclude,
		});

		if (report.incidentClusterId && nearbyReports.length > 0) {
			try {
				await prisma.report.updateMany({
					where: {
						id: { in: nearbyReports.map((item) => item.id) },
						incidentClusterId: null,
					},
					data: { incidentClusterId: report.incidentClusterId },
				});
			} catch (error) {
				console.error("[ReportAssessment] cluster linking failed", {
					reportId: report.id,
					incidentClusterId: report.incidentClusterId,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		console.info("[ReportAssessment] created", {
			reportId: report.id,
			status: computation.status,
			nearbyReportCount: nearbyReports.length,
			providerErrors: computation.providerErrors,
			model: computation.model,
			errorCode: computation.errorCode,
		});

		return resultToPublicView(report);
	});

async function loadOwnedReport(
	reportId: string,
	userId: string,
): Promise<ReportResult | null> {
	return prisma.report.findFirst({
		where: { id: reportId, userId },
		include: reportResultInclude,
	});
}

function retryCooldownActive(report: ReportResult): boolean {
	const lastAttemptAt = report.riskAssessment?.lastAttemptAt;
	return Boolean(
		lastAttemptAt &&
			Date.now() - lastAttemptAt.getTime() < ASSESSMENT_RETRY_COOLDOWN_MS,
	);
}

async function refreshOwnedReportAssessment(
	report: ReportResult,
	userId: string,
	allowFailed: boolean,
): Promise<CreateReportResult> {
	const currentAssessment = report.riskAssessment;
	if (
		currentAssessment?.status === "COMPLETE" ||
		currentAssessment?.status === "PARTIAL" ||
		(currentAssessment?.status === "FAILED" && !allowFailed) ||
		retryCooldownActive(report)
	) {
		return resultToPublicView(report);
	}

	const coordinates = toValidCoordinates(report.latitude, report.longitude);
	const nearbyReports = coordinates
		? await findNearbyReports({
				category: report.category,
				latitude: coordinates.latitude,
				longitude: coordinates.longitude,
				excludeReportId: report.id,
			})
		: [];
	const previousAttemptCount = currentAssessment?.attemptCount ?? 0;
	const computation = await computeAssessment({
		report: {
			id: report.id,
			title: report.title,
			description: report.description,
			category: report.category,
			urgency: report.urgency,
			locationName: report.locationName,
			latitude: report.latitude,
			longitude: report.longitude,
			ecolensSummary: report.ecolensAnalysis?.summary,
		},
		nearbyReports,
		rateLimitKey: userId,
		previousAttemptCount,
	});
	const nextAttemptCount =
		previousAttemptCount + (computation.attempted ? 1 : 0);

	await prisma.reportRiskAssessment.upsert({
		where: { reportId: report.id },
		create: {
			reportId: report.id,
			status: computation.status,
			score: computation.risk?.score,
			level: computation.risk?.level,
			confidence: computation.risk?.confidence,
			summary: computation.risk?.summary,
			horizons: computation.risk?.horizons as Prisma.InputJsonValue | undefined,
			factors: computation.risk?.factors ?? [],
			potentialImpacts: computation.risk?.potentialImpacts ?? [],
			recommendedActions: computation.risk?.recommendedActions ?? [],
			environmentSnapshot: computation.snapshot,
			nearbyReportCount: nearbyReports.length,
			nearbyReportIds: nearbyReports.map((item) => item.id),
			providerStatus: computation.providerStatus,
			model: computation.model,
			attemptCount: nextAttemptCount,
			lastAttemptAt: computation.attempted ? new Date() : undefined,
			errorCode: computation.errorCode,
		},
		update: {
			status: computation.status,
			score: computation.risk?.score,
			level: computation.risk?.level,
			confidence: computation.risk?.confidence,
			summary: computation.risk?.summary,
			horizons: computation.risk?.horizons as Prisma.InputJsonValue | undefined,
			factors: computation.risk?.factors ?? [],
			potentialImpacts: computation.risk?.potentialImpacts ?? [],
			recommendedActions: computation.risk?.recommendedActions ?? [],
			environmentSnapshot: computation.snapshot,
			nearbyReportCount: nearbyReports.length,
			nearbyReportIds: nearbyReports.map((item) => item.id),
			providerStatus: computation.providerStatus,
			model: computation.model,
			attemptCount: nextAttemptCount,
			lastAttemptAt: computation.attempted ? new Date() : undefined,
			errorCode: computation.errorCode,
		},
	});

	const refreshedReport = await loadOwnedReport(report.id, userId);
	if (!refreshedReport) throw new Error("Laporan tidak ditemukan");

	console.info("[ReportAssessment] refreshed", {
		reportId: report.id,
		status: computation.status,
		attemptCount: nextAttemptCount,
		providerErrors: computation.providerErrors,
		model: computation.model,
		errorCode: computation.errorCode,
	});

	return resultToPublicView(refreshedReport);
}

export const refreshReportAssessmentFn = createServerFn({ method: "POST" })
	.validator((data: { reportId: string }) => {
		if (!data.reportId?.trim()) throw new Error("ID laporan wajib diisi");
		return { reportId: data.reportId.trim() };
	})
	.handler(async ({ data }) => {
		const session = await ensureSession();
		const report = await loadOwnedReport(data.reportId, session.user.id);
		if (!report) throw new Error("Laporan tidak ditemukan");

		return refreshOwnedReportAssessment(report, session.user.id, true);
	});

export const getMyReportsFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await ensureSession();

		const reports = await prisma.report.findMany({
			where: {
				userId: session.user.id,
			},
			orderBy: {
				createdAt: "desc",
			},
			include: {
				ecolensAnalysis: true,
				riskAssessment: true,
			},
		});

		return reports;
	},
);

export const getPublicReportsFn = createServerFn({ method: "GET" })
	.validator(
		(params?: {
			category?: string;
			status?: string;
			query?: string;
			limit?: number;
		}) => params ?? {},
	)
	.handler(async ({ data }) => {
		const whereClause: Record<string, unknown> = {};

		if (data.category && data.category !== "Semua") {
			whereClause.category = data.category;
		}

		if (data.status && data.status !== "Semua") {
			whereClause.status = data.status;
		}

		if (data.query?.trim()) {
			whereClause.OR = [
				{ title: { contains: data.query.trim(), mode: "insensitive" } },
				{ description: { contains: data.query.trim(), mode: "insensitive" } },
				{ locationName: { contains: data.query.trim(), mode: "insensitive" } },
			];
		}

		const reports = await prisma.report.findMany({
			where: whereClause,
			orderBy: {
				createdAt: "desc",
			},
			take: data.limit ?? 50,
			include: {
				ecolensAnalysis: true,
				user: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
		});

		return reports;
	});

export type ReportMapPin = {
	id: string;
	title: string;
	category: string;
	urgency: string;
	locationName: string;
	latitude: number;
	longitude: number;
	riskAssessment: ReportAssessmentSummary | null;
};

export const getReportMapPinsFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<ReportMapPin[]> => {
		const reports = await prisma.report.findMany({
			orderBy: {
				createdAt: "desc",
			},
			take: 500,
			select: {
				id: true,
				title: true,
				category: true,
				urgency: true,
				locationName: true,
				latitude: true,
				longitude: true,
				incidentClusterId: true,
				riskAssessment: {
					select: {
						status: true,
						score: true,
						level: true,
						confidence: true,
						summary: true,
						horizons: true,
						factors: true,
						potentialImpacts: true,
						recommendedActions: true,
						nearbyReportCount: true,
						providerStatus: true,
					},
				},
			},
		});

		return reports.flatMap((report) => {
			const { latitude, longitude } = report;
			if (
				typeof latitude !== "number" ||
				!Number.isFinite(latitude) ||
				latitude < -90 ||
				latitude > 90 ||
				typeof longitude !== "number" ||
				!Number.isFinite(longitude) ||
				longitude < -180 ||
				longitude > 180
			) {
				return [];
			}

			const assessment = report.riskAssessment;

			return [
				{
					id: report.id,
					title: report.title,
					category: report.category,
					urgency: report.urgency,
					locationName: report.locationName,
					latitude,
					longitude,
					riskAssessment: assessment
						? {
								status: storedAssessmentStatusToView(assessment.status),
								nearbyReportCount: assessment.nearbyReportCount,
								incidentClusterId: report.incidentClusterId,
								risk: storedRiskToView(assessment),
								providerErrors: providerErrorsFromRecord(
									assessment.providerStatus,
								),
							}
						: null,
				},
			];
		});
	},
);

export const getReportByIdFn = createServerFn({ method: "GET" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		const session = await ensureSession();
		const report = await loadOwnedReport(id, session.user.id);
		if (!report) return null;

		if (
			report.riskAssessment?.status === "PENDING" &&
			!retryCooldownActive(report)
		) {
			const refreshed = await refreshOwnedReportAssessment(
				report,
				session.user.id,
				false,
			);
			return refreshed.report;
		}

		return report;
	});
