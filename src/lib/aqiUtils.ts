// AQI color scale (standard international)
export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return "bg-emerald-500"; // Good
  if (aqi <= 100) return "bg-yellow-500"; // Moderate
  if (aqi <= 150) return "bg-orange-500"; // Unhealthy for Sensitive
  if (aqi <= 200) return "bg-red-500"; // Unhealthy
  if (aqi <= 300) return "bg-purple-500"; // Very Unhealthy
  return "bg-red-900"; // Hazardous
}

// AQI category label
export function getAQICategory(aqi: number): string {
  if (aqi <= 50) return "Baik";
  if (aqi <= 100) return "Sedang";
  if (aqi <= 150) return "Tidak Sehat (Sensitif)";
  if (aqi <= 200) return "Tidak Sehat";
  if (aqi <= 300) return "Sangat Tidak Sehat";
  return "Berbahaya";
}

// AQI health advice
export function getAQIAdvice(aqi: number): string {
  if (aqi <= 50) {
    return "Udara bersih. Aman untuk aktivitas outdoor.";
  }
  if (aqi <= 100) {
    return "Kualitas udara dapat diterima. Kelompok sensitif sebaiknya batasi aktivitas outdoor berkepanjangan.";
  }
  if (aqi <= 150) {
    return "Kelompok sensitif mungkin mengalami dampak kesehatan. Batasi aktivitas outdoor berkepanjangan.";
  }
  return "⚠️ Tidak sehat! Hindari aktivitas outdoor. Gunakan masker jika harus keluar.";
}
