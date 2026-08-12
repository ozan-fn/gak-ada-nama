import { useRef, useState, useCallback, useEffect } from "react";
import * as maplibregl from "maplibre-gl";

export function useUserLocationMarker(
  mapRef: React.RefObject<maplibregl.Map | null>,
) {
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const watchId = useRef<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

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

  const locate = useCallback(() => {
    if (!mapRef.current || !navigator.geolocation) return;
    setIsLocating(true);

    // Pantau posisi user secara realtime (bukan sekali ambil saja)
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { longitude, latitude } = position.coords;

        if (!userMarker.current) {
          const el = createMarkerElement();
          userMarker.current = new maplibregl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current!);

          mapRef.current!.flyTo({
            center: [longitude, latitude],
            zoom: 11,
            duration: 1500,
          });
        } else {
          userMarker.current.setLngLat([longitude, latitude]);
        }

        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(
          "Tidak dapat mengakses lokasi Anda. Pastikan izin lokasi diaktifkan.",
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [mapRef, createMarkerElement]);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    userMarker.current?.remove();
    userMarker.current = null;
  }, []);

  useEffect(() => {
    return () => stopWatching();
  }, [stopWatching]);

  return { locate, stopWatching, isLocating };
}
