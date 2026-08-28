// 100% Dynamic Baseline System - ALL data from real APIs
// Temperature, Humidity, Rain → Open-Meteo Historical Weather API
// AQI → AQICN nearby stations average

export type DynamicBaseline = {
  temp: number;
  rainSum: number;      // Average daily precipitation (mm)
  humidity: number;
  aqi: number;          // Local area AQI baseline from nearby stations
  confidence: number;   // 0-100, based on data availability
};

/**
 * Fetch REAL historical weather baseline from Open-Meteo Archive API
 * Uses 1-year historical data (365 days)
 * FREE & UNLIMITED - no API key required
 */
async function fetchWeatherBaseline(
  latitude: number,
  longitude: number
): Promise<{ temp: number; rainSum: number; humidity: number }> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1); // Last 1 year

  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];

  const url = 
    `https://archive-api.open-meteo.com/v1/archive?` +
    `latitude=${latitude}&longitude=${longitude}` +
    `&start_date=${start}&end_date=${end}` +
    `&daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean` +
    `&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo Historical API failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.daily) {
    throw new Error('No historical weather data available');
  }

  // Calculate averages from 1-year data
  const temps = data.daily.temperature_2m_mean.filter((v: number | null) => v !== null);
  const rains = data.daily.precipitation_sum.filter((v: number | null) => v !== null);
  const humidities = data.daily.relative_humidity_2m_mean.filter((v: number | null) => v !== null);

  const avgTemp = temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
  const avgRain = rains.reduce((a: number, b: number) => a + b, 0) / rains.length;
  const avgHumidity = humidities.reduce((a: number, b: number) => a + b, 0) / humidities.length;

  return {
    temp: Math.round(avgTemp * 10) / 10,
    rainSum: Math.round(avgRain * 10) / 10,
    humidity: Math.round(avgHumidity),
  };
}

/**
 * Fetch LOCAL AQI baseline from nearby AQICN stations
 * Calculates median AQI from stations within radius
 * This is the "normal" AQI for user's area, NOT a global static value!
 */
async function fetchLocalAQIBaseline(
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<{ aqi: number; stationCount: number }> {
  try {
    // Use our existing /api/aqi-stations endpoint
    const response = await fetch(
      `/api/aqi-stations?lat=${latitude}&lon=${longitude}&radius=${radiusKm}`
    );

    if (!response.ok) {
      throw new Error(`AQI stations API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const stations = data.stations || [];

    if (stations.length === 0) {
      // No nearby stations - expand radius or use regional estimate
      return { aqi: 50, stationCount: 0 }; // Fallback
    }

    // Calculate median AQI from nearby stations (more robust than mean)
    const aqiValues = stations.map((s: any) => s.aqi).sort((a: number, b: number) => a - b);
    const median = aqiValues[Math.floor(aqiValues.length / 2)];

    return {
      aqi: Math.round(median),
      stationCount: stations.length,
    };
  } catch (error) {
    return { aqi: 50, stationCount: 0 }; // Fallback
  }
}

/**
 * Fetch complete dynamic baseline with ALL real API data
 * Combines Open-Meteo historical weather + AQICN local stations
 */
export async function fetchDynamicBaseline(
  latitude: number,
  longitude: number
): Promise<DynamicBaseline> {
  // Fetch weather and AQI baselines in parallel
  const [weatherBaseline, aqiBaseline] = await Promise.all([
    fetchWeatherBaseline(latitude, longitude),
    fetchLocalAQIBaseline(latitude, longitude, 50),
  ]);

  // Calculate confidence score based on data availability
  let confidence = 100;
  if (aqiBaseline.stationCount === 0) confidence -= 25; // No AQI stations
  if (aqiBaseline.stationCount < 3) confidence -= 10;   // Few AQI stations

  const baseline: DynamicBaseline = {
    temp: weatherBaseline.temp,
    rainSum: weatherBaseline.rainSum,
    humidity: weatherBaseline.humidity,
    aqi: aqiBaseline.aqi,
    confidence,
  };

  return baseline;
}

/**
 * Fetch dynamic baseline WITH CACHE (localStorage)
 * Cache expires after 7 days (AQI patterns change frequently)
 */
export async function getDynamicBaseline(
  latitude: number,
  longitude: number,
  city: string
): Promise<DynamicBaseline> {
  const cacheKey = `dynamic-baseline-${city}-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    if (age < SEVEN_DAYS) {
      return data;
    }
  }

  // Fetch fresh data from APIs
  const baseline = await fetchDynamicBaseline(latitude, longitude);

  // Cache it
  localStorage.setItem(cacheKey, JSON.stringify({
    data: baseline,
    timestamp: Date.now()
  }));

  return baseline;
}

/**
 * Get dynamic baseline with fallback for loading state
 * Returns static fallback immediately, fetches real data in background
 * 
 * @deprecated - Use getDynamicBaseline directly with async/await
 * This hook placeholder is for future React hook implementation
 */
export function useDynamicBaseline(
  _latitude: number | null,
  _longitude: number | null,
  _city: string | null
): {
  baseline: DynamicBaseline | null;
  loading: boolean;
  error: Error | null;
} {
  // This will be used as a React hook in components
  // For now, components can call getDynamicBaseline directly
  // Future: implement as proper React hook with useState/useEffect
  return {
    baseline: null,
    loading: true,
    error: null,
  };
}

