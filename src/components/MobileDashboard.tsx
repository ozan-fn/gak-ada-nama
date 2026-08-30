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
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChartAQITrend } from "#/components/ChartAQITrend";
import PrecipitationOverview from "#/components/PrecipitationOverview";
import RegionalExtreme from "#/components/RegionalExtreme";
import RegionRisk from "#/components/RegionRisk";
import WeatherInformation from "#/components/WeatherInformation";
import { createReportMarkers, groupNearbyReports } from "#/lib/mapMarkers";
import { BaseEnvironmentMap } from "./maps/BaseEnvironmentMap";
import { ElevationLegend } from "./maps/ElevationLegend";
import type { NearbyReportPin } from "./RiskMap";
import { Skeleton } from "./ui/skeleton";

interface MobileDashboardProps {
  location: {
    latitude: number | null;
    longitude: number | null;
    city: string;
    loading: boolean;
    error: string | null;
  };

  stableLocation: {
    latitude: number | null;
    longitude: number | null;
    city: string;
    loading: boolean;
    error: string | null;
  };

  locationParams: { latitude: number; longitude: number } | { city: string };

  envData: {
    weather: {
      current: {
        temperature: number;
        humidity: number;
        precipitation: number;
        rain: number;
        windSpeed: number;
        cloudCover: number;
      };
      hourly: {
        time: string[];
        precipitation: number[];
      };
      daily: {
        time: string[];
        precipitationSum: number[];
        rainSum: number[];
        precipitationProbability: number[];
      };
    } | null;

    aqi: {
      aqi: number;
      city: string;
      dominentpol: string;
    } | null;

    loading: boolean;
    error: string | null;
  };

  reports: NearbyReportPin[];
  reportRadiusKm: number;
}

const HANDLE_HEIGHT = 80;

/**
 * Default map view.
 *
 * IMPORTANT:
 * This object is intentionally kept outside the component
 * so its reference never changes between renders.
 */
const DEFAULT_MAP_CENTER: [number, number] = [106.8456, -6.2088];
const DEFAULT_MAP_ZOOM = 13;

/**
 * Create the blue user location marker.
 *
 * This function is outside the component so it doesn't get recreated
 * on every render.
 */
function createUserLocationMarker(): HTMLDivElement {
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

export default function MobileDashboard({
  location,
  stableLocation,
  locationParams,
  envData,
  reports,
  reportRadiusKm,
}: MobileDashboardProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  /**
   * Map instance.
   *
   * This ref MUST remain stable during the entire component lifetime.
   */
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  /**
   * User marker.
   *
   * We create this only once and then update its position.
   */
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const reportMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedReport, setSelectedReport] = useState<NearbyReportPin | null>(
    null,
  );
  const reportGroups = useMemo(() => groupNearbyReports(reports), [reports]);

  /**
   * Prevent the initial flyTo from running more than once.
   */
  const hasAutoLocatedRef = useRef(false);

  /**
   * Prevent operations after component unmount.
   */
  const mountedRef = useRef(false);

  /**
   * Keep latest stable coordinates accessible from stable callbacks.
   *
   * This avoids putting coordinates into handleMapReady dependencies.
   */
  const coordsRef = useRef<{
    lat: number | null;
    lng: number | null;
  }>({
    lat: stableLocation.latitude,
    lng: stableLocation.longitude,
  });

  /**
   * Keep coordinates ref updated.
   *
   * This does NOT recreate the map.
   */
  useEffect(() => {
    coordsRef.current = {
      lat: stableLocation.latitude,
      lng: stableLocation.longitude,
    };
  }, [stableLocation.latitude, stableLocation.longitude]);

  /**
   * Component lifecycle.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
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

  /* ============================================================
   * BOTTOM SHEET
   * ============================================================ */

  const [collapsedY, setCollapsedY] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const y = useMotionValue(0);
  const dragControls = useDragControls();

  useEffect(() => {
    if (!sheetRef.current) return;

    const updateSheetPosition = () => {
      if (!sheetRef.current) return;

      const fullHeight = sheetRef.current.offsetHeight;
      const peek = Math.max(fullHeight - HANDLE_HEIGHT, 0);

      setCollapsedY(peek);

      /**
       * Only set initial position.
       *
       * Do not continuously reset y because that would interrupt
       * the user's drag animation.
       */
      if (!expanded) {
        y.set(peek);
      }
    };

    updateSheetPosition();

    const resizeObserver = new ResizeObserver(updateSheetPosition);
    resizeObserver.observe(sheetRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [expanded, y]);

  const contentOpacity = useTransform(y, [0, collapsedY ?? 1], [1, 0]);

  const controlsOpacity = useTransform(y, [0, collapsedY ?? 1], [0, 1]);

  const snapTo = useCallback(
    (target: number, isExpanded: boolean) => {
      animate(y, target, {
        type: "spring",
        stiffness: 420,
        damping: 42,
      });

      setExpanded(isExpanded);
    },
    [y],
  );

  const handleDragEnd = useCallback(
    (_event: unknown, info: { velocity: { y: number } }) => {
      if (collapsedY === null) return;

      const current = y.get();

      const shouldExpand = info.velocity.y < -400 || current < collapsedY / 2;

      snapTo(shouldExpand ? 0 : collapsedY, shouldExpand);
    },
    [collapsedY, snapTo, y],
  );

  const startDrag = useCallback(
    (event: ReactPointerEvent) => {
      dragControls.start(event);
    },
    [dragControls],
  );

  const toggleSheet = useCallback(() => {
    if (collapsedY === null) return;

    snapTo(expanded ? collapsedY : 0, !expanded);
  }, [collapsedY, expanded, snapTo]);

  /* ============================================================
   * INITIAL MAP POSITION
   * ============================================================ */

  /**
   * IMPORTANT:
   *
   * We intentionally DO NOT use stableLocation directly as
   * initialCenter.
   *
   * initialCenter should remain stable after BaseEnvironmentMap
   * has been mounted.
   *
   * The actual GPS location will be handled separately by
   * the marker + one-time flyTo.
   */
  const initialCenter = useMemo<[number, number]>(() => DEFAULT_MAP_CENTER, []);

  /**
   * Fixed bounds.
   *
   * We intentionally don't regenerate maxBounds when GPS changes.
   */
  const maxBounds = useMemo<[[number, number], [number, number]]>(
    () => [
      [95, -11],
      [141, 6],
    ],
    [],
  );

  /* ============================================================
   * USER LOCATION MARKER
   * ============================================================ */

  const createOrUpdateUserMarker = useCallback(
    (map: maplibregl.Map, latitude: number, longitude: number) => {
      if (!mountedRef.current) return;

      /**
       * Marker already exists:
       * ONLY update its position.
       *
       * Do NOT recreate it.
       */
      if (markerRef.current) {
        markerRef.current.setLngLat([longitude, latitude]);

        return;
      }

      console.log(
        "[MobileDashboard] Creating BLUE user marker:",
        latitude,
        longitude,
      );

      const markerElement = createUserLocationMarker();

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      markerRef.current = marker;

      console.log("[MobileDashboard] BLUE user marker created");
    },
    [],
  );

  /* ============================================================
   * MAP READY
   * ============================================================ */

  /**
   * IMPORTANT:
   *
   * Empty dependency array.
   *
   * This callback must stay stable so BaseEnvironmentMap doesn't
   * interpret every GPS update as a new map configuration.
   */
  const handleMapReady = useCallback(
    (mapInstance: maplibregl.Map) => {
      if (!mountedRef.current) return;

      console.log("[MobileDashboard] Map ready");

      mapInstanceRef.current = mapInstance;
      setIsMapReady(true);

      const updateUserLocation = () => {
        if (!mountedRef.current) return;

        const { lat, lng } = coordsRef.current;

        if (lat === null || lng === null) {
          console.log("[MobileDashboard] GPS location not available yet");

          return;
        }

        /**
         * Make sure map dimensions are correct before flying.
         */
        mapInstance.resize();

        /**
         * Create/update blue marker.
         */
        createOrUpdateUserMarker(mapInstance, lat, lng);

        /**
         * AUTO LOCATE ONLY ONCE.
         *
         * This is the important part:
         * subsequent GPS updates won't force the map to move.
         */
        if (!hasAutoLocatedRef.current) {
          hasAutoLocatedRef.current = true;

          console.log("[MobileDashboard] Initial auto flyTo:", lat, lng);

          mapInstance.flyTo({
            center: [lng, lat],
            zoom: 13,
            duration: 1200,
            essential: true,
          });
        }
      };

      /**
       * Wait one frame so MapLibre's container is fully ready.
       */
      requestAnimationFrame(updateUserLocation);
    },
    [createOrUpdateUserMarker],
  );

  /* ============================================================
   * GPS UPDATE
   * ============================================================ */

  /**
   * Synchronize GPS changes with the marker.
   *
   * IMPORTANT:
   *
   * This effect does NOT fly the map.
   * It only moves the blue dot.
   *
   * Therefore GPS refreshes won't make the map jump around.
   */
  useEffect(() => {
    const map = mapInstanceRef.current;

    const latitude = stableLocation.latitude;
    const longitude = stableLocation.longitude;

    if (!map || latitude === null || longitude === null) {
      return;
    }

    createOrUpdateUserMarker(map, latitude, longitude);

    if (!hasAutoLocatedRef.current) {
      hasAutoLocatedRef.current = true;
      map.flyTo({
        center: [longitude, latitude],
        zoom: DEFAULT_MAP_ZOOM,
        duration: 1200,
        essential: true,
      });
    }
  }, [
    stableLocation.latitude,
    stableLocation.longitude,
    createOrUpdateUserMarker,
  ]);

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

  /* ============================================================
   * RENDER
   * ============================================================ */

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
      <BaseEnvironmentMap
        /**
         * These values are intentionally stable.
         *
         * Do not replace initialCenter with changing GPS coordinates.
         */
        initialCenter={initialCenter}
        initialZoom={DEFAULT_MAP_ZOOM}
        autoFitStations={false}
        autoZoomOnLocate={false}
        autoLocateOnMount={false}
        aqiRadiusKm={50}
        maxBounds={maxBounds}
        onMapReady={handleMapReady}
      >
        {(context) => {
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
              {/* ==================================================
                  TOP LEFT: Laporan dalam Radius
              ================================================== */}

              <motion.div
                style={{
                  opacity: controlsOpacity,
                }}
                className="absolute left-3 top-3 z-10 flex flex-col gap-2"
              >
                <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200/80 bg-white/95 dark:bg-neutral-800/95 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-400 shadow-sm backdrop-blur-md">
                  <MapPin className="size-3.5 text-amber-600" />
                  <span>
                    {reports.length} laporan · {reportRadiusKm} km
                  </span>
                </div>

                {(showRainRadar || showFireLayer || showElevation) && (
                  <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/90 shadow-sm backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setShowLegend((previous) => !previous)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
                    >
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100">
                        Map Legend
                      </h4>

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
              </motion.div>

              {/* ==================================================
                  DANGER SUMMARY
              ================================================== */}

              {alerts.length > 0 && (
                <motion.div
                  style={{
                    opacity: controlsOpacity,
                  }}
                  className="absolute bottom-24 left-3 z-10 max-w-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-800/95 p-3 shadow-md backdrop-blur-sm"
                >
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

                        <span className="flex-1 text-neutral-700 dark:text-neutral-400">
                          {alert.message}
                        </span>
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
                </motion.div>
              )}

              {selectedReport && (
                <motion.div
                  style={{ opacity: controlsOpacity }}
                  className="
                    absolute bottom-24 left-3 z-20
                    w-[min(19rem,calc(100%-4.5rem))]
                    overflow-hidden
                    rounded-xl
                    border border-neutral-200/80
                    dark:border-neutral-700
                    bg-white/95
                    dark:bg-neutral-800/95
                    shadow-[0_8px_30px_rgba(0,0,0,0.1)]
                    backdrop-blur-md
                  "
                >
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
                        onClick={() => setSelectedReport(null)}
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
                </motion.div>
              )}

              {/* ==================================================
                  TOP RIGHT CONTROLS
              ================================================== */}

              <motion.div
                style={{
                  opacity: controlsOpacity,
                }}
                className="absolute right-3 top-3 z-10 flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm"
              >
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

                      <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                        <input
                          type="checkbox"
                          checked={showRainRadar}
                          onChange={(event) =>
                            setShowRainRadar(event.target.checked)
                          }
                          className="h-4 w-4 cursor-pointer rounded border-neutral-300"
                        />

                        <span>Rain Radar</span>
                      </label>

                      <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                        <input
                          type="checkbox"
                          checked={showFireLayer}
                          onChange={(event) =>
                            setShowFireLayer(event.target.checked)
                          }
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
              </motion.div>

              {/* ==================================================
                  ZOOM
              ================================================== */}

              <motion.div
                style={{
                  opacity: controlsOpacity,
                }}
                className="absolute bottom-24 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm"
              >
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
              </motion.div>
            </>
          );
        }}
      </BaseEnvironmentMap>

      {/* ============================================================
          BOTTOM SHEET
      ============================================================ */}

      <motion.div
        ref={sheetRef}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{
          top: 0,
          bottom: collapsedY ?? 0,
        }}
        dragElastic={0.04}
        onDragEnd={handleDragEnd}
        style={{
          y,
          visibility: collapsedY === null ? "hidden" : "visible",
        }}
        className="absolute inset-x-0 bottom-0 z-10 max-h-[82vh] overflow-hidden"
      >
        <div className="rounded-t-4xl bg-white dark:bg-neutral-800 shadow-sm">
          {/* Handle */}

          <button
            type="button"
            onPointerDown={startDrag}
            onClick={toggleSheet}
            className="relative flex w-full cursor-grab touch-none flex-col items-center gap-3 py-3 active:cursor-grabbing"
          >
            <div className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />

            <div className="flex w-full items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                <MapPin className="size-3.5 text-neutral-500 dark:text-neutral-400" strokeWidth={2} />

                <span>{location.city}</span>
              </div>

              {envData.loading || !envData.weather ? (
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-3.5 w-7 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  <span className="font-semibold">
                    {Math.round(envData.weather.current.temperature)}°
                  </span>

                  <span className="text-neutral-400">•</span>

                  <span>
                    {envData.weather.current.cloudCover > 80
                      ? "Berawan"
                      : envData.weather.current.cloudCover > 50
                        ? "Sebagian Berawan"
                        : envData.weather.current.rain > 0
                          ? "Hujan"
                          : "Cerah"}
                  </span>
                </div>
              )}
            </div>
          </button>

          <motion.div
            style={{
              opacity: contentOpacity,
            }}
            className="max-h-[calc(82vh-80px)] overflow-y-auto bg-neutral-50 dark:bg-neutral-900 px-4"
          >
            <div className="space-y-3 pb-4 pt-2">
              {/* Weather */}

              <div className="rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-sm">
                <WeatherInformation location={locationParams} />
              </div>

              {/* Regional Extreme */}

              <div className="rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-sm">
                <RegionalExtreme location={locationParams} />
              </div>

              {/* Precipitation */}

              <div className="rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-sm">
                <PrecipitationOverview location={locationParams} />
              </div>

              {/* AQI */}

              <div className="rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-sm">
                <ChartAQITrend location={locationParams} />
              </div>

              {/* Region Risk */}

              <div className="rounded-2xl bg-white dark:bg-neutral-800 p-4 shadow-sm">
                <RegionRisk
                  location={locationParams}
                  reportCount={reports.length}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
