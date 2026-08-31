import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
	type PublicFirePoint as FirePoint,
	getFireDataFn,
} from "#/lib/fire.functions";

export type { FirePoint };

const INDONESIA_BOUNDS = {
	west: 94.5,
	south: -11.5,
	east: 141.5,
	north: 6.5,
};

export function useFireData() {
	const getFireData = useServerFn(getFireDataFn);
	const query = useQuery({
		queryKey: ["fire-data", "indonesia"],
		queryFn: () => getFireData({ data: { ...INDONESIA_BOUNDS, dayRange: 5 } }),
		staleTime: 3 * 60 * 60 * 1_000,
		gcTime: 24 * 60 * 60 * 1_000,
		refetchInterval: 3 * 60 * 60 * 1_000,
	});

	return {
		points: query.data ?? [],
		loading: query.isLoading,
		error: query.error?.message ?? null,
	};
}

export function useLocalFireData(
	latitude: number | null,
	longitude: number | null,
	radiusKm = 100,
) {
	const getFireData = useServerFn(getFireDataFn);
	const enabled = latitude !== null && longitude !== null;
	const radiusDegrees = radiusKm / 111;
	const bounds = enabled
		? {
				west: longitude - radiusDegrees,
				south: latitude - radiusDegrees,
				east: longitude + radiusDegrees,
				north: latitude + radiusDegrees,
			}
		: null;

	const query = useQuery({
		queryKey: ["fire-data", "local", latitude, longitude, radiusKm],
		queryFn: () =>
			getFireData({ data: { ...(bounds ?? INDONESIA_BOUNDS), dayRange: 5 } }),
		enabled,
		staleTime: 3 * 60 * 60 * 1_000,
		gcTime: 24 * 60 * 60 * 1_000,
		refetchInterval: 3 * 60 * 60 * 1_000,
	});

	return {
		points: query.data ?? [],
		loading: query.isLoading,
		error: query.error?.message ?? null,
	};
}
