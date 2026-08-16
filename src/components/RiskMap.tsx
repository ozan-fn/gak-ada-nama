import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, Navigation, Minus, Plus, Compass } from "lucide-react";
import { useUserLocationMarker } from "#/hooks/use-user-marker";

export default function RiskMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const [showLayers, setShowLayers] = useState(false);
  const [bearing, setBearing] = useState(0);

  const { locate, isLocating } = useUserLocationMarker(map);

  const defaultView = {
    center: [118.0, -2.5] as [number, number],
    zoom: 4.5,
    pitch: 0,
    bearing: 0,
  };

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
      ...defaultView,
      maxBounds: [
        [94.5, -11.5],
        [141.5, 6.5],
      ],
      attributionControl: false,
    });

    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.current.on("rotate", () => {
      setBearing(map.current?.getBearing() ?? 0);
    });

    // Kunci ke lokasi user saat pertama kali dimuat
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

  const resetView = () => {
    map.current?.easeTo({ ...defaultView, duration: 600 });
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-white dark:bg-neutral-900"
    >
      <div ref={mapContainer} className="h-full w-full" />

      {/* Top Right Controls: Layers, Locate, Compass/Reset */}
      <div className="absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayers(!showLayers)}
            className="flex h-9 w-9 items-center justify-center border-b border-neutral-200 transition-colors hover:bg-neutral-50"
            aria-label="Layers"
          >
            <Layers className="h-4 w-4 text-neutral-700" />
          </button>
          {showLayers && (
            <div className="absolute right-full top-0 mr-2 w-48 rounded-lg border border-neutral-200 bg-white p-2 shadow-md">
              <p className="text-xs text-neutral-600">Layer options</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={locate}
          disabled={isLocating}
          className="flex h-9 w-9 items-center justify-center border-b border-neutral-200 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Locate me"
        >
          <Navigation
            className={`h-4 w-4 text-neutral-700 ${
              isLocating ? "animate-pulse" : ""
            }`}
          />
        </button>

        <button
          type="button"
          onClick={resetView}
          className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-neutral-50"
          aria-label="Reset arah"
          title="Reset arah"
        >
          <Compass
            className="h-4 w-4 text-neutral-700"
            style={{ transform: `rotate(${-bearing}deg)` }}
          />
        </button>
      </div>

      {/* Bottom Right Controls: Zoom */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          className="flex h-9 w-9 items-center justify-center border-b border-neutral-200 transition-colors hover:bg-neutral-50"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4 text-neutral-700" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(1)}
          className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-neutral-50"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4 text-neutral-700" />
        </button>
      </div>
    </div>
  );
}