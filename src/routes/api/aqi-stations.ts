import { createFileRoute } from "@tanstack/react-router";

type AQICNBoundsResponse = {
  status: string;
  data: Array<{
    lat: number;
    lon: number;
    uid: number;
    aqi: string;
    station: {
      name: string;
      time: string;
    };
  }>;
};

// Indonesia bounding box coordinates
// North: 6°N, South: -11°S, West: 95°E, East: 141°E
const INDONESIA_BOUNDS = {
  north: 6,
  west: 95,
  south: -11,
  east: 141,
};

export const Route = createFileRoute("/api/aqi-stations")({
  server: {
    handlers: {
      GET: async () => {
        const token = process.env.AQICN_TOKEN;

        if (!token) {
          return new Response(
            JSON.stringify({ error: "AQICN_TOKEN not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        try {
          // Use AQICN Map Bounds API to get ALL stations in Indonesia
          const { north, west, south, east } = INDONESIA_BOUNDS;
          const url = `https://api.waqi.info/v2/map/bounds?latlng=${north},${west},${south},${east}&token=${token}`;

          const res = await fetch(url);

          if (!res.ok) {
            throw new Error(`AQICN API error: ${res.status}`);
          }

          const data = (await res.json()) as AQICNBoundsResponse;

          if (data.status !== "ok" || !data.data) {
            throw new Error("Invalid response from AQICN API");
          }

          // Transform the response to our station format
          const stations = data.data
            .filter((station) => station.aqi !== "-") // Filter out stations without AQI data
            .map((station) => ({
              id: station.uid,
              name: station.station.name,
              latitude: station.lat,
              longitude: station.lon,
              aqi: parseInt(station.aqi, 10),
              uid: station.uid,
            }));

          return new Response(JSON.stringify({ stations, count: stations.length }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=600", // 10 min cache
            },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: "Failed to fetch AQI stations",
              message: error instanceof Error ? error.message : "Unknown error",
              stations: [],
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
