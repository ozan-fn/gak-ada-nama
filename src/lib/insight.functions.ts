import { createServerFn } from "@tanstack/react-start";
import { prisma } from "#/lib/prisma";
import {
	clusterReports,
	fetchReportsForClustering,
	buildInsightFromCandidate,
} from "#/lib/insight-engine.server";
import { generateInsightContent } from "#/lib/insight-generation.server";
import { ensureSession } from "#/lib/auth.functions";

const INSIGHT_CACHE_TTL_MS = 30 * 60 * 1_000; // 30 minutes
let lastInsightRefresh = 0;

export type InsightView = {
	id: string;
	title: string;
	summary: string;
	category: string;
	impact: "Tinggi" | "Sedang" | "Rendah";
	impactScore: number;
	centerLatitude: number;
	centerLongitude: number;
	locationName: string;
	reportCount: number;
	validatedCount: number;
	trend: "up" | "down" | "stable";
	affectedRadiusKm: number | null;
	factors: string[];
	potentialImpacts: string[];
	whyRisks: string[];
	rainCondition: string;
	airQualityCondition: string;
	riskLevel: string | null;
	generatedAt: Date;
};

export type InsightDetailView = InsightView & {
	reportIds: string[];
	reports: Array<{
		id: string;
		title: string;
		category: string;
		urgency: string;
		status: string;
		locationName: string;
		images: string[];
		createdAt: Date;
	}>;
};

export type InsightStats = {
	totalReports: number;
	totalInsights: number;
	highImpactCount: number;
	trendDirection: "up" | "down" | "stable";
};

function isCacheStale(): boolean {
	return Date.now() - lastInsightRefresh > INSIGHT_CACHE_TTL_MS;
}

function determineTrend(
	impactScore: number,
): "up" | "down" | "stable" {
	// For MVP, use score thresholds to infer trend direction
	if (impactScore >= 70) return "up";
	if (impactScore <= 30) return "down";
	return "stable";
}

function ctxValue(ctx: unknown, key: string): unknown {
	if (ctx && typeof ctx === "object" && !Array.isArray(ctx)) {
		return (ctx as Record<string, unknown>)[key];
	}
	return undefined;
}

function stringOr(ctx: unknown, key: string, fallback: string | null = "Tidak tersedia"): string | null {
	const value = ctxValue(ctx, key);
	if (typeof value === "string" && value.length > 0) return value;
	if (value != null) return String(value);
	return fallback;
}

async function refreshInsights(): Promise<void> {
	// Check if insights exist first - force refresh if empty
	const existingCount = await prisma.insight.count({
		where: { status: "ACTIVE" },
	});
	
	// If no insights exist, force refresh regardless of cache
	const shouldForceRefresh = existingCount === 0;
	
	if (!shouldForceRefresh && !isCacheStale()) return;

	console.info("[Insights] starting refresh");

	const reports = await fetchReportsForClustering();
	if (reports.length === 0) {
		console.info("[Insights] no reports found, skipping refresh");
		return;
	}

	const candidates = clusterReports(reports);
	console.info("[Insights] formed", { clusterCount: candidates.length });

	const existingInsights = await prisma.insight.findMany({
		where: { status: "ACTIVE" },
		select: { id: true, category: true, centerLatitude: true, centerLongitude: true, reportIds: true },
	});

	const existingBySignature = new Map<string, string>();
	for (const insight of existingInsights) {
		const sig = `${insight.category}:${insight.centerLatitude.toFixed(3)}:${insight.centerLongitude.toFixed(3)}`;
		existingBySignature.set(sig, insight.id);
	}

	for (const candidate of candidates) {
		const built = buildInsightFromCandidate(candidate);
		const sig = `${candidate.category}:${candidate.centerLatitude.toFixed(3)}:${candidate.centerLongitude.toFixed(3)}`;
		const existingId = existingBySignature.get(sig);

		let aiResult = null;
		if (!existingId) {
			aiResult = await generateInsightContent({
				category: candidate.category,
				locationName: built.locationName,
				reportCount: built.reportCount,
				validatedCount: built.validatedCount,
				impactScore: built.impactScore.total,
				reports: candidate.reports.slice(0, 5).map((r) => ({
					title: r.title,
					description: r.description,
					urgency: r.urgency,
				})),
				factors: built.factors,
				environmentalContext: built.environmentalContext,
			});
		}

		const title = aiResult?.title ?? built.title;
		const summary = aiResult?.summary ?? built.summary ?? `${built.reportCount} laporan terkait ${candidate.category} di ${built.locationName}`;
		const factors = aiResult?.factors ?? built.factors;
		const potentialImpacts = aiResult?.potentialImpacts ?? built.potentialImpacts;
		const whyRisks = aiResult?.whyRisks ?? built.whyRisks;
		const trend = determineTrend(built.impactScore.total);

		if (existingId) {
			await prisma.insight.update({
				where: { id: existingId },
				data: {
					impactScore: built.impactScore.total,
					impact: built.impact,
					reportIds: built.reportIds,
					reportCount: built.reportCount,
					validatedCount: built.validatedCount,
					factors,
					potentialImpacts,
					whyRisks,
					trend,
					weatherContext: built.weatherContext,
					aqiContext: built.aqiContext,
					generatedAt: new Date(),
				},
			});
		} else {
			await prisma.insight.create({
				data: {
					title,
					summary,
					category: candidate.category,
					impact: built.impact,
					impactScore: built.impactScore.total,
					centerLatitude: candidate.centerLatitude,
					centerLongitude: candidate.centerLongitude,
					locationName: built.locationName,
					reportIds: built.reportIds,
					reportCount: built.reportCount,
					validatedCount: built.validatedCount,
					trend,
					affectedRadiusKm: built.affectedRadiusKm,
					factors,
					potentialImpacts,
					whyRisks,
					weatherContext: built.weatherContext,
					aqiContext: built.aqiContext,
				},
			});
		}
	}

	// Deactivate insights whose reports are no longer in active clusters
	const activeReportIds = new Set(reports.map((r) => r.id));
	const staleInsights = await prisma.insight.findMany({
		where: { status: "ACTIVE" },
		select: { id: true, reportIds: true },
	});

	for (const insight of staleInsights) {
		const hasActiveReports = insight.reportIds.some((rid) => activeReportIds.has(rid));
		if (!hasActiveReports) {
			await prisma.insight.update({
				where: { id: insight.id },
				data: { status: "RESOLVED" },
			});
		}
	}

	lastInsightRefresh = Date.now();
	console.info("[Insights] refresh complete");
}

export const getInsightsFn = createServerFn({ method: "GET" })
	.validator((data: { scope?: string; latitude?: number; longitude?: number } | void) => {
		return {
			scope: (data && "scope" in data ? data.scope : "Indonesia") ?? "Indonesia",
			latitude: data && "latitude" in data ? data.latitude : undefined,
			longitude: data && "longitude" in data ? data.longitude : undefined,
		};
	})
	.handler(async ({ data }): Promise<{ insights: InsightView[]; stats: InsightStats }> => {
		await refreshInsights();

		// ponytail: haversine in SQL, no dependencies
		const NEARBY_RADIUS_KM = 50;
		const insights = await prisma.insight.findMany({
			where: { status: "ACTIVE" },
			orderBy: { impactScore: "desc" },
			take: 50,
		});

		let filteredInsights = insights;
		if (data.scope === "Sekitar Anda" && data.latitude && data.longitude) {
			filteredInsights = insights.filter((insight) => {
				const dLat = (insight.centerLatitude - data.latitude!) * (Math.PI / 180);
				const dLng = (insight.centerLongitude - data.longitude!) * (Math.PI / 180);
				const a =
					Math.sin(dLat / 2) ** 2 +
					Math.cos(data.latitude! * (Math.PI / 180)) *
						Math.cos(insight.centerLatitude * (Math.PI / 180)) *
						Math.sin(dLng / 2) ** 2;
				const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				const distanceKm = 6371 * c;
				return distanceKm <= NEARBY_RADIUS_KM;
			});
		}

		const totalReports = filteredInsights.reduce((sum, i) => sum + i.reportCount, 0);
		const highImpactCount = filteredInsights.filter((i) => i.impact === "Tinggi").length;
		const upCount = filteredInsights.filter((i) => i.trend === "up").length;
		const downCount = filteredInsights.filter((i) => i.trend === "down").length;
		const trendDirection = upCount > downCount ? "up" : downCount > upCount ? "down" : "stable";

		return {
			insights: filteredInsights.map((i) => ({
				id: i.id,
				title: i.title,
				summary: i.summary,
				category: i.category,
				impact: i.impact as "Tinggi" | "Sedang" | "Rendah",
				impactScore: i.impactScore,
				centerLatitude: i.centerLatitude,
				centerLongitude: i.centerLongitude,
				locationName: i.locationName,
				reportCount: i.reportCount,
				validatedCount: i.validatedCount,
				trend: i.trend as "up" | "down" | "stable",
				affectedRadiusKm: i.affectedRadiusKm,
				factors: i.factors,
				potentialImpacts: i.potentialImpacts,
				whyRisks: i.whyRisks,
				rainCondition: stringOr(i.weatherContext, "rainCondition") ?? "Tidak tersedia",
				airQualityCondition: stringOr(i.aqiContext, "airQualityCondition") ?? "Tidak tersedia",
				riskLevel: stringOr(i.weatherContext, "riskLevel", null),
				generatedAt: i.generatedAt,
			})),
			stats: {
				totalReports,
				totalInsights: filteredInsights.length,
				highImpactCount,
				trendDirection,
			},
		};
	});

export const getInsightByIdFn = createServerFn({ method: "GET" })
	.validator((id: string) => id)
	.handler(async ({ data: insightId }): Promise<InsightDetailView | null> => {
		const insight = await prisma.insight.findUnique({
			where: { id: insightId },
		});
		if (!insight) return null;

		const reports = await prisma.report.findMany({
			where: { id: { in: insight.reportIds } },
			select: {
				id: true,
				title: true,
				category: true,
				urgency: true,
				status: true,
				locationName: true,
				images: true,
				createdAt: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return {
			id: insight.id,
			title: insight.title,
			summary: insight.summary,
			category: insight.category,
			impact: insight.impact as "Tinggi" | "Sedang" | "Rendah",
			impactScore: insight.impactScore,
			centerLatitude: insight.centerLatitude,
			centerLongitude: insight.centerLongitude,
			locationName: insight.locationName,
			reportCount: insight.reportCount,
			validatedCount: insight.validatedCount,
			trend: insight.trend as "up" | "down" | "stable",
			affectedRadiusKm: insight.affectedRadiusKm,
			factors: insight.factors,
			potentialImpacts: insight.potentialImpacts,
			whyRisks: insight.whyRisks,
			rainCondition: stringOr(insight.weatherContext, "rainCondition") ?? "Tidak tersedia",
			airQualityCondition: stringOr(insight.aqiContext, "airQualityCondition") ?? "Tidak tersedia",
			riskLevel: stringOr(insight.weatherContext, "riskLevel", null),
			generatedAt: insight.generatedAt,
			reportIds: insight.reportIds,
			reports,
		};
	});

export const refreshInsightsFn = createServerFn({ method: "POST" }).handler(
	async () => {
		await ensureSession();
		lastInsightRefresh = 0;
		await refreshInsights();
		return { success: true };
	},
);
