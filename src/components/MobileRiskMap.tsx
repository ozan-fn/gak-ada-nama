import { Layers, Navigation, Minus, Plus, MapPin, Compass } from "lucide-react";
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
import { BaseEnvironmentMap } from "./maps/BaseEnvironmentMap";
import * as maplibregl from "maplibre-gl";
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
  radiusKm: number;
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

function groupNearbyReports(reports: NearbyReportPin[]): NearbyReportPin[][] {
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
    reportCount > 1
      ? `${reportCount} laporan di lokasi ini`
      : `Laporan: ${title}`;
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

export default function MobileRiskMap({
  location,
  stableLocation,
  reports,
  radiusKm,
  selectedLocation,
  onLocationSelect,
  onReportSelect,
  renderSheetContent,
}: MobileRiskMapProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const reportMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [collapsedY, setCollapsedY] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);
  const y = useMotionValue(0);
  const dragControls = useDragControls();

  const coords = useMemo(
    () => ({ lat: stableLocation.latitude, lng: stableLocation.longitude }),
    [stableLocation.latitude, stableLocation.longitude],
  );

  const center: [number, number] = useMemo(
    () =>
      selectedLocation
        ? [selectedLocation.longitude, selectedLocation.latitude]
        : stableLocation.latitude && stableLocation.longitude
          ? [stableLocation.longitude, stableLocation.latitude]
          : [118.0, -2.5],
    [selectedLocation, stableLocation.latitude, stableLocation.longitude],
  );

  const aqiRadius = useMemo(
    () => (selectedLocation ? 100 : 1000),
    [selectedLocation],
  );

  useEffect(() => {
    if (!sheetRef.current) return;
    
    const updateCollapsedY = () => {
      if (!sheetRef.current) return;
      const fullHeight = sheetRef.current.offsetHeight;
      const peek = Math.max(fullHeight - HANDLE_HEIGHT, 0);
      setCollapsedY(peek);
      if (!expanded) {
        y.set(peek);
      }
    };

    updateCollapsedY();

    const observer = new ResizeObserver(() => {
      updateCollapsedY();
    });

    observer.observe(sheetRef.current);

    return () => {
      observer.disconnect();
    };
  }, [y, expanded]);

  const contentOpacity = useTransform(y, [0, collapsedY ?? 1], [1, 0]);
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

  const handleMapReady = useCallback(
    (mapInstance: maplibregl.Map) => {
      mapInstanceRef.current = mapInstance;
      setIsMapReady(true);

      mapInstance.on("rotate", () => {
        setBearing(mapInstance.getBearing() ?? 0);
      });

      if (!coords.lat || !coords.lng) return;
      if (typeof document === "undefined") return;

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

  useEffect(() => {
    if (!mapInstanceRef.current || !coords.lat || !coords.lng) return;
    if (typeof document === "undefined") return;

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

  // Report markers
  useEffect(() => {
    reportMarkersRef.current.forEach((marker) => {
      marker.remove();
    });
    reportMarkersRef.current = [];

    if (!mapInstanceRef.current || !isMapReady) return;
    const mapInstance = mapInstanceRef.current;

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
  }, [isMapReady, onReportSelect, reports]);

  // Map click handler
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !onLocationSelect) return;

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
          const reportPoint = mapInstanceRef.current?.project([
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
      const { findNearestCity } = require("#/lib/geoUtils");
      const { indonesiaLocations } = require("#/data/indonesia-locations");
      const nearestCity = findNearestCity(lat, lng, indonesiaLocations);

      onLocationSelect({
        latitude: lat,
        longitude: lng,
        city: `${nearestCity.name}, ${nearestCity.province}`,
      });
    };

    mapInstanceRef.current.on("click", handleMapClick);

    return () => {
      mapInstanceRef.current?.off("click", handleMapClick);
    };
  }, [isMapReady, onLocationSelect, onReportSelect, reports]);

  // Fly to selected location
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !selectedLocation) return;

    mapInstanceRef.current.flyTo({
      center: [selectedLocation.longitude, selectedLocation.latitude],
      zoom: 10,
      duration: 1500,
    });
  }, [selectedLocation, isMapReady]);

  const resetView = () => {
    mapInstanceRef.current?.easeTo({
      center: [118.0, -2.5],
      zoom: 4.5,
      pitch: 0,
      bearing: 0,
      duration: 600,
    });
  };

  const goToUserLocation = () => {
    if (
      !mapInstanceRef.current ||
      stableLocation.latitude === null ||
      stableLocation.longitude === null
    ) {
      return;
    }

    if (onLocationSelect) {
      onLocationSelect({
        latitude: stableLocation.latitude,
        longitude: stableLocation.longitude,
        city: stableLocation.city,
      });
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-100">
      <BaseEnvironmentMap
        initialCenter={center}
        initialZoom={selectedLocation ? 10 : 4.5}
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
            aqiFilter,
            setAqiFilter,
            showMarkers,
            setShowMarkers,
          } = context;

          return (
            <>
              {/* Top Left: Report count */}
              <motion.div
                style={{ opacity: controlsOpacity }}
                className="absolute left-3 top-3 z-10 flex flex-col gap-2"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur-md">
                  <MapPin className="size-3.5 text-red-600" />
                  <span>
                    {reports.length} laporan dalam radius {radiusKm} km
                  </span>
                </div>
              </motion.div>

              {/* Top Right Controls */}
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
                        <span>Show Stations</span>
                      </label>

                      <p className="mb-2 text-xs font-semibold text-neutral-700">
                        Filter AQI Stations
                      </p>
                      <select
                        value={aqiFilter}
                        onChange={(e) =>
                          setAqiFilter(e.target.value as typeof aqiFilter)
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
                >
                  <Navigation className="h-4 w-4 text-neutral-700" />
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

              {/* Map Legend */}
              <motion.div
                style={{ opacity: controlsOpacity }}
                className="absolute bottom-24 left-3 z-10 flex flex-col rounded-lg border border-neutral-200 bg-white/90 p-3 shadow-sm backdrop-blur-sm"
              >
                <h4 className="mb-2 text-xs font-bold text-neutral-800">
                  AQI Legend
                </h4>
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
                    Unhealthy (101-150)
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

            {/* Location info */}
            <div className="flex w-full items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                <MapPin className="size-3.5 text-neutral-500" strokeWidth={2} />
                <span>{selectedLocation?.city || location.city}</span>
              </div>

              {selectedLocation && reports.length > 0 && (
                <>
                  <span className="text-neutral-400">•</span>
                  <span className="text-xs font-semibold text-red-600">
                    {reports.length} laporan
                  </span>
                </>
              )}
            </div>
          </button>

          <motion.div
            style={{ opacity: contentOpacity }}
            className="max-h-[calc(82vh-80px)] overflow-y-auto bg-neutral-50 px-4"
          >
            <div className="space-y-3 pb-4 pt-2">{renderSheetContent()}</div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
