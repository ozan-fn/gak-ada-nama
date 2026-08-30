import { Compass, Layers, MapPin, Minus, Navigation, Plus } from "lucide-react";
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

import { indonesiaLocations } from "#/data/indonesia-locations";
import { calculateDistanceKm } from "#/lib/distanceUtils";
import { findNearestCity } from "#/lib/geoUtils";
import {
  createAutomaticReportUncertaintyGeoJson,
  createReportMarkers,
  createSelectedLocationMarker,
  groupNearbyReports,
} from "#/lib/mapMarkers";

import { BaseEnvironmentMap, type MapContext } from "./maps/BaseEnvironmentMap";
import { ElevationLegend } from "./maps/ElevationLegend";
import type { NearbyReportPin } from "./RiskMap";

interface MobileRiskMapProps {
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

  reports: NearbyReportPin[];

  selectedLocation: {
    latitude: number;
    longitude: number;
    city: string;
  } | null;

  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
    city: string;
  }) => void;

  onReportSelect?: (report: NearbyReportPin) => void;

  renderSheetContent: () => React.ReactNode;
}

const HANDLE_HEIGHT = 80;

/**
 * IMPORTANT:
 * Keep this object outside the component.
 * This prevents BaseEnvironmentMap from receiving
 * a new object reference on every render.
 */
const defaultView = {
  center: [118.0, -2.5] as [number, number],
  zoom: 4.5,
  pitch: 0,
  bearing: 0,
};

/**
 * Creates the blue user-location marker.
 *
 * This marker is independent from:
 * - selected red marker
 * - report markers
 *
 * Therefore clicking the map will never remove the user marker.
 */
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

/**
 * Creates or updates the blue user marker.
 *
 * Stable function because it does not depend on component state.
 */
function createOrUpdateUserMarker(
  map: maplibregl.Map,
  markerRef: React.MutableRefObject<maplibregl.Marker | null>,
  latitude: number,
  longitude: number,
) {
  if (markerRef.current) {
    markerRef.current.setLngLat([longitude, latitude]);
    return;
  }

  console.log("[MobileRiskMap] Creating BLUE user marker:", {
    latitude,
    longitude,
  });

  const markerElement = createUserLocationMarkerElement();

  const marker = new maplibregl.Marker({
    element: markerElement,
    anchor: "center",
  })
    .setLngLat([longitude, latitude])
    .addTo(map);

  markerRef.current = marker;

  console.log("[MobileRiskMap] BLUE user marker successfully added");
}

/**
 * Map click handler is intentionally defined OUTSIDE MobileRiskMap.
 *
 * This is important for stability.
 * If it was declared inside MobileRiskMap, React could treat it as
 * a different component function on every parent render.
 */
function MobileMapClickHandler({
  ctx,
  isMapReady,
  onLocationSelect,
  onReportSelect,
  reportGroups,
}: {
  ctx: MapContext;
  isMapReady: boolean;

  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
    city: string;
  }) => void;

  onReportSelect?: (report: NearbyReportPin) => void;

  reportGroups: NearbyReportPin[][];
}) {
  useEffect(() => {
    const map = ctx.map.current;

    if (!map || !isMapReady || !onLocationSelect) {
      return;
    }

    console.log("[MobileRiskMap] Registering map click handler");

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      console.log("[MobileRiskMap] Map clicked:", e.lngLat);

      /**
       * Prevent clicks that were already handled by another element.
       */
      if (e.originalEvent.defaultPrevented) {
        return;
      }

      /**
       * Ignore clicks on:
       * - report markers
       * - selected marker
       * - user marker
       * - popup
       */
      const eventTarget = e.originalEvent.target;

      if (
        eventTarget instanceof Element &&
        eventTarget.closest(".maplibregl-marker, .maplibregl-popup")
      ) {
        return;
      }

      /**
       * Detect report marker/group click.
       *
       * This fallback is useful because the marker itself may not
       * always receive the click depending on its DOM structure.
       */
      const clickedReportGroup = reportGroups.find((group) => {
        const primaryReport = group[0];

        const reportPoint = map.project([
          primaryReport.longitude,
          primaryReport.latitude,
        ]);

        const horizontalDistance = reportPoint.x - e.point.x;
        const verticalDistance = reportPoint.y - e.point.y;

        return Math.hypot(horizontalDistance, verticalDistance) <= 24;
      });

      if (clickedReportGroup) {
        onReportSelect?.(clickedReportGroup[0]);
        return;
      }

      /**
       * Normal map click:
       * create/update selected location in parent.
       *
       * The RED marker is handled separately by the parent
       * selectedLocation effect.
       */
      const { lng, lat } = e.lngLat;

      const nearestCity = findNearestCity(lat, lng, indonesiaLocations);

      const city = `${nearestCity.name}, ${nearestCity.province}`;

      console.log("[MobileRiskMap] Selecting location:", {
        latitude: lat,
        longitude: lng,
        city,
      });

      onLocationSelect({
        latitude: lat,
        longitude: lng,
        city,
      });
    };

    map.on("click", handleMapClick);

    return () => {
      console.log("[MobileRiskMap] Removing map click handler");

      map.off("click", handleMapClick);
    };
  }, [ctx.map, isMapReady, onLocationSelect, onReportSelect, reportGroups]);

  return null;
}

export default function MobileRiskMap({
  location,
  stableLocation,
  reports,
  selectedLocation,
  onLocationSelect,
  onReportSelect,
  renderSheetContent,
}: MobileRiskMapProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  /**
   * Main MapLibre instance.
   *
   * This ref must remain stable and should not be recreated
   * because of GPS/location state changes.
   */
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  /**
   * BLUE user marker.
   */
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  /**
   * RED selected-location marker.
   */
  const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);

  /**
   * Report markers.
   */
  const reportMarkersRef = useRef<maplibregl.Marker[]>([]);

  /**
   * Prevent initial auto-location from running repeatedly.
   */
  const initialLocateKeyRef = useRef<string | null>(null);

  /**
   * Track selected marker location.
   *
   * Prevents duplicate marker recreation when parent renders again
   * with exactly the same coordinates.
   */
  const selectedLocationKeyRef = useRef<string | null>(null);

  const mountedRef = useRef(false);

  const [collapsedY, setCollapsedY] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);
  const [aqiRadius, setAqiRadius] = useState(1000);

  const y = useMotionValue(0);

  const dragControls = useDragControls();

  /**
   * Keep stable coordinates in a ref.
   *
   * This allows callbacks to access the newest GPS coordinate
   * without changing callback identity.
   */
  const stableCoordsRef = useRef<{
    latitude: number | null;
    longitude: number | null;
    city: string;
  }>({
    latitude: stableLocation.latitude,
    longitude: stableLocation.longitude,
    city: stableLocation.city,
  });

  useEffect(() => {
    stableCoordsRef.current = {
      latitude: stableLocation.latitude,
      longitude: stableLocation.longitude,
      city: stableLocation.city,
    };
  }, [stableLocation.latitude, stableLocation.longitude, stableLocation.city]);

  /**
   * Component mounted state.
   */
  useEffect(() => {
    mountedRef.current = true;

    console.log("[MobileRiskMap] Component mounted");

    return () => {
      console.log("[MobileRiskMap] Component unmounted");

      mountedRef.current = false;

      /**
       * Remove BLUE user marker.
       */
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      /**
       * Remove RED selected marker.
       */
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.remove();
        selectedMarkerRef.current = null;
      }

      /**
       * Remove report markers.
       */
      reportMarkersRef.current.forEach((marker) => {
        marker.remove();
      });

      reportMarkersRef.current = [];

      /**
       * Do NOT call map.remove() here.
       *
       * BaseEnvironmentMap owns the MapLibre instance.
       */
      mapInstanceRef.current = null;
    };
  }, []);

  /**
   * Bottom sheet collapse logic.
   */
  useEffect(() => {
    if (!sheetRef.current) {
      return;
    }

    const fullHeight = sheetRef.current.offsetHeight;

    const peek = Math.max(fullHeight - HANDLE_HEIGHT, 0);

    setCollapsedY(peek);
    y.set(peek);
  }, [y]);

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
    (
      _: unknown,
      info: {
        velocity: {
          y: number;
        };
      },
    ) => {
      if (collapsedY === null) {
        return;
      }

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
    if (collapsedY === null) {
      return;
    }

    snapTo(expanded ? collapsedY : 0, !expanded);
  }, [collapsedY, expanded, snapTo]);

  /**
   * Group reports only when reports actually change.
   */
  const reportGroups = useMemo(() => groupNearbyReports(reports), [reports]);

  /**
   * Calculate nearby reports within 5km of user location
   */
  const nearbyReportsCount = useMemo(() => {
    const latitude = location.latitude;
    const longitude = location.longitude;
    
    if (!latitude || !longitude) return 0;
    
    return reports.filter(report => {
      const distance = calculateDistanceKm(
        latitude,
        longitude,
        report.latitude,
        report.longitude
      );
      return distance <= 5;
    }).length;
  }, [reports, location.latitude, location.longitude]);

  /**
   * Create/update REPORT markers.
   *
   * They are independent from:
   * - blue user marker
   * - red selected marker
   */
  useEffect(() => {
    const map = mapInstanceRef.current;

    console.log("[MobileRiskMap] Report marker effect:", {
      reportsCount: reports.length,
      isMapReady,
      mapExists: !!map,
    });

    /**
     * Remove previous report markers.
     */
    reportMarkersRef.current.forEach((marker) => {
      marker.remove();
    });

    reportMarkersRef.current = [];

    if (!map || !isMapReady) {
      console.log("[MobileRiskMap] Report markers skipped - map not ready");

      return;
    }

    console.log("[MobileRiskMap] Creating report markers:", {
      totalReports: reports.length,
      groupCount: reportGroups.length,
    });

    const markers = createReportMarkers(
      reports,
      map,
      onReportSelect,
      reportGroups,
    );

    reportMarkersRef.current = markers;

    console.log("[MobileRiskMap] Report markers created:", markers.length);

    return () => {
      markers.forEach((marker) => {
        marker.remove();
      });

      reportMarkersRef.current = [];
    };
  }, [isMapReady, onReportSelect, reports, reportGroups]);

  /**
   * UNCERTAINTY HEATMAP for automatic AI reports
   */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    const sourceId = "automatic-report-uncertainty";
    const fillLayerId = "automatic-report-uncertainty-fill";
    const lineLayerId = "automatic-report-uncertainty-line";
    const data = createAutomaticReportUncertaintyGeoJson(reports);
    const existingSource = map.getSource(sourceId) as
      | maplibregl.GeoJSONSource
      | undefined;

    if (existingSource) {
      existingSource.setData(data);
    } else {
      map.addSource(sourceId, { type: "geojson", data });
    }

    if (!map.getLayer(fillLayerId)) {
      map.addLayer({
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": "#10b981",
          "fill-opacity": 0.08,
        },
      });
    }

    if (!map.getLayer(lineLayerId)) {
      map.addLayer({
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
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [isMapReady, reports]);

  /**
   * BLUE USER MARKER
   *
   * This effect only updates the marker position.
   *
   * It does NOT recreate the map.
   */
  useEffect(() => {
    const map = mapInstanceRef.current;

    const latitude = stableLocation.latitude;
    const longitude = stableLocation.longitude;

    if (!map || !isMapReady || latitude === null || longitude === null) {
      return;
    }

    if (!mountedRef.current) {
      return;
    }

    createOrUpdateUserMarker(map, userMarkerRef, latitude, longitude);
  }, [isMapReady, stableLocation.latitude, stableLocation.longitude]);

  /**
   * INITIAL AUTO LOCATE
   *
   * Important:
   *
   * - Runs only once for the first valid stable GPS location.
   * - Does NOT run every time GPS changes.
   * - Does NOT call onLocationSelect.
   * - Therefore it does not create a new red marker.
   * - Does not trigger parent location state.
   * - Priority: red marker > blue user dot
   */
  useEffect(() => {
    const map = mapInstanceRef.current;

    const latitude = stableLocation.latitude;
    const longitude = stableLocation.longitude;

    if (!map || !isMapReady || latitude === null || longitude === null) {
      return;
    }

    if (!mountedRef.current) {
      return;
    }

    const locationKey = `${latitude},${longitude}`;

    /**
     * Already performed initial locate.
     */
    if (initialLocateKeyRef.current !== null) {
      return;
    }

    initialLocateKeyRef.current = locationKey;

    console.log("[MobileRiskMap] Initial auto locate:", {
      latitude,
      longitude,
    });

    /**
     * Wait one animation frame so MapLibre has fully rendered.
     */
    requestAnimationFrame(() => {
      if (!mountedRef.current) {
        return;
      }

      if (!mapInstanceRef.current) {
        return;
      }

      mapInstanceRef.current.resize();

      // Only fly to user location if there's no selected marker (red marker)
      // Priority: red marker > blue user dot
      if (!selectedMarkerRef.current) {
        mapInstanceRef.current.flyTo({
          center: [longitude, latitude],
          zoom: 10,
          duration: 1200,
          essential: true,
        });
      }
    });
  }, [isMapReady, stableLocation.latitude, stableLocation.longitude]);

  /**
   * RED SELECTED LOCATION MARKER
   *
   * This is completely separate from the blue user marker.
   *
   * Therefore:
   *
   * Map click
   *   -> parent gets selectedLocation
   *   -> this effect creates RED marker
   *
   * User GPS update
   *   -> blue marker moves
   *   -> red marker remains
   */
  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map || !isMapReady || !selectedLocation) {
      return;
    }

    if (!mountedRef.current) {
      return;
    }

    const { latitude, longitude } = selectedLocation;

    const locationKey = `${latitude},${longitude}`;

    /**
     * Do not recreate the red marker if the selected
     * coordinates are exactly the same.
     */
    if (selectedLocationKeyRef.current === locationKey) {
      return;
    }

    selectedLocationKeyRef.current = locationKey;

    console.log("[MobileRiskMap] New selected location:", {
      latitude,
      longitude,
    });

    /**
     * Remove ONLY the previous RED marker.
     *
     * Blue user marker and report markers are untouched.
     */
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    const selectedMarker = createSelectedLocationMarker(
      latitude,
      longitude,
      map,
    );

    selectedMarkerRef.current = selectedMarker;

    /**
     * Update AQI radius for selected location.
     */
    setAqiRadius(100);

    /**
     * Fly to the clicked/search location.
     */
    map.flyTo({
      center: [longitude, latitude],
      zoom: 10,
      duration: 1200,
      essential: true,
    });
  }, [isMapReady, selectedLocation]);

  /**
   * Reset map to Indonesia-wide view.
   */
  const resetView = useCallback(() => {
    mapInstanceRef.current?.easeTo({
      center: defaultView.center,
      zoom: defaultView.zoom,
      pitch: defaultView.pitch,
      bearing: defaultView.bearing,
      duration: 600,
    });
  }, []);

  /**
   * Go directly to USER location.
   *
   * IMPORTANT:
   * This does NOT call onLocationSelect.
   *
   * Therefore:
   * - does not create red marker
   * - does not change selectedLocation
   * - does not trigger selected-location effect
   * - only moves camera
   */
  const goToUserLocation = useCallback(() => {
    const map = mapInstanceRef.current;

    const { latitude, longitude } = stableCoordsRef.current;

    if (!map || latitude === null || longitude === null) {
      console.log("[MobileRiskMap] User location unavailable");

      return;
    }

    console.log("[MobileRiskMap] Going to user location:", {
      latitude,
      longitude,
    });

    map.flyTo({
      center: [longitude, latitude],
      zoom: 14,
      duration: 1000,
      essential: true,
    });
  }, []);

  /**
   * Map ready callback.
   *
   * Stable identity.
   */
  const handleMapReady = useCallback((map: maplibregl.Map) => {
    if (!mountedRef.current) {
      return;
    }

    console.log("[MobileRiskMap] Map ready");

    mapInstanceRef.current = map;

    setIsMapReady(true);

    /**
     * Update compass bearing.
     */
    const handleRotate = () => {
      if (!mountedRef.current) {
        return;
      }

      setBearing(map.getBearing() ?? 0);
    };

    map.on("rotate", handleRotate);

    /**
     * We intentionally do not return cleanup here because
     * BaseEnvironmentMap owns the map lifecycle.
     *
     * The map is destroyed by BaseEnvironmentMap itself.
     */
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-100">
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
          selectedLocation
            ? {
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }
            : stableLocation.latitude !== null && stableLocation.longitude !== null
              ? {
                  latitude: stableLocation.latitude,
                  longitude: stableLocation.longitude,
                }
              : null
        }
        onMapReady={handleMapReady}
      >
        {(context) => {
          const {
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

          return (
            <>
              {/* ================================
							    TOP LEFT - REPORT COUNT (follows user location)
							================================ */}
              <motion.div
                style={{
                  opacity: controlsOpacity,
                }}
                className="absolute left-3 top-3 z-10 flex flex-col gap-2"
              >
                <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200/80 bg-white/95 dark:bg-neutral-800/95 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-400 shadow-sm backdrop-blur-md">
                  <MapPin className="size-3.5 text-amber-600" />

                  <span>
                    {nearbyReportsCount} laporan · 5 km
                  </span>
                </div>
              </motion.div>

              {/* ================================
							    TOP RIGHT CONTROLS
							================================ */}
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
                          className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600"
                        />

                        <span>AQI Heatmap</span>
                      </label>

                      <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                        <input
                          type="checkbox"
                          checked={showRainRadar}
                          onChange={(e) => setShowRainRadar(e.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                        />

                        <span>Rain Radar</span>
                      </label>

                      <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                        <input
                          type="checkbox"
                          checked={showFireLayer}
                          onChange={(e) => setShowFireLayer(e.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                        />

                        <span>Fire Hotspots</span>
                      </label>

                      <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                        <input
                          type="checkbox"
                          checked={showElevation}
                          onChange={(e) => setShowElevation(e.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                        />

                        <span>Elevation</span>
                      </label>

                      <label className="mb-3 flex cursor-pointer items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-3 text-sm text-neutral-700 dark:text-neutral-400">
                        <input
                          type="checkbox"
                          checked={showMarkers}
                          onChange={(e) => setShowMarkers(e.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded border-neutral-300 dark:border-neutral-600"
                        />

                        <span>Show Stations</span>
                      </label>

                      <p className="mb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-400">
                        Filter AQI Stations
                      </p>

                      <select
                        value={aqiFilter}
                        onChange={(e) =>
                          setAqiFilter(
                            e.target.value as MapContext["aqiFilter"],
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

                {/* Reset */}
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

                {/* User location */}
                <button
                  type="button"
                  onClick={goToUserLocation}
                  className="flex h-9 w-9 items-center justify-center rounded-b-lg transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  aria-label="Ke lokasi saya"
                  title="Ke lokasi saya"
                >
                  <Navigation className="h-4 w-4 text-neutral-700 dark:text-neutral-400" />
                </button>
              </motion.div>

              {/* ================================
							    BOTTOM RIGHT - ZOOM
							================================ */}
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

              {/* ================================
							    AQI LEGEND
							================================ */}
              <motion.div
                style={{
                  opacity: controlsOpacity,
                }}
                className="absolute bottom-24 left-3 z-10 flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/90 p-3 shadow-sm backdrop-blur-sm"
              >
                <h4 className="mb-2 text-xs font-bold text-neutral-800 dark:text-neutral-100">
                  Map Legend
                </h4>

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
                      <span className="h-3 w-3 rounded-full bg-[#00e400] opacity-80" />
                      Good (0-50)
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#ffff00] opacity-80" />
                      Moderate (51-100)
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#ff7e00] opacity-80" />
                      Unhealthy (101-150)
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#ff0000] opacity-80" />
                      Unhealthy (151-200)
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#99004c] opacity-80" />
                      Very Unhealthy (201-300)
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#7e0023] opacity-80" />
                      Hazardous (&gt;300)
                    </div>
                  </div>
                </div>

                {showElevation && <ElevationLegend />}
              </motion.div>

              {/* ================================
							    STABLE MAP CLICK HANDLER
							================================ */}
              <MobileMapClickHandler
                ctx={context}
                isMapReady={isMapReady}
                onLocationSelect={onLocationSelect}
                onReportSelect={onReportSelect}
                reportGroups={reportGroups}
              />
            </>
          );
        }}
      </BaseEnvironmentMap>

      {/* ================================
			    BOTTOM SHEET
			================================ */}
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
        <div className="rounded-t-4xl bg-white dark:bg-neutral-900 shadow-sm">
          {/* Handle */}
          <button
            type="button"
            onPointerDown={startDrag}
            onClick={toggleSheet}
            className="relative flex w-full cursor-grab touch-none flex-col items-center gap-3 py-3 active:cursor-grabbing"
          >
            <div className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />

            {/* Location */}
            <div className="flex w-full items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                <MapPin className="size-3.5 text-neutral-500 dark:text-neutral-400" strokeWidth={2} />

                <span>{selectedLocation?.city || location.city}</span>
              </div>

              {selectedLocation && reports.length > 0 && (
                <>
                  <span className="text-neutral-400 dark:text-neutral-600">•</span>

                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                    {reports.length} laporan
                  </span>
                </>
              )}
            </div>
          </button>

          <motion.div
            style={{
              opacity: contentOpacity,
            }}
            className="max-h-[calc(82vh-80px)] overflow-y-auto bg-neutral-50 dark:bg-neutral-950 px-4"
          >
            <div className="space-y-3 pb-4 pt-2">{renderSheetContent()}</div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
