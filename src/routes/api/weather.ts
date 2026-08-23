import { createFileRoute } from "@tanstack/react-router";

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    rain: number;
    wind_speed_10m: number;
    cloud_cover: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
  };
  daily: {
    time: string[];
    precipitation_sum: number[];
    rain_sum: number[];
    precipitation_probability_max: number[];
  };
};

// Indonesia major cities coordinates
const CITY_COORDS: Record<string, [number, number]> = {
  jakarta: [-6.2088, 106.8456],
  surabaya: [-7.2575, 112.7521],
  bandung: [-6.9175, 107.6191],
  medan: [3.5952, 98.6722],
  semarang: [-6.9667, 110.4167],
  makassar: [-5.1477, 119.4327],
  palembang: [-2.9761, 104.7754],
  yogyakarta: [-7.7956, 110.3695],
  bali: [-8.4095, 115.1889],
};

export const Route = createFileRoute("/api/weather")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const city = url.searchParams.get("city")?.toLowerCase() || "jakarta";
        const lat = url.searchParams.get("lat");
        const lng = url.searchParams.get("lng") || url.searchParams.get("lon"); // Accept both lon and lng

        try {
          // Get coordinates
          let latitude: number;
          let longitude: number;

          if (lat && lng) {
            latitude = parseFloat(lat);
            longitude = parseFloat(lng);
          } else if (CITY_COORDS[city]) {
            [latitude, longitude] = CITY_COORDS[city];
          } else {
            // Default to Jakarta
            [latitude, longitude] = CITY_COORDS.jakarta;
          }

          // Open-Meteo API (FREE, no API key needed)
          const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            current:
              "temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,cloud_cover",
            hourly: "temperature_2m,precipitation_probability,precipitation",
            daily:
              "precipitation_sum,rain_sum,precipitation_probability_max",
            timezone: "Asia/Jakarta",
            forecast_days: "7",
          });

          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params}`
          );

          if (!res.ok) {
            throw new Error(`Open-Meteo API error: ${res.status}`);
          }

          const data = (await res.json()) as OpenMeteoResponse;

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=600", // 10 min cache
            },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: "Failed to fetch weather data",
              message: error instanceof Error ? error.message : "Unknown error",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
