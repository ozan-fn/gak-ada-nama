import { useState, useEffect, useRef } from "react";
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

  const retryCount = useRef(0);
  const maxRetries = 3;

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

    const attemptLocation = () => {
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

          retryCount.current = 0;
        },
        (error) => {
          console.error("Geolocation error:", error);

          // Retry logic
          if (retryCount.current < maxRetries) {
            retryCount.current++;
            console.log(`Retrying geolocation (${retryCount.current}/${maxRetries})...`);
            setTimeout(() => attemptLocation(), 1000 * retryCount.current);
          } else {
            // Max retries reached - fallback to Jakarta
            setLocation({
              latitude: -6.2088,
              longitude: 106.8456,
              city: "Jakarta, ID",
              loading: false,
              error: error.message,
            });
            retryCount.current = 0;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, // Always get fresh location on mount
        }
      );
    };

    attemptLocation();
  }, []);

  return location;
}
