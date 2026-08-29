import { useRef, useCallback, useMemo, useEffect, memo, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Layers, Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { BaseEnvironmentMap, type MapContext } from "./maps/BaseEnvironmentMap";
import { Skeleton } from "./ui/skeleton";
import type { Warning } from "#/hooks/useEnvironmentWarnings";
import type { NearbyReportPin } from "#/components/RiskMap";
import { createReportMarkers, groupNearbyReports } from "#/lib/mapMarkers";

interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  city: string;
  loading: boolean;
  error: string | null;
}

interface WarningsMapProps {
  userLocation: UserLocation;
  warnings: Warning[];
  reports: NearbyReportPin[];
}

const severityColors: Record<Warning["severity"], string> = {
  tinggi: "#ef4444",
  sedang: "#f59e0b",
  rendah: "#10b981",
};

function createUserLocationMarkerElement(): HTMLDivElement {
  const markerEl = document.createElement("div");
  markerEl.className = "user-location-marker";

  Object.assign(markerEl.style, {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "default",
    pointerEvents: "none",
  });

  const dot = document.createElement("div");
  Object.assign(dot.style, {
    width: "16px",
    height: "16px",
    borderRadius: "9999px",
    backgroundColor: "#3b82f6",
    border: "3px solid #ffffff",
    boxShadow:
      "0 0 0 2px rgba(59, 130, 246, 0.20), 0 2px 6px rgba(0, 0, 0, 0.35)",
  });

  markerEl.appendChild(dot);
  return markerEl;
}

function createWarningMarkerElement(
  severity: Warning["severity"],
): HTMLDivElement {
  const markerEl = document.createElement("div");
  markerEl.className = "warning-marker";

  Object.assign(markerEl.style, {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "default",
    pointerEvents: "none",
  });

  const dot = document.createElement("div");
  Object.assign(dot.style, {
    width: "12px",
    height: "12px",
    borderRadius: "9999px",
    backgroundColor: severityColors[severity],
    border: "2px solid #ffffff",
    boxShadow: `0 0 0 2px ${severityColors[severity]}40, 0 2px 4px rgba(0, 0, 0, 0.25)`,
  });

  markerEl.appendChild(dot);
  return markerEl;
}

function WarningsMapControls({ context }: { context: MapContext }) {
  const [showLegend, setShowLegend] = useState<boolean>(false);

  const {
    handleZoom,
    showLayers,
    setShowLayers,
    showRainRadar,
    setShowRainRadar,
    showFireLayer,
    setShowFireLayer,
  } = context;

  return (
    <>
      {/* Top Left Legend */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/90 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setShowLegend((prev) => !prev)}
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
            <div className="border-t border-neutral-100 dark:border-neutral-700 px-3 pb-3 pt-2">
              <p className="mb-2 text-[10px] font-semibold text-neutral-700 dark:text-neutral-400">
                Warning Severity
              </p>

              <div className="flex flex-col gap-1 text-[10px] text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full border border-white bg-[#ef4444] shadow-sm" />
                  <span>Risiko Tinggi</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full border border-white bg-[#f59e0b] shadow-sm" />
                  <span>Risiko Sedang</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full border border-white bg-[#10b981] shadow-sm" />
                  <span>Risiko Rendah</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full border border-white bg-[#3b82f6] shadow-sm" />
                  <span>Lokasi Anda</span>
                </div>

                <div className="mt-2 border-t border-neutral-100 dark:border-neutral-700 pt-2">
                  <p className="mb-1.5 text-[10px] font-semibold text-neutral-700 dark:text-neutral-400">
                    Laporan Sekitar
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full border border-white bg-amber-400 text-[8px] font-black text-amber-950 shadow-sm">
                      !
                    </span>
                    <span>Laporan komunitas</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full border border-white bg-emerald-500 text-[8px] font-black text-white shadow-sm">
                      !
                    </span>
                    <span>Pemantauan otomatis</span>
                  </div>
                </div>
              </div>

              {showFireLayer && (
                <div className="mt-3 border-t border-neutral-100 dark:border-neutral-700 pt-2">
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
            </div>
          )}
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute right-3 top-3 z-10">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayers(!showLayers)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
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

              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={showRainRadar}
                  onChange={(event) => setShowRainRadar(event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                />
                <span>Rain Radar</span>
              </label>

              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={showFireLayer}
                  onChange={(event) => setShowFireLayer(event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                />
                <span>Fire Hotspots</span>
              </label>
            </div>
          )}
        </div>
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
    </>
  );
}

function WarningsMapContent({
  userLocation,
  warnings,
  reports,
  onMapReady,
}: WarningsMapProps & { onMapReady: (map: maplibregl.Map) => void }) {
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const warningMarkersRef = useRef<maplibregl.Marker[]>([]);
  const reportMarkersRef = useRef<maplibregl.Marker[]>([]);
  const mountedRef = useRef(false);

  const reportGroups = useMemo(() => groupNearbyReports(reports), [reports]);

  const center = useMemo<[number, number]>(() => {
    if (userLocation.latitude !== null && userLocation.longitude !== null) {
      return [userLocation.longitude, userLocation.latitude];
    }
    return [106.8456, -6.2088];
  }, [userLocation.latitude, userLocation.longitude]);

  const bounds = useMemo<
    [[number, number], [number, number]] | undefined
  >(() => {
    if (userLocation.latitude === null || userLocation.longitude === null) {
      return undefined;
    }

    return [
      [userLocation.longitude - 0.5, userLocation.latitude - 0.5],
      [userLocation.longitude + 0.5, userLocation.latitude + 0.5],
    ];
  }, [userLocation.latitude, userLocation.longitude]);

  const createUserMarker = useCallback(
    (map: maplibregl.Map, latitude: number, longitude: number) => {
      if (!mountedRef.current) return;

      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([longitude, latitude]);
        return;
      }

      const markerElement = createUserLocationMarkerElement();
      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      userMarkerRef.current = marker;
    },
    [],
  );

  const createWarningMarkers = useCallback(
    (map: maplibregl.Map) => {
      if (!mountedRef.current) return;

      // Clear existing markers
      warningMarkersRef.current.forEach((marker) => {
        marker.remove();
      });
      warningMarkersRef.current = [];

      // Since warnings don't have actual coordinates, we'll place them
      // in a circle around the user location for visualization
      const lat = userLocation.latitude ?? -6.2088;
      const lng = userLocation.longitude ?? 106.8456;

      warnings.forEach((warning, index) => {
        // Create markers in a circle around user location
        const angle = (index / warnings.length) * 2 * Math.PI;
        const radius = 0.02; // approximately 2km
        const markerLat = lat + radius * Math.sin(angle);
        const markerLng = lng + radius * Math.cos(angle);

        const markerElement = createWarningMarkerElement(warning.severity);
        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: "center",
        })
          .setLngLat([markerLng, markerLat])
          .addTo(map);

        warningMarkersRef.current.push(marker);
      });
    },
    [warnings, userLocation.latitude, userLocation.longitude],
  );

  const syncReportMarkers = useCallback(
    (map: maplibregl.Map) => {
      if (!mountedRef.current) return;

      reportMarkersRef.current.forEach((marker) => {
        marker.remove();
      });

      reportMarkersRef.current = createReportMarkers(
        reports,
        map,
        undefined,
        reportGroups,
      );
    },
    [reportGroups, reports],
  );

  const handleMapReady = useCallback(
    (mapInstance: maplibregl.Map) => {
      if (!mountedRef.current) return;

      mapInstanceRef.current = mapInstance;
      onMapReady(mapInstance);

      const lat = userLocation.latitude;
      const lng = userLocation.longitude;

      if (lat !== null && lng !== null) {
        requestAnimationFrame(() => {
          if (!mountedRef.current) return;
          mapInstance.resize();
          createUserMarker(mapInstance, lat, lng);
          createWarningMarkers(mapInstance);
          syncReportMarkers(mapInstance);
        });
      }
    },
    [
      userLocation.latitude,
      userLocation.longitude,
      createUserMarker,
      createWarningMarkers,
      syncReportMarkers,
      onMapReady,
    ],
  );

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    createWarningMarkers(map);
  }, [createWarningMarkers]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    syncReportMarkers(map);
  }, [syncReportMarkers]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const lat = userLocation.latitude;
    const lng = userLocation.longitude;

    if (!map || lat === null || lng === null) return;

    if (!userMarkerRef.current) {
      createUserMarker(map, lat, lng);
      return;
    }

    userMarkerRef.current.setLngLat([lng, lat]);
  }, [userLocation.latitude, userLocation.longitude, createUserMarker]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      warningMarkersRef.current.forEach((marker) => {
        marker.remove();
      });
      warningMarkersRef.current = [];

      reportMarkersRef.current.forEach((marker) => {
        marker.remove();
      });
      reportMarkersRef.current = [];

      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <BaseEnvironmentMap
      initialCenter={center}
      initialZoom={12}
      autoFitStations={false}
      autoZoomOnLocate={false}
      autoLocateOnMount={false}
      aqiRadiusKm={10}
      maxBounds={bounds}
      onMapReady={handleMapReady}
    >
      {(context) => <WarningsMapControls context={context} />}
    </BaseEnvironmentMap>
  );
}

function WarningsMap({ userLocation, warnings, reports }: WarningsMapProps) {
  const handleMapReady = useCallback(() => {
    // Map ready callback if needed
  }, []);

  if (userLocation.loading) {
    return (
      <div className="relative h-full w-full bg-neutral-100">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <WarningsMapContent
        userLocation={userLocation}
        warnings={warnings}
        reports={reports}
        onMapReady={handleMapReady}
      />
    </div>
  );
}

export default memo(WarningsMap, (prevProps, nextProps) => {
  return (
    prevProps.userLocation.latitude === nextProps.userLocation.latitude &&
    prevProps.userLocation.longitude === nextProps.userLocation.longitude &&
    prevProps.userLocation.loading === nextProps.userLocation.loading &&
    prevProps.warnings.length === nextProps.warnings.length &&
    prevProps.warnings.every((w, i) => w.id === nextProps.warnings[i]?.id) &&
    prevProps.reports.length === nextProps.reports.length &&
    prevProps.reports.every(
      (report, index) =>
        report.id === nextProps.reports[index]?.id &&
        report.latitude === nextProps.reports[index]?.latitude &&
        report.longitude === nextProps.reports[index]?.longitude,
    )
  );
});
