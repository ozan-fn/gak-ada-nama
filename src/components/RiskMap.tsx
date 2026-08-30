import * as maplibregl from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AlertOctagon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Compass,
  Layers,
  MapPin,
  Minus,
  Navigation,
  Plus,
  XCircle,
} from "lucide-react";

import { indonesiaLocations } from "#/data/indonesia-locations";
import {
  generateRecommendation,
  getRecommendationColor,
} from "#/lib/aiSimulation";
import { calculateDistanceKm } from "#/lib/distanceUtils";
import { findNearestCity } from "#/lib/geoUtils";
import {
  createAutomaticReportUncertaintyGeoJson,
  createReportMarkers,
  createSelectedLocationMarker,
  groupNearbyReports,
} from "#/lib/mapMarkers";
import type { ReportMapPin } from "#/lib/reports.functions";
import { BaseEnvironmentMap, type MapContext } from "./maps/BaseEnvironmentMap";
import { ElevationLegend } from "./maps/ElevationLegend";

const defaultView = {
  center: [118.0, -2.5] as [number, number],
  zoom: 4.5,
  pitch: 0,
  bearing: 0,
};

export type NearbyReportPin = ReportMapPin & {
  distanceKm: number;
};

/** Creates the DOM element for the custom user location marker. */
function createUserLocationMarkerElement(): HTMLDivElement {
  const markerEl = document.createElement("div");

  markerEl.className = "user-location-marker";

  Object.assign(markerEl.style, {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    pointerEvents: "auto",
  });

  const dot = document.createElement("div");

  Object.assign(dot.style, {
    width: "16px",
    height: "16px",
    borderRadius: "9999px",
    backgroundColor: "#3b82f6",
    border: "3px solid #ffffff",
    boxShadow: `
			0 0 0 2px rgba(59, 130, 246, 0.20),
			0 2px 6px rgba(0, 0, 0, 0.35)
		`,
  });

  markerEl.appendChild(dot);

  return markerEl;
}

function RiskMapContent({
  context,
  bearing,
  showAIPanel,
  setShowAIPanel,
  reports,
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
  isMapReady: boolean;
  onReportSelect?: (report: NearbyReportPin) => void;
}) {
  const reportMarkersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Tracks initial location flyTo so subsequent GPS updates move only the marker without moving the camera
  const hasInitialLocatedRef = useRef(false);

  const {
    map,
    alerts,
    userLocation,
    handleZoom,
    showLayers,
    setShowLayers,
    showRainRadar,
    setShowRainRadar,
    showFireLayer,
    setShowFireLayer,
    showElevation,
    setShowElevation,
    aqiFilter,
    setAqiFilter,
    showMarkers,
    setShowMarkers,
  } = context;

  const [showLegend, setShowLegend] = useState(true);

  const reportGroups = useMemo(() => {
    return groupNearbyReports(reports);
  }, [reports]);

  // Calculate nearby reports within 5km of user location
  const nearbyReportsCount = useMemo(() => {
    if (!userLocation.latitude || !userLocation.longitude) return 0;
    
    return reports.filter(report => {
      const distance = calculateDistanceKm(
        userLocation.latitude!,
        userLocation.longitude!,
        report.latitude,
        report.longitude
      );
      return distance <= 5;
    }).length;
  }, [reports, userLocation.latitude, userLocation.longitude]);

  /** Instantiates or updates the blue user location marker position. */
  const createUserMarker = useCallback(
    (mapInstance: maplibregl.Map, latitude: number, longitude: number) => {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([longitude, latitude]);
        return;
      }

      const markerElement = createUserLocationMarkerElement();

      userMarkerRef.current = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat([longitude, latitude])
        .addTo(mapInstance);
    },
    [],
  );

  // Sync user location marker and trigger single initial flyTo
  useEffect(() => {
    const mapInstance = map.current;

    if (!mapInstance || !isMapReady) {
      return;
    }

    const latitude = userLocation.latitude;
    const longitude = userLocation.longitude;

    if (latitude === null || longitude === null) {
      return;
    }

    createUserMarker(mapInstance, latitude, longitude);

    if (!hasInitialLocatedRef.current) {
      hasInitialLocatedRef.current = true;

      // Only fly to user location if there's no selected marker (red marker)
      // Priority: red marker > blue user dot
      if (!selectedMarkerRef.current) {
        mapInstance.flyTo({
          center: [longitude, latitude],
          zoom: 10,
          duration: 1200,
        });
      }
    }
  }, [
    map,
    isMapReady,
    userLocation.latitude,
    userLocation.longitude,
    createUserMarker,
  ]);

  useEffect(() => {
    return () => {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
    };
  }, []);

  // Synchronize report markers with map lifecycle
  useEffect(() => {
    if (!map.current || !isMapReady) {
      return;
    }

    const mapInstance = map.current;

    reportMarkersRef.current.forEach((marker) => {
      marker.remove();
    });

    reportMarkersRef.current = [];

    const markers = createReportMarkers(
      reports,
      mapInstance,
      onReportSelect,
      reportGroups,
    );

    reportMarkersRef.current = markers;

    return () => {
      markers.forEach((marker) => {
        marker.remove();
      });

      reportMarkersRef.current = [];
    };
  }, [map, isMapReady, reports, reportGroups, onReportSelect]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !isMapReady) return;

    const sourceId = "automatic-report-uncertainty";
    const fillLayerId = "automatic-report-uncertainty-fill";
    const lineLayerId = "automatic-report-uncertainty-line";
    const data = createAutomaticReportUncertaintyGeoJson(reports);
    const existingSource = mapInstance.getSource(sourceId) as
      | maplibregl.GeoJSONSource
      | undefined;

    if (existingSource) {
      existingSource.setData(data);
    } else {
      mapInstance.addSource(sourceId, { type: "geojson", data });
    }

    if (!mapInstance.getLayer(fillLayerId)) {
      mapInstance.addLayer({
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": "#10b981",
          "fill-opacity": 0.08,
        },
      });
    }

    if (!mapInstance.getLayer(lineLayerId)) {
      mapInstance.addLayer({
        id: lineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": "#059669",
          "line-opacity": 0.7,
          "line-width": 1.5,
          "line-dasharray": [2, 2],
        },
      });
    }

    return () => {
      if (mapInstance.getLayer(lineLayerId))
        mapInstance.removeLayer(lineLayerId);
      if (mapInstance.getLayer(fillLayerId))
        mapInstance.removeLayer(fillLayerId);
      if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
    };
  }, [map, isMapReady, reports]);

  // Handle map clicks for selecting report clusters or pin locations
  useEffect(() => {
    const mapInstance = map.current;

    if (!mapInstance || !isMapReady || !onLocationSelect) {
      return;
    }

    const handleMapClick = (event: maplibregl.MapMouseEvent) => {
      // Ignore click propagation from markers and popups
      if (event.originalEvent.defaultPrevented) {
        return;
      }

      const eventTarget = event.originalEvent.target;

      if (
        eventTarget instanceof Element &&
        eventTarget.closest(".maplibregl-marker, .maplibregl-popup")
      ) {
        return;
      }

      // Hit-test grouped report markers within a pixel radius
      const clickedReportGroup = reportGroups.find((reportGroup) => {
        const primaryReport = reportGroup[0];

        const reportPoint = mapInstance.project([
          primaryReport.longitude,
          primaryReport.latitude,
        ]);

        const horizontalDistance = reportPoint.x - event.point.x;
        const verticalDistance = reportPoint.y - event.point.y;

        return Math.hypot(horizontalDistance, verticalDistance) <= 24;
      });

      if (clickedReportGroup) {
        onReportSelect?.(clickedReportGroup[0]);
        return;
      }

      const { lng, lat } = event.lngLat;

      const nearestCity = findNearestCity(lat, lng, indonesiaLocations);

      selectedMarkerRef.current?.remove();

      selectedMarkerRef.current = createSelectedLocationMarker(
        lat,
        lng,
        mapInstance,
      );

      onLocationSelect({
        latitude: lat,
        longitude: lng,
        city: `${nearestCity.name}, ${nearestCity.province}`,
      });
    };

    mapInstance.on("click", handleMapClick);

    return () => {
      mapInstance.off("click", handleMapClick);
    };
  }, [map, isMapReady, onLocationSelect, onReportSelect, reportGroups]);

  useEffect(() => {
    return () => {
      selectedMarkerRef.current?.remove();
      selectedMarkerRef.current = null;
    };
  }, []);

  const resetView = useCallback(() => {
    map.current?.easeTo({
      ...defaultView,
      duration: 600,
    });
  }, [map]);

  const goToUserLocation = useCallback(() => {
    const mapInstance = map.current;

    if (
      !mapInstance ||
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
      mapInstance.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [
    map,
    userLocation.latitude,
    userLocation.longitude,
    userLocation.city,
    onLocationSelect,
  ]);

  return (
    <>
      {/* Report Counter Badge - follows user location */}
      <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-lg border border-amber-200/80 bg-white/95 dark:bg-neutral-800/95 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-400 shadow-sm backdrop-blur-md">
        <MapPin className="size-3.5 text-amber-600" />

        <span>
          {nearbyReportsCount} laporan dalam radius 5 km
        </span>
      </div>

      {/* Top Right Controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayers(!showLayers)}
            className="flex h-9 w-9 items-center justify-center rounded-t-lg border-b border-neutral-200 dark:border-neutral-700 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
            aria-label="Layers"
          >
            <Layers className="h-4 w-4 text-neutral-700 dark:text-neutral-400" />
          </button>

          {showLayers && (
            <div className="absolute right-full top-0 z-20 mr-2 w-52 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 shadow-lg">
              <p className="mb-3 text-xs font-semibold text-neutral-700 dark:text-neutral-400">
                Map Layers
              </p>

              <label className="mb-2 flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600"
                />

                <span>AQI Heatmap</span>
              </label>

              <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={showRainRadar}
                  onChange={(event) => setShowRainRadar(event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                />

                <span>Rain Radar</span>
              </label>

              <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={showFireLayer}
                  onChange={(event) => setShowFireLayer(event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                />

                <span>Fire Hotspots</span>
              </label>

              <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={showElevation}
                  onChange={(event) => setShowElevation(event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                />

                <span>Elevation</span>
              </label>

              <label className="mb-3 flex cursor-pointer items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-3 text-sm text-neutral-700 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={showMarkers}
                  onChange={(event) => setShowMarkers(event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                />

                <span>Show Stations</span>
              </label>

              <p className="mb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-400">
                Filter AQI Stations
              </p>

              <select
                value={aqiFilter}
                onChange={(event) =>
                  setAqiFilter(event.target.value as MapContext["aqiFilter"])
                }
                className="w-full rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 p-1 text-sm text-neutral-700 dark:text-neutral-300 focus:border-blue-500 focus:outline-none"
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
          className="flex h-9 w-9 items-center justify-center border-b border-neutral-200 dark:border-neutral-700 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
          aria-label="Reset arah"
          title="Reset arah"
        >
          <Compass
            className="h-4 w-4 text-neutral-700 dark:text-neutral-400"
            style={{
              transform: `rotate(${-bearing}deg)`,
            }}
          />
        </button>

        <button
          type="button"
          onClick={goToUserLocation}
          className="flex h-9 w-9 items-center justify-center rounded-b-lg transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
          aria-label="Ke lokasi saya"
          title="Ke lokasi saya"
        >
          <Navigation className="h-4 w-4 text-neutral-700 dark:text-neutral-400" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          className="flex h-9 w-9 items-center justify-center border-b border-neutral-200 dark:border-neutral-700 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4 text-neutral-700 dark:text-neutral-400" />
        </button>

        <button
          type="button"
          onClick={() => handleZoom(1)}
          className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4 text-neutral-700 dark:text-neutral-400" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/90 shadow-sm backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setShowLegend((previous) => !previous)}
          className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
        >
          <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100">Map Legend</h4>

          {showLegend ? (
            <ChevronDown className="h-3 w-3 text-neutral-600 dark:text-neutral-400" />
          ) : (
            <ChevronUp className="h-3 w-3 text-neutral-600 dark:text-neutral-400" />
          )}
        </button>

        {showLegend && (
          <div className="px-3 pb-3">
            <div className="border-t border-neutral-100 dark:border-neutral-700 pt-2">
              <div className="mb-3 space-y-1.5 border-b border-neutral-100 dark:border-neutral-700 pb-3 text-[10px] text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full border-2 border-white bg-amber-400 shadow-sm" />
                  <span>Laporan masyarakat</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                  <span>Terdeteksi otomatis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-5 rounded-full border border-dashed border-emerald-600 bg-emerald-100/60" />
                  <span>Area ketidakpastian</span>
                </div>
              </div>
              <p className="mb-2 text-[10px] font-semibold text-neutral-700 dark:text-neutral-400">
                AQI Quality
              </p>

              <div className="flex flex-col gap-1 text-[10px] text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#00e400] opacity-80" />
                  <span>Good (0-50)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#ffff00] opacity-80" />
                  <span>Moderate (51-100)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#ff7e00] opacity-80" />
                  <span>Unhealthy (101-150)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#ff0000] opacity-80" />
                  <span>Unhealthy (151-200)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#99004c] opacity-80" />
                  <span>Very Unhealthy (201-300)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#7e0023] opacity-80" />
                  <span>Hazardous (&gt;300)</span>
                </div>
              </div>
            </div>

            {showFireLayer && (
              <div className="mt-3 border-t border-neutral-100 dark:border-neutral-700 pt-3">
                <p className="mb-2 text-[10px] font-semibold text-neutral-700 dark:text-neutral-400">
                  Fire Hotspots (5d)
                </p>

                <div className="flex flex-col gap-1 text-[10px] text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full border border-white bg-[#fbbf24] shadow-sm" />
                    <span>Medium (50-65%)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full border border-white bg-[#f97316] shadow-sm" />
                    <span>High (65-80%)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full border border-white bg-[#dc2626] shadow-sm" />
                    <span>Very High (&gt;80%)</span>
                  </div>
                </div>

                <p className="mt-2 text-[9px] italic text-neutral-500 dark:text-neutral-400">
                  NASA FIRMS VIIRS
                </p>
              </div>
            )}

            {showElevation && <ElevationLegend />}
          </div>
        )}
      </div>

      {/* AI Recommendation Modal */}
      {showAIPanel && alerts.length > 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-lg bg-white dark:bg-neutral-800 p-4 shadow-xl">
            {(() => {
              const dangersData = alerts.map((alert, index) => {
                const estimatedDistance = (index + 1) * 1000;

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

                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        AI Recommendation
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAIPanel(false)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
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
                      Safety Score: {recommendation.score.toFixed(1)}
                      /10
                    </p>
                  </div>

                  {recommendation.reasons.length > 0 && (
                    <div className="mb-3">
                      <h4 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Detected Hazards:
                      </h4>

                      <ul className="space-y-1">
                        {recommendation.reasons.map((reason) => (
                          <li key={reason} className="text-sm text-neutral-600 dark:text-neutral-400">
                            • {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recommendation.alternativeActions.length > 0 && (
                    <div className="mb-3">
                      <h4 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Recommended Actions:
                      </h4>

                      <ul className="space-y-1">
                        {recommendation.alternativeActions.map((action) => (
                          <li key={action} className="text-sm text-neutral-600 dark:text-neutral-400">
                            ✓ {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recommendation.bestTime && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-2">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
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

export default function RiskMap({
  reports,
  onLocationSelect,
  onReportSelect,
  flyToLocation,
}: {
  reports: NearbyReportPin[];
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
  const [aqiRadius, setAqiRadius] = useState(1000);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const lastFlyLocationRef = useRef<string | null>(null);

  // Prevents re-running map initialization on re-renders
  const hasInitializedMapRef = useRef(false);

  const handleMapReady = useCallback((map: maplibregl.Map) => {
    mapInstanceRef.current = map;

    if (hasInitializedMapRef.current) {
      return;
    }

    hasInitializedMapRef.current = true;
    setIsMapReady(true);

    const handleRotate = () => {
      setBearing(map.getBearing() ?? 0);
    };

    map.on("rotate", handleRotate);

    map.once("remove", () => {
      map.off("rotate", handleRotate);
    });
  }, []);

  // Pan and place marker when flyToLocation prop updates
  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map || !isMapReady || !flyToLocation) {
      return;
    }

    const locationKey = `${flyToLocation.latitude},${flyToLocation.longitude}`;

    if (lastFlyLocationRef.current === locationKey) {
      return;
    }

    lastFlyLocationRef.current = locationKey;

    selectedMarkerRef.current?.remove();

    selectedMarkerRef.current = createSelectedLocationMarker(
      flyToLocation.latitude,
      flyToLocation.longitude,
      map,
    );

    setAqiRadius(100);

    map.flyTo({
      center: [flyToLocation.longitude, flyToLocation.latitude],
      zoom: 10,
      duration: 1500,
    });
  }, [flyToLocation, isMapReady]);

  useEffect(() => {
    return () => {
      selectedMarkerRef.current?.remove();
      selectedMarkerRef.current = null;

      mapInstanceRef.current = null;
    };
  }, []);

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
      onMapReady={handleMapReady}
    >
      {(context) => (
        <RiskMapContent
          context={context}
          bearing={bearing}
          showAIPanel={showAIPanel}
          setShowAIPanel={setShowAIPanel}
          reports={reports}
          isMapReady={isMapReady}
          onLocationSelect={onLocationSelect}
          onReportSelect={onReportSelect}
        />
      )}
    </BaseEnvironmentMap>
  );
}
