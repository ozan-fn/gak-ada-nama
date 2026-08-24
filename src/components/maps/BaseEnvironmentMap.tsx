import { useEffect, useRef, useState, type ReactNode } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useUserLocationMarker } from "#/hooks/use-user-marker";
import { useUserLocation } from "#/hooks/useUserLocation";
import { useAQIStations } from "#/hooks/useAQIStations";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { useEnvironmentAlerts } from "#/hooks/useEnvironmentAlerts";
import { usePrecipitationGrid } from "#/hooks/usePrecipitationGrid";

export interface MapContext {
  map: React.MutableRefObject<maplibregl.Map | null>;
  userLocation: ReturnType<typeof useUserLocation>;
  locate: (shouldZoom?: boolean) => void;
  isLocating: boolean;
  envData: ReturnType<typeof useEnvironmentData>;
  alerts: ReturnType<typeof useEnvironmentAlerts>;
  stations: ReturnType<typeof useAQIStations>["stations"];
  stationsLoading: boolean;
  handleZoom: (delta: number) => void;
  showLayers: boolean;
  setShowLayers: (show: boolean) => void;
  showRainRadar: boolean;
  setShowRainRadar: (show: boolean) => void;
  aqiFilter: 'all' | 'good' | 'moderate' | 'unhealthy' | 'hazardous';
  setAqiFilter: (filter: 'all' | 'good' | 'moderate' | 'unhealthy' | 'hazardous') => void;
  showMarkers: boolean;
  setShowMarkers: (show: boolean) => void;
}

interface BaseEnvironmentMapProps {
  // Initial view configuration
  initialCenter?: [number, number];
  initialZoom?: number;
  initialPitch?: number;
  initialBearing?: number;

  // Map bounds
  maxBounds?: [[number, number], [number, number]]; // Lock map to specific area

  // Behavior flags
  autoFitStations?: boolean; // Auto-fit bounds to show all AQI stations
  autoZoomOnLocate?: boolean; // Zoom to user location on locate button click
  autoLocateOnMount?: boolean; // Automatically locate user on map mount
  aqiRadiusKm?: number; // AQI stations search radius in km (default: 1000)

  // Override AQI center location (for search feature)
  aqiCenterLocation?: { latitude: number; longitude: number } | null;

  // Render props pattern - children receive map context
  children?: (context: MapContext) => ReactNode;

  // Callback when map is ready
  onMapReady?: (map: maplibregl.Map) => void;
}

export function BaseEnvironmentMap({
  initialCenter = [118.0, -2.5],
  initialZoom = 4.5,
  initialPitch = 0,
  initialBearing = 0,
  maxBounds,
  autoFitStations = false,
  autoZoomOnLocate = false,
  autoLocateOnMount = false,
  aqiRadiusKm = 1000,
  aqiCenterLocation,
  children,
  onMapReady,
}: BaseEnvironmentMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const mapInitialized = useRef(false);
  const onMapReadyRef = useRef(onMapReady);

  // Update ref when callback changes
  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  const [showLayers, setShowLayers] = useState(false);
  const [showRainRadar, setShowRainRadar] = useState(false);
  const [aqiFilter, setAqiFilter] = useState<'all' | 'good' | 'moderate' | 'unhealthy' | 'hazardous'>('all');
  const [showMarkers, setShowMarkers] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const autoLocateTriggered = useRef(false);
  const fitBoundsTriggered = useRef(false);

  const { locate, isLocating } = useUserLocationMarker(map, autoZoomOnLocate);
  const userLocation = useUserLocation();

  // Fetch environment data and alerts
  const envData = useEnvironmentData(userLocation);
  const alerts = useEnvironmentAlerts(envData);

  // Use override location for AQI if provided (from search), otherwise use user location
  const aqiCenter = aqiCenterLocation || {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
  };

  // Fetch AQI stations for heatmap visualization
  const { stations, loading: stationsLoading } = useAQIStations({
    userLat: aqiCenter.latitude,
    userLon: aqiCenter.longitude,
    radiusKm: aqiRadiusKm,
  });

  // Fetch precipitation grid data around user location
  const { points: precipitationPoints } = usePrecipitationGrid({
    userLat: userLocation.latitude ?? undefined,
    userLon: userLocation.longitude ?? undefined,
    radiusKm: 300, // 300km radius around user
  });

  // Initialize map only once
  useEffect(() => {
    if (mapInitialized.current || !mapContainer.current) return;
    
    mapInitialized.current = true;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: initialCenter,
      zoom: initialZoom,
      pitch: initialPitch,
      bearing: initialBearing,
      maxBounds: maxBounds || [
        [94.5, -11.5],
        [141.5, 6.5],
      ],
      attributionControl: false,
    });

    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left",
    );

    // Set mapLoaded when map is ready
    map.current.on("load", () => {
      setMapLoaded(true);
    });

    // Cleanup on unmount
    return () => {
      map.current?.remove();
      map.current = null;
      mapInitialized.current = false;
    };
  }, [initialCenter, initialZoom, initialPitch, initialBearing, maxBounds]); // Only initialize once

  // Trigger user location detection when map is ready (ONCE only)
  useEffect(() => {
    if (!map.current || !autoLocateOnMount || !mapLoaded || autoLocateTriggered.current) return;
    
    autoLocateTriggered.current = true;
    
    setTimeout(() => {
      locate(false); // Don't zoom, let fitBounds handle it
    }, 500);
    
    if (onMapReadyRef.current && map.current) {
      onMapReadyRef.current(map.current);
    }
  }, [mapLoaded, locate, autoLocateOnMount]);
   
  // Call onMapReady if autoLocateOnMount is false
  useEffect(() => {
    if (!map.current || !mapLoaded || autoLocateOnMount) return;
    
    if (onMapReadyRef.current && map.current) {
      onMapReadyRef.current(map.current);
    }
  }, [mapLoaded, autoLocateOnMount]);

  // Add AQI visualization layer
  useEffect(() => {
    if (!map.current || stationsLoading || stations.length === 0) {
      return;
    }

    const mapInstance = map.current;

    // Try to add layer immediately if style is already loaded
    if (mapInstance.isStyleLoaded()) {
      addAQILayer();
      return;
    }

    // Otherwise wait for style to load (with timeout)
    const timeoutId = setTimeout(() => {
      if (mapInstance.isStyleLoaded()) {
        addAQILayer();
      }
    }, 3000); // 3 second timeout

    const handleStyleLoad = () => {
      clearTimeout(timeoutId);
      addAQILayer();
    };

    mapInstance.once("styledata", handleStyleLoad);

    return () => {
      clearTimeout(timeoutId);
      mapInstance.off("styledata", handleStyleLoad);
    };

    function addAQILayer() {
      if (!mapInstance) return;

      // Remove existing layers if any
      if (mapInstance.getLayer("unclustered-point-label")) mapInstance.removeLayer("unclustered-point-label");
      if (mapInstance.getLayer("unclustered-point")) mapInstance.removeLayer("unclustered-point");
      if (mapInstance.getLayer("cluster-count")) mapInstance.removeLayer("cluster-count");
      if (mapInstance.getLayer("clusters")) mapInstance.removeLayer("clusters");
      if (mapInstance.getLayer("aqi-heatmap")) mapInstance.removeLayer("aqi-heatmap");
      if (mapInstance.getSource("aqi-stations")) mapInstance.removeSource("aqi-stations");

      // Apply Filter
      const filteredStations = stations.filter(station => {
        if (aqiFilter === 'all') return true;
        if (aqiFilter === 'good') return station.aqi <= 50;
        if (aqiFilter === 'moderate') return station.aqi > 50 && station.aqi <= 100;
        if (aqiFilter === 'unhealthy') return station.aqi > 100 && station.aqi <= 200;
        if (aqiFilter === 'hazardous') return station.aqi > 200;
        return true;
      });

      // Create GeoJSON from stations
      const geojson = {
        type: "FeatureCollection",
        features: filteredStations.map((station) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [station.longitude, station.latitude],
          },
          properties: {
            aqi: station.aqi,
          },
        })),
      };

      // Add source
      mapInstance.addSource("aqi-stations", {
        type: "geojson",
        data: geojson as any,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
        clusterProperties: {
          max_aqi: ["max", ["get", "aqi"]]
        }
      });

      // Auto-fit bounds ONLY once on first station load, and ONLY if autoLocateOnMount is false
      if (autoFitStations && stations.length > 0 && !fitBoundsTriggered.current && !autoLocateOnMount) {
        fitBoundsTriggered.current = true;
        
        const bounds = new maplibregl.LngLatBounds();
        stations.forEach((station) => {
          bounds.extend([station.longitude, station.latitude]);
        });

        // Fit map to show all stations with padding
        mapInstance.fitBounds(bounds, {
          padding: 100,
          maxZoom: 10,
          duration: 1000,
        });
      }

      // Add heatmap layer (pollution gradient visualization)
      mapInstance.addLayer({
        id: "aqi-heatmap",
        type: "heatmap",
        source: "aqi-stations",
        paint: {
          // Weight based on AQI value (0-500 scale)
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "aqi"],
            0,
            0,
            50,
            0.2,
            100,
            0.4,
            150,
            0.6,
            200,
            0.8,
            300,
            1,
          ],

          // Intensity increases with zoom level
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.5,
            9,
            1.5,
          ],

          // Color ramp - standard AQI colors
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0, 0, 0, 0)", // Transparent
            0.1,
            "rgba(0, 228, 0, 0.4)", // Good (green)
            0.3,
            "rgba(255, 255, 0, 0.5)", // Moderate (yellow)
            0.5,
            "rgba(255, 126, 0, 0.6)", // Unhealthy for Sensitive (orange)
            0.7,
            "rgba(255, 0, 0, 0.7)", // Unhealthy (red)
            0.85,
            "rgba(153, 0, 76, 0.8)", // Very Unhealthy (purple)
            1,
            "rgba(126, 0, 35, 0.9)", // Hazardous (maroon)
          ],

          // Radius of influence (pollution spread area)
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            40, // Far zoom: larger spread
            5,
            60,
            9,
            100, // Close zoom: more defined areas
          ],

          // Fade opacity at higher zoom levels
          "heatmap-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.8,
            9,
            0.7,
            14,
            0.4,
          ],
        },
      });

      // Add clusters layer
      mapInstance.addLayer({
        id: "clusters",
        type: "circle",
        source: "aqi-stations",
        filter: ["has", "point_count"],
        layout: {
          visibility: showMarkers ? "visible" : "none"
        },
        paint: {
          "circle-color": [
            "step",
            ["get", "max_aqi"],
            "rgba(0, 228, 0, 0.9)", // Good <= 50
            50,
            "rgba(255, 255, 0, 0.9)", // Moderate <= 100
            100,
            "rgba(255, 126, 0, 0.9)", // Unhealthy sensitive <= 150
            150,
            "rgba(255, 0, 0, 0.9)", // Unhealthy <= 200
            200,
            "rgba(153, 0, 76, 0.9)", // Very Unhealthy <= 300
            300,
            "rgba(126, 0, 35, 0.9)" // Hazardous
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            10, // point count 10+
            30,
            50, // point count 50+
            40
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        }
      });

      // Add cluster count label
      mapInstance.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "aqi-stations",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
          visibility: showMarkers ? "visible" : "none"
        },
        paint: {
          "text-color": "#000000"
        }
      });

      // Add unclustered point layer
      mapInstance.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "aqi-stations",
        filter: ["!", ["has", "point_count"]],
        layout: {
          visibility: showMarkers ? "visible" : "none"
        },
        paint: {
          "circle-color": [
            "step",
            ["get", "aqi"],
            "rgba(0, 228, 0, 1)",
            50,
            "rgba(255, 255, 0, 1)",
            100,
            "rgba(255, 126, 0, 1)",
            150,
            "rgba(255, 0, 0, 1)",
            200,
            "rgba(153, 0, 76, 1)",
            300,
            "rgba(126, 0, 35, 1)"
          ],
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff"
        }
      });

      // Add unclustered point AQI label
      mapInstance.addLayer({
        id: "unclustered-point-label",
        type: "symbol",
        source: "aqi-stations",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": "{aqi}",
          "text-size": 10,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
          visibility: showMarkers ? "visible" : "none"
        },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 1
        }
      });
    }
  }, [stations, stationsLoading, autoFitStations, autoLocateOnMount, aqiFilter, showMarkers]);

  // Add Precipitation Heatmap visualization layer
  useEffect(() => {
    if (!map.current || precipitationPoints.length === 0) return;

    const mapInstance = map.current;

    // Try to add layer immediately if style is already loaded
    if (mapInstance.isStyleLoaded()) {
      addPrecipitationLayer();
      return;
    }

    // Otherwise wait for style to load (with timeout)
    const timeoutId = setTimeout(() => {
      if (mapInstance.isStyleLoaded()) {
        addPrecipitationLayer();
      }
    }, 3000);

    const handleStyleLoad = () => {
      clearTimeout(timeoutId);
      addPrecipitationLayer();
    };

    mapInstance.once("styledata", handleStyleLoad);

    return () => {
      clearTimeout(timeoutId);
      mapInstance.off("styledata", handleStyleLoad);
    };

    function addPrecipitationLayer() {
      if (!mapInstance || precipitationPoints.length === 0) return;

      // Remove existing layers if any
      if (mapInstance.getLayer("precipitation-heatmap")) {
        mapInstance.removeLayer("precipitation-heatmap");
      }
      if (mapInstance.getSource("precipitation-source")) {
        mapInstance.removeSource("precipitation-source");
      }

      // Filter to ONLY show points with actual rain (precipitation > 0)
      const pointsWithRain = precipitationPoints.filter(p => p.precipitation > 0);
      
      // If no rain, don't add any layer
      if (pointsWithRain.length === 0) {
        return;
      }

      // Convert ONLY rain points to GeoJSON
      const geojson = {
        type: "FeatureCollection" as const,
        features: pointsWithRain.map((point) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [point.lon, point.lat],
          },
          properties: {
            precipitation: point.precipitation,
          },
        })),
      };

      console.log('[Precipitation Layer] GeoJSON features:', geojson.features.length);

      // Add precipitation data source
      mapInstance.addSource("precipitation-source", {
        type: "geojson",
        data: geojson,
      });

      // Add precipitation heatmap layer (gradient like AQI)
      mapInstance.addLayer({
        id: "precipitation-heatmap",
        type: "heatmap",
        source: "precipitation-source",
        paint: {
          // Weight based on precipitation intensity
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "precipitation"],
            0, 0.1,    // Even 0mm gets small weight for visibility
            0.5, 0.3,  // Light drizzle
            2, 0.6,    // Light rain
            5, 0.8,    // Moderate rain
            10, 1,     // Heavy rain
          ],
          // Increase intensity as zoom level increases
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 1,
            9, 2,
          ],
          // Color gradient: blue (light) → dark blue → purple (heavy)
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0, 0, 0, 0)",
            0.1, "rgba(96, 165, 250, 0.3)",   // light blue
            0.3, "rgba(59, 130, 246, 0.5)",   // blue
            0.5, "rgba(37, 99, 235, 0.7)",    // darker blue
            0.7, "rgba(30, 64, 175, 0.85)",   // dark blue
            1, "rgba(124, 58, 237, 1)",       // purple
          ],
          // Radius of each point's influence (larger for better visibility)
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 30,
            5, 60,
            9, 100,
          ],
          // Overall layer opacity controlled by toggle
          "heatmap-opacity": showRainRadar ? 0.85 : 0,
        },
      });

      console.log('[Precipitation Layer] Heatmap layer added successfully');
    }
  }, [precipitationPoints, showRainRadar]);

  const handleZoom = (delta: number) => {
    if (!map.current) return;
    map.current.zoomTo(map.current.getZoom() + delta);
  };

  const mapContext: MapContext = {
    map,
    userLocation,
    locate,
    isLocating,
    envData,
    alerts,
    stations,
    stationsLoading,
    handleZoom,
    showLayers,
    setShowLayers,
    showRainRadar,
    setShowRainRadar,
    aqiFilter,
    setAqiFilter,
    showMarkers,
    setShowMarkers,
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-white dark:bg-neutral-900">
      <div ref={mapContainer} className="h-full w-full" />
      {children?.(mapContext)}
    </div>
  );
}
