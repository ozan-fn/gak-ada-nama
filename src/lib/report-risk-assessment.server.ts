import { getGroqClient } from "@/lib/groq";
import {
	type AssessReportRiskInput,
	type AssessReportRiskResult,
	type NearbyReportRiskContext,
	RISK_HORIZONS,
	RISK_LEVELS,
	type RiskAssessmentErrorCode,
	type RiskAssessmentStatus,
	type RiskAssessmentView,
	type RiskHorizonView,
	type RiskLevel,
} from "@/types/report-assessment";

export const ACTIVE_REPORT_STATUSES = [
	"PENDING",
	"VERIFIED",
	"IN_PROGRESS",
] as const;

export type ActiveReportStatus = (typeof ACTIVE_REPORT_STATUSES)[number];

export type ReportSearchPolicy = {
	radiusMeters: number;
	lookbackMs: number;
};

const HOUR_MS = 60 * 60 * 1_000;
const DAY_MS = 24 * HOUR_MS;

export const REPORT_SEARCH_POLICIES = {
	Sampah: { radiusMeters: 300, lookbackMs: 7 * DAY_MS },
	"Drainase/Banjir": { radiusMeters: 1_000, lookbackMs: 72 * HOUR_MS },
	Polusi: { radiusMeters: 3_000, lookbackMs: 72 * HOUR_MS },
	Kebakaran: { radiusMeters: 3_000, lookbackMs: 24 * HOUR_MS },
	"Fasilitas Rusak": { radiusMeters: 300, lookbackMs: 30 * DAY_MS },
	Lainnya: { radiusMeters: 500, lookbackMs: 7 * DAY_MS },
} as const satisfies Record<string, ReportSearchPolicy>;

export const MAX_NEARBY_REPORTS_FOR_RISK = 20;
export const RISK_ASSESSMENT_TIMEOUT_MS = 12_000;
export const RISK_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1_000;
export const MAX_RISK_ASSESSMENTS_PER_WINDOW = 10;

const DEFAULT_RISK_MODEL = "qwen/qwen3.6-27b";
const EARTH_RADIUS_METERS = 6_371_000;
const MAX_SUMMARY_LENGTH = 800;
const MAX_HORIZON_SUMMARY_LENGTH = 500;
const MAX_LIST_ITEM_LENGTH = 300;
const MAX_LIST_ITEMS = 8;
const MAX_REPORT_DESCRIPTION_LENGTH = 800;
const MAX_CANDIDATE_DESCRIPTION_LENGTH = 180;
const MAX_ENVIRONMENT_JSON_LENGTH = 4_000;

type RiskRateLimitState = {
	timestamps: number[];
	inFlight: boolean;
};

const riskRateLimits = new Map<string, RiskRateLimitState>();

function normalizeCategory(
	category: string,
): keyof typeof REPORT_SEARCH_POLICIES {
	const normalized = category.trim().toLowerCase();

	if (normalized === "sampah") return "Sampah";
	if (normalized === "drainase/banjir" || normalized === "banjir") {
		return "Drainase/Banjir";
	}
	if (normalized === "polusi") return "Polusi";
	if (normalized === "kebakaran") return "Kebakaran";
	if (normalized === "fasilitas rusak") return "Fasilitas Rusak";

	return "Lainnya";
}

export function getReportSearchPolicy(category: string): ReportSearchPolicy {
	return REPORT_SEARCH_POLICIES[normalizeCategory(category)];
}

export function getReportSearchCutoff(
	category: string,
	now: Date = new Date(),
): Date {
	return new Date(now.getTime() - getReportSearchPolicy(category).lookbackMs);
}

export function isActiveReportStatus(
	status: string,
): status is ActiveReportStatus {
	return ACTIVE_REPORT_STATUSES.includes(status as ActiveReportStatus);
}

export function resolveRiskAssessmentStatus({
	hasRisk,
	providerErrorCount,
	attemptCount,
}: {
	hasRisk: boolean;
	providerErrorCount: number;
	attemptCount: number;
}): RiskAssessmentStatus {
	if (hasRisk) return providerErrorCount > 0 ? "PARTIAL" : "COMPLETE";
	return attemptCount >= 3 ? "FAILED" : "PENDING";
}

export function hasValidCoordinates(
	latitude: number | null | undefined,
	longitude: number | null | undefined,
): boolean {
	return (
		typeof latitude === "number" &&
		Number.isFinite(latitude) &&
		latitude >= -90 &&
		latitude <= 90 &&
		typeof longitude === "number" &&
		Number.isFinite(longitude) &&
		longitude >= -180 &&
		longitude <= 180
	);
}

export type ValidCoordinates = {
	latitude: number;
	longitude: number;
};

export function toValidCoordinates(
	latitude: number | null | undefined,
	longitude: number | null | undefined,
): ValidCoordinates | null {
	return hasValidCoordinates(latitude, longitude)
		? { latitude: latitude as number, longitude: longitude as number }
		: null;
}

export function haversineDistanceMeters(
	latitudeA: number,
	longitudeA: number,
	latitudeB: number,
	longitudeB: number,
): number {
	if (
		!hasValidCoordinates(latitudeA, longitudeA) ||
		!hasValidCoordinates(latitudeB, longitudeB)
	) {
		return Number.POSITIVE_INFINITY;
	}

	const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
	const latitudeDelta = toRadians(latitudeB - latitudeA);
	const longitudeDelta = toRadians(longitudeB - longitudeA);
	const startLatitude = toRadians(latitudeA);
	const endLatitude = toRadians(latitudeB);
	const haversine =
		Math.sin(latitudeDelta / 2) ** 2 +
		Math.cos(startLatitude) *
			Math.cos(endLatitude) *
			Math.sin(longitudeDelta / 2) ** 2;
	const boundedHaversine = Math.min(1, Math.max(0, haversine));

	return (
		2 *
		EARTH_RADIUS_METERS *
		Math.atan2(Math.sqrt(boundedHaversine), Math.sqrt(1 - boundedHaversine))
	);
}

export type ReportSearchBounds = {
	minLatitude: number;
	maxLatitude: number;
	minLongitude: number;
	maxLongitude: number;
};

export function getReportSearchBounds(
	latitude: number,
	longitude: number,
	radiusMeters: number,
): ReportSearchBounds {
	if (
		!hasValidCoordinates(latitude, longitude) ||
		!Number.isFinite(radiusMeters) ||
		radiusMeters < 0
	) {
		throw new RangeError("INVALID_REPORT_SEARCH_BOUNDS");
	}

	const latitudeDelta = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
	const latitudeRadians = (latitude * Math.PI) / 180;
	const longitudeDivisor = EARTH_RADIUS_METERS * Math.cos(latitudeRadians);
	const longitudeDelta =
		Math.abs(longitudeDivisor) < 1
			? 180
			: Math.min(180, (radiusMeters / longitudeDivisor) * (180 / Math.PI));

	return {
		minLatitude: Math.max(-90, latitude - latitudeDelta),
		maxLatitude: Math.min(90, latitude + latitudeDelta),
		minLongitude: Math.max(-180, longitude - longitudeDelta),
		maxLongitude: Math.min(180, longitude + longitudeDelta),
	};
}

function cleanJsonText(rawText: string): string {
	let text = rawText.trim();
	text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

	const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (fenceMatch?.[1]) text = fenceMatch[1].trim();

	return text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
	record: Record<string, unknown>,
	allowedKeys: readonly string[],
): boolean {
	return Object.keys(record).every((key) => allowedKeys.includes(key));
}

function parseScore(value: unknown): number | null {
	return typeof value === "number" &&
		Number.isInteger(value) &&
		value >= 0 &&
		value <= 100
		? value
		: null;
}

function parseConfidence(value: unknown): number | null {
	return typeof value === "number" &&
		Number.isFinite(value) &&
		value >= 0 &&
		value <= 1
		? value
		: null;
}

function parseLevel(value: unknown): RiskLevel | null {
	return typeof value === "string" && RISK_LEVELS.includes(value as RiskLevel)
		? (value as RiskLevel)
		: null;
}

function parseText(value: unknown, maxLength: number): string | null {
	if (typeof value !== "string") return null;

	const text = value.replace(/\s+/g, " ").trim();
	return text && text.length <= maxLength ? text : null;
}

function parseTextList(value: unknown): string[] | null {
	if (
		!Array.isArray(value) ||
		value.length < 1 ||
		value.length > MAX_LIST_ITEMS
	) {
		return null;
	}

	const parsed = value.map((item) => parseText(item, MAX_LIST_ITEM_LENGTH));
	return parsed.every((item): item is string => item !== null) ? parsed : null;
}

function parseHorizon(value: unknown): RiskHorizonView | null {
	if (!isRecord(value) || !hasOnlyKeys(value, ["score", "level", "summary"])) {
		return null;
	}

	const score = parseScore(value.score);
	const level = parseLevel(value.level);
	const summary = parseText(value.summary, MAX_HORIZON_SUMMARY_LENGTH);

	return score !== null && level && summary ? { score, level, summary } : null;
}

export function parseRiskAssessment(
	rawText: string,
): RiskAssessmentView | null {
	let parsed: unknown;

	try {
		parsed = JSON.parse(cleanJsonText(rawText));
	} catch {
		return null;
	}

	if (
		!isRecord(parsed) ||
		!hasOnlyKeys(parsed, [
			"score",
			"level",
			"confidence",
			"summary",
			"factors",
			"potentialImpacts",
			"recommendedActions",
			"horizons",
		]) ||
		!isRecord(parsed.horizons) ||
		!hasOnlyKeys(parsed.horizons, RISK_HORIZONS)
	) {
		return null;
	}
	const horizons = parsed.horizons;

	const score = parseScore(parsed.score);
	const level = parseLevel(parsed.level);
	const confidence = parseConfidence(parsed.confidence);
	const summary = parseText(parsed.summary, MAX_SUMMARY_LENGTH);
	const factors = parseTextList(parsed.factors);
	const potentialImpacts = parseTextList(parsed.potentialImpacts);
	const recommendedActions = parseTextList(parsed.recommendedActions);
	const parsedHorizons = RISK_HORIZONS.map(
		(horizon) => [horizon, parseHorizon(horizons[horizon])] as const,
	);

	if (
		score === null ||
		!level ||
		confidence === null ||
		!summary ||
		!factors ||
		!potentialImpacts ||
		!recommendedActions ||
		parsedHorizons.some(([, horizon]) => horizon === null)
	) {
		return null;
	}

	return {
		score,
		level,
		confidence,
		summary,
		factors,
		potentialImpacts,
		recommendedActions,
		horizons: Object.fromEntries(parsedHorizons) as Record<
			(typeof RISK_HORIZONS)[number],
			RiskHorizonView
		>,
	};
}

function acquireRiskAssessmentSlot(key: string): boolean {
	const now = Date.now();
	const windowStart = now - RISK_RATE_LIMIT_WINDOW_MS;

	for (const [existingKey, state] of riskRateLimits) {
		if (!state.inFlight && (state.timestamps.at(-1) ?? 0) < windowStart) {
			riskRateLimits.delete(existingKey);
		}
	}

	const current = riskRateLimits.get(key);
	const timestamps =
		current?.timestamps.filter((timestamp) => timestamp >= windowStart) ?? [];

	if (
		!key.trim() ||
		current?.inFlight ||
		timestamps.length >= MAX_RISK_ASSESSMENTS_PER_WINDOW
	) {
		return false;
	}

	riskRateLimits.set(key, { timestamps: [...timestamps, now], inFlight: true });
	return true;
}

function releaseRiskAssessmentSlot(key: string): void {
	const current = riskRateLimits.get(key);
	if (current) riskRateLimits.set(key, { ...current, inFlight: false });
}

function truncateText(
	value: string | null | undefined,
	maxLength: number,
): string {
	const text = value?.replace(/\s+/g, " ").trim() ?? "";
	return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
}

function finiteNumber(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function finiteNumberArray(value: unknown, limit: number): number[] {
	return Array.isArray(value)
		? value.slice(0, limit).flatMap((item) => {
				const number = finiteNumber(item);
				return number === null ? [] : [number];
			})
		: [];
}

function rounded(value: number): number {
	return Math.round(value * 10) / 10;
}

function average(values: number[]): number | null {
	return values.length > 0
		? rounded(values.reduce((sum, value) => sum + value, 0) / values.length)
		: null;
}

function minimum(values: number[]): number | null {
	return values.length > 0 ? rounded(Math.min(...values)) : null;
}

function maximum(values: number[]): number | null {
	return values.length > 0 ? rounded(Math.max(...values)) : null;
}

function total(values: number[]): number | null {
	return values.length > 0
		? rounded(values.reduce((sum, value) => sum + value, 0))
		: null;
}

function summarizeHourlyWeather(
	hourly: Record<string, unknown> | null,
	hours: number,
): Record<string, number | null> | null {
	if (!hourly) return null;

	const temperatures = finiteNumberArray(hourly.temperature_2m, hours);
	const humidity = finiteNumberArray(hourly.relative_humidity_2m, hours);
	const rainProbability = finiteNumberArray(
		hourly.precipitation_probability,
		hours,
	);
	const precipitation = finiteNumberArray(hourly.precipitation, hours);
	const wind = finiteNumberArray(hourly.wind_speed_10m, hours);

	return {
		minTemperatureC: minimum(temperatures),
		maxTemperatureC: maximum(temperatures),
		averageHumidityPercent: average(humidity),
		maxRainProbabilityPercent: maximum(rainProbability),
		totalPrecipitationMm: total(precipitation),
		maxWindSpeedKmh: maximum(wind),
	};
}

function summarizeDailyWeather(
	daily: Record<string, unknown> | null,
): Record<string, number | null> | null {
	if (!daily) return null;

	return {
		minTemperatureC: minimum(finiteNumberArray(daily.temperature_2m_min, 7)),
		maxTemperatureC: maximum(finiteNumberArray(daily.temperature_2m_max, 7)),
		maxRainProbabilityPercent: maximum(
			finiteNumberArray(daily.precipitation_probability_max, 7),
		),
		totalPrecipitationMm: total(finiteNumberArray(daily.precipitation_sum, 7)),
		maxWindSpeedKmh: maximum(finiteNumberArray(daily.wind_speed_10m_max, 7)),
	};
}

function getPollutantValue(
	iaqi: Record<string, unknown> | null,
	key: string,
): number | null {
	const measurement = iaqi && isRecord(iaqi[key]) ? iaqi[key] : null;
	return measurement ? finiteNumber(measurement.v) : null;
}

function summarizeAQIForecast(
	daily: Record<string, unknown> | null,
	days: number,
): Record<string, { average: number | null; maximum: number | null }> | null {
	if (!daily) return null;

	const summaries = ["pm25", "pm10", "o3", "uvi"].flatMap((pollutant) => {
		const points = Array.isArray(daily[pollutant])
			? daily[pollutant].slice(0, days).filter(isRecord)
			: [];
		if (points.length === 0) return [];

		return [
			[
				pollutant,
				{
					average: average(
						points.flatMap((point) => {
							const value = finiteNumber(point.avg);
							return value === null ? [] : [value];
						}),
					),
					maximum: maximum(
						points.flatMap((point) => {
							const value = finiteNumber(point.max);
							return value === null ? [] : [value];
						}),
					),
				},
			] as const,
		];
	});

	return summaries.length > 0 ? Object.fromEntries(summaries) : null;
}

export function compactEnvironmentSnapshotForRisk(snapshot: unknown): unknown {
	if (!isRecord(snapshot)) return null;

	const coordinates = isRecord(snapshot.coordinates)
		? {
				latitude: finiteNumber(snapshot.coordinates.latitude),
				longitude: finiteNumber(snapshot.coordinates.longitude),
			}
		: null;
	const weather = isRecord(snapshot.openMeteo) ? snapshot.openMeteo : null;
	const weatherCurrent =
		weather && isRecord(weather.current) ? weather.current : null;
	const weatherHourly =
		weather && isRecord(weather.hourly) ? weather.hourly : null;
	const weatherDaily =
		weather && isRecord(weather.daily) ? weather.daily : null;
	const airQuality = isRecord(snapshot.aqicn) ? snapshot.aqicn : null;
	const iaqi = airQuality && isRecord(airQuality.iaqi) ? airQuality.iaqi : null;
	const aqiTime =
		airQuality && isRecord(airQuality.time) ? airQuality.time : null;
	const aqiForecast =
		airQuality && isRecord(airQuality.forecast) ? airQuality.forecast : null;
	const aqiDaily =
		aqiForecast && isRecord(aqiForecast.daily) ? aqiForecast.daily : null;

	return {
		observedAt:
			typeof snapshot.observedAt === "string" ? snapshot.observedAt : null,
		coordinates,
		weather: weather
			? {
					source: "OPEN_METEO",
					observedAt:
						typeof weatherCurrent?.time === "string"
							? weatherCurrent.time
							: null,
					current: weatherCurrent
						? {
								temperatureC: finiteNumber(weatherCurrent.temperature_2m),
								humidityPercent: finiteNumber(
									weatherCurrent.relative_humidity_2m,
								),
								precipitationMm: finiteNumber(weatherCurrent.precipitation),
								rainMm: finiteNumber(weatherCurrent.rain),
								windSpeedKmh: finiteNumber(weatherCurrent.wind_speed_10m),
								cloudCoverPercent: finiteNumber(weatherCurrent.cloud_cover),
							}
						: null,
					forecast: {
						"24H": summarizeHourlyWeather(weatherHourly, 24),
						"72H": summarizeHourlyWeather(weatherHourly, 72),
						"7D": summarizeDailyWeather(weatherDaily),
					},
				}
			: null,
		airQuality: airQuality
			? {
					source: "AQICN",
					observedAt: typeof aqiTime?.iso === "string" ? aqiTime.iso : null,
					current: {
						aqi: finiteNumber(airQuality.aqi),
						dominantPollutant:
							typeof airQuality.dominentpol === "string"
								? airQuality.dominentpol
								: null,
						pm25: getPollutantValue(iaqi, "pm25"),
						pm10: getPollutantValue(iaqi, "pm10"),
						o3: getPollutantValue(iaqi, "o3"),
						no2: getPollutantValue(iaqi, "no2"),
						so2: getPollutantValue(iaqi, "so2"),
						co: getPollutantValue(iaqi, "co"),
					},
					forecast: {
						"24H": summarizeAQIForecast(aqiDaily, 1),
						"72H": summarizeAQIForecast(aqiDaily, 3),
						"7D": summarizeAQIForecast(aqiDaily, 7),
					},
				}
			: null,
	};
}

function normalizeEnvironmentSnapshot(snapshot: unknown): unknown {
	try {
		const compactSnapshot = compactEnvironmentSnapshotForRisk(snapshot);
		const serialized = JSON.stringify(compactSnapshot) ?? "null";
		return serialized.length <= MAX_ENVIRONMENT_JSON_LENGTH
			? compactSnapshot
			: {
					truncated: true,
					observedAt: isRecord(compactSnapshot)
						? compactSnapshot.observedAt
						: null,
				};
	} catch {
		return null;
	}
}

function normalizeNearbyReports(
	reports: NearbyReportRiskContext[],
): Array<Record<string, unknown>> {
	return [...reports]
		.sort(
			(a, b) =>
				a.distanceMeters - b.distanceMeters ||
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
				a.id.localeCompare(b.id),
		)
		.slice(0, MAX_NEARBY_REPORTS_FOR_RISK)
		.map((report) => ({
			id: report.id,
			title: truncateText(report.title, 120),
			description: truncateText(
				report.description,
				MAX_CANDIDATE_DESCRIPTION_LENGTH,
			),
			category: report.category,
			urgency: report.urgency,
			status: report.status,
			locationName: truncateText(report.locationName, 120),
			createdAt:
				report.createdAt instanceof Date
					? report.createdAt.toISOString()
					: report.createdAt,
			distanceMeters: Math.max(0, Math.round(report.distanceMeters)),
		}));
}

function buildRiskPrompt(input: AssessReportRiskInput): string {
	return JSON.stringify({
		report: {
			title: truncateText(input.report.title, 120),
			description: truncateText(
				input.report.description,
				MAX_REPORT_DESCRIPTION_LENGTH,
			),
			category: input.report.category,
			urgency: input.report.urgency,
			locationName: truncateText(input.report.locationName, 120),
			latitude: input.report.latitude ?? null,
			longitude: input.report.longitude ?? null,
			ecolensSummary: truncateText(input.report.ecolensSummary, 300) || null,
		},
		nearbyReports: normalizeNearbyReports(input.nearbyReports),
		environmentSnapshot: normalizeEnvironmentSnapshot(
			input.environmentSnapshot,
		),
	});
}

function classifyRiskError(
	error: unknown,
	aborted: boolean,
): RiskAssessmentErrorCode {
	if (aborted) return "TIMEOUT";

	const message = (
		error instanceof Error ? error.message : String(error)
	).toLowerCase();
	if (message.includes("groq_api_key_missing") || message.includes("api key")) {
		return "CONFIGURATION";
	}
	if (message.includes("rate") || message.includes("429")) {
		return "RATE_LIMITED";
	}

	return "AI_UNAVAILABLE";
}

function getRiskErrorLogDetails(error: unknown): {
	name: string;
	message: string;
	status: number | null;
	code: string | null;
} {
	const errorRecord =
		typeof error === "object" && error !== null
			? (error as Record<string, unknown>)
			: null;
	const rawMessage = error instanceof Error ? error.message : String(error);
	const apiKey = process.env.GROQ_API_KEY?.trim();
	const redactedMessage = apiKey
		? rawMessage.replaceAll(apiKey, "[REDACTED]")
		: rawMessage;
	const status = errorRecord?.status;
	const code = errorRecord?.code;

	return {
		name: error instanceof Error ? error.name : "UnknownError",
		message: redactedMessage.replace(/\s+/g, " ").trim().slice(0, 500),
		status: typeof status === "number" ? status : null,
		code:
			typeof code === "string" || typeof code === "number"
				? String(code)
				: null,
	};
}

export async function assessReportRisk(
	input: AssessReportRiskInput,
): Promise<AssessReportRiskResult> {
	const startedAt = Date.now();
	const model = process.env.GROQ_RISK_MODEL?.trim() || DEFAULT_RISK_MODEL;

	if (!acquireRiskAssessmentSlot(input.rateLimitKey)) {
		console.warn("[ReportAssessment] AI risk assessment rate limited", {
			errorCode: "RATE_LIMITED",
			model,
			durationMs: Date.now() - startedAt,
		});
		return { success: false, errorCode: "RATE_LIMITED", model };
	}

	const controller = new AbortController();
	const timeout = setTimeout(
		() => controller.abort(),
		RISK_ASSESSMENT_TIMEOUT_MS,
	);
	try {
		const groq = getGroqClient();
		const riskContext = buildRiskPrompt(input);
		console.info("[ReportAssessment] AI risk request prepared", {
			model,
			contextChars: riskContext.length,
			estimatedContextTokens: Math.ceil(riskContext.length / 4),
			nearbyReportCount: Math.min(
				input.nearbyReports.length,
				MAX_NEARBY_REPORTS_FOR_RISK,
			),
		});
		const completion = await groq.chat.completions.create(
			{
				model,
				messages: [
					{
						role: "system",
						content: `Kamu adalah analis risiko lingkungan untuk laporan masyarakat di Indonesia. Gunakan hanya bukti dalam input: isi laporan, laporan sekitar, dan snapshot lingkungan. Jangan mengarang data yang tidak tersedia. Nyatakan ketidakpastian melalui confidence dan ringkasan. Urgensi laporan adalah bukti masukan dan tidak boleh diubah.

Balas HANYA dengan JSON valid tanpa markdown, menggunakan struktur persis berikut:
{
  "score": 0,
  "level": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "confidence": 0.0,
  "summary": "ringkasan risiko dalam bahasa Indonesia",
  "factors": ["faktor berbasis bukti"],
  "potentialImpacts": ["dampak potensial"],
  "recommendedActions": ["tindakan yang disarankan"],
  "horizons": {
    "24H": { "score": 0, "level": "LOW", "summary": "risiko 24 jam" },
    "72H": { "score": 0, "level": "LOW", "summary": "risiko 72 jam" },
    "7D": { "score": 0, "level": "LOW", "summary": "risiko 7 hari" }
  }
}

Semua score wajib bilangan bulat 0-100, confidence wajib 0-1, dan setiap daftar wajib berisi 1-8 butir singkat. Jika bukti lingkungan tidak lengkap, turunkan confidence dan sebutkan keterbatasannya tanpa mengasumsikan nilai yang hilang.`,
					},
					{
						role: "user",
						content: `Analisis konteks laporan berikut:\n${riskContext}`,
					},
				],
				response_format: { type: "json_object" },
				reasoning_format: "hidden",
				reasoning_effort: "none",
				temperature: 0.1,
				max_completion_tokens: 900,
			},
			{ signal: controller.signal },
		);

		const rawText = completion.choices[0]?.message?.content;
		const risk = rawText ? parseRiskAssessment(rawText) : null;

		if (!risk) {
			console.error("[ReportAssessment] AI risk response rejected", {
				errorCode: "INVALID_RESPONSE",
				model,
				durationMs: Date.now() - startedAt,
				finishReason: completion.choices[0]?.finish_reason ?? null,
				responseLength: rawText?.length ?? 0,
			});
			return { success: false, errorCode: "INVALID_RESPONSE", model };
		}

		return { success: true, risk, model };
	} catch (error) {
		const errorCode = classifyRiskError(error, controller.signal.aborted);
		console.error("[ReportAssessment] AI risk request failed", {
			errorCode,
			model,
			durationMs: Date.now() - startedAt,
			...getRiskErrorLogDetails(error),
		});
		return {
			success: false,
			errorCode,
			model,
		};
	} finally {
		clearTimeout(timeout);
		releaseRiskAssessmentSlot(input.rateLimitKey);
	}
}
