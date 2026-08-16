import { createFileRoute } from "@tanstack/react-router";

type AQICNResponse = {
  status: string;
  data: {
    aqi: number;
    idx: number;
    attributions: Array<{ url: string; name: string }>;
    city: {
      geo: [number, number];
      name: string;
      url: string;
      location: string;
    };
    dominentpol: string;
    iaqi: {
      co?: { v: number };
      h?: { v: number }; // humidity
      no2?: { v: number };
      o3?: { v: number };
      p?: { v: number }; // pressure
      pm10?: { v: number };
      pm25?: { v: number };
      so2?: { v: number };
      t?: { v: number }; // temperature
      w?: { v: number }; // wind speed
    };
    time: {
      s: string;
      tz: string;
      v: number;
      iso: string;
    };
    forecast?: {
      daily: {
        o3?: Array<{ avg: number; day: string; max: number; min: number }>;
        pm10?: Array<{ avg: number; day: string; max: number; min: number }>;
        pm25?: Array<{ avg: number; day: string; max: number; min: number }>;
        uvi?: Array<{ avg: number; day: string; max: number; min: number }>;
      };
    };
    debug?: {
      sync: string;
    };
  };
};

export const Route = createFileRoute("/api/aqi")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const city = url.searchParams.get("city") || "jakarta";
        const lat = url.searchParams.get("lat");
        const lng = url.searchParams.get("lng") || url.searchParams.get("lon"); // Accept both lon and lng

        const token = process.env.AQICN_TOKEN;

        if (!token) {
          return new Response(
            JSON.stringify({
              error: "AQICN_TOKEN not configured",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        try {
          // Geo-based or city-based query
          const endpoint =
            lat && lng
              ? `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${token}`
              : `https://api.waqi.info/feed/${city}/?token=${token}`;

          const res = await fetch(endpoint);

          if (!res.ok) {
            throw new Error(`AQICN API error: ${res.status}`);
          }

          const data = (await res.json()) as AQICNResponse;

          if (data.status !== "ok") {
            return new Response(
              JSON.stringify({
                error: "AQICN API returned error status",
                details: data,
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

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
              error: "Failed to fetch AQI data",
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
