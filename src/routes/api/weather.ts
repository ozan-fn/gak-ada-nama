import { createFileRoute } from "@tanstack/react-router";
import { fetchWeatherByCoordinates, resolveWeatherCityCoordinates } from "#/lib/environment.server";

export const Route = createFileRoute("/api/weather")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const city = url.searchParams.get("city")?.toLowerCase() || "jakarta";
        const lat = url.searchParams.get("lat");
        const lng = url.searchParams.get("lng") || url.searchParams.get("lon"); // Accept both lon and lng

        try {
          const parsedLatitude = lat === null ? Number.NaN : Number.parseFloat(lat);
          const parsedLongitude = lng === null ? Number.NaN : Number.parseFloat(lng);
          const coordinates =
            Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude)
              ? {
                  latitude: parsedLatitude,
                  longitude: parsedLongitude,
                }
              : resolveWeatherCityCoordinates(city);
          const data = await fetchWeatherByCoordinates(coordinates, {
            signal: request.signal,
          });

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
            },
          );
        }
      },
    },
  },
});
