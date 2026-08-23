import { useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  Minus,
  Plus,
  Compass,
  Navigation,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle,
  XCircle,
  AlertOctagon,
} from "lucide-react";
import { BaseEnvironmentMap, type MapContext } from "./maps/BaseEnvironmentMap";
import {
  generateRecommendation,
  getRecommendationColor,
} from "#/lib/aiSimulation";
import { INDONESIA_LOCATIONS } from "#/lib/indonesiaLocations";
import { findNearestCity } from "#/lib/geoUtils";

const defaultView = {
  center: [118.0, -2.5] as [number, number],
  zoom: 4.5,
  pitch: 0,
  bearing: 0,
};

// Content component that can use hooks
function RiskMapContent({
  context,
  bearing,
  showAIPanel,
  setShowAIPanel,
  onLocationSelect,
}: {
  context: MapContext;
  bearing: number;
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
  onLocationSelect?: (location: { latitude: number; longitude: number; city: string }) => void;
}) {
  const { map, alerts, userLocation, handleZoom, showLayers, setShowLayers, showRainRadar, setShowRainRadar } = context;

  // Add map click handler for location selection
  useEffect(() => {
    if (!map.current || !onLocationSelect) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      
      // Find nearest city
      const nearestCity = findNearestCity(lat, lng, INDONESIA_LOCATIONS);
      
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        city: `${nearestCity.name}, ID`,
      });
    };

    map.current.on("click", handleMapClick);

    return () => {
      map.current?.off("click", handleMapClick);
    };
  }, [map, onLocationSelect]);



  const resetView = () => {
    map.current?.easeTo({ ...defaultView, duration: 600 });
  };

  const goToUserLocation = () => {
    if (map.current && userLocation.latitude && userLocation.longitude) {
      map.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 14,
        duration: 1000,
      });
    }
  };

  return (
    <>
      {/* Top Right Controls: Layers, Compass/Reset */}
      <div className="absolute right-3 top-3 z-10 flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm">
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
            <div className="absolute left-0 -translate-x-full top-0 mr-6 w-52 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg z-20">
              <p className="mb-3 text-xs font-semibold text-neutral-700">Map Layers</p>
              
              <label className="flex items-center gap-2 text-sm text-neutral-700 mb-2">
                <input 
                  type="checkbox" 
                  checked 
                  disabled 
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <span>AQI Heatmap</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showRainRadar} 
                  onChange={(e) => setShowRainRadar(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 cursor-pointer"
                />
                <span>Rain Radar</span>
              </label>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={resetView}
          className="flex h-9 w-9 items-center justify-center border-b border-neutral-200 transition-colors hover:bg-neutral-50"
          aria-label="Reset arah"
          title="Reset arah"
        >
          <Compass
            className="h-4 w-4 text-neutral-700"
            style={{ transform: `rotate(${-bearing}deg)` }}
          />
        </button>

        <button
          type="button"
          onClick={goToUserLocation}
          className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-neutral-50"
          aria-label="Ke lokasi saya"
          title="Ke lokasi saya"
        >
          <Navigation className="h-4 w-4 text-neutral-700" />
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
                const estimatedDistance = (idx + 1) * 1000;
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
    </>
  );
}

// Main component
export default function RiskMap({
  onLocationSelect,
}: {
  onLocationSelect?: (location: { latitude: number; longitude: number; city: string }) => void;
}) {
  const [bearing, setBearing] = useState(0);
  const [showAIPanel, setShowAIPanel] = useState(false);

  return (
    <BaseEnvironmentMap
      initialCenter={defaultView.center}
      initialZoom={defaultView.zoom}
      initialPitch={defaultView.pitch}
      initialBearing={defaultView.bearing}
      autoFitStations={false}
      autoZoomOnLocate={false}
      autoLocateOnMount={true}
      aqiRadiusKm={1000}
      onMapReady={(map) => {
        map.on("rotate", () => {
          setBearing(map.getBearing() ?? 0);
        });
      }}
    >
      {(context) => (
        <RiskMapContent
          context={context}
          bearing={bearing}
          showAIPanel={showAIPanel}
          setShowAIPanel={setShowAIPanel}
          onLocationSelect={onLocationSelect}
        />
      )}
    </BaseEnvironmentMap>
  );
}
