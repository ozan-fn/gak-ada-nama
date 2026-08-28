import { useMemo } from "react";

type WeatherData = {
  current: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
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

export type EnvironmentAlert = {
  type: "rain" | "temperature" | "aqi" | "wind" | "humidity";
  severity: "info" | "warning" | "danger";
  message: string;
  time?: string;
  actionText: string;
  actionLink?: string;
};

export function useEnvironmentAlerts(data: EnvironmentData): EnvironmentAlert[] {
  return useMemo(() => {
    const alerts: EnvironmentAlert[] = [];
    
    if (!data.weather && !data.aqi) return alerts;
    
    // Check current conditions
    if (data.weather?.current) {
      const { temperature, humidity, windSpeed, precipitation } = data.weather.current;
      
      // Extreme temperature alert
      if (temperature > 35) {
        alerts.push({
          type: "temperature",
          severity: temperature > 38 ? "danger" : "warning",
          message: `Suhu sangat panas ${temperature.toFixed(1)}°C saat ini`,
          actionText: "Tips cuaca panas",
          actionLink: "/dashboard",
        });
      } else if (temperature < 18) {
        alerts.push({
          type: "temperature",
          severity: "info",
          message: `Suhu dingin ${temperature.toFixed(1)}°C saat ini`,
          actionText: "Lihat prakiraan",
          actionLink: "/dashboard",
        });
      }
      
      // High humidity alert
      if (humidity > 90) {
        alerts.push({
          type: "humidity",
          severity: "info",
          message: `Kelembaban sangat tinggi ${humidity.toFixed(0)}%`,
          actionText: "Lihat detail",
          actionLink: "/dashboard",
        });
      }
      
      // Strong wind alert
      if (windSpeed > 30) {
        alerts.push({
          type: "wind",
          severity: windSpeed > 50 ? "danger" : "warning",
          message: `Angin kencang ${windSpeed.toFixed(1)} km/h`,
          actionText: "Lihat prakiraan",
          actionLink: "/dashboard/risk-map",
        });
      }
      
      // Current heavy rain
      if (precipitation > 5) {
        alerts.push({
          type: "rain",
          severity: precipitation > 15 ? "danger" : precipitation > 10 ? "warning" : "info",
          message: `Hujan ${precipitation > 15 ? "sangat deras" : precipitation > 10 ? "deras" : "sedang"} saat ini`,
          actionText: "Lihat peta risiko",
          actionLink: "/dashboard/risk-map",
        });
      }
    }
    
    // Check hourly forecast for upcoming rain
    if (data.weather?.hourly) {
      const { time, precipitation } = data.weather.hourly;
      
      // Check next 12 hours for heavy rain
      const next12Hours = time.slice(0, 12);
      const nextPrecipitations = precipitation.slice(0, 12);
      
      let foundRainAlert = false;
      nextPrecipitations.forEach((precip, index) => {
        if (precip > 5 && !foundRainAlert) {
          const hour = new Date(next12Hours[index]).getHours();
          const severity = precip > 15 ? "danger" : precip > 10 ? "warning" : "info";
          alerts.push({
            type: "rain",
            severity,
            message: `Prakiraan hujan ${precip > 15 ? "sangat deras" : precip > 10 ? "deras" : "sedang"} pukul ${hour.toString().padStart(2, "0")}:00`,
            time: next12Hours[index],
            actionText: "Lihat prakiraan",
            actionLink: "/dashboard/risk-map",
          });
          foundRainAlert = true; // Only show first rain alert
        }
      });
    }
    
    // Check AQI
    if (data.aqi?.aqi) {
      const aqiValue = data.aqi.aqi;
      if (aqiValue > 150) {
        alerts.push({
          type: "aqi",
          severity: aqiValue > 200 ? "danger" : "warning",
          message: `Kualitas udara tidak sehat (AQI ${aqiValue})`,
          actionText: "Lihat peta AQI",
          actionLink: "/dashboard/risk-map",
        });
      } else if (aqiValue > 100) {
        alerts.push({
          type: "aqi",
          severity: "info",
          message: `Kualitas udara sedang (AQI ${aqiValue})`,
          actionText: "Lihat peta AQI",
          actionLink: "/dashboard/risk-map",
        });
      }
    }

    // Sort by severity (danger > warning > info)
    return alerts.sort((a, b) => {
      const severityOrder = { danger: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }).slice(0, 3); // Return top 3 most important alerts
  }, [data]);
}
