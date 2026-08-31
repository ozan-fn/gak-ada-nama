import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Layers,
  Info,
  Plus,
  Minus,
  Navigation,
} from "lucide-react";

import { BaseEnvironmentMap } from "./maps/BaseEnvironmentMap";
import type { ReportMapPin } from "#/lib/reports.functions";
import { 
  createReportMarkers, 
  groupNearbyReports,
  createAutomaticReportUncertaintyGeoJson,
} from "#/lib/mapMarkers";
import type { NearbyReportPin } from "./RiskMap";

interface LiveEnvironmentMapProps {
  reports: ReportMapPin[];
  selectedLocation: {
    latitude: number;
    longitude: number;
    city: string;
  };
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    city: string;
  }) => void;
  onReportSelect?: (report: NearbyReportPin) => void;
}

export function LiveEnvironmentMap({
  reports,
  selectedLocation,
  onLocationSelect,
  onReportSelect,
}: LiveEnvironmentMapProps) {
  const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const reportMarkersRef = useRef<maplibregl.Marker[]>([]);
  const mountedRef = useRef(false);
  const [mapInstance, setMapInstance] = useState<MaplibreMap | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [bearing, setBearing] = useState(0);

  // Keep coordinates updated in ref to access inside stable callbacks
  const selectedLocationRef = useRef(selectedLocation);

  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Convert reports to NearbyReportPin with distance
  const reportsWithDistance = useMemo<NearbyReportPin[]>(() => {
    return reports.map((report) => ({
      ...report,
      distanceKm: 0, // Distance not relevant for livemap
    }));
  }, [reports]);

  const reportGroups = useMemo(
    () => groupNearbyReports(reportsWithDistance),
    [reportsWithDistance],
  );

  // Memoize map center
  const center = useMemo<[number, number]>(() => {
    return [selectedLocation.longitude, selectedLocation.latitude];
  }, [selectedLocation]);

  // Memoize bounds to prevent layout jumps
  const bounds = useMemo<
    [[number, number], [number, number]] | undefined
  >(() => {
    return [
      [selectedLocation.longitude - 0.5, selectedLocation.latitude - 0.5],
      [selectedLocation.longitude + 0.5, selectedLocation.latitude + 0.5],
    ];
  }, [selectedLocation]);

  // Add report markers (same as RiskMap)
  useEffect(() => {
    if (!mapInstance || !isMapReady || !mountedRef.current) return;

    // Clear existing markers
    reportMarkersRef.current.forEach((marker) => {
      marker.remove();
    });
    reportMarkersRef.current = [];

    // Create markers using the same function as RiskMap
    const markers = createReportMarkers(
      reportsWithDistance,
      mapInstance,
      onReportSelect, // Pass callback to handle report selection
      reportGroups,
    );

    reportMarkersRef.current = markers;

    return () => {
      markers.forEach((marker) => {
        marker.remove();
      });
      reportMarkersRef.current = [];
    };
  }, [mapInstance, isMapReady, reportsWithDistance, reportGroups, onReportSelect]);

  // Add uncertainty circles for automatic reports (same as RiskMap)
  useEffect(() => {
    if (!mapInstance || !isMapReady) return;

    const sourceId = "automatic-report-uncertainty";
    const fillLayerId = "automatic-report-uncertainty-fill";
    const lineLayerId = "automatic-report-uncertainty-line";
    const data = createAutomaticReportUncertaintyGeoJson(reportsWithDistance);
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
  }, [mapInstance, isMapReady, reportsWithDistance]);

  // Update selected location marker (red marker like RiskMap)
  useEffect(() => {
    if (!mapInstance || !isMapReady || !mountedRef.current) return;

    // Remove old marker
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    // Create red marker for selected location (same style as RiskMap)
    const el = document.createElement("div");
    el.className = "relative";
    el.innerHTML = `
      <div class="relative flex h-10 w-10 items-center justify-center">
        <div class="absolute h-10 w-10 animate-ping rounded-full bg-red-500 opacity-25"></div>
        <div class="relative h-8 w-8 rounded-full border-2 border-white bg-red-500 shadow-lg">
          <div class="absolute inset-0 flex items-center justify-center">
            <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>
      </div>
    `;

    selectedMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([selectedLocation.longitude, selectedLocation.latitude])
      .addTo(mapInstance);

    return () => {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.remove();
        selectedMarkerRef.current = null;
      }
    };
  }, [mapInstance, isMapReady, selectedLocation]);

  // Handle map click to select location (same as RiskMap)
  useEffect(() => {
    if (!mapInstance || !isMapReady) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!mountedRef.current) return;

      // Ignore click propagation from markers and popups (same as RiskMap)
      if (e.originalEvent.defaultPrevented) {
        return;
      }

      const eventTarget = e.originalEvent.target;

      if (
        eventTarget instanceof Element &&
        eventTarget.closest(".maplibregl-marker, .maplibregl-popup, .risk-report-marker")
      ) {
        return; // Don't select location when clicking markers
      }

      const { lng, lat } = e.lngLat;

      // Simple city detection based on coordinates
      let city = "Unknown Location";
      
      // Indonesia major cities rough coordinates
      if (lng >= 106.7 && lng <= 106.9 && lat >= -6.3 && lat <= -6.1) {
        city = "Jakarta, DKI Jakarta";
      } else if (lng >= 110.3 && lng <= 110.5 && lat >= -7.1 && lat <= -6.9) {
        city = "Semarang, Jawa Tengah";
      } else if (lng >= 112.6 && lng <= 112.8 && lat >= -7.4 && lat <= -7.2) {
        city = "Surabaya, Jawa Timur";
      } else if (lng >= 107.5 && lng <= 107.7 && lat >= -6.95 && lat <= -6.85) {
        city = "Bandung, Jawa Barat";
      }

      onLocationSelect({
        latitude: lat,
        longitude: lng,
        city,
      });
    };

    mapInstance.on("click", handleMapClick);

    return () => {
      mapInstance.off("click", handleMapClick);
    };
  }, [mapInstance, isMapReady, onLocationSelect]);

  // Track bearing changes
  useEffect(() => {
    if (!mapInstance || !isMapReady) return;

    const handleRotate = () => {
      if (!mountedRef.current) return;
      setBearing(mapInstance.getBearing());
    };

    mapInstance.on("rotate", handleRotate);

    return () => {
      mapInstance.off("rotate", handleRotate);
    };
  }, [mapInstance, isMapReady]);

  const handleMapReady = useCallback((map: MaplibreMap) => {
    if (!mountedRef.current) return;

    setMapInstance(map);
    setIsMapReady(true);

    // Resize map after initialization
    requestAnimationFrame(() => {
      if (mountedRef.current) {
        map.resize();
      }
    });
  }, []);

  return (
    <BaseEnvironmentMap
      initialCenter={center}
      initialZoom={11}
      maxBounds={bounds}
      aqiCenterLocation={{
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      }}
      aqiRadiusKm={100}
      onMapReady={handleMapReady}
      autoLocateOnMount={false}
    >
      {(context) => (
        <>
          {/* Top Right Controls */}
          <div className="absolute right-3 top-3 z-10 flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
            <div className="relative">
              <button
                type="button"
                onClick={() => context.setShowLayers(!context.showLayers)}
                className="flex h-9 w-9 items-center justify-center rounded-t-lg border-b border-neutral-200 dark:border-neutral-700 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
                aria-label="Layers"
              >
                <Layers className="h-4 w-4 text-neutral-700 dark:text-neutral-400" />
              </button>

              {context.showLayers && (
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
                      checked={context.showRainRadar}
                      onChange={(e) => context.setShowRainRadar(e.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                    />
                    <span>Rain Radar</span>
                  </label>

                  <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={context.showFireLayer}
                      onChange={(e) => context.setShowFireLayer(e.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                    />
                    <span>Fire Hotspots</span>
                  </label>

                  <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={context.showElevation}
                      onChange={(e) => context.setShowElevation(e.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                    />
                    <span>Elevation</span>
                  </label>

                  <label className="mb-3 flex cursor-pointer items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-3 text-sm text-neutral-700 dark:text-neutral-400">
                    <input
                      type="checkbox"
                      checked={context.showMarkers}
                      onChange={(e) => context.setShowMarkers(e.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                    />
                    <span>Show Stations</span>
                  </label>

                  <p className="mb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-400">
                    Filter AQI Stations
                  </p>

                  <select
                    value={context.aqiFilter}
                    onChange={(e) =>
                      context.setAqiFilter(
                        e.target.value as typeof context.aqiFilter,
                      )
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
              onClick={() => setShowLegend(!showLegend)}
              className="flex h-9 w-9 items-center justify-center rounded-b-lg transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
              aria-label="Legend"
            >
              <Info className="h-4 w-4 text-neutral-700 dark:text-neutral-400" />
            </button>
          </div>

          {/* Legend Panel - Bottom Left */}
          {showLegend && (
            <div className="absolute left-3 bottom-3 z-10 w-72 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-800/95 p-4 shadow-lg backdrop-blur-sm">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Keterangan Peta
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Kualitas Udara
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-emerald-500" />
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                          Baik
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400">0-50 AQI</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-yellow-500" />
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                          Sedang
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400">51-100 AQI</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-orange-500" />
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                          Tidak Sehat
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400">101+ AQI</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
                  <p className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Marker
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-red-500" />
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        Lokasi Terpilih
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute bottom-3 right-3 z-10 flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
            <button
              type="button"
              onClick={() => context.handleZoom(1)}
              className="flex h-9 w-9 items-center justify-center rounded-t-lg border-b border-neutral-200 dark:border-neutral-700 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4 text-neutral-700 dark:text-neutral-400" />
            </button>

            <button
              type="button"
              onClick={() => context.handleZoom(-1)}
              className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4 text-neutral-700 dark:text-neutral-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (context.map.current) {
                  context.map.current.easeTo({ bearing: 0, duration: 500 });
                }
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-b-lg border-t border-neutral-200 dark:border-neutral-700 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-700 ${
                bearing !== 0 ? "text-sky-600 dark:text-sky-400" : "text-neutral-700 dark:text-neutral-400"
              }`}
              aria-label="Reset bearing"
              style={{
                transform: `rotate(${-bearing}deg)`,
              }}
            >
              <Navigation className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </BaseEnvironmentMap>
  );
}
