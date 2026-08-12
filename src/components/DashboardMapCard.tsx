import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, Navigation, Minus, Plus, AlertTriangle } from "lucide-react";
import { useUserLocationMarker } from "#/hooks/use-user-marker";

export default function DashboardMapCard() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [showLayers, setShowLayers] = useState(false);

  // Custom hook untuk user location dengan compass heading
  const { locate, isLocating } = useUserLocationMarker(map);

  // Ganti sesuai data alert asli
  const activeAlertsCount = 0;

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [106.8456, -6.2088],
      zoom: 12,
      maxBounds: [
        [94.5, -11.5],
        [141.5, 6.5],
      ],
      attributionControl: false,
    });
    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left",
    );

    // Auto-locate user saat map ready
    map.current.once("load", () => {
      setTimeout(() => locate(), 500);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [locate]);

  const handleZoom = (delta: number) => {
    if (!map.current) return;
    map.current.zoomTo(map.current.getZoom() + delta);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Top Left: Active Weather Alerts Pill */}
      {activeAlertsCount > 0 && (
        <button
          type="button"
          className="absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-neutral-200/60 bg-white/70 px-3 py-2 backdrop-blur-sm transition-colors hover:bg-white/90"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-medium text-neutral-800">
            {activeAlertsCount} Active Weather Alerts
          </span>
        </button>
      )}

      {/* Top Right Controls: Layers & Locate Me */}
      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-lg border border-neutral-200/60 bg-white/70 backdrop-blur-sm">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayers(!showLayers)}
            className="flex h-9 w-9 items-center justify-center border-b border-neutral-200/60 transition-colors hover:bg-white/90"
            aria-label="Layers"
          >
            <Layers className="h-4 w-4 text-neutral-700" />
          </button>
          {showLayers && (
            <div className="absolute right-full top-0 mr-2 w-48 rounded-lg border border-neutral-200 bg-white p-2 shadow-sm">
              <p className="text-xs text-neutral-600">Layer options</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={locate}
          disabled={isLocating}
          className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Locate me"
        >
          <Navigation className={`h-4 w-4 text-neutral-700 ${isLocating ? "animate-pulse" : ""}`} />
        </button>
      </div>

      {/* Bottom Right Controls: Zoom */}
      <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-lg border border-neutral-200/60 bg-white/70 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          className="flex h-9 w-9 items-center justify-center border-b border-neutral-200/60 transition-colors hover:bg-white/90"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4 text-neutral-700" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(1)}
          className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-white/90"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4 text-neutral-700" />
        </button>
      </div>
    </div>
  );
}
