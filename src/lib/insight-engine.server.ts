import type { Prisma } from "@prisma/client";
import { prisma } from "#/lib/prisma";
import {
	haversineDistanceMeters,
	hasValidCoordinates,
	REPORT_SEARCH_POLICIES,
} from "#/lib/report-risk-assessment.server";

const DAY_MS = 24 * 60 * 60 * 1_000;
const INSIGHT_LOOKBACK_DAYS = 14;
const MIN_CLUSTER_SIZE = 2;

type ReportForClustering = {
	id: string;
	title: string;
	description: string;
	category: string;
	urgency: string;
	status: string;
	locationName: string;
	latitude: number | null;
	longitude: number | null;
	createdAt: Date;
	userId: string;
	riskAssessment: {
		score: number | null;
		level: string | null;
		factors: string[];
		potentialImpacts: string[];
		environmentSnapshot: Prisma.JsonValue | null;
	} | null;
};

export type InsightCandidate = {
	category: string;
	centerLatitude: number;
	centerLongitude: number;
	reports: ReportForClustering[];
};

export type ImpactScore = {
	total: number;
	severity: number;
	affectedArea: number;
	recurrence: number;
	exposure: number;
	validation: number;
	environmental: number;
	riskAssessment: number;
};

export type EnvironmentalContext = {
	rainCondition: string;
	airQualityCondition: string;
	riskLevel: string | null;
	precipitationMm: number | null;
	aqi: number | null;
};

function urgencyToScore(urgency: string): number {
	switch (urgency) {
		case "Sangat Tinggi":
			return 40;
		case "Tinggi":
			return 30;
		case "Sedang":
			return 20;
		case "Rendah":
			return 10;
		default:
			return 15;
	}
}

function riskLevelToScore(level: string | null): number {
	switch (level) {
		case "CRITICAL":
			return 10;
		case "HIGH":
			return 8;
		case "MODERATE":
			return 5;
		case "LOW":
			return 2;
		default:
			return 0;
	}
}

function computeEnvironmentalScore(
	snapshot: Prisma.JsonValue | null,
	category: string,
): number {
	if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
		return 0;
	}

	const s = snapshot as Record<string, unknown>;
	let score = 0;

	const weather = s.weather as Record<string, unknown> | undefined;
	const current = weather?.current as Record<string, unknown> | undefined;
	const airQuality = s.airQuality as Record<string, unknown> | undefined;
	const aqiCurrent = airQuality?.current as Record<string, unknown> | undefined;

	if (current) {
		const rain = typeof current.precipitationMm === "number" ? current.precipitationMm : 0;
		const wind = typeof current.windSpeedKmh === "number" ? current.windSpeedKmh : 0;

		if (category === "Drainase/Banjir" && rain > 5) score += 3;
		else if (category === "Kebakaran" && wind > 20) score += 3;
		else if (category === "Polusi" && wind > 15) score += 2;
	}

	if (aqiCurrent) {
		const aqi = typeof aqiCurrent.aqi === "number" ? aqiCurrent.aqi : 0;
		if (aqi > 150) score += 3;
		else if (aqi > 100) score += 2;
		else if (aqi > 50) score += 1;
	}

	return Math.min(10, score);
}

function calculateImpactScore(
	candidate: InsightCandidate,
	validatedCount: number,
): ImpactScore {
	const reports = candidate.reports;

	const maxUrgency = Math.max(...reports.map((r) => urgencyToScore(r.urgency)));
	const severity = Math.min(40, maxUrgency);

	const distances = reports
		.filter((r) => r.latitude && r.longitude)
		.map((r) =>
			haversineDistanceMeters(
				candidate.centerLatitude,
				candidate.centerLongitude,
				r.latitude!,
				r.longitude!,
			),
		);
	const maxDistanceKm = distances.length > 0 ? Math.max(...distances) / 1000 : 0;
	const affectedArea = Math.min(15, Math.round(maxDistanceKm * 3));

	const count = reports.length;
	const recurrence = Math.min(15, Math.round(Math.log2(count + 1) * 5));

	// exposure: luas jangkauan + kepadatan laporan → seberapa luas populasi terdampak
	const exposure = Math.min(15, Math.round(maxDistanceKm * 2 + count / 2));

	const validationRatio = reports.length > 0 ? validatedCount / reports.length : 0;
	const validation = Math.round(validationRatio * 10);

	const envScores = reports.map((r) =>
		computeEnvironmentalScore(r.riskAssessment?.environmentSnapshot ?? null, candidate.category),
	);
	const environmental = Math.min(10, Math.round(Math.max(...envScores, 0)));

	const riskScores = reports
		.map((r) => {
			const score = r.riskAssessment?.score;
			const level = r.riskAssessment?.level;
			if (typeof score === "number") return score / 10;
			return riskLevelToScore(level ?? null);
		})
		.filter((s) => s > 0);
	const avgRisk =
		riskScores.length > 0
			? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
			: 0;
	const riskAssessment = Math.min(10, Math.round(avgRisk));

	const total = Math.min(
		100,
		severity + affectedArea + recurrence + exposure + validation + environmental + riskAssessment,
	);

	return {
		total,
		severity,
		affectedArea,
		recurrence,
		exposure,
		validation,
		environmental,
		riskAssessment,
	};
}

function classifyImpact(total: number): "Tinggi" | "Sedang" | "Rendah" {
	if (total >= 70) return "Tinggi";
	if (total >= 40) return "Sedang";
	return "Rendah";
}

function conditionLabel(
	value: number | null,
	high: number,
	medium: number,
): string {
	if (value === null) return "Tidak tersedia";
	if (value >= high) return "Tinggi";
	if (value >= medium) return "Sedang";
	return "Rendah";
}

export function summarizeEnvironmentalContext(
	candidate: InsightCandidate,
): EnvironmentalContext {
	let maxPrecipitationKm: number | null = null;
	let maxAqi: number | null = null;
	let riskLevel: string | null = null;

	for (const report of candidate.reports) {
		const snapshot = report.riskAssessment?.environmentSnapshot;
		if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
			continue;
		}

		const s = snapshot as Record<string, unknown>;
		const weather = s.weather as Record<string, unknown> | undefined;
		const current = weather?.current as Record<string, unknown> | undefined;
		if (current) {
			const rain =
				typeof current.precipitationMm === "number"
					? current.precipitationMm
					: null;
			if (rain !== null && (maxPrecipitationKm === null || rain > maxPrecipitationKm)) {
				maxPrecipitationKm = rain;
			}
		}

		const airQuality = s.airQuality as Record<string, unknown> | undefined;
		const aqiCurrent = airQuality?.current as Record<string, unknown> | undefined;
		if (aqiCurrent) {
			const aqi = typeof aqiCurrent.aqi === "number" ? aqiCurrent.aqi : null;
			if (aqi !== null && (maxAqi === null || aqi > maxAqi)) {
				maxAqi = aqi;
			}
		}

		const level = report.riskAssessment?.level ?? null;
		if (level && (riskLevel === null || level === "CRITICAL" || level === "HIGH")) {
			riskLevel = level;
		}
	}

	return {
		rainCondition: conditionLabel(maxPrecipitationKm, 20, 5),
		airQualityCondition: conditionLabel(maxAqi, 150, 100),
		riskLevel,
		precipitationMm: maxPrecipitationKm,
		aqi: maxAqi,
	};
}

export async function fetchReportsForClustering(): Promise<ReportForClustering[]> {
	const cutoff = new Date(Date.now() - INSIGHT_LOOKBACK_DAYS * DAY_MS);

	return prisma.report.findMany({
		where: {
			status: { in: ["PENDING", "VERIFIED", "IN_PROGRESS"] },
			createdAt: { gte: cutoff },
			latitude: { not: null },
			longitude: { not: null },
		},
		orderBy: { createdAt: "desc" },
		take: 500,
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
			userId: true,
			riskAssessment: {
				select: {
					score: true,
					level: true,
					factors: true,
					potentialImpacts: true,
					environmentSnapshot: true,
				},
			},
		},
	});
}

export function clusterReports(reports: ReportForClustering[]): InsightCandidate[] {
	const withCoords = reports.filter(
		(r) => hasValidCoordinates(r.latitude, r.longitude),
	);

	const byCategory = new Map<string, ReportForClustering[]>();
	for (const report of withCoords) {
		const existing = byCategory.get(report.category) ?? [];
		existing.push(report);
		byCategory.set(report.category, existing);
	}

	const candidates: InsightCandidate[] = [];

	for (const [category, categoryReports] of byCategory) {
		const policy = (REPORT_SEARCH_POLICIES as Record<string, { radiusMeters: number; lookbackMs: number }>)[category] ?? REPORT_SEARCH_POLICIES.Lainnya;
		const radiusMeters = policy.radiusMeters;

		const assigned = new Set<string>();
		const sorted = [...categoryReports].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);

		for (const report of sorted) {
			if (assigned.has(report.id)) continue;

			const cluster: ReportForClustering[] = [report];
			assigned.add(report.id);

			for (const candidate of sorted) {
				if (assigned.has(candidate.id)) continue;
				if (
					!hasValidCoordinates(candidate.latitude, candidate.longitude) ||
					!hasValidCoordinates(report.latitude, report.longitude)
				) {
					continue;
				}

				const distance = haversineDistanceMeters(
					report.latitude!,
					report.longitude!,
					candidate.latitude!,
					candidate.longitude!,
				);

				if (distance <= radiusMeters) {
					cluster.push(candidate);
					assigned.add(candidate.id);
				}
			}

			if (cluster.length >= MIN_CLUSTER_SIZE) {
				const latitudes = cluster
					.map((r) => r.latitude!)
					.filter((lat): lat is number => typeof lat === "number");
				const longitudes = cluster
					.map((r) => r.longitude!)
					.filter((lng): lng is number => typeof lng === "number");

				candidates.push({
					category,
					centerLatitude: latitudes.reduce((a, b) => a + b, 0) / latitudes.length,
					centerLongitude:
						longitudes.reduce((a, b) => a + b, 0) / longitudes.length,
					reports: cluster,
				});
			}
		}
	}

	return candidates;
}

function buildInsightTitle(candidate: InsightCandidate): string {
	const category = candidate.category;
	const location = candidate.reports[0]?.locationName ?? "Area ini";

	const categoryTitle: Record<string, string> = {
		Sampah: "Peningkatan Laporan Sampah",
		"Drainase/Banjir": "Risiko Genangan dan Banjir",
		Polusi: "Penurunan Kualitas Udara",
		Kebakaran: "Potensi Kebakaran Lahan",
		"Fasilitas Rusak": "Kerusakan Fasilitas Publik",
		Lainnya: "Isu Lingkungan Terdeteksi",
	};

	return `${categoryTitle[category] ?? categoryTitle.Lainnya} di ${location}`;
}

function buildFactorsSummary(candidate: InsightCandidate): string[] {
	const factors: string[] = [];
	const category = candidate.category;
	const count = candidate.reports.length;

	if (count >= 5) {
		factors.push(`${count} laporan terkait ditemukan dalam radius dekat`);
	} else if (count >= 2) {
		factors.push(`${count} laporan konsisten di lokasi berdekatan`);
	}

	const urgentCount = candidate.reports.filter(
		(r) => r.urgency === "Tinggi" || r.urgency === "Sangat Tinggi",
	).length;
	if (urgentCount > 0) {
		factors.push(`${urgentCount} laporan dengan urgensi tinggi`);
	}

	const withRisk = candidate.reports.filter(
		(r) => r.riskAssessment?.level === "HIGH" || r.riskAssessment?.level === "CRITICAL",
	).length;
	if (withRisk > 0) {
		factors.push(`${withRisk} laporan dengan level risiko tinggi/krusial`);
	}

	if (category === "Drainase/Banjir") {
		factors.push("Kondisi curah hujan meningkat");
	} else if (category === "Polusi") {
		factors.push("Kualitas udara terpantau menurun");
	} else if (category === "Kebakaran") {
		factors.push("Kondisi lahan kering dan angin kencang");
	}

	return factors;
}

function buildPotentialImpacts(candidate: InsightCandidate): string[] {
	const impacts: string[] = [];
	const category = candidate.category;

	switch (category) {
		case "Drainase/Banjir":
			impacts.push("Gangguan mobilitas warga");
			impacts.push("Genangan di permukiman");
			impacts.push("Rusaknya infrastruktur jalan");
			break;
		case "Polusi":
			impacts.push("Risiko gangguan pernapasan");
			impacts.push("Penurunan kualitas udara");
			impacts.push("Gangguan aktivitas luar ruangan");
			break;
		case "Kebakaran":
			impacts.push("Kerusakan lahan dan vegetasi");
			impacts.push("Pencemaran udara asap");
			impacts.push("Risiko kebakaran menyebar");
			break;
		case "Sampah":
			impacts.push("Pencemaran lingkungan");
			impacts.push("Gangguan saluran air");
			impacts.push("Risiko kesehatan masyarakat");
			break;
		default:
			impacts.push("Gangguan aktivitas warga");
			impacts.push("Potensi eskalasi masalah");
	}

	return impacts;
}

function buildWhyRisks(candidate: InsightCandidate): string[] {
	const reasons: string[] = [];
	const count = candidate.reports.length;

	if (count >= 5) {
		reasons.push(`${count} laporan konsisten di area yang sama`);
	}

	const urgentReports = candidate.reports.filter(
		(r) => r.urgency === "Tinggi" || r.urgency === "Sangat Tinggi",
	);
	if (urgentReports.length > 0) {
		reasons.push("Beberapa laporan menunjukkan urgensi tinggi");
	}

	const category = candidate.category;
	if (category === "Drainase/Banjir") {
		reasons.push("Curah hujan meningkat di wilayah tersebut");
		const hasEnvData = candidate.reports.some(
			(r) => r.riskAssessment?.environmentSnapshot,
		);
		if (hasEnvData) {
			reasons.push("Kondisi lingkungan memperburuk potensi risiko");
		}
	} else if (category === "Polusi") {
		reasons.push("Peningkatan konsentrasi polutan terdeteksi");
	} else if (category === "Kebakaran") {
		reasons.push("Kondisi cuaca mendukung potensi kebakaran");
	} else if (category === "Sampah") {
		reasons.push("Akumulasi sampah di area strategis");
	}

	return reasons;
}

export function buildInsightFromCandidate(candidate: InsightCandidate) {
	const validatedCount = candidate.reports.filter(
		(r) => r.status === "VERIFIED" || r.status === "IN_PROGRESS",
	).length;

	const impactScore = calculateImpactScore(candidate, validatedCount);

	const reportIds = candidate.reports.map((r) => r.id);
	const latitudes = candidate.reports
		.map((r) => r.latitude)
		.filter((lat): lat is number => typeof lat === "number");

	const maxDistanceKm =
		latitudes.length > 1
			? Math.max(
					...candidate.reports
						.filter((r) => r.latitude && r.longitude)
						.map((r) =>
							haversineDistanceMeters(
								candidate.centerLatitude,
								candidate.centerLongitude,
								r.latitude!,
								r.longitude!,
							),
						),
				) / 1000
			: 0;

	const latestReport = candidate.reports[0];
	const environmentalContext = summarizeEnvironmentalContext(candidate);

	return {
		title: buildInsightTitle(candidate),
		summary: "", // filled by AI generation
		category: candidate.category,
		impact: classifyImpact(impactScore.total),
		impactScore,
		centerLatitude: candidate.centerLatitude,
		centerLongitude: candidate.centerLongitude,
		locationName: latestReport?.locationName ?? "",
		reportIds,
		reportCount: candidate.reports.length,
		validatedCount,
		trend: "stable" as const, // computed against previous insights
		affectedRadiusKm: Math.round(maxDistanceKm * 10) / 10,
		factors: buildFactorsSummary(candidate),
		potentialImpacts: buildPotentialImpacts(candidate),
		whyRisks: buildWhyRisks(candidate),
		environmentalContext,
		weatherContext: {
			rainCondition: environmentalContext.rainCondition,
			precipitationMm: environmentalContext.precipitationMm,
			riskLevel: environmentalContext.riskLevel,
		} as Prisma.JsonObject,
		aqiContext: {
			airQualityCondition: environmentalContext.airQualityCondition,
			aqi: environmentalContext.aqi,
		} as Prisma.JsonObject,
	};
}
