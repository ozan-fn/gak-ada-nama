import type { LocationData } from "./indonesiaLocations";

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Find nearest city from coordinates
export function findNearestCity(
  userLat: number,
  userLon: number,
  cities: LocationData[]
): LocationData {
  let nearest = cities[0];
  let minDistance = calculateDistance(userLat, userLon, nearest.latitude, nearest.longitude);

  for (const city of cities) {
    const distance = calculateDistance(userLat, userLon, city.latitude, city.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }

  return nearest;
}
