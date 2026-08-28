import { useEffect, useSyncExternalStore } from "react";
import { indonesiaLocations } from "#/data/indonesia-locations";
import { findNearestCity } from "#/lib/geoUtils";

type LocationState = {
	latitude: number | null;
	longitude: number | null;
	city: string;
	loading: boolean;
	error: string | null;
};

const FALLBACK: LocationState = {
	latitude: -6.2088,
	longitude: 106.8456,
	city: "Jakarta, ID",
	loading: false,
	error: "Geolocation not supported",
};

// Module-level singleton state + subscription so every useUserLocation() call
// shares ONE geolocation request instead of firing one per mounted consumer
// (both the route and BaseEnvironmentMap mounted one each → duplicate fetches).
let state: LocationState = {
	latitude: null,
	longitude: null,
	city: "Jakarta, ID",
	loading: true,
	error: null,
};
const listeners = new Set<() => void>();
let started = false;

function setState(next: LocationState) {
	state = next;
	listeners.forEach((l) => {
		l();
	});
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function resolveCity(lat: number, lon: number): string {
	const nearestCity = findNearestCity(lat, lon, indonesiaLocations);
	return `${nearestCity.name}, ${nearestCity.province}`;
}

function startLocation() {
	if (started) return;
	started = true;

	if (!navigator.geolocation) {
		setState({ ...FALLBACK, error: "Geolocation not supported" });
		return;
	}

	let retryCount = 0;
	const maxRetries = 3;

	const attempt = () => {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const lat = position.coords.latitude;
				const lon = position.coords.longitude;
				setState({
					latitude: lat,
					longitude: lon,
					city: resolveCity(lat, lon),
					loading: false,
					error: null,
				});
				retryCount = 0;
			},
			(error) => {
				console.error("Geolocation error:", error);
				if (retryCount < maxRetries) {
					retryCount++;
					setTimeout(attempt, 1000 * retryCount);
				} else {
					setState({
						latitude: -6.2088,
						longitude: 106.8456,
						city: "Jakarta, ID",
						loading: false,
						error: error.message,
					});
					// Allow a future mount to retry from scratch.
					started = false;
				}
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	};

	attempt();
}

export function useUserLocation() {
	const location = useSyncExternalStore(
		subscribe,
		() => state,
		() => state,
	);

	// Start the shared request once, on first consumer mount.
	useEffect(() => {
		if (!started) startLocation();
	}, []);

	return location;
}
