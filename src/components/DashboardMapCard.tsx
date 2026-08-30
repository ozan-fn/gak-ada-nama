import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Droplet,
  Factory,
  Layers,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Thermometer,
  Wind,
  X,
} from "lucide-react";
import * as maplibregl from "maplibre-gl";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NearbyReportPin } from "#/components/RiskMap";
import { useLocalFireData } from "#/hooks/useFireData";
import { createReportMarkers, groupNearbyReports } from "#/lib/mapMarkers";
import { BaseEnvironmentMap, type MapContext } from "./maps/BaseEnvironmentMap";
import { ElevationLegend } from "./maps/ElevationLegend";
import { Skeleton } from "./ui/skeleton";

interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  city: string;
  loading: boolean;
  error: string | null;
}

interface DashboardMapCardProps {
  userLocation: UserLocation;
  reports: NearbyReportPin[];
  reportRadiusKm: number;
}

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

function DashboardMapContent({
  context,
  reports,
  reportRadiusKm,
  selectedReport,
  onClearSelectedReport,
}: {
  context: MapContext;
  reports: NearbyReportPin[];
  reportRadiusKm: number;
  selectedReport: NearbyReportPin | null;
  onClearSelectedReport: () => void;
}) {
  const [showLegend, setShowLegend] = useState<boolean>(false);

  const {
    alerts,
    locate,
    isLocating,
    handleZoom,
    showLayers,
    setShowLayers,
    showRainRadar,
    setShowRainRadar,
    showFireLayer,
    setShowFireLayer,
    showElevation,
    setShowElevation,
  } = context;

  return (
    <>
      {/* Top Left: Laporan dalam Radius */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200/80 bg-white/95 dark:bg-neutral-800/95 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-400 shadow-sm backdrop-blur-md">
          <MapPin className="size-3.5 text-amber-600" />
          <span>
            {reports.length} laporan dalam radius {reportRadiusKm} km
          </span>
        </div>

        {(showRainRadar || showFireLayer || showElevation) && (
          <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/90 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setShowLegend((previous: boolean) => !previous)}
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
                {showFireLayer && (
                  <div className="border-t border-neutral-100 dark:border-neutral-700 pt-2">
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
        )}
      </div>

      {/* Bottom Left Alerts Preview */}
      {alerts.length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 hidden max-w-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-800/95 p-3 shadow-md backdrop-blur-sm lg:block">
          <h3 className="mb-2 text-xs font-semibold text-neutral-800 dark:text-neutral-100">
            Dangers Nearby
          </h3>

          <div className="space-y-1.5">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={`${alert.type}-${alert.severity}`}
                className="flex items-start gap-2 text-xs"
              >
                <span className="mt-0.5 shrink-0">
                  {alert.type === "aqi" ? (
                    <Factory className="h-4 w-4 text-orange-500" />
                  ) : alert.type === "temperature" ? (
                    <Thermometer className="h-4 w-4 text-red-500" />
                  ) : alert.type === "rain" ? (
                    <CloudRain className="h-4 w-4 text-blue-500" />
                  ) : alert.type === "wind" ? (
                    <Wind className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  ) : alert.type === "humidity" ? (
                    <Droplet className="h-4 w-4 text-cyan-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </span>

                <span className="flex-1 text-neutral-700 dark:text-neutral-400">{alert.message}</span>
              </div>
            ))}
          </div>

          <Link to="/dashboard/risk-map">
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-sky-400/30 bg-sky-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-sky-500/15 transition-colors duration-200 hover:bg-sky-400"
            >
              <span>Lihat Peta Risiko</span>
              <ArrowUpRight className="size-3" />
            </button>
          </Link>
        </div>
      )}

      {selectedReport && (
        <div className="absolute bottom-3 left-3 z-20 w-[min(20rem,calc(100%-4.5rem))] overflow-hidden rounded-xl border border-neutral-200/80 dark:border-neutral-700 bg-white/95 dark:bg-neutral-800/95 shadow-[0_8px_30px_rgba(0,0,0,0.1)] backdrop-blur-md">
          <div className="p-3.5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[10px] font-medium text-sky-600 dark:text-sky-400">
                    {selectedReport.category}
                  </span>

                  <span className="size-1 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-700" />

                  <span className="shrink-0 text-[10px] text-neutral-400">
                    {selectedReport.distanceKm.toFixed(1)} km
                  </span>
                </div>

                <h3 className="mt-1.5 truncate text-[13px] font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
                  {selectedReport.title}
                </h3>

                <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <MapPin className="size-3 shrink-0 text-neutral-400" />
                  <span className="truncate">
                    {selectedReport.locationName}
                  </span>
                </div>
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={onClearSelectedReport}
                className="
                  flex size-7 shrink-0
                  items-center justify-center
                  rounded-md
                  text-neutral-400
                  dark:text-neutral-400
                  transition-colors
                  hover:bg-neutral-100
                  dark:hover:bg-neutral-700
                  hover:text-neutral-700
                  dark:hover:text-neutral-100
                  focus:outline-none
                  focus:ring-2
                  focus:ring-neutral-200
                  dark:focus:ring-neutral-700
                "
                aria-label="Tutup detail laporan"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Action */}
            <Link
              to="/dashboard/risk-map"
              search={{
                lat: selectedReport.latitude,
                lng: selectedReport.longitude,
                city: selectedReport.locationName,
              }}
              className="
                mt-3
                flex w-full
                items-center justify-between
                rounded-md
                border border-sky-100
                dark:border-sky-400/30
                bg-sky-50/70
                dark:bg-sky-400/10
                px-3 py-2
                text-[11px]
                font-medium
                text-sky-700
                dark:text-sky-400
                transition-colors
                hover:border-sky-200
                hover:bg-sky-50
                dark:hover:bg-sky-400/20
                focus:outline-none
                focus:ring-2
                focus:ring-sky-100
                dark:focus:ring-sky-400/30
              "
            >
              <span>Lihat di peta risiko</span>
              <ArrowUpRight className="size-3.5 shrink-0" />
            </Link>
          </div>
        </div>
      )}

      {/* Top Right Controls */}
      <div className="absolute right-3 top-3 z-10 hidden flex-col rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm lg:flex">
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
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <span>AQI Heatmap</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={showRainRadar}
                  onChange={(event) => setShowRainRadar(event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-neutral-300"
                />
                <span>Rain Radar</span>
              </label>

              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={showFireLayer}
                  onChange={(event) => setShowFireLayer(event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-neutral-300"
                />
                <span>Fire Hotspots</span>
              </label>

              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={showElevation}
                  onChange={(event) =>
                    setShowElevation(event.target.checked)
                  }
                  className="h-4 w-4 cursor-pointer rounded border-neutral-300"
                />
                <span>Elevation</span>
              </label>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => locate(true)}
          disabled={isLocating}
          className="flex h-9 w-9 items-center justify-center rounded-b-lg transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Locate me"
        >
          <Navigation
            className={`h-4 w-4 text-neutral-700 dark:text-neutral-400 ${
              isLocating ? "animate-pulse" : ""
            }`}
          />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-3 right-3 z-10 hidden flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm lg:flex">
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

function DashboardMapCard({
  userLocation,
  reports,
  reportRadiusKm,
}: DashboardMapCardProps) {
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const reportMarkersRef = useRef<maplibregl.Marker[]>([]);
  const mountedRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedReport, setSelectedReport] = useState<NearbyReportPin | null>(
    null,
  );

  const reportGroups = useMemo(() => groupNearbyReports(reports), [reports]);

  // Keep coordinates updated in ref to access inside stable callbacks without stale closures
  const coordsRef = useRef<{
    lat: number | null;
    lng: number | null;
  }>({
    lat: userLocation.latitude,
    lng: userLocation.longitude,
  });

  useEffect(() => {
    coordsRef.current = {
      lat: userLocation.latitude,
      lng: userLocation.longitude,
    };
  }, [userLocation.latitude, userLocation.longitude]);

  const { points: localFirePoints } = useLocalFireData(
    userLocation.latitude,
    userLocation.longitude,
    100,
  );

  // Memoize map center to prevent recreate on unneeded renders
  const center = useMemo<[number, number]>(() => {
    if (userLocation.latitude !== null && userLocation.longitude !== null) {
      return [userLocation.longitude, userLocation.latitude];
    }

    return [110.4203, -6.9932];
  }, [userLocation.latitude, userLocation.longitude]);

  // Memoize bounds to prevent layout jumps
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

  /** Instantiates or updates the blue user location marker position. */
  const createUserMarker = useCallback(
    (map: maplibregl.Map, latitude: number, longitude: number) => {
      if (!mountedRef.current) {
        return;
      }

      if (markerRef.current) {
        markerRef.current.setLngLat([longitude, latitude]);
        return;
      }

      console.log(
        "[DashboardMap] Creating BLUE user marker:",
        latitude,
        longitude,
      );

      const markerElement = createUserLocationMarkerElement();

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      markerRef.current = marker;

      console.log("[DashboardMap] BLUE marker successfully added");
    },
    [],
  );

  // Callback dependency stays empty to avoid re-initializing BaseEnvironmentMap
  const handleMapReady = useCallback(
    (mapInstance: maplibregl.Map) => {
      if (!mountedRef.current) {
        return;
      }

      console.log("[DashboardMap] Map ready callback");

      mapInstanceRef.current = mapInstance;
      setIsMapReady(true);

      const updateMarker = () => {
        if (!mountedRef.current) {
          return;
        }

        const { lat, lng } = coordsRef.current;

        if (lat === null || lng === null) {
          console.log("[DashboardMap] Location unavailable");
          return;
        }

        mapInstance.resize();
        createUserMarker(mapInstance, lat, lng);
      };

      // Delay execution by 1 frame to ensure the canvas container is fully rendered
      requestAnimationFrame(updateMarker);
    },
    [createUserMarker],
  );

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    reportMarkersRef.current.forEach((marker) => {
      marker.remove();
    });
    const markers = createReportMarkers(
      reports,
      map,
      setSelectedReport,
      reportGroups,
    );
    reportMarkersRef.current = markers;

    return () => {
      markers.forEach((marker) => {
        marker.remove();
      });
      reportMarkersRef.current = [];
    };
  }, [isMapReady, reportGroups, reports]);

  useEffect(() => {
    if (
      selectedReport &&
      !reports.some((report) => report.id === selectedReport.id)
    ) {
      setSelectedReport(null);
    }
  }, [reports, selectedReport]);

  // Sync GPS updates to marker position without re-creating the map
  useEffect(() => {
    const map = mapInstanceRef.current;

    const lat = userLocation.latitude;
    const lng = userLocation.longitude;

    if (!map || lat === null || lng === null) {
      return;
    }

    if (!markerRef.current) {
      createUserMarker(map, lat, lng);
      return;
    }

    markerRef.current.setLngLat([lng, lat]);
  }, [userLocation.latitude, userLocation.longitude, createUserMarker]);

  // Clean up MapLibre instance and marker only on unmount
  useEffect(() => {
    mountedRef.current = true;

    console.log("[DashboardMap] Component mounted");

    return () => {
      console.log("[DashboardMap] Component unmounted");

      mountedRef.current = false;

      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      reportMarkersRef.current.forEach((marker) => {
        marker.remove();
      });
      reportMarkersRef.current = [];

      mapInstanceRef.current = null;
    };
  }, []);

  if (userLocation.loading) {
    return (
      <div className="relative h-full w-full bg-neutral-100 dark:bg-neutral-900">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <BaseEnvironmentMap
      initialCenter={center}
      initialZoom={13}
      autoFitStations={false}
      autoZoomOnLocate={false}
      autoLocateOnMount={false}
      aqiRadiusKm={50}
      maxBounds={bounds}
      customFireData={localFirePoints}
      onMapReady={handleMapReady}
    >
      {(context) => (
        <DashboardMapContent
          context={context}
          reports={reports}
          reportRadiusKm={reportRadiusKm}
          selectedReport={selectedReport}
          onClearSelectedReport={() => setSelectedReport(null)}
        />
      )}
    </BaseEnvironmentMap>
  );
}

// Custom memo equality check to prevent re-renders when object reference changes but data remains identical
export default memo(DashboardMapCard, (prevProps, nextProps) => {
  return (
    prevProps.userLocation.latitude === nextProps.userLocation.latitude &&
    prevProps.userLocation.longitude === nextProps.userLocation.longitude &&
    prevProps.userLocation.loading === nextProps.userLocation.loading &&
    prevProps.userLocation.error === nextProps.userLocation.error &&
    prevProps.reports === nextProps.reports &&
    prevProps.reportRadiusKm === nextProps.reportRadiusKm
  );
});
