import { indonesiaLocations } from "@/data/indonesia-locations";
import type { AutomaticCoordinates } from "@/lib/automatic-report-detection";
import { findNearestCity } from "@/lib/geoUtils";

const DEFAULT_ENDPOINT = "https://nominatim.openstreetmap.org";
const PUBLIC_NOMINATIM_INTERVAL_MS = 16_000;
const REQUEST_TIMEOUT_MS = 6_000;
const locationCache = new Map<string, ResolvedLocation>();

let publicNominatimQueue: Promise<void> = Promise.resolve();
let lastPublicNominatimRequestAt = 0;

type NominatimAddress = Record<string, string | undefined>;

type NominatimReverseResponse = {
	display_name?: string;
	licence?: string;
	address?: NominatimAddress;
};

export type ResolvedLocation = {
	name: string;
	provider: "NOMINATIM" | "LOCAL_NEAREST_CITY";
	attribution: string | null;
};

function cacheKey(coordinates: AutomaticCoordinates) {
	return `${coordinates.latitude.toFixed(4)}:${coordinates.longitude.toFixed(4)}`;
}

function distinctLocationParts(parts: Array<string | undefined>) {
	const seen = new Set<string>();
	return parts.flatMap((part) => {
		const normalized = part?.replace(/\s+/g, " ").trim();
		if (!normalized) return [];
		const key = normalized.toLocaleLowerCase("id-ID");
		if (seen.has(key)) return [];
		seen.add(key);
		return [normalized];
	});
}

export function formatNominatimLocationName(
	address: NominatimAddress,
): string | null {
	const localArea =
		address.neighbourhood ??
		address.quarter ??
		address.suburb ??
		address.village ??
		address.hamlet;
	const district =
		address.city_district ??
		address.municipality ??
		address.town ??
		address.city;
	const regency = address.county ?? address.state_district;
	const parts = distinctLocationParts([
		localArea,
		district,
		regency,
		address.state,
	]);

	return parts.length > 0 ? parts.slice(0, 4).join(", ") : null;
}

function localFallback(coordinates: AutomaticCoordinates): ResolvedLocation {
	const nearest = findNearestCity(
		coordinates.latitude,
		coordinates.longitude,
		indonesiaLocations,
	);
	return {
		name: `Sekitar ${nearest.name}, ${nearest.province}`,
		provider: "LOCAL_NEAREST_CITY",
		attribution: null,
	};
}

async function waitForPublicNominatimSlot() {
	const waitMs = Math.max(
		0,
		lastPublicNominatimRequestAt + PUBLIC_NOMINATIM_INTERVAL_MS - Date.now(),
	);
	if (waitMs > 0) {
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}
	lastPublicNominatimRequestAt = Date.now();
}

async function schedulePublicNominatim<T>(task: () => Promise<T>): Promise<T> {
	const result = publicNominatimQueue.then(async () => {
		await waitForPublicNominatimSlot();
		return task();
	});
	publicNominatimQueue = result.then(
		() => undefined,
		() => undefined,
	);
	return result;
}

async function fetchNominatimLocation(
	coordinates: AutomaticCoordinates,
): Promise<ResolvedLocation | null> {
	if (process.env.AUTOMATIC_REPORT_REVERSE_GEOCODING_ENABLED === "false") {
		return null;
	}

	const endpoint =
		process.env.AUTOMATIC_REPORT_REVERSE_GEOCODING_URL?.trim() ||
		DEFAULT_ENDPOINT;
	const url = new URL("reverse", `${endpoint.replace(/\/$/, "")}/`);
	url.search = new URLSearchParams({
		format: "jsonv2",
		lat: String(coordinates.latitude),
		lon: String(coordinates.longitude),
		zoom: "14",
		addressdetails: "1",
		layer: "address",
		"accept-language": "id",
	}).toString();
	const isPublicNominatim = url.hostname === "nominatim.openstreetmap.org";
	const request = async () => {
		const systemEmail =
			process.env.AUTOMATIC_REPORT_SYSTEM_EMAIL?.trim() ||
			"monitor@prita.system";
		const response = await fetch(url, {
			headers: {
				Accept: "application/json",
				"Accept-Language": "id",
				"User-Agent": `PritaEnvironmentalMonitor/1.0 (${systemEmail})`,
			},
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});
		if (!response.ok) return null;
		const data = (await response.json()) as NominatimReverseResponse;
		if (data.address?.country_code?.toLowerCase() !== "id") return null;
		const name = data.address
			? formatNominatimLocationName(data.address)
			: null;
		return name
			? {
					name,
					provider: "NOMINATIM" as const,
					attribution: data.licence?.trim() || "© OpenStreetMap contributors",
				}
			: null;
	};

	return isPublicNominatim ? schedulePublicNominatim(request) : request();
}

export async function resolveAutomaticReportLocation(
	coordinates: AutomaticCoordinates,
): Promise<ResolvedLocation> {
	const key = cacheKey(coordinates);
	const cached = locationCache.get(key);
	if (cached) return cached;

	const resolved =
		(await fetchNominatimLocation(coordinates).catch(() => null)) ??
		localFallback(coordinates);
	locationCache.set(key, resolved);
	return resolved;
}
