// Regional climate baselines for Indonesian cities
// Based on historical climate data for anomaly detection

export type RegionalBaseline = {
  temp: number;        // Normal temperature (°C)
  rainProb: number;    // Normal precipitation probability (%)
  aqi: number;         // Normal AQI value
  humidity: number;    // Normal humidity (%)
};

// ponytail: hardcoded baselines from climate data, DB with historical trends later
export const REGIONAL_BASELINES: Record<string, RegionalBaseline> = {
  // Java
  'Jakarta': { temp: 28, rainProb: 30, aqi: 50, humidity: 75 },
  'Bandung': { temp: 24, rainProb: 35, aqi: 45, humidity: 70 },
  'Surabaya': { temp: 29, rainProb: 28, aqi: 55, humidity: 73 },
  'Semarang': { temp: 28, rainProb: 32, aqi: 48, humidity: 74 },
  'Yogyakarta': { temp: 27, rainProb: 33, aqi: 46, humidity: 72 },
  'Malang': { temp: 23, rainProb: 36, aqi: 42, humidity: 68 },
  'Bogor': { temp: 25, rainProb: 40, aqi: 44, humidity: 78 },
  'Depok': { temp: 27, rainProb: 32, aqi: 49, humidity: 75 },
  'Tangerang': { temp: 28, rainProb: 30, aqi: 51, humidity: 74 },
  'Bekasi': { temp: 28, rainProb: 31, aqi: 50, humidity: 75 },
  'Cirebon': { temp: 28, rainProb: 29, aqi: 47, humidity: 73 },
  'Tegal': { temp: 28, rainProb: 30, aqi: 46, humidity: 72 },
  
  // Sumatra
  'Medan': { temp: 27, rainProb: 38, aqi: 52, humidity: 77 },
  'Palembang': { temp: 28, rainProb: 36, aqi: 48, humidity: 76 },
  'Pekanbaru': { temp: 27, rainProb: 40, aqi: 54, humidity: 79 },
  'Padang': { temp: 26, rainProb: 42, aqi: 43, humidity: 80 },
  'Jambi': { temp: 27, rainProb: 38, aqi: 47, humidity: 78 },
  'Bandar Lampung': { temp: 27, rainProb: 35, aqi: 46, humidity: 76 },
  'Bengkulu': { temp: 26, rainProb: 40, aqi: 42, humidity: 79 },
  'Dumai': { temp: 27, rainProb: 39, aqi: 55, humidity: 78 },
  'Batam': { temp: 27, rainProb: 37, aqi: 49, humidity: 77 },
  
  // Kalimantan
  'Pontianak': { temp: 27, rainProb: 42, aqi: 46, humidity: 82 },
  'Banjarmasin': { temp: 28, rainProb: 40, aqi: 48, humidity: 80 },
  'Balikpapan': { temp: 27, rainProb: 41, aqi: 47, humidity: 81 },
  'Samarinda': { temp: 27, rainProb: 41, aqi: 47, humidity: 81 },
  'Palangkaraya': { temp: 27, rainProb: 40, aqi: 45, humidity: 80 },
  
  // Sulawesi
  'Makassar': { temp: 28, rainProb: 34, aqi: 46, humidity: 74 },
  'Manado': { temp: 27, rainProb: 38, aqi: 42, humidity: 78 },
  'Palu': { temp: 28, rainProb: 36, aqi: 44, humidity: 75 },
  'Kendari': { temp: 27, rainProb: 37, aqi: 43, humidity: 77 },
  'Gorontalo': { temp: 27, rainProb: 38, aqi: 42, humidity: 78 },
  
  // Bali & Nusa Tenggara
  'Denpasar': { temp: 28, rainProb: 32, aqi: 44, humidity: 73 },
  'Mataram': { temp: 28, rainProb: 30, aqi: 43, humidity: 72 },
  'Kupang': { temp: 29, rainProb: 25, aqi: 41, humidity: 68 },
  
  // Maluku & Papua
  'Ambon': { temp: 27, rainProb: 43, aqi: 38, humidity: 83 },
  'Ternate': { temp: 27, rainProb: 42, aqi: 39, humidity: 82 },
  'Jayapura': { temp: 27, rainProb: 44, aqi: 36, humidity: 84 },
  'Sorong': { temp: 27, rainProb: 45, aqi: 37, humidity: 85 },
  'Manokwari': { temp: 27, rainProb: 45, aqi: 36, humidity: 85 },
  'Timika': { temp: 27, rainProb: 46, aqi: 35, humidity: 86 },
  'Merauke': { temp: 28, rainProb: 42, aqi: 37, humidity: 83 },
};

/**
 * Get regional baseline for a specific city
 * Falls back to Jakarta baseline if city not found
 */
export function getRegionalBaseline(city?: string | null): RegionalBaseline {
  if (!city) {
    return REGIONAL_BASELINES['Jakarta'];
  }

  // Try exact match first
  if (REGIONAL_BASELINES[city]) {
    return REGIONAL_BASELINES[city];
  }

  // Try case-insensitive match
  const cityLower = city.toLowerCase();
  const matchedCity = Object.keys(REGIONAL_BASELINES).find(
    key => key.toLowerCase() === cityLower
  );

  if (matchedCity) {
    return REGIONAL_BASELINES[matchedCity];
  }

  // Fallback to Jakarta (Java baseline)
  return REGIONAL_BASELINES['Jakarta'];
}

/**
 * Get available cities with baselines
 */
export function getAvailableCities(): string[] {
  return Object.keys(REGIONAL_BASELINES).sort();
}
