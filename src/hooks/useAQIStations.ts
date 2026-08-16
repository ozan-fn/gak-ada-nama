import { useState, useEffect } from "react";
import type { AQIStation } from "#/lib/aqiUtils";
import { calculateDistance } from "#/lib/geoUtils";

type UseAQIStationsParams = {
  userLat?: number | null;
  userLon?: number | null;
  radiusKm?: number;
};

export function useAQIStations({ userLat, userLon, radiusKm = 1000 }: UseAQIStationsParams = {}) {
  const [stations, setStations] = useState<AQIStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchStations() {
      try {
        const res = await fetch("/api/aqi-stations");
        
        if (!res.ok) throw new Error("Failed to fetch");
        
        const data = await res.json();
        
        if (mounted) {
          let filteredStations = data.stations || [];

          // Filter by distance if user location provided
          if (userLat !== null && userLat !== undefined && userLon !== null && userLon !== undefined) {
            const stationsWithDistance = filteredStations.map((station: AQIStation) => {
              const distance = calculateDistance(userLat, userLon, station.latitude, station.longitude);
              return { ...station, distance };
            });

            // Sort by distance
            stationsWithDistance.sort((a: AQIStation & { distance: number }, b: AQIStation & { distance: number }) => a.distance - b.distance);

            // Filter within radius
            const nearbyStations = stationsWithDistance.filter((s: AQIStation & { distance: number }) => s.distance <= radiusKm);

            // If no stations within radius, show the 3 nearest ones
            if (nearbyStations.length === 0) {
              filteredStations = stationsWithDistance.slice(0, 3);
            } else {
              filteredStations = nearbyStations;
            }
          }

          setStations(filteredStations);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching AQI stations:", error);
        if (mounted) {
          setStations([]);
          setLoading(false);
        }
      }
    }

    fetchStations();

    // Refresh every 10 minutes
    const interval = setInterval(fetchStations, 10 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [userLat, userLon, radiusKm]);

  return { stations, loading };
}
