import { useEffect, useState, useRef } from "react";
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
import { indonesiaLocations } from "#/data/indonesia-locations";
import { findNearestCity } from "#/lib/geoUtils";
import type { ReportMapPin } from "#/lib/reports.functions";

const defaultView = {
  center: [118.0, -2.5] as [number, number],
  zoom: 4.5,
  pitch: 0,
  bearing: 0,
};

export type NearbyReportPin = ReportMapPin & {
  distanceKm: number;
};

function groupNearbyReports(
  reports: NearbyReportPin[],
): NearbyReportPin[][] {
  const overlapThreshold = 0.0015;
  const groups: NearbyReportPin[][] = [];

  for (const report of reports) {
    const existingGroup = groups.find((group) =>
      group.some(
        (candidate) =>
          Math.abs(candidate.latitude - report.latitude) <= overlapThreshold &&
          Math.abs(candidate.longitude - report.longitude) <= overlapThreshold,
      ),
    );

    if (existingGroup) {
      existingGroup.push(report);
    } else {
      groups.push([report]);
    }
  }

  return groups;
}

function createReportMarkerElement(title: string, reportCount: number) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className =
    "risk-report-marker flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-amber-400 text-amber-950 shadow-lg transition-colors hover:bg-amber-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2";
  marker.ariaLabel =
    reportCount > 1 ? `${reportCount} laporan di lokasi ini` : `Laporan: ${title}`;
  marker.title =
    reportCount > 1 ? `${reportCount} laporan di lokasi ini` : title;
  marker.style.pointerEvents = "auto";
  marker.style.zIndex = "20";

  const icon = document.createElement("span");
  icon.className = "text-xl font-black leading-none";
  icon.textContent = reportCount > 1 ? String(reportCount) : "!";
  icon.setAttribute("aria-hidden", "true");
  marker.appendChild(icon);

  return marker;
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
  onReportSelect,
}: {
  context: MapContext;
  bearing: number;
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
    city: string;
  }) => void;
  reports: NearbyReportPin[];
  radiusKm: number;
  isMapReady: boolean;
  onReportSelect?: (report: NearbyReportPin) => void;
}) {
  const reportMarkersRef = useRef<maplibregl.Marker[]>([]);
  const {
    map,
    alerts,
    userLocation,
    handleZoom,
    showLayers,
    setShowLayers,
    showRainRadar,
    setShowRainRadar,
    aqiFilter,
    setAqiFilter,
    showMarkers,
    setShowMarkers,
  } = context;

  useEffect(() => {
    reportMarkersRef.current.forEach((marker) => {
      marker.remove();
    });
    reportMarkersRef.current = [];

    if (!map.current || !isMapReady) return;
    const mapInstance = map.current;

    const reportGroups = groupNearbyReports(reports);
    const markers = reportGroups.map((reportGroup) => {
      const primaryReport = reportGroup[0];
      const markerElement = createReportMarkerElement(
        primaryReport.title,
        reportGroup.length,
      );
      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "bottom",
      })
        .setLngLat([primaryReport.longitude, primaryReport.latitude])
        .addTo(mapInstance);

      markerElement.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onReportSelect?.(primaryReport);
      });
      markerElement.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });

      return marker;
    });
    reportMarkersRef.current = markers;

    return () => {
      markers.forEach((marker) => {
        marker.remove();
      });
      reportMarkersRef.current = [];
    };
  }, [isMapReady, map, onReportSelect, reports]);

  // Add map click handler for location selection
  useEffect(() => {
    if (!map.current || !isMapReady || !onLocationSelect) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (e.originalEvent.defaultPrevented) return;

      const eventTarget = e.originalEvent.target;
      if (
        eventTarget instanceof Element &&
        eventTarget.closest(".maplibregl-marker, .maplibregl-popup")
      ) {
        return;
      }

      const clickedReportGroup = groupNearbyReports(reports).find(
        (reportGroup) => {
          const primaryReport = reportGroup[0];
        const reportPoint = map.current?.project([
            primaryReport.longitude,
            primaryReport.latitude,
        ]);
        if (!reportPoint) return false;

          const horizontalDistance = reportPoint.x - e.point.x;
          const verticalDistance = reportPoint.y - e.point.y;
        return Math.hypot(horizontalDistance, verticalDistance) <= 24;
        },
      );

      if (clickedReportGroup) {
        onReportSelect?.(clickedReportGroup[0]);
        return;
      }

      const { lng, lat } = e.lngLat;

      // Find nearest city
      const nearestCity = findNearestCity(lat, lng, indonesiaLocations);

      onLocationSelect({
        latitude: lat,
        longitude: lng,
        city: `${nearestCity.name}, ${nearestCity.province}`,
      });
    };

    map.current.on("click", handleMapClick);

    return () => {
      map.current?.off("click", handleMapClick);
    };
  }, [isMapReady, map, onLocationSelect, onReportSelect, reports]);

  const resetView = () => {
    map.current?.easeTo({ ...defaultView, duration: 600 });
  };

  const goToUserLocation = () => {
    if (
      !map.current ||
      userLocation.latitude === null ||
      userLocation.longitude === null
    ) {
      return;
    }

    if (onLocationSelect) {
      onLocationSelect({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        city: userLocation.city,
      });
    } else {
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
        <span>
          {reports.length} laporan dalam radius {radiusKm} km
        </span>
      </div>

      {/* Top Right Controls: Layers, Compass/Reset */}
      <div className="absolute right-3 top-3 z-10 flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayers(!showLayers)}
            className="flex h-9 w-9 items-center justify-center rounded-t-lg border-b border-neutral-200 transition-colors hover:bg-neutral-50"
            aria-label="Layers"
          >
            <Layers className="h-4 w-4 text-neutral-700" />
          </button>
          {showLayers && (
            <div className="absolute right-full top-0 mr-2 w-52 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg z-20">
              <p className="mb-3 text-xs font-semibold text-neutral-700">
                Map Layers
              </p>

              <label className="flex items-center gap-2 text-sm text-neutral-700 mb-2">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <span>AQI Heatmap</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={showRainRadar}
                  onChange={(e) => setShowRainRadar(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 cursor-pointer"
                />
                <span>Rain Radar</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer mb-3 pb-3 border-b border-neutral-100">
                <input
                  type="checkbox"
                  checked={showMarkers}
                  onChange={(e) => setShowMarkers(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 cursor-pointer"
                />
                <span>Show Stations (Clusters)</span>
              </label>

              <p className="mb-2 text-xs font-semibold text-neutral-700">
                Filter AQI Stations
              </p>
              <select
                value={aqiFilter}
                onChange={(e) =>
                  setAqiFilter(e.target.value as MapContext["aqiFilter"])
                }
                className="w-full rounded border border-neutral-300 bg-white p-1 text-sm text-neutral-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Stations</option>
                <option value="good">Good (0-50)</option>
                <option value="moderate">Moderate (51-100)</option>
                <option value="unhealthy">Unhealthy (101-200)</option>
                <option value="hazardous">Hazardous (&gt;200)</option>
              </select>
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
          className="flex h-9 w-9 items-center justify-center rounded-b-lg transition-colors hover:bg-neutral-50"
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

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-3 z-10 flex flex-col rounded-lg border border-neutral-200 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
        <h4 className="mb-2 text-xs font-bold text-neutral-800">AQI Legend</h4>
        <div className="flex flex-col gap-1 text-[10px] text-neutral-600">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#00e400] opacity-80" />{" "}
            Good (0-50)
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ffff00] opacity-80" />{" "}
            Moderate (51-100)
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff7e00] opacity-80" />{" "}
            Unhealthy for Sensitive (101-150)
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff0000] opacity-80" />{" "}
            Unhealthy (151-200)
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#99004c] opacity-80" />{" "}
            Very Unhealthy (201-300)
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#7e0023] opacity-80" />{" "}
            Hazardous (&gt;300)
          </div>
        </div>
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
  onReportSelect,
  flyToLocation,
}: {
  reports: NearbyReportPin[];
  radiusKm?: number;
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
    city: string;
  }) => void;
  onReportSelect?: (report: NearbyReportPin) => void;
  flyToLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}) {
  const [bearing, setBearing] = useState(0);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const [aqiRadius, setAqiRadius] = useState(1000); // Default Indonesia-wide
  const [isMapReady, setIsMapReady] = useState(false);

  // Fly to location when flyToLocation changes (from search)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !flyToLocation) return;

    const mapInstance = mapInstanceRef.current;
    const selectedMarker = new maplibregl.Marker({ color: "#dc2626" })
      .setLngLat([flyToLocation.longitude, flyToLocation.latitude])
      .addTo(mapInstance);
    selectedMarker.getElement().ariaLabel = "Titik wilayah terpilih";
    selectedMarker.getElement().title = "Wilayah terpilih";

    // Adjust AQI radius untuk regional detail
    setAqiRadius(100); // 100km radius untuk city-level detail

    mapInstance.flyTo({
      center: [flyToLocation.longitude, flyToLocation.latitude],
      zoom: 10, // Regional view untuk lihat AQI area sekitar
      duration: 1500,
    });

    return () => {
      selectedMarker.remove();
    };
  }, [flyToLocation, isMapReady]);

  return (
    <BaseEnvironmentMap
      initialCenter={defaultView.center}
      initialZoom={defaultView.zoom}
      initialPitch={defaultView.pitch}
      initialBearing={defaultView.bearing}
      autoFitStations={false}
      autoZoomOnLocate={false}
      autoLocateOnMount={false}
      aqiRadiusKm={aqiRadius}
      aqiCenterLocation={
        flyToLocation
          ? {
              latitude: flyToLocation.latitude,
              longitude: flyToLocation.longitude,
            }
          : null
      }
      onMapReady={(map) => {
        mapInstanceRef.current = map;
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
          onReportSelect={onReportSelect}
        />
      )}
    </BaseEnvironmentMap>
  );
}
