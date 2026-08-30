import type { IndonesiaLocation } from "#/data/indonesia-locations";

type LocationShape =
  | { name: string; province: string; latitude: number; longitude: number }
  | { name: string; province: string; coordinates: [number, number] }
  | IndonesiaLocation;

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

function resolveCoordinates(city: LocationShape): [number, number] {
  if ("coordinates" in city) {
    return city.coordinates;
  }

  return [city.longitude, city.latitude];
}

// Find nearest city from coordinates
export function findNearestCity(
  userLat: number,
  userLon: number,
  cities: LocationShape[]
): LocationShape {
  if (cities.length === 0) {
    // ponytail: fallback to Semarang if no cities
    return {
      name: "Semarang",
      province: "Jawa Tengah",
      coordinates: [110.4203, -6.9932]
    };
  }

  let nearest = cities[0];
  const [nearestLng, nearestLat] = resolveCoordinates(nearest);
  let minDistance = calculateDistance(userLat, userLon, nearestLat, nearestLng);

  for (const city of cities) {
    const [lng, lat] = resolveCoordinates(city);
    const distance = calculateDistance(userLat, userLon, lat, lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }

  return nearest;
}
