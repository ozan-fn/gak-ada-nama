import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  Navigation,
  Minus,
  Plus,
  Compass,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle,
  XCircle,
  AlertOctagon,
} from "lucide-react";
import { useUserLocationMarker } from "#/hooks/use-user-marker";
import { useUserLocation } from "#/hooks/useUserLocation";
import { useAQIStations } from "#/hooks/useAQIStations";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { useEnvironmentAlerts } from "#/hooks/useEnvironmentAlerts";
import { calculateDistance } from "#/lib/geoUtils";
import { addValidation, getValidationSummary } from "#/lib/validationStorage";
import {
  generateRecommendation,
  getRecommendationColor,
} from "#/lib/aiSimulation";

const defaultView = {
  center: [118.0, -2.5] as [number, number],
  zoom: 4.5,
  pitch: 0,
  bearing: 0,
};

export default function RiskMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const [showLayers, setShowLayers] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const { locate, isLocating } = useUserLocationMarker(map, false);
  const userLocation = useUserLocation();

  // Fetch environment data and calculate dangers
  const envData = useEnvironmentData(userLocation);
  const alerts = useEnvironmentAlerts(envData);

  // Fetch AQI stations for heatmap visualization
  const { stations, loading: stationsLoading } = useAQIStations({
    userLat: userLocation.latitude,
    userLon: userLocation.longitude,
    radiusKm: 1000,
  });

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
      "bottom-left",
    );

    map.current.on("rotate", () => {
      setBearing(map.current?.getBearing() ?? 0);
    });

    // Show user location marker on load (without auto-zoom)
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
      if (mapInstance.getLayer("aqi-heatmap")) {
        mapInstance.removeLayer("aqi-heatmap");
      }
      if (mapInstance.getSource("aqi-stations")) {
        mapInstance.removeSource("aqi-stations");
      }

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

      // Add heatmap layer (pollution gradient visualization)
      mapInstance.addLayer({
        id: "aqi-heatmap",
        type: "heatmap",
        source: "aqi-stations",
        paint: {
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
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.5,
            9,
            1.5,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0, 0, 0, 0)",
            0.1,
            "rgba(0, 228, 0, 0.4)",
            0.3,
            "rgba(255, 255, 0, 0.5)",
            0.5,
            "rgba(255, 126, 0, 0.6)",
            0.7,
            "rgba(255, 0, 0, 0.7)",
            0.85,
            "rgba(153, 0, 76, 0.8)",
            1,
            "rgba(126, 0, 35, 0.9)",
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            40,
            5,
            60,
            9,
            100,
          ],
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

  // Add interactive danger markers
  useEffect(() => {
    if (
      !map.current ||
      !userLocation.latitude ||
      !userLocation.longitude ||
      alerts.length === 0
    ) {
      return;
    }

    const mapInstance = map.current;
    const markers: maplibregl.Marker[] = [];

    // Create danger markers from alerts
    alerts.forEach((alert, index) => {
      // Estimate location based on alert type and user location
      // In production, this would come from actual danger zone coordinates
      const offset = 0.01 * (index + 1);
      const dangerLat = userLocation.latitude! + (Math.random() - 0.5) * offset;
      const dangerLon =
        userLocation.longitude! + (Math.random() - 0.5) * offset;

      const distance = calculateDistance(
        userLocation.latitude!,
        userLocation.longitude!,
        dangerLat,
        dangerLon,
      );

      // Get marker color based on severity
      const markerColor =
        alert.severity === "danger"
          ? "#ef4444"
          : alert.severity === "warning"
            ? "#f59e0b"
            : "#3b82f6";

      // Get icon for alert type
      const icon =
        alert.type === "aqi"
          ? "🏭"
          : alert.type === "temperature"
            ? "🌡️"
            : alert.type === "rain"
              ? "🌧️"
              : alert.type === "wind"
                ? "💨"
                : "💧";

      const markerId = `${alert.type}-${alert.severity}-${index}`;
      const validationSummary = getValidationSummary(markerId);

      // Create popup content
      const popupContent = `
        <div class="p-3 min-w-60">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl">${icon}</span>
            <div class="flex-1">
              <h3 class="font-semibold text-sm">${alert.message}</h3>
              <p class="text-xs text-gray-500">${distance.toFixed(1)}km away</p>
            </div>
          </div>

          <div class="flex gap-2 mb-2">
            <button
              onclick="window.confirmDanger('${markerId}')"
              class="flex-1 px-2 py-1 text-xs rounded ${validationSummary.userValidated ? "bg-gray-200 text-gray-500" : "bg-green-500 text-white hover:bg-green-600"}"
              ${validationSummary.userValidated ? "disabled" : ""}
            >
              ✓ Confirm (${validationSummary.confirmations})
            </button>
            <button
              onclick="window.reportCleared('${markerId}')"
              class="flex-1 px-2 py-1 text-xs rounded ${validationSummary.userValidated ? "bg-gray-200 text-gray-500" : "bg-blue-500 text-white hover:bg-blue-600"}"
              ${validationSummary.userValidated ? "disabled" : ""}
            >
              ✗ Cleared (${validationSummary.clearances})
            </button>
          </div>

          <button
            onclick="window.showAIRecommendation('${markerId}')"
            class="w-full px-3 py-1.5 text-xs font-medium rounded bg-purple-500 text-white hover:bg-purple-600"
          >
            🤖 AI Recommendation
          </button>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupContent);

      const marker = new maplibregl.Marker({ color: markerColor })
        .setLngLat([dangerLon, dangerLat])
        .setPopup(popup)
        .addTo(mapInstance);

      markers.push(marker);
    });

    // Global functions for popup buttons
    (window as any).confirmDanger = (markerId: string) => {
      addValidation(markerId, "confirm");
      alert("Danger confirmed! Thank you for validating.");
      // Reload markers to update counts
      window.location.reload();
    };

    (window as any).reportCleared = (markerId: string) => {
      addValidation(markerId, "cleared");
      alert("Reported as cleared! Thank you for updating.");
      window.location.reload();
    };

    (window as any).showAIRecommendation = () => {
      setShowAIPanel(true);
    };

    return () => {
      markers.forEach((m) => {
        m.remove();
      });
    };
  }, [alerts, userLocation.latitude, userLocation.longitude]);

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

      {/* AI Recommendation Panel */}
      {showAIPanel && alerts.length > 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-lg bg-white p-4 shadow-xl">
            {(() => {
              // Generate AI recommendation based on current dangers
              const dangersData = alerts.map((alert, idx) => {
                const estimatedDistance = (idx + 1) * 1000; // Rough estimate
                return {
                  type: alert.type,
                  value:
                    alert.type === "aqi"
                      ? 165
                      : alert.type === "temperature"
                        ? 36
                        : alert.type === "rain"
                          ? 15
                          : alert.type === "wind"
                            ? 45
                            : 85,
                  severity: alert.severity,
                  location: [0, 0] as [number, number],
                  distance: estimatedDistance,
                };
              });

              const recommendation = generateRecommendation(dangersData);
              const iconColor = getRecommendationColor(recommendation.level);

              return (
                <>
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0">
                        {recommendation.level === "safe" ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : recommendation.level === "caution" ? (
                          <AlertTriangleIcon className="h-6 w-6 text-amber-600" />
                        ) : recommendation.level === "avoid" ? (
                          <XCircle className="h-6 w-6 text-red-600" />
                        ) : (
                          <AlertOctagon className="h-6 w-6 text-red-800" />
                        )}
                      </span>
                      <h3 className="text-lg font-semibold">
                        AI Recommendation
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAIPanel(false)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className={`mb-3 rounded-lg p-3 ${iconColor}`}>
                    <p className="font-medium">
                      {recommendation.recommendation}
                    </p>
                    <p className="mt-1 text-sm">
                      Safety Score: {recommendation.score.toFixed(1)}/10
                    </p>
                  </div>

                  {recommendation.reasons.length > 0 && (
                    <div className="mb-3">
                      <h4 className="mb-2 text-sm font-semibold text-gray-700">
                        Detected Hazards:
                      </h4>
                      <ul className="space-y-1">
                        {recommendation.reasons.map((reason) => (
                          <li key={reason} className="text-sm text-gray-600">
                            • {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recommendation.alternativeActions.length > 0 && (
                    <div className="mb-3">
                      <h4 className="mb-2 text-sm font-semibold text-gray-700">
                        Recommended Actions:
                      </h4>
                      <ul className="space-y-1">
                        {recommendation.alternativeActions.map((action) => (
                          <li key={action} className="text-sm text-gray-600">
                            ✓ {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recommendation.bestTime && (
                    <div className="rounded-lg bg-blue-50 p-2">
                      <p className="text-sm text-blue-800">
                        <strong>Best time to go:</strong>{" "}
                        {recommendation.bestTime}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
