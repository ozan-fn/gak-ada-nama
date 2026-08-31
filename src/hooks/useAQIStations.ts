import { useEffect, useRef, useState } from "react";
import { calculateDistance } from "@/lib/geoUtils";

export interface AQIStation {
	id: number | string;
	name: string;
	latitude: number;
	longitude: number;
	aqi: number;
	uid: number | string;
	distance?: number;
}

type UseAQIStationsParams = {
	userLat?: number | null;
	userLon?: number | null;
	radiusKm?: number;
};

// Module-level cache: the station dataset is static and returned in full, so we
// fetch it once and filter by distance client-side. This avoids re-fetching the
// whole list on every center/radius change (which caused map flicker on select).
let cachedAllStations: AQIStation[] | null = null;
let cacheCreatedAt = 0;
let inFlight: Promise<AQIStation[]> | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

async function fetchAllStations(): Promise<AQIStation[]> {
	// Reuse an in-flight request so concurrent subscribers share one fetch.
	if (inFlight) return inFlight;

	inFlight = (async () => {
		try {
			const res = await fetch("/api/aqi-stations");
			if (!res.ok) throw new Error("Failed to fetch");
			const data = await res.json();
			const stations: AQIStation[] = data.stations || [];
			cachedAllStations = stations;
			cacheCreatedAt = Date.now();
			return stations;
		} finally {
			inFlight = null;
		}
	})();

	return inFlight;
}

export function useAQIStations({
	userLat,
	userLon,
	radiusKm = 1000,
}: UseAQIStationsParams = {}) {
	const [stations, setStations] = useState<AQIStation[]>([]);
	const [loading, setLoading] = useState(() => cachedAllStations === null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				// Use cached data if fresh, otherwise fetch.
				if (cachedAllStations && Date.now() - cacheCreatedAt < CACHE_TTL_MS) {
					if (cancelled) return;
					setStations(
						filterStations(cachedAllStations, userLat, userLon, radiusKm),
					);
					setLoading(false);
					return;
				}
				const all = await fetchAllStations();
				if (!cancelled) {
					setStations(filterStations(all, userLat, userLon, radiusKm));
					setLoading(false);
				}
			} catch (e) {
				console.error("Error fetching AQI stations:", e);
				if (!cancelled) {
					setStations([]);
					setLoading(false);
				}
			}
		}

		// Keep the cache refreshed in the background without touching visible state.
		timerRef.current = setInterval(async () => {
			if (Date.now() - cacheCreatedAt < CACHE_TTL_MS) return;
			try {
				await fetchAllStations();
			} catch {
				// ignore background refresh errors
			}
		}, CACHE_TTL_MS);

		load();

		return () => {
			cancelled = true;
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [userLat, userLon, radiusKm]);

	// Client-side distance filtering happens synchronously on center/radius change.
	return { stations, loading };
}

function filterStations(
	all: AQIStation[],
	userLat?: number | null,
	userLon?: number | null,
	radiusKm = 1000,
): AQIStation[] {
	if (
		userLat === null ||
		userLat === undefined ||
		userLon === null ||
		userLon === undefined
	) {
		// No center → use nearest stations to a fallback, or just return as-is.
		return all.slice(0, 50);
	}

	const withDistance = all
		.map((station) => ({
			...station,
			distance: calculateDistance(
				userLat,
				userLon,
				station.latitude,
				station.longitude,
			),
		}))
		.sort((a, b) => a.distance - b.distance);

	const nearby = withDistance.filter((s) => s.distance <= radiusKm);

	// If nothing within radius, show the 3 nearest (preserve original behavior).
	return nearby.length > 0 ? nearby : withDistance.slice(0, 3);
}
