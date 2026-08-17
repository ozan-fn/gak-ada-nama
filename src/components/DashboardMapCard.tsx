import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  Navigation,
  Minus,
  Plus,
  AlertTriangle,
  Factory,
  Thermometer,
  CloudRain,
  Wind,
  Droplet,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useUserLocationMarker } from "#/hooks/use-user-marker";
import { useUserLocation } from "#/hooks/useUserLocation";
import { useAQIStations } from "#/hooks/useAQIStations";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { useEnvironmentAlerts } from "#/hooks/useEnvironmentAlerts";

export default function DashboardMapCard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const [showLayers, setShowLayers] = useState(false);

  const { locate, isLocating } = useUserLocationMarker(map, true);
  const userLocation = useUserLocation();

  // Fetch environment data for alerts
  const envData = useEnvironmentData(userLocation);
  const alerts = useEnvironmentAlerts(envData);

  // Fetch AQI stations near user location (within 1000km radius, or show 3 nearest if none found)
  const { stations, loading: stationsLoading } = useAQIStations({
    userLat: userLocation.latitude,
    userLon: userLocation.longitude,
    radiusKm: 1000,
  });

  const activeAlertsCount = alerts.length;

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

    map.current.once("load", () => {
      setTimeout(() => locate(), 500);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [locate]);

  // Add AQI visualization layer
  useEffect(() => {
    if (!map.current || stationsLoading || stations.length === 0) {
      return;
    }

    const mapInstance = map.current;

    // Wait for map to be ready
    if (!mapInstance.isStyleLoaded()) {
      mapInstance.once("styledata", () => {
        addAQILayer();
      });
      return;
    }

    addAQILayer();

    function addAQILayer() {
      if (!mapInstance) return;

      // Remove existing layers if any
      if (mapInstance.getLayer("aqi-heatmap"))
        mapInstance.removeLayer("aqi-heatmap");
      if (mapInstance.getSource("aqi-stations"))
        mapInstance.removeSource("aqi-stations");

      // Create GeoJSON from stations
      const geojson = {
        type: "FeatureCollection",
        features: stations.map((station) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [station.longitude, station.latitude],
          },
          properties: {
            aqi: station.aqi,
          },
        })),
      };

      // Add source
      mapInstance.addSource("aqi-stations", {
        type: "geojson",
        data: geojson as any,
      });

      // Calculate bounds to fit all stations
      if (stations.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        stations.forEach((station) => {
          bounds.extend([station.longitude, station.latitude]);
        });

        // Fit map to show all stations with padding
        mapInstance.fitBounds(bounds, {
          padding: 100,
          maxZoom: 10,
          duration: 1000,
        });
      }

      // Add heatmap layer (pollution gradient visualization)
      mapInstance.addLayer({
        id: "aqi-heatmap",
        type: "heatmap",
        source: "aqi-stations",
        paint: {
          // Weight based on AQI value (0-500 scale)
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "aqi"],
            0,
            0,
            50,
            0.2,
            100,
            0.4,
            150,
            0.6,
            200,
            0.8,
            300,
            1,
          ],

          // Intensity increases with zoom level
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.5,
            9,
            1.5,
          ],

          // Color ramp - standard AQI colors
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0, 0, 0, 0)", // Transparent
            0.1,
            "rgba(0, 228, 0, 0.4)", // Good (green)
            0.3,
            "rgba(255, 255, 0, 0.5)", // Moderate (yellow)
            0.5,
            "rgba(255, 126, 0, 0.6)", // Unhealthy for Sensitive (orange)
            0.7,
            "rgba(255, 0, 0, 0.7)", // Unhealthy (red)
            0.85,
            "rgba(153, 0, 76, 0.8)", // Very Unhealthy (purple)
            1,
            "rgba(126, 0, 35, 0.9)", // Hazardous (maroon)
          ],

          // Radius of influence (pollution spread area)
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            40, // Far zoom: larger spread
            5,
            60,
            9,
            100, // Close zoom: more defined areas
          ],

          // Fade opacity at higher zoom levels
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.8,
            9,
            0.7,
            14,
            0.4,
          ],
        },
      });
    }
  }, [stations, stationsLoading]);

  const handleZoom = (delta: number) => {
    if (!map.current) return;
    map.current.zoomTo(map.current.getZoom() + delta);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-white dark:bg-neutral-900"
    >
      <div ref={mapContainer} className="h-full w-full" />

      {/* Top Left Container: Active Alerts */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        {activeAlertsCount > 0 && (
          <Link to="/dashboard/risk-map">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-white/40 bg-white/60 px-3 py-2 shadow-sm backdrop-blur-md transition-colors hover:bg-white/80"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-neutral-800">
                {activeAlertsCount} Active Alert
                {activeAlertsCount > 1 ? "s" : ""}
              </span>
            </button>
          </Link>
        )}
      </div>

      {/* Bottom Left: Danger Summary */}
      {alerts.length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 max-w-xs rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-md backdrop-blur-sm">
          <h3 className="mb-2 text-xs font-semibold text-neutral-800">
            Dangers Nearby
          </h3>
          <div className="space-y-1.5">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={`${alert.type}-${alert.severity}`}
                className="flex items-start gap-2 text-xs"
              >
                <span className="shrink-0 mt-0.5">
                  {alert.type === "aqi" ? (
                    <Factory className="h-4 w-4 text-orange-500" />
                  ) : alert.type === "temperature" ? (
                    <Thermometer className="h-4 w-4 text-red-500" />
                  ) : alert.type === "rain" ? (
                    <CloudRain className="h-4 w-4 text-blue-500" />
                  ) : alert.type === "wind" ? (
                    <Wind className="h-4 w-4 text-gray-600" />
                  ) : alert.type === "humidity" ? (
                    <Droplet className="h-4 w-4 text-cyan-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </span>
                <span className="flex-1 text-neutral-700">{alert.message}</span>
              </div>
            ))}
          </div>
          <Link to="/dashboard/risk-map">
            <button
              type="button"
              className="mt-2 w-full rounded-md bg-sky-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600"
            >
              View Risk Map →
            </button>
          </Link>
        </div>
      )}

      {/* Top Right Controls: Layers, Locate Me */}
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
