/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param latitudeA - Latitude of first point in degrees
 * @param longitudeA - Longitude of first point in degrees
 * @param latitudeB - Latitude of second point in degrees
 * @param longitudeB - Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateDistanceKm(
	latitudeA: number,
	longitudeA: number,
	latitudeB: number,
	longitudeB: number,
): number {
	const earthRadiusKm = 6371;
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

	return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}
