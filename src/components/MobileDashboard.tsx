import {
  Droplet,
  Layers,
  Navigation,
  Minus,
  Plus,
  MapPin,
  AlertTriangle,
  Factory,
  Thermometer,
  CloudRain,
  Wind,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "@tanstack/react-router";
import { ChartAQITrend } from "#/components/ChartAQITrend";
import RegionalExtreme from "#/components/RegionalExtreme";
import PrecipitationOverview from "#/components/PrecipitationOverview";
import RegionRisk from "#/components/RegionRisk";
import WeatherInformation from "#/components/WeatherInformation";
import { BaseEnvironmentMap } from "./maps/BaseEnvironmentMap";
import * as maplibregl from "maplibre-gl";
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
}

const HANDLE_HEIGHT = 80; // Increased for better visibility when collapsed

export default function MobileDashboard({
  location,
  stableLocation,
  locationParams,
  envData,
}: MobileDashboardProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const [collapsedY, setCollapsedY] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const y = useMotionValue(0);
  const dragControls = useDragControls();

  // Stabilize coords for marker
  const coords = useMemo(
    () => ({ lat: stableLocation.latitude, lng: stableLocation.longitude }),
    [stableLocation.latitude, stableLocation.longitude],
  );

  // Memoize center to prevent unnecessary map re-initialization
  const center: [number, number] = useMemo(
    () =>
      stableLocation.latitude && stableLocation.longitude
        ? [stableLocation.longitude, stableLocation.latitude]
        : [106.8456, -6.2088],
    [stableLocation.latitude, stableLocation.longitude],
  );

  // Memoize bounds to prevent unnecessary map updates
  const bounds: [[number, number], [number, number]] | undefined = useMemo(
    () =>
      stableLocation.latitude && stableLocation.longitude
        ? [
            [stableLocation.longitude - 0.5, stableLocation.latitude - 0.5],
            [stableLocation.longitude + 0.5, stableLocation.latitude + 0.5],
          ]
        : undefined,
    [stableLocation.latitude, stableLocation.longitude],
  );

  useEffect(() => {
    if (!sheetRef.current) return;
    const fullHeight = sheetRef.current.offsetHeight;
    const peek = Math.max(fullHeight - HANDLE_HEIGHT, 0);
    setCollapsedY(peek);
    y.set(peek);
  }, [y]);

  const contentOpacity = useTransform(y, [0, collapsedY ?? 1], [1, 0]);
  // Controls opacity: fade out when sheet expands
  const controlsOpacity = useTransform(y, [0, collapsedY ?? 1], [0, 1]);

  const snapTo = (target: number, isExpanded: boolean) => {
    animate(y, target, { type: "spring", stiffness: 420, damping: 42 });
    setExpanded(isExpanded);
  };

  const handleDragEnd = (_: unknown, info: { velocity: { y: number } }) => {
    if (collapsedY === null) return;
    const current = y.get();
    const shouldExpand = info.velocity.y < -400 || current < collapsedY / 2;
    snapTo(shouldExpand ? 0 : collapsedY, shouldExpand);
  };

  const startDrag = (event: ReactPointerEvent) => {
    dragControls.start(event);
  };

  const toggleSheet = () => {
    if (collapsedY === null) return;
    snapTo(expanded ? collapsedY : 0, !expanded);
  };

  // Create marker when map is ready
  const handleMapReady = useCallback(
    (mapInstance: maplibregl.Map) => {
      mapInstanceRef.current = mapInstance;

      if (!coords.lat || !coords.lng) return;
      if (typeof document === "undefined") return; // SSR guard

      if (markerRef.current) {
        markerRef.current.remove();
      }

      const markerEl = document.createElement("div");
      markerEl.className = "user-location-marker";
      markerEl.style.cssText = `
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;

      const dot = document.createElement("div");
      dot.style.cssText = `
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: #3b82f6;
      border: 3px solid white;
      box-shadow: 0 0 6px rgba(0,0,0,0.4);
      transition: all 0.3s ease;
    `;

      markerEl.appendChild(dot);

      markerRef.current = new maplibregl.Marker({
        element: markerEl,
        anchor: "center",
      })
        .setLngLat([coords.lng, coords.lat])
        .addTo(mapInstance);
    },
    [coords],
  );

  // Keep marker alive
  useEffect(() => {
    if (!mapInstanceRef.current || !coords.lat || !coords.lng) return;
    if (typeof document === "undefined") return; // SSR guard

    if (!markerRef.current) {
      const markerEl = document.createElement("div");
      markerEl.className = "user-location-marker";
      markerEl.style.cssText = `
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      `;

      const dot = document.createElement("div");
      dot.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #3b82f6;
        border: 3px solid white;
        box-shadow: 0 0 6px rgba(0,0,0,0.4);
        transition: all 0.3s ease;
      `;

      markerEl.appendChild(dot);

      markerRef.current = new maplibregl.Marker({
        element: markerEl,
        anchor: "center",
      })
        .setLngLat([coords.lng, coords.lat])
        .addTo(mapInstanceRef.current);
    } else {
      markerRef.current.setLngLat([coords.lng, coords.lat]);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [coords]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-100">
      <BaseEnvironmentMap
        initialCenter={center}
        initialZoom={13}
        autoFitStations={false}
        autoZoomOnLocate={false}
        autoLocateOnMount={false}
        aqiRadiusKm={50}
        maxBounds={bounds}
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
          } = context;
          const activeAlertsCount = alerts.length;

          return (
            <>
              {/* Top Left Container: Active Alerts + Map Legend */}
              <motion.div
                style={{ opacity: controlsOpacity }}
                className="absolute left-3 top-3 z-10 flex flex-col gap-2"
              >
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

                {/* Map Legend - Below Active Alerts or in its place */}
                {(showRainRadar || showFireLayer) && (
                  <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white/90 shadow-sm backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setShowLegend(!showLegend)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-neutral-50"
                    >
                      <h4 className="text-xs font-bold text-neutral-800">
                        Map Legend
                      </h4>

                      {showLegend ? (
                        <ChevronDown className="h-3 w-3 text-neutral-600" />
                      ) : (
                        <ChevronUp className="h-3 w-3 text-neutral-600" />
                      )}
                    </button>

                    {showLegend && (
                      <div className="px-3 pb-3">
                        {showFireLayer && (
                          <div className="border-t border-neutral-100 pt-2">
                            <p className="mb-2 text-[10px] font-semibold text-neutral-700">
                              Fire Hotspots (5d)
                            </p>

                            <div className="flex flex-col gap-1 text-[10px] text-neutral-600">
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

                            <p className="mt-2 text-[9px] italic text-neutral-500">
                              NASA FIRMS VIIRS
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Bottom Left: Danger Summary */}
              {alerts.length > 0 && (
                <motion.div
                  style={{ opacity: controlsOpacity }}
                  className="absolute bottom-24 left-3 z-10 max-w-xs rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-md backdrop-blur-sm"
                >
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
                        <span className="flex-1 text-neutral-700">
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

              {/* Top Right Controls: Layers, Locate Me */}
              <motion.div
                style={{ opacity: controlsOpacity }}
                className="absolute right-3 top-3 z-10 flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm"
              >
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

                      <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showRainRadar}
                          onChange={(e) => setShowRainRadar(e.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 cursor-pointer"
                        />
                        <span>Rain Radar</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer mt-2">
                        <input
                          type="checkbox"
                          checked={showFireLayer}
                          onChange={(e) => setShowFireLayer(e.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 cursor-pointer"
                        />
                        <span>Fire Hotspots</span>
                      </label>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => locate(true)}
                  disabled={isLocating}
                  className="flex h-9 w-9 items-center justify-center rounded-b-lg transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Locate me"
                >
                  <Navigation
                    className={`h-4 w-4 text-neutral-700 ${isLocating ? "animate-pulse" : ""}`}
                  />
                </button>
              </motion.div>

              {/* Bottom Right Controls: Zoom */}
              <motion.div
                style={{ opacity: controlsOpacity }}
                className="absolute bottom-24 right-3 z-10 flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
              >
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
              </motion.div>
            </>
          );
        }}
      </BaseEnvironmentMap>

      {/* Bottom sheet */}
      <motion.div
        ref={sheetRef}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: collapsedY ?? 0 }}
        dragElastic={0.04}
        onDragEnd={handleDragEnd}
        style={{ y, visibility: collapsedY === null ? "hidden" : "visible" }}
        className="absolute inset-x-0 bottom-0 z-10 max-h-[82vh] overflow-hidden"
      >
        <div className="rounded-t-4xl bg-white shadow-sm">
          {/* Handle strip */}
          <button
            type="button"
            onPointerDown={startDrag}
            onClick={toggleSheet}
            className="relative flex w-full cursor-grab touch-none flex-col items-center gap-3 py-3 active:cursor-grabbing"
          >
            <div className="h-1 w-10 rounded-full bg-neutral-300" />

            {/* Location & Weather - Always visible */}
            <div className="flex w-full items-center justify-center gap-2">
              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                <MapPin className="size-3.5 text-neutral-500" strokeWidth={2} />
                <span>{location.city}</span>
              </div>

              {/* Weather */}
              {envData.loading || !envData.weather ? (
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-3.5 w-7 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
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
            style={{ opacity: contentOpacity }}
            className="max-h-[calc(82vh-80px)] overflow-y-auto bg-neutral-50 px-4"
          >
            <div className="space-y-3 pb-4 pt-2">
              {/* Weather info - white card */}
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <WeatherInformation location={locationParams} />
              </div>

              {/* Regional extreme - white card */}
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <RegionalExtreme location={locationParams} />
              </div>

              {/* Precipitation - white card */}
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <PrecipitationOverview location={locationParams} />
              </div>

              {/* AQI trend - white card */}
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <ChartAQITrend location={locationParams} />
              </div>

              {/* Region risk - white card */}
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <RegionRisk location={locationParams} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
