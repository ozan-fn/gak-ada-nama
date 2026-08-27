import { Prisma } from "@prisma/client";
import {
	AUTOMATIC_REPORT_REGIONS,
	type AutomaticReportRegion,
	validateAutomaticReportRegions,
} from "#/config/automatic-report-regions";
import {
	AUTOMATIC_REPORT_SOURCE,
	type AutomaticReportCandidate,
	buildAutomaticDeduplicationKey,
	createMonitoringGrid,
	detectFireCandidates,
	detectRegionalCandidates,
	distanceMeters,
	type MonitoringGridCell,
	type RegionalEnvironmentObservation,
} from "#/lib/automatic-report-detection";
import { generateAutomaticReportNarrative } from "#/lib/automatic-report-narrative.server";
import {
	fetchAQIByCoordinates,
	fetchWeatherByCoordinates,
} from "#/lib/environment.server";
import { fetchFirmsFirePoints } from "#/lib/firms.server";
import { prisma } from "#/lib/prisma";
import {
	getReportSearchBounds,
	getReportSearchPolicy,
} from "#/lib/report-risk-assessment.server";
import {
	createReportCore,
	refreshAutomaticReportAssessment,
} from "#/lib/reports.server";

const PROVIDER_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_GRID_CELLS_PER_RUN = 12;
const GRID_CONCURRENCY = 3;
const DETECTOR_VERSION = "1.0.0";
const ACTIVE_REPORT_STATUSES = ["PENDING", "VERIFIED", "IN_PROGRESS"];
const URGENCY_RANK: Record<string, number> = {
	Rendah: 0,
	Sedang: 1,
	Tinggi: 2,
	"Sangat Tinggi": 3,
};

type CandidateResult = "created" | "updated" | "skipped";

export type AutomaticReportRunSummary = {
	runId: string;
	startedAt: string;
	finishedAt: string;
	regionsRequested: number;
	regionsProcessed: number;
	candidates: number;
	created: number;
	updated: number;
	skipped: number;
	providerErrors: Array<{ regionId: string; error: string }>;
};

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

function getRegionBounds(region: AutomaticReportRegion) {
	const latitudeDelta = region.radiusKm / 111.32;
	const longitudeDelta =
		region.radiusKm /
		(111.32 * Math.cos((region.center.latitude * Math.PI) / 180));

	return {
		west: region.center.longitude - longitudeDelta,
		south: region.center.latitude - latitudeDelta,
		east: region.center.longitude + longitudeDelta,
		north: region.center.latitude + latitudeDelta,
	};
}

function selectGridCellsForRun(
	cells: MonitoringGridCell[],
	now: Date,
): MonitoringGridCell[] {
	const configuredLimit = Number.parseInt(
		process.env.AUTOMATIC_REPORT_MAX_GRID_CELLS ?? "",
		10,
	);
	const limit =
		Number.isFinite(configuredLimit) && configuredLimit > 0
			? configuredLimit
			: DEFAULT_MAX_GRID_CELLS_PER_RUN;
	if (cells.length <= limit) return cells;

	const runSlot = Math.floor(now.getTime() / (3 * 60 * 60 * 1_000));
	const start = (runSlot * limit) % cells.length;
	return Array.from(
		{ length: limit },
		(_, offset) => cells[(start + offset) % cells.length],
	);
}

async function mapWithConcurrency<T, TResult>(
	items: T[],
	concurrency: number,
	mapper: (item: T) => Promise<TResult>,
): Promise<TResult[]> {
	const results = new Array<TResult>(items.length);
	let nextIndex = 0;

	async function worker() {
		while (nextIndex < items.length) {
			const index = nextIndex;
			nextIndex += 1;
			results[index] = await mapper(items[index]);
		}
	}

	await Promise.all(
		Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
	);
	return results;
}

function numericValue(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseJakartaProviderTime(value: string): Date | null {
	const explicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
	const parsed = new Date(explicitTimezone ? value : `${value}+07:00`);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isFreshProviderTime(observedAt: Date, now: Date) {
	const ageMs = now.getTime() - observedAt.getTime();
	return ageMs >= -10 * 60 * 1_000 && ageMs <= 3 * 60 * 60 * 1_000;
}

function recentRainTotals(
	weather: Awaited<ReturnType<typeof fetchWeatherByCoordinates>>,
	now: Date,
) {
	const samples = weather.hourly.time.flatMap((time, index) => {
		const observedAt = parseJakartaProviderTime(time);
		const precipitationMm = numericValue(weather.hourly.precipitation[index]);
		return observedAt && precipitationMm !== null
			? [{ observedAt, precipitationMm }]
			: [];
	});
	const currentSample = samples
		.filter((sample) => sample.observedAt.getTime() <= now.getTime())
		.sort(
			(sampleA, sampleB) =>
				Math.abs(now.getTime() - sampleA.observedAt.getTime()) -
				Math.abs(now.getTime() - sampleB.observedAt.getTime()),
		)[0];
	const rollingStart = now.getTime() - 24 * 60 * 60 * 1_000;
	const rolling24HoursMm = samples
		.filter(
			(sample) =>
				sample.observedAt.getTime() > rollingStart &&
				sample.observedAt.getTime() <= now.getTime(),
		)
		.reduce((total, sample) => total + sample.precipitationMm, 0);

	return {
		hourlyMm:
			currentSample &&
			now.getTime() - currentSample.observedAt.getTime() <= 90 * 60 * 1_000
				? currentSample.precipitationMm
				: null,
		rolling24HoursMm: samples.length > 0 ? rolling24HoursMm : null,
	};
}

async function collectCellObservation(
	region: AutomaticReportRegion,
	cell: MonitoringGridCell,
	now: Date,
): Promise<RegionalEnvironmentObservation> {
	const coordinates = cell.center;
	const [weatherResult, aqiResult] = await Promise.allSettled([
		fetchWeatherByCoordinates(coordinates, {
			signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
			pastDays: 1,
		}),
		fetchAQIByCoordinates(coordinates, {
			signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
		}),
	]);
	const providerErrors: string[] = [];
	let weather =
		weatherResult.status === "fulfilled" ? weatherResult.value : null;
	let aqi = aqiResult.status === "fulfilled" ? aqiResult.value.data : null;
	let weatherObservedAt = weather
		? parseJakartaProviderTime(weather.current.time)
		: null;
	let aqiObservedAt = aqi ? new Date(aqi.time.iso) : null;

	if (weatherResult.status === "rejected") {
		providerErrors.push(`OPEN_METEO:${errorMessage(weatherResult.reason)}`);
	}
	if (aqiResult.status === "rejected") {
		providerErrors.push(`AQICN:${errorMessage(aqiResult.reason)}`);
	}
	if (aqi) {
		if (!aqiObservedAt || !isFreshProviderTime(aqiObservedAt, now)) {
			providerErrors.push("AQICN:STALE");
			aqi = null;
			aqiObservedAt = null;
		}
	}
	if (
		weather &&
		(!weatherObservedAt || !isFreshProviderTime(weatherObservedAt, now))
	) {
		providerErrors.push("OPEN_METEO:STALE");
		weather = null;
		weatherObservedAt = null;
	}
	const rainTotals = weather ? recentRainTotals(weather, now) : null;

	return {
		observedAt: now,
		aqiObservedAt,
		weatherObservedAt,
		aqi: aqi ? numericValue(aqi.aqi) : null,
		baselineAqi: region.baselineAqi ?? 50,
		pm25: aqi ? numericValue(aqi.iaqi.pm25?.v) : null,
		pm10: aqi ? numericValue(aqi.iaqi.pm10?.v) : null,
		co: aqi ? numericValue(aqi.iaqi.co?.v) : null,
		aqiStationName: aqi?.city.name ?? null,
		aqiStationLatitude: aqi ? numericValue(aqi.city.geo[0]) : null,
		aqiStationLongitude: aqi ? numericValue(aqi.city.geo[1]) : null,
		temperatureCelsius: weather
			? numericValue(weather.current.temperature_2m)
			: null,
		humidityPercent: weather
			? numericValue(weather.current.relative_humidity_2m)
			: null,
		elevationMeters: weather ? numericValue(weather.elevation) : null,
		currentRainMm: rainTotals?.hourlyMm ?? null,
		dailyRainMm: rainTotals?.rolling24HoursMm ?? null,
		windSpeedKmh: weather ? numericValue(weather.current.wind_speed_10m) : null,
		providerErrors,
	};
}

function enrichFireCandidates(
	candidates: AutomaticReportCandidate[],
	observations: Array<{
		cell: MonitoringGridCell;
		observation: RegionalEnvironmentObservation;
	}>,
) {
	return candidates.map((candidate) => {
		const nearest = [...observations].sort(
			(itemA, itemB) =>
				distanceMeters(candidate.coordinates, itemA.cell.center) -
				distanceMeters(candidate.coordinates, itemB.cell.center),
		)[0]?.observation;
		if (!nearest) return candidate;

		return {
			...candidate,
			evidence: [
				...candidate.evidence,
				...(nearest.aqi === null
					? []
					: [`AQI sekitar ${Math.round(nearest.aqi)}`]),
				...(nearest.currentRainMm === null
					? []
					: [`Hujan terkini ${nearest.currentRainMm.toFixed(1)} mm`]),
			],
			providerErrors: [...candidate.providerErrors, ...nearest.providerErrors],
			facts: {
				...candidate.facts,
				aqi: nearest.aqi,
				temperatureCelsius: nearest.temperatureCelsius,
				currentRainMm: nearest.currentRainMm,
				windSpeedKmh: nearest.windSpeedKmh,
				elevationMeters: nearest.elevationMeters,
			},
		};
	});
}

function sourceMetadata(
	candidate: AutomaticReportCandidate,
	narrative: { model: string | null; usedFallback: boolean },
): Prisma.InputJsonObject {
	const providers =
		candidate.detectorId === "fire-hotspot"
			? ["NASA_FIRMS", "OPEN_METEO", "AQICN"]
			: candidate.detectorId === "air-pollution"
				? ["AQICN"]
				: ["OPEN_METEO"];

	return {
		origin: AUTOMATIC_REPORT_SOURCE,
		detectorId: candidate.detectorId,
		detectorVersion: DETECTOR_VERSION,
		regionId: candidate.regionId,
		spatialKey: candidate.spatialKey,
		providers,
		providerErrors: candidate.providerErrors,
		coordinateSource: candidate.coordinateSource,
		accuracyRadiusMeters: candidate.accuracyRadiusMeters,
		firstObservedAt: candidate.observedAt.toISOString(),
		observedAt: candidate.observedAt.toISOString(),
		lastObservedAt: candidate.observedAt.toISOString(),
		evidence: candidate.evidence,
		facts: candidate.facts,
		narrativeModel: narrative.model,
		narrativeFallback: narrative.usedFallback,
		verificationBasis:
			"Threshold data lingkungan terpenuhi; belum dikonfirmasi saksi manusia.",
	};
}

function jsonObject(value: Prisma.JsonValue | null) {
	return value && typeof value === "object" && !Array.isArray(value)
		? value
		: {};
}

async function ensureSystemReporter() {
	const email =
		process.env.AUTOMATIC_REPORT_SYSTEM_EMAIL?.trim().toLowerCase() ||
		"monitor@prita.system";
	return prisma.user.upsert({
		where: { email },
		create: {
			email,
			name: "Prita Environmental Monitor",
			emailVerified: true,
		},
		update: {
			name: "Prita Environmental Monitor",
			emailVerified: true,
		},
	});
}

async function findExistingAutomaticReport(
	candidate: AutomaticReportCandidate,
	deduplicationKey: string,
) {
	const exact = await prisma.report.findUnique({
		where: { deduplicationKey },
		include: { riskAssessment: true },
	});
	if (exact && ACTIVE_REPORT_STATUSES.includes(exact.status)) return exact;

	const policy = getReportSearchPolicy(candidate.category);
	const bounds = getReportSearchBounds(
		candidate.coordinates.latitude,
		candidate.coordinates.longitude,
		policy.radiusMeters,
	);
	const cutoff = new Date(candidate.observedAt.getTime() - policy.lookbackMs);
	const nearby = await prisma.report.findMany({
		where: {
			source: AUTOMATIC_REPORT_SOURCE,
			category: candidate.category,
			status: { in: ACTIVE_REPORT_STATUSES },
			createdAt: { gte: cutoff },
			latitude: { gte: bounds.minLatitude, lte: bounds.maxLatitude },
			longitude: { gte: bounds.minLongitude, lte: bounds.maxLongitude },
		},
		include: { riskAssessment: true },
		orderBy: { createdAt: "desc" },
		take: 25,
	});

	return (
		nearby.find(
			(report) =>
				typeof report.latitude === "number" &&
				typeof report.longitude === "number" &&
				distanceMeters(candidate.coordinates, {
					latitude: report.latitude,
					longitude: report.longitude,
				}) <= policy.radiusMeters,
		) ?? null
	);
}

async function persistCandidate(
	candidate: AutomaticReportCandidate,
	systemUserId: string,
): Promise<CandidateResult> {
	const baseDeduplicationKey = buildAutomaticDeduplicationKey(candidate);
	let deduplicationKey = baseDeduplicationKey;
	const existing = await findExistingAutomaticReport(
		candidate,
		deduplicationKey,
	);

	if (existing) {
		const previousConfidence = existing.sourceConfidence ?? 0;
		const existingMetadata = jsonObject(existing.sourceMetadata);
		const firstObservedAt =
			typeof existingMetadata.firstObservedAt === "string"
				? existingMetadata.firstObservedAt
				: typeof existingMetadata.observedAt === "string"
					? existingMetadata.observedAt
					: (existing.observedAt?.toISOString() ??
						candidate.observedAt.toISOString());
		const severityIncreased =
			(URGENCY_RANK[candidate.urgency] ?? 0) >
			(URGENCY_RANK[existing.urgency] ?? 0);
		const shouldRefreshAssessment =
			severityIncreased ||
			candidate.sourceConfidence >= previousConfidence + 0.05 ||
			!existing.riskAssessment ||
			Date.now() - existing.riskAssessment.updatedAt.getTime() >
				6 * 60 * 60 * 1_000;
		await prisma.report.update({
			where: { id: existing.id },
			data: {
				status: "VERIFIED",
				urgency: severityIncreased ? candidate.urgency : existing.urgency,
				sourceConfidence: Math.max(
					previousConfidence,
					candidate.sourceConfidence,
				),
				sourceMetadata: {
					...existingMetadata,
					...sourceMetadata(candidate, {
						model:
							typeof existingMetadata.narrativeModel === "string"
								? String(existingMetadata.narrativeModel)
								: null,
						usedFallback: existingMetadata.narrativeFallback === true,
					}),
					firstObservedAt,
					observedAt: firstObservedAt,
				},
				accuracyRadiusMeters: candidate.accuracyRadiusMeters,
			},
		});

		if (shouldRefreshAssessment) {
			await refreshAutomaticReportAssessment(
				existing.id,
				`automatic:${candidate.regionId}`,
			);
		}
		return "updated";
	}

	const occupiedKey = await prisma.report.findUnique({
		where: { deduplicationKey: baseDeduplicationKey },
		select: { status: true },
	});
	if (occupiedKey && !ACTIVE_REPORT_STATUSES.includes(occupiedKey.status)) {
		deduplicationKey = `${baseDeduplicationKey}:restart:${candidate.observedAt.getTime()}`;
	}

	const narrative = await generateAutomaticReportNarrative(candidate);
	try {
		await createReportCore({
			input: {
				title: narrative.title,
				description: narrative.description,
				category: candidate.category,
				urgency: candidate.urgency,
				locationName:
					candidate.coordinateSource === "MONITORING_GRID_CENTROID"
						? `${candidate.regionName} · Area ${candidate.spatialKey}`
						: candidate.regionName,
				latitude: candidate.coordinates.latitude,
				longitude: candidate.coordinates.longitude,
				images: [],
			},
			actorUserId: systemUserId,
			source: AUTOMATIC_REPORT_SOURCE,
			sourceConfidence: candidate.sourceConfidence,
			sourceMetadata: sourceMetadata(candidate, narrative),
			status: "VERIFIED",
			deduplicationKey,
			observedAt: candidate.observedAt,
			accuracyRadiusMeters: candidate.accuracyRadiusMeters,
			rateLimitKey: `automatic:${candidate.regionId}`,
		});
		return "created";
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			return "skipped";
		}
		throw error;
	}
}

async function runRegion(region: AutomaticReportRegion, now: Date) {
	const providerErrors: string[] = [];
	const firePoints = await fetchFirmsFirePoints(getRegionBounds(region)).catch(
		(error) => {
			providerErrors.push(`FIRMS:${errorMessage(error)}`);
			return [];
		},
	);
	const selectedCells = selectGridCellsForRun(
		createMonitoringGrid(region),
		now,
	);
	const observations = await mapWithConcurrency(
		selectedCells,
		GRID_CONCURRENCY,
		async (cell) => {
			const observation = await collectCellObservation(region, cell, now);
			providerErrors.push(...observation.providerErrors);
			return { cell, observation };
		},
	);
	const fireCandidates = enrichFireCandidates(
		detectFireCandidates({ region, points: firePoints, now }),
		observations,
	);
	const regionalCandidates = observations.flatMap(({ cell, observation }) =>
		detectRegionalCandidates({ region, cell, observation }),
	);

	return {
		candidates: [...fireCandidates, ...regionalCandidates],
		providerErrors,
	};
}

export async function runAutomaticReports({
	regionId,
	now = new Date(),
}: {
	regionId?: string;
	now?: Date;
} = {}): Promise<AutomaticReportRunSummary> {
	const startedAt = new Date();
	const runId = crypto.randomUUID();
	const configuredRegions = validateAutomaticReportRegions(
		AUTOMATIC_REPORT_REGIONS,
	).filter((region) => region.enabled && (!regionId || region.id === regionId));
	if (regionId && configuredRegions.length === 0) {
		throw new Error(`AUTOMATIC_REPORT_REGION_NOT_FOUND:${regionId}`);
	}

	const systemUser = await ensureSystemReporter();
	const summary: AutomaticReportRunSummary = {
		runId,
		startedAt: startedAt.toISOString(),
		finishedAt: startedAt.toISOString(),
		regionsRequested: configuredRegions.length,
		regionsProcessed: 0,
		candidates: 0,
		created: 0,
		updated: 0,
		skipped: 0,
		providerErrors: [],
	};

	for (const region of configuredRegions) {
		try {
			const result = await runRegion(region, now);
			summary.regionsProcessed += 1;
			summary.candidates += result.candidates.length;
			summary.providerErrors.push(
				...result.providerErrors.map((error) => ({
					regionId: region.id,
					error,
				})),
			);

			for (const candidate of result.candidates) {
				try {
					const outcome = await persistCandidate(candidate, systemUser.id);
					summary[outcome] += 1;
				} catch (error) {
					summary.skipped += 1;
					summary.providerErrors.push({
						regionId: region.id,
						error: `PERSIST:${errorMessage(error)}`,
					});
				}
			}
		} catch (error) {
			summary.providerErrors.push({
				regionId: region.id,
				error: `REGION:${errorMessage(error)}`,
			});
		}
	}

	summary.finishedAt = new Date().toISOString();
	console.info("[AutomaticReports] run completed", summary);
	return summary;
}
