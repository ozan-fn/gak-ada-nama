import { useEffect, useState } from "react";

export interface PrecipitationPoint {
  lat: number;
  lon: number;
  precipitation: number; // mm/hr
  rain: number; // mm/hr
}

// Generate grid of points around user's location
// Creates a 5x5 grid within radius (default 300km)
function generateGridAroundLocation(
  centerLat: number,
  centerLon: number,
  radiusKm: number = 300
): Array<{ lat: number; lon: number }> {
  const points: Array<{ lat: number; lon: number }> = [];
  
  // Convert radius to degrees (approximate: 1° ≈ 111km)
  const radiusDeg = radiusKm / 111;
  
  // Create 5x5 grid (25 points) around center
  const gridSize = 5;
  const step = (radiusDeg * 2) / (gridSize - 1);
  
  for (let latIdx = 0; latIdx < gridSize; latIdx++) {
    for (let lonIdx = 0; lonIdx < gridSize; lonIdx++) {
      const lat = centerLat - radiusDeg + latIdx * step;
      const lon = centerLon - radiusDeg + lonIdx * step;
      points.push({ lat, lon });
    }
  }
  
  return points;
}

// Fetch precipitation data for a single point
async function fetchPrecipitationForPoint(
  lat: number,
  lon: number
): Promise<PrecipitationPoint | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toFixed(2));
    url.searchParams.set("longitude", lon.toFixed(2));
    url.searchParams.set("current", "precipitation,rain");
    url.searchParams.set("forecast_days", "1");
    
    const response = await fetch(url.toString());
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      lat,
      lon,
      precipitation: data.current?.precipitation ?? 0,
      rain: data.current?.rain ?? 0,
    };
  } catch (error) {
    console.error(`Failed to fetch precipitation for ${lat},${lon}:`, error);
    return null;
  }
}

interface UsePrecipitationGridProps {
  userLat?: number;
  userLon?: number;
  radiusKm?: number;
}

export function usePrecipitationGrid({
  userLat,
  userLon,
  radiusKm = 300,
}: UsePrecipitationGridProps = {}) {
  const [points, setPoints] = useState<PrecipitationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if no user location
    if (!userLat || !userLon) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchGrid() {
      try {
        // TypeScript guard - these are checked in the outer useEffect
        if (!userLat || !userLon) return;
        
        const grid = generateGridAroundLocation(userLat, userLon, radiusKm);
        
        // Fetch all points in parallel
        const results = await Promise.all(
          grid.map((point) => fetchPrecipitationForPoint(point.lat, point.lon))
        );
        
        // Filter out failed requests
        const validPoints = results.filter(
          (point): point is PrecipitationPoint => point !== null
        );
        
        if (!mounted) return;
        
        if (validPoints.length === 0) {
          setError("Failed to fetch precipitation data");
        } else {
          setPoints(validPoints);
          setError(null);
        }
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    }

    fetchGrid();

    // Refresh every 10 minutes
    const interval = setInterval(fetchGrid, 10 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [userLat, userLon, radiusKm]);

  return { points, loading, error };
}
