import { useEffect, useState } from "react";

export type WeatherData = {
  elevation?: number;
  current: {
    temperature: number;
    humidity: number;
    apparentTemperature: number;
    precipitation: number;
    rain: number;
    windSpeed: number;
    cloudCover: number;
    uvIndex: number;
  };
  hourly: {
    time: string[];
    precipitation: number[];
  };
  daily: {
    time: string[];
    precipitationSum: number[];
    rainSum: number[];
    precipitationProbability: number[];
  };
};

export type AQIData = {
  aqi: number;
  city: string;
  dominentpol: string;
  pm25?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  so2?: number;
  co?: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  time: string;
  forecast?: {
    pm25: Array<{ avg: number; day: string; max: number; min: number }>;
    pm10: Array<{ avg: number; day: string; max: number; min: number }>;
  };
};

export type EnvironmentData = {
  weather: WeatherData | null;
  aqi: AQIData | null;
  loading: boolean;
  error: string | null;
};

type LocationParams = 
  | { latitude: number; longitude: number }
  | { city: string }
  | undefined;

export function useEnvironmentData(location?: LocationParams) {
  const [data, setData] = useState<EnvironmentData>({
    weather: null,
    aqi: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchData(isInitial = false) {
      try {
        // Only show loading on initial fetch, not on refresh
        if (isInitial) {
          setData((prev) => ({ ...prev, loading: true, error: null }));
        }

        // Build query params based on location type
        const params = new URLSearchParams();
        if (location && "latitude" in location) {
          params.set("lat", location.latitude.toString());
          params.set("lon", location.longitude.toString());
        } else if (location && "city" in location) {
          params.set("city", location.city);
        } else {
          params.set("city", "jakarta"); // Default fallback
        }

        const [weatherRes, aqiRes] = await Promise.all([
          fetch(`/api/weather?${params}`),
          fetch(`/api/aqi?${params}`),
        ]);

        if (!mounted) return;

        // Parse weather data
        let weather: WeatherData | null = null;
        if (weatherRes.ok) {
          const raw = await weatherRes.json();
          weather = {
            elevation: raw.elevation,
            current: {
              temperature: raw.current.temperature_2m,
              humidity: raw.current.relative_humidity_2m,
              apparentTemperature: raw.current.apparent_temperature,
              precipitation: raw.current.precipitation,
              rain: raw.current.rain,
              windSpeed: raw.current.wind_speed_10m,
              cloudCover: raw.current.cloud_cover,
              uvIndex: raw.current.uv_index,
            },
            hourly: {
              time: raw.hourly.time,
              precipitation: raw.hourly.precipitation,
            },
            daily: {
              time: raw.daily.time,
              precipitationSum: raw.daily.precipitation_sum,
              rainSum: raw.daily.rain_sum,
              precipitationProbability: raw.daily.precipitation_probability_max,
            },
          };
        }

        // Parse AQI data
        let aqi: AQIData | null = null;
        if (aqiRes.ok) {
          const raw = await aqiRes.json();
          if (raw.status === "ok") {
            aqi = {
              aqi: raw.data.aqi,
              city: raw.data.city.name,
              dominentpol: raw.data.dominentpol,
              pm25: raw.data.iaqi.pm25?.v,
              pm10: raw.data.iaqi.pm10?.v,
              o3: raw.data.iaqi.o3?.v,
              no2: raw.data.iaqi.no2?.v,
              so2: raw.data.iaqi.so2?.v,
              co: raw.data.iaqi.co?.v,
              temperature: raw.data.iaqi.t?.v,
              humidity: raw.data.iaqi.h?.v,
              windSpeed: raw.data.iaqi.w?.v,
              pressure: raw.data.iaqi.p?.v,
              time: raw.data.time.s,
              forecast: raw.data.forecast?.daily
                ? {
                    pm25: raw.data.forecast.daily.pm25 || [],
                    pm10: raw.data.forecast.daily.pm10 || [],
                  }
                : undefined,
            };
          }
        }

        if (!mounted) return;

        setData({
          weather,
          aqi,
          loading: false,
          error: !weather && !aqi ? "Failed to fetch data" : null,
        });
      } catch (error) {
        if (!mounted) return;
        setData({
          weather: null,
          aqi: null,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    fetchData(true); // Initial fetch

    // Refresh every 10 minutes (background refresh, no loading state)
    const interval = setInterval(() => fetchData(false), 10 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [location]);

  return data;
}
