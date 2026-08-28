import { useMemo } from "react";

type WeatherData = {
  current: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    cloudCover: number;
  };
  hourly: {
    time: string[];
    precipitation: number[];
  };
};

type AQIData = {
  aqi: number;
  city: string;
};

type EnvironmentData = {
  weather: WeatherData | null;
  aqi: AQIData | null;
};

export type Warning = {
  id: string;
  title: string;
  severity: "tinggi" | "sedang" | "rendah";
  distance: string;
  timeAgo: string;
  supportingReports: number;
  reason: string;
  confidence: number;
  riskScore: number;
  type: "rain" | "temperature" | "aqi" | "wind" | "humidity" | "flooding";
};

export function useEnvironmentWarnings(data: EnvironmentData): Warning[] {
  return useMemo(() => {
    const warnings: Warning[] = [];
    
    if (!data.weather && !data.aqi) return warnings;
    
    // Heavy rain + flooding risk
    if (data.weather?.current?.precipitation && data.weather.current.precipitation > 10) {
      const intensity = data.weather.current.precipitation;
      warnings.push({
        id: "flooding-current",
        title: "Potensi Genangan",
        severity: intensity > 20 ? "tinggi" : "sedang",
        distance: "Di lokasi Anda",
        timeAgo: "Saat ini",
        supportingReports: Math.floor(intensity / 5),
        reason: `Hujan dengan intensitas ${intensity > 20 ? "sangat tinggi" : "tinggi"} (${intensity.toFixed(1)} mm/jam) terdeteksi. Waspada genangan air di area rendah.`,
        confidence: Math.min(95, 75 + Math.floor(intensity)),
        riskScore: Math.min(100, Math.floor(intensity * 3.5)),
        type: "flooding",
      });
    }
    
    // Upcoming heavy rain
    if (data.weather?.hourly) {
      const nextRain = data.weather.hourly.precipitation.slice(0, 6).findIndex(p => p > 8);
      if (nextRain !== -1 && nextRain < 6) {
        const intensity = data.weather.hourly.precipitation[nextRain];
        warnings.push({
          id: `rain-forecast-${nextRain}`,
          title: "Prakiraan Hujan Deras",
          severity: intensity > 15 ? "tinggi" : "sedang",
          distance: "Di lokasi Anda",
          timeAgo: `${nextRain + 1} jam lagi`,
          supportingReports: 1,
          reason: `Prakiraan cuaca menunjukkan hujan deras (${intensity.toFixed(1)} mm/jam) dalam ${nextRain + 1} jam ke depan.`,
          confidence: 82,
          riskScore: Math.floor(intensity * 3),
          type: "rain",
        });
      }
    }
    
    // High AQI warning
    if (data.aqi?.aqi && data.aqi.aqi > 100) {
      const aqiValue = data.aqi.aqi;
      warnings.push({
        id: "aqi-high",
        title: "Kualitas Udara Menurun",
        severity: aqiValue > 150 ? "tinggi" : "sedang",
        distance: "Di sekitar Anda",
        timeAgo: "Saat ini",
        supportingReports: 1,
        reason: `Indeks kualitas udara mencapai ${aqiValue} (${aqiValue > 150 ? "tidak sehat" : "sedang"}). ${aqiValue > 150 ? "Hindari aktivitas luar ruangan." : "Batasi aktivitas luar ruangan berkepanjangan."}`,
        confidence: 88,
        riskScore: Math.min(100, Math.floor(aqiValue * 0.5)),
        type: "aqi",
      });
    }
    
    // Extreme temperature
    if (data.weather?.current?.temperature && data.weather.current.temperature > 35) {
      const temp = data.weather.current.temperature;
      warnings.push({
        id: "temperature-high",
        title: "Suhu Ekstrem Tinggi",
        severity: temp > 38 ? "tinggi" : "sedang",
        distance: "Di lokasi Anda",
        timeAgo: "Saat ini",
        supportingReports: 1,
        reason: `Suhu udara mencapai ${temp.toFixed(1)}°C. Risiko heat stroke meningkat. Pastikan hidrasi cukup dan hindari paparan langsung matahari.`,
        confidence: 92,
        riskScore: Math.floor((temp - 30) * 8),
        type: "temperature",
      });
    }
    
    // Strong wind
    if (data.weather?.current?.windSpeed && data.weather.current.windSpeed > 40) {
      const windSpeed = data.weather.current.windSpeed;
      warnings.push({
        id: "wind-strong",
        title: "Angin Kencang",
        severity: windSpeed > 60 ? "tinggi" : "sedang",
        distance: "Di lokasi Anda",
        timeAgo: "Saat ini",
        supportingReports: 1,
        reason: `Kecepatan angin mencapai ${windSpeed.toFixed(1)} km/jam. Waspada terhadap benda yang mudah terbang dan pohon rapuh.`,
        confidence: 85,
        riskScore: Math.floor(windSpeed * 1.2),
        type: "wind",
      });
    }
    
    // High humidity + potential mold/health issues
    if (data.weather?.current?.humidity && data.weather.current.humidity > 85 && 
        data.weather.current.temperature && data.weather.current.temperature > 28) {
      warnings.push({
        id: "humidity-high",
        title: "Kelembaban Sangat Tinggi",
        severity: "rendah",
        distance: "Di lokasi Anda",
        timeAgo: "Saat ini",
        supportingReports: 1,
        reason: `Kelembaban ${data.weather.current.humidity.toFixed(0)}% dengan suhu ${data.weather.current.temperature.toFixed(1)}°C meningkatkan risiko pertumbuhan jamur dan ketidaknyamanan.`,
        confidence: 78,
        riskScore: Math.floor(data.weather.current.humidity * 0.4),
        type: "humidity",
      });
    }
    
    // Sort by risk score
    return warnings.sort((a, b) => b.riskScore - a.riskScore);
  }, [data]);
}
