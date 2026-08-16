import { useState, useEffect } from "react";
import { INDONESIA_LOCATIONS } from "#/lib/indonesiaLocations";
import { findNearestCity } from "#/lib/geoUtils";

type LocationState = {
  latitude: number | null;
  longitude: number | null;
  city: string;
  loading: boolean;
  error: string | null;
};

export function useUserLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    city: "Jakarta, ID", // Fallback
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Check if Geolocation API is available
    if (!navigator.geolocation) {
      setLocation({
        latitude: -6.2088, // Jakarta fallback
        longitude: 106.8456,
        city: "Jakarta, ID",
        loading: false,
        error: "Geolocation not supported",
      });
      return;
    }

    // Request user location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Find nearest city from our database
        const nearestCity = findNearestCity(lat, lon, INDONESIA_LOCATIONS);

        setLocation({
          latitude: lat,
          longitude: lon,
          city: `${nearestCity.name}, ID`,
          loading: false,
          error: null,
        });
      },
      (error) => {
        // Permission denied or error - fallback to Jakarta
        console.error("Geolocation error:", error.message);
        setLocation({
          latitude: -6.2088,
          longitude: 106.8456,
          city: "Jakarta, ID",
          loading: false,
          error: error.message,
        });
      },
      {
        enableHighAccuracy: false, // ponytail: false = faster, less battery
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  return location;
}
