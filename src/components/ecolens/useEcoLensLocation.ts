import { useEffect, useRef, useState } from "react";
import { findNearestCity } from "@/lib/geoUtils";
import { INDONESIA_LOCATIONS } from "@/lib/indonesiaLocations";

export type EcoLensLocationStatus =
	| "idle"
	| "requesting"
	| "resolved"
	| "error";

export type EcoLensCoordinates = {
	latitude: number;
	longitude: number;
	accuracy: number;
};

function describeLocationError(error: GeolocationPositionError): string {
	if (error.code === error.PERMISSION_DENIED) {
		return "Izin lokasi ditolak. Isi lokasi kejadian secara manual.";
	}

	if (error.code === error.TIMEOUT) {
		return "GPS terlalu lama merespons. Coba lagi atau isi lokasi secara manual.";
	}

	return "Lokasi tidak dapat ditemukan. Isi lokasi kejadian secara manual.";
}

export function useEcoLensLocation() {
	const mountedRef = useRef(false);
	const [status, setStatus] = useState<EcoLensLocationStatus>("idle");
	const [coordinates, setCoordinates] = useState<EcoLensCoordinates | null>(
		null,
	);
	const [suggestedLocation, setSuggestedLocation] = useState<string | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const requestLocation = () => {
		setError(null);
		setStatus("requesting");

		if (!navigator.geolocation) {
			setStatus("error");
			setError("Browser ini tidak mendukung GPS. Isi lokasi secara manual.");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				if (!mountedRef.current) return;

				const { latitude, longitude, accuracy } = position.coords;
				const nearestCity = findNearestCity(
					latitude,
					longitude,
					INDONESIA_LOCATIONS,
				);

				setCoordinates({ latitude, longitude, accuracy });
				setSuggestedLocation(
					`Koordinat ${latitude.toFixed(5)}, ${longitude.toFixed(5)} · sekitar ${nearestCity.name}, ${nearestCity.province}`,
				);
				setStatus("resolved");
			},
			(locationError) => {
				if (!mountedRef.current) return;

				setCoordinates(null);
				setSuggestedLocation(null);
				setStatus("error");
				setError(describeLocationError(locationError));
			},
			{
				enableHighAccuracy: true,
				timeout: 10_000,
				maximumAge: 60_000,
			},
		);
	};

	return {
		status,
		coordinates,
		suggestedLocation,
		error,
		requestLocation,
	};
}
