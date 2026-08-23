import { useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  Minus,
  Plus,
  Compass,
  MapPin,
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
import type { ReportMapPin } from "#/lib/reports.functions";

const defaultView = {
  center: [118.0, -2.5] as [number, number],
  zoom: 4.5,
  pitch: 0,
  bearing: 0,
};

type NearbyReportPin = ReportMapPin & {
  distanceKm: number;
};

function getReportMarkerColor(urgency: string) {
  if (urgency === "Sangat Tinggi") return "#b91c1c";
  if (urgency === "Tinggi") return "#ef4444";
  if (urgency === "Rendah") return "#0ea5e9";
  return "#f59e0b";
}

function createReportPopup(report: NearbyReportPin) {
  const container = document.createElement("div");
  container.className = "min-w-56 space-y-2 p-1 text-neutral-900";

  const category = document.createElement("p");
  category.className = "text-[10px] font-bold uppercase tracking-wider text-red-600";
  category.textContent = report.category;

  const title = document.createElement("h3");
  title.className = "text-sm font-bold leading-snug";
  title.textContent = report.title;

  const location = document.createElement("p");
  location.className = "text-xs leading-relaxed text-neutral-600";
  location.textContent = report.locationName;

  const metadata = document.createElement("div");
  metadata.className = "flex items-center justify-between gap-3 border-t border-neutral-100 pt-2 text-[11px]";

  const distance = document.createElement("span");
  distance.className = "font-semibold text-red-600";
  distance.textContent = `${report.distanceKm.toFixed(1)} km dari Anda`;

  const urgency = document.createElement("span");
  urgency.className = "text-neutral-500";
  urgency.textContent = `Urgensi ${report.urgency}`;

  metadata.append(distance, urgency);
  container.append(category, title, location, metadata);

  return container;
}

// Content component that can use hooks
function RiskMapContent({
  context,
  bearing,
  showAIPanel,
  setShowAIPanel,
  reports,
  radiusKm,
  isMapReady,
  onLocationSelect,
}: {
  context: MapContext;
  bearing: number;
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
  reports: NearbyReportPin[];
  radiusKm: number;
  isMapReady: boolean;
  onLocationSelect?: (location: { latitude: number; longitude: number; city: string }) => void;
}) {
  const { map, alerts, userLocation, handleZoom, showLayers, setShowLayers, showRainRadar, setShowRainRadar } = context;

  // Add map click handler for location selection
  useEffect(() => {
    if (!map.current || !isMapReady || !onLocationSelect) return;

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
  }, [isMapReady, map, onLocationSelect]);

  useEffect(() => {
    if (!map.current || !isMapReady) return;
    const mapInstance = map.current;

    const markers = reports.map((report) => {
      const marker = new maplibregl.Marker({
        color: getReportMarkerColor(report.urgency),
        scale: 0.85,
      })
        .setLngLat([report.longitude, report.latitude])
        .setPopup(
          new maplibregl.Popup({
            closeButton: true,
            maxWidth: "280px",
            offset: 24,
          }).setDOMContent(createReportPopup(report)),
        )
        .addTo(mapInstance);

      const markerElement = marker.getElement();
      markerElement.setAttribute("aria-label", `Laporan: ${report.title}`);
      markerElement.setAttribute("role", "button");
      markerElement.setAttribute("tabindex", "0");
      markerElement.classList.add("cursor-pointer");

      const selectReport = () => {
        onLocationSelect?.({
          latitude: report.latitude,
          longitude: report.longitude,
          city: report.locationName,
        });
      };

      const handleMarkerClick = (event: Event) => {
        event.stopPropagation();
        selectReport();
      };

      const handleMarkerKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        selectReport();
        marker.togglePopup();
      };

      markerElement.addEventListener("click", handleMarkerClick);
      markerElement.addEventListener("keydown", handleMarkerKeyDown);

      return {
        marker,
        markerElement,
        handleMarkerClick,
        handleMarkerKeyDown,
      };
    });

    return () => {
      for (const {
        marker,
        markerElement,
        handleMarkerClick,
        handleMarkerKeyDown,
      } of markers) {
        markerElement.removeEventListener("click", handleMarkerClick);
        markerElement.removeEventListener("keydown", handleMarkerKeyDown);
        marker.remove();
      }
    };
  }, [isMapReady, map, onLocationSelect, reports]);



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
      <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur-md">
        <MapPin className="size-3.5 text-red-600" />
        <span>{reports.length} laporan dalam radius {radiusKm} km</span>
      </div>

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
  reports,
  radiusKm = 5,
  onLocationSelect,
}: {
  reports: NearbyReportPin[];
  radiusKm?: number;
  onLocationSelect?: (location: { latitude: number; longitude: number; city: string }) => void;
}) {
  const [bearing, setBearing] = useState(0);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  return (
    <BaseEnvironmentMap
      initialCenter={defaultView.center}
      initialZoom={defaultView.zoom}
      initialPitch={defaultView.pitch}
      initialBearing={defaultView.bearing}
      autoFitStations={false}
      autoZoomOnLocate={true}
      autoLocateOnMount={true}
      aqiRadiusKm={1000}
      onMapReady={(map) => {
        setIsMapReady(true);
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
          reports={reports}
          radiusKm={radiusKm}
          isMapReady={isMapReady}
          onLocationSelect={onLocationSelect}
        />
      )}
    </BaseEnvironmentMap>
  );
}
