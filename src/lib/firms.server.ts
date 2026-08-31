import type { AutomaticFirePoint } from "@/lib/automatic-report-detection";

const FIRMS_TIMEOUT_MS = 10_000;

export type FirmsBounds = {
	west: number;
	south: number;
	east: number;
	north: number;
};

function getFirmsApiKey() {
	const apiKey = process.env.NASA_FIRMS_MAP_KEY?.trim();
	if (!apiKey) throw new Error("NASA_FIRMS_MAP_KEY_MISSING");
	return apiKey;
}

function parseConfidence(value: string): number {
	const numeric = Number.parseFloat(value);
	if (Number.isFinite(numeric)) return numeric;

	switch (value.trim().toLowerCase()) {
		case "high":
		case "h":
			return 90;
		case "nominal":
		case "n":
			return 70;
		case "low":
		case "l":
			return 30;
		default:
			return 0;
	}
}

function parseObservedAt(date: string, time: string): Date | null {
	const paddedTime = time.padStart(4, "0");
	const hours = paddedTime.slice(0, 2);
	const minutes = paddedTime.slice(2, 4);
	const observedAt = new Date(`${date}T${hours}:${minutes}:00Z`);
	return Number.isNaN(observedAt.getTime()) ? null : observedAt;
}

export function parseFirmsCsv(csv: string): AutomaticFirePoint[] {
	const lines = csv.trim().split(/\r?\n/);
	if (lines.length <= 1) return [];

	const headers = lines[0].split(",").map((header) => header.trim());
	const indexOf = (...names: string[]) =>
		names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ??
		-1;
	const latitudeIndex = indexOf("latitude");
	const longitudeIndex = indexOf("longitude");
	const brightnessIndex = indexOf("brightness", "bright_ti4");
	const confidenceIndex = indexOf("confidence");
	const frpIndex = indexOf("frp");
	const dateIndex = indexOf("acq_date");
	const timeIndex = indexOf("acq_time");

	if (
		latitudeIndex < 0 ||
		longitudeIndex < 0 ||
		dateIndex < 0 ||
		timeIndex < 0
	) {
		throw new Error("FIRMS_INVALID_CSV");
	}

	return lines.slice(1).flatMap((line) => {
		if (!line.trim()) return [];
		const values = line.split(",").map((value) => value.trim());
		const latitude = Number.parseFloat(values[latitudeIndex]);
		const longitude = Number.parseFloat(values[longitudeIndex]);
		const observedAt = parseObservedAt(
			values[dateIndex] ?? "",
			values[timeIndex] ?? "",
		);

		if (
			!Number.isFinite(latitude) ||
			latitude < -90 ||
			latitude > 90 ||
			!Number.isFinite(longitude) ||
			longitude < -180 ||
			longitude > 180 ||
			!observedAt
		) {
			return [];
		}

		return [
			{
				latitude,
				longitude,
				brightness:
					brightnessIndex < 0
						? 0
						: Number.parseFloat(values[brightnessIndex]) || 0,
				confidence:
					confidenceIndex < 0
						? 0
						: parseConfidence(values[confidenceIndex] ?? ""),
				frp: frpIndex < 0 ? 0 : Number.parseFloat(values[frpIndex]) || 0,
				observedAt,
			},
		];
	});
}

export async function fetchFirmsFirePoints(
	bounds: FirmsBounds,
	dayRange = 1,
): Promise<AutomaticFirePoint[]> {
	const apiKey = getFirmsApiKey();
	const encodedBounds = [bounds.west, bounds.south, bounds.east, bounds.north]
		.map((value) => value.toFixed(5))
		.join(",");
	const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(apiKey)}/VIIRS_SNPP_NRT/${encodedBounds}/${Math.max(1, Math.min(10, Math.round(dayRange)))}`;
	const response = await fetch(url, {
		signal: AbortSignal.timeout(FIRMS_TIMEOUT_MS),
	});

	if (!response.ok) {
		throw new Error(`FIRMS_HTTP_${response.status}`);
	}

	return parseFirmsCsv(await response.text());
}
