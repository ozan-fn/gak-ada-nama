/**
 * Simple client-side routing utilities for calculating safe routes
 * avoiding environmental danger zones
 */

type DangerZone = {
  location: [number, number]; // [longitude, latitude]
  radius: number; // in meters
  severity: 'low' | 'medium' | 'high' | 'extreme';
};

type RouteResult = {
  normalRoute: [number, number][];
  safeRoute: [number, number][];
  detourDistance: number;
  dangersAvoided: number;
  estimatedTime: number; // in minutes
};

/**
 * Calculate if a point is within a danger zone
 */
function isInDangerZone(
  point: [number, number],
  zone: DangerZone
): boolean {
  const [lon1, lat1] = point;
  const [lon2, lat2] = zone.location;
  
  // Simple distance calculation (Haversine formula simplified)
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= zone.radius;
}

/**
 * Calculate a simple safe route avoiding danger zones
 * This is a basic implementation - in production, use a proper routing engine
 */
export function calculateSafeRoute(
  start: [number, number],
  end: [number, number],
  dangerZones: DangerZone[]
): RouteResult {
  // Normal route (straight line)
  const normalRoute = [start, end];
  
  // Check if normal route intersects any danger zones
  const dangerousZones = dangerZones.filter(zone => {
    // Check if danger zone is near the straight path
    const midpoint: [number, number] = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
    ];
    return isInDangerZone(midpoint, zone);
  });
  
  if (dangerousZones.length === 0) {
    // No dangers on path, use normal route
    return {
      normalRoute,
      safeRoute: normalRoute,
      detourDistance: 0,
      dangersAvoided: 0,
      estimatedTime: calculateTravelTime(start, end),
    };
  }
  
  // Simple detour: create waypoints that avoid danger zones
  const safeRoute: [number, number][] = [start];
  
  // Calculate perpendicular offset to avoid danger zones
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const perpOffset = 0.01; // Roughly 1km offset
  
  // Add waypoint that goes around danger zones
  const waypoint: [number, number] = [
    start[0] + dx * 0.5 + dy * perpOffset,
    start[1] + dy * 0.5 - dx * perpOffset,
  ];
  
  safeRoute.push(waypoint, end);
  
  // Calculate detour distance
  const normalDistance = calculateDistance(start, end);
  const detourDistance =
    calculateDistance(start, waypoint) + calculateDistance(waypoint, end);
  
  return {
    normalRoute,
    safeRoute,
    detourDistance: detourDistance - normalDistance,
    dangersAvoided: dangerousZones.length,
    estimatedTime: calculateTravelTime(start, end, safeRoute.length),
  };
}

/**
 * Calculate distance between two points in meters
 */
function calculateDistance(
  point1: [number, number],
  point2: [number, number]
): number {
  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;
  
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate travel time in minutes
 * Assumes average speed of 40 km/h
 */
function calculateTravelTime(
  start: [number, number],
  end: [number, number],
  waypoints: number = 2
): number {
  const distance = calculateDistance(start, end);
  const avgSpeedKmh = 40;
  const timeHours = distance / 1000 / avgSpeedKmh;
  const timeMinutes = timeHours * 60;
  
  // Add extra time for waypoints (traffic, turns)
  const waypointPenalty = (waypoints - 2) * 2; // 2 min per extra waypoint
  
  return Math.round(timeMinutes + waypointPenalty);
}
