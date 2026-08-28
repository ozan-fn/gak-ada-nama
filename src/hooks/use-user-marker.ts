import { useRef, useState, useCallback, useEffect } from "react";
import * as maplibregl from "maplibre-gl";

export function useUserLocationMarker(
  mapRef: React.RefObject<maplibregl.Map | null>,
  restrictBounds: boolean = false
) {
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const watchId = useRef<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const createMarkerElement = useCallback(() => {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = "24px";
    wrapper.style.height = "24px";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";

    // Dot biru + ring putih (posisi tetap di tengah)
    const dot = document.createElement("div");
    dot.style.position = "relative";
    dot.style.width = "16px";
    dot.style.height = "16px";
    dot.style.borderRadius = "50%";
    dot.style.backgroundColor = "#3b82f6";
    dot.style.border = "3px solid white";
    dot.style.boxShadow = "0 0 6px rgba(0,0,0,0.25)";

    wrapper.appendChild(dot);
    return wrapper;
  }, []);

  const locate = useCallback((shouldZoom: boolean = true) => {
    if (!mapRef.current || !navigator.geolocation) return;
    setIsLocating(true);

    // ponytail: getCurrentPosition + retry, no watchPosition drift
    const attemptLocate = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;

          if (!userMarker.current) {
            const el = createMarkerElement();
            userMarker.current = new maplibregl.Marker({ element: el })
              .setLngLat([longitude, latitude])
              .addTo(mapRef.current!);

            if (shouldZoom) {
              mapRef.current!.flyTo({
                center: [longitude, latitude],
                zoom: 11,
                duration: 1500,
              });
            }
          } else {
            userMarker.current.setLngLat([longitude, latitude]);
          }

          if (restrictBounds) {
            const radiusInDeg = 1.8;
            mapRef.current!.setMaxBounds([
              [longitude - radiusInDeg, latitude - radiusInDeg],
              [longitude + radiusInDeg, latitude + radiusInDeg],
            ]);
          }

          retryCount.current = 0;
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          
          // Retry logic
          if (retryCount.current < maxRetries) {
            retryCount.current++;
            console.log(`Retrying geolocation (${retryCount.current}/${maxRetries})...`);
            setTimeout(() => attemptLocate(), 1000 * retryCount.current);
          } else {
            alert("Tidak dapat mengakses lokasi Anda. Pastikan izin lokasi diaktifkan.");
            retryCount.current = 0;
            setIsLocating(false);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    };

    attemptLocate();
  }, [mapRef, createMarkerElement, restrictBounds]);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    userMarker.current?.remove();
    userMarker.current = null;
    retryCount.current = 0;
  }, []);

  useEffect(() => {
    return () => stopWatching();
  }, [stopWatching]);

  return { locate, stopWatching, isLocating };
}
