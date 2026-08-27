import { useQuery } from "@tanstack/react-query";

export interface FirePoint {
  lat: number;
  lon: number;
  brightness: number;
  confidence: number;
  frp: number; // Fire Radiative Power
  acq_date: string;
  acq_time: string;
}

const INDONESIA_BOUNDS = "94.5,-11.5,141.5,6.5"; // west,south,east,north

/**
 * Fetch fire data from NASA FIRMS API
 * @param bounds - Bounding box (west,south,east,north) or "world"
 * @param dayRange - Number of days to fetch (1-10)
 */
async function fetchFireData(bounds: string, dayRange: number = 5): Promise<FirePoint[]> {
  const apiKey = import.meta.env.VITE_NASA_FIRMS_MAP_KEY;

  if (!apiKey) {
    console.error("[fetchFireData] ❌ NASA FIRMS API key not found");
    throw new Error("NASA FIRMS API key not configured");
  }

  console.log(`[fetchFireData] 🔥 Fetching fire data for bounds: ${bounds}, days: ${dayRange}`);
  
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/${bounds}/${dayRange}`;
  
  const fetchStartTime = Date.now();
  const response = await fetch(url);
  const fetchDuration = Date.now() - fetchStartTime;

  console.log(`[fetchFireData] Response received in ${fetchDuration}ms`);
  console.log(`[fetchFireData] Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const csvText = await response.text();
  console.log(`[fetchFireData] ✅ CSV received, size: ${csvText.length} bytes`);

  // Parse CSV
  const lines = csvText.trim().split("\n");
  
  if (lines.length <= 1) {
    console.warn("[fetchFireData] ⚠️ No fire data available");
    return [];
  }

  const headers = lines[0].split(",");
  console.log("[fetchFireData] CSV Headers:", headers);

  // Find column indices
  const latIndex = headers.indexOf("latitude");
  const lonIndex = headers.indexOf("longitude");
  const brightIndex = headers.indexOf("brightness") !== -1 
    ? headers.indexOf("brightness") 
    : headers.indexOf("bright_ti4"); // VIIRS uses bright_ti4
  const confIndex = headers.indexOf("confidence");
  const frpIndex = headers.indexOf("frp");
  const dateIndex = headers.indexOf("acq_date");
  const timeIndex = headers.indexOf("acq_time");

  if (latIndex === -1 || lonIndex === -1) {
    throw new Error("Invalid CSV format: missing latitude or longitude columns");
  }

  // Parse data rows (skip header)
  const firePoints: FirePoint[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",");
    
    const lat = parseFloat(values[latIndex]);
    const lon = parseFloat(values[lonIndex]);
    const brightness = brightIndex !== -1 ? parseFloat(values[brightIndex]) : 0;
    const confidenceValue = confIndex !== -1 ? values[confIndex] : "0";
    const frp = frpIndex !== -1 ? parseFloat(values[frpIndex]) : 0;
    const acq_date = dateIndex !== -1 ? values[dateIndex] : "";
    const acq_time = timeIndex !== -1 ? values[timeIndex] : "";

    // Parse confidence (can be numeric or categorical: "low", "nominal", "high")
    let confidence = 0;
    if (!isNaN(parseFloat(confidenceValue))) {
      confidence = parseFloat(confidenceValue);
    } else {
      // Map categorical to numeric
      const confLower = confidenceValue.toLowerCase();
      if (confLower.includes("high") || confLower === "h") confidence = 90;
      else if (confLower.includes("nominal") || confLower === "n") confidence = 70;
      else if (confLower.includes("low") || confLower === "l") confidence = 30;
    }

    // Filter: only medium to high confidence fires (>= 50%)
    if (confidence >= 50 && !isNaN(lat) && !isNaN(lon)) {
      firePoints.push({
        lat,
        lon,
        brightness,
        confidence,
        frp,
        acq_date,
        acq_time,
      });
    }
  }

  console.log(`[fetchFireData] 🔥 Total fire points parsed: ${lines.length - 1}`);
  console.log(`[fetchFireData] 🔥 Fire points after confidence filter (>=50): ${firePoints.length}`);
  
  if (firePoints.length > 0) {
    console.log("[fetchFireData] 📊 Sample fire point:", firePoints[0]);
    console.log("[fetchFireData] 📊 Confidence range:", {
      min: Math.min(...firePoints.map(p => p.confidence)),
      max: Math.max(...firePoints.map(p => p.confidence)),
      avg: (firePoints.reduce((sum, p) => sum + p.confidence, 0) / firePoints.length).toFixed(1)
    });
  }

  return firePoints;
}

/**
 * Hook: Fetch fire data for entire Indonesia
 * - Cached globally for 3 hours
 * - Persists across page navigation
 * - Background refetch every 3 hours
 */
export function useFireData() {
  const query = useQuery({
    queryKey: ['fire-data', 'indonesia'],
    queryFn: () => fetchFireData(INDONESIA_BOUNDS, 5),
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (cache persists)
    refetchInterval: 3 * 60 * 60 * 1000, // Auto-refetch every 3 hours
  });

  return {
    points: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}

/**
 * Hook: Fetch fire data for local area around user
 * - Smaller bounding box for faster loading
 * - Used in DashboardMapCard for nearby fires only
 * @param lat - User latitude
 * @param lon - User longitude
 * @param radiusKm - Radius in km (default: 100km)
 */
export function useLocalFireData(lat: number | null, lon: number | null, radiusKm: number = 100) {
  // Calculate bounding box (rough approximation: 1 degree ≈ 111km)
  const enabled = lat !== null && lon !== null;
  const radiusDeg = radiusKm / 111;
  const bounds = enabled 
    ? `${lon! - radiusDeg},${lat! - radiusDeg},${lon! + radiusDeg},${lat! + radiusDeg}`
    : "";

  const query = useQuery({
    queryKey: ['fire-data', 'local', lat, lon, radiusKm],
    queryFn: () => fetchFireData(bounds, 5),
    enabled, // Only fetch when lat/lon available
    staleTime: 3 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: 3 * 60 * 60 * 1000,
  });

  return {
    points: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
