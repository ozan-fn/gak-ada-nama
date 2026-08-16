// AQI color scale based on US EPA standards
export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return "#10b981"; // Green - Good
  if (aqi <= 100) return "#fbbf24"; // Yellow - Moderate
  if (aqi <= 150) return "#f97316"; // Orange - Unhealthy for Sensitive
  if (aqi <= 200) return "#ef4444"; // Red - Unhealthy
  if (aqi <= 300) return "#a855f7"; // Purple - Very Unhealthy
  return "#991b1b"; // Maroon - Hazardous
}

export function getAQILabel(aqi: number): string {
  if (aqi <= 50) return "Baik";
  if (aqi <= 100) return "Sedang";
  if (aqi <= 150) return "Tidak Sehat (Sensitif)";
  if (aqi <= 200) return "Tidak Sehat";
  if (aqi <= 300) return "Sangat Tidak Sehat";
  return "Berbahaya";
}

export type AQIStation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  aqi: number;
  dominentpol: string;
};
