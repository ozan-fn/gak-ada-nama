import * as maplibregl from "maplibre-gl";
import { type ReactNode, useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useUserLocationMarker } from "@/hooks/use-user-marker";
import { useAQIStations } from "@/hooks/useAQIStations";
import { useEnvironmentAlerts } from "@/hooks/useEnvironmentAlerts";
import { useEnvironmentData } from "@/hooks/useEnvironmentData";
import { type FirePoint, useFireData } from "@/hooks/useFireData";
import { usePrecipitationGrid } from "@/hooks/usePrecipitationGrid";
import { useUserLocation } from "@/hooks/useUserLocation";

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
	showFireLayer: boolean;
	setShowFireLayer: (show: boolean) => void;
	showElevation: boolean;
	setShowElevation: (show: boolean) => void;
	firePoints: ReturnType<typeof useFireData>["points"];
	fireLoading: boolean;
	aqiFilter: "all" | "good" | "moderate" | "unhealthy" | "hazardous";
	setAqiFilter: (
		filter: "all" | "good" | "moderate" | "unhealthy" | "hazardous",
	) => void;
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

	// Override fire data (for local area fire data)
	customFireData?: FirePoint[];

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
	customFireData,
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
	const [showFireLayer, setShowFireLayer] = useState(false);
	const [showElevation, setShowElevation] = useState(false);
	const [aqiFilter, setAqiFilter] = useState<
		"all" | "good" | "moderate" | "unhealthy" | "hazardous"
	>("all");
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

	// Fetch fire data for Indonesia (global)
	const { points: globalFirePoints, loading: fireLoading } = useFireData();

	// Use custom fire data if provided (for local area), otherwise use global
	const firePoints = customFireData ?? globalFirePoints;

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
			clickTolerance: 10,
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
		if (
			!map.current ||
			!autoLocateOnMount ||
			!mapLoaded ||
			autoLocateTriggered.current
		)
			return;

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

	// Add / update AQI visualization layers. Uses in-place source updates
	// (setData) instead of removing/re-adding layers, so switching location
	// / filter / markers toggles does not cause visual churn or flicker.
	useEffect(() => {
		if (!map.current || stationsLoading || stations.length === 0) {
			return;
		}

		const mapInstance = map.current;

		// Try to add/update immediately if style is already loaded
		if (mapInstance.isStyleLoaded()) {
			updateAQILayers();
			return;
		}

		// Otherwise wait for style to load (with timeout)
		const timeoutId = setTimeout(() => {
			if (mapInstance.isStyleLoaded()) {
				updateAQILayers();
			}
		}, 3000); // 3 second timeout

		const handleStyleLoad = () => {
			clearTimeout(timeoutId);
			updateAQILayers();
		};

		mapInstance.once("styledata", handleStyleLoad);

		return () => {
			clearTimeout(timeoutId);
			mapInstance.off("styledata", handleStyleLoad);
		};

		function updateAQILayers() {
			if (!mapInstance) return;

			const filteredStations = stations.filter((station) => {
				if (aqiFilter === "all") return true;
				if (aqiFilter === "good") return station.aqi <= 50;
				if (aqiFilter === "moderate")
					return station.aqi > 50 && station.aqi <= 100;
				if (aqiFilter === "unhealthy")
					return station.aqi > 100 && station.aqi <= 200;
				if (aqiFilter === "hazardous") return station.aqi > 200;
				return true;
			});

			const geojson = {
				type: "FeatureCollection",
				features: filteredStations.map((station) => ({
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: [station.longitude, station.latitude],
					},
					properties: { aqi: station.aqi },
				})),
			};

			// Create source + layers once, update in place afterwards.
			if (!mapInstance.getSource("aqi-stations")) {
				mapInstance.addSource("aqi-stations", {
					type: "geojson",
					data: geojson as any,
					cluster: true,
					clusterMaxZoom: 14,
					clusterRadius: 50,
					clusterProperties: {
						max_aqi: ["max", ["get", "aqi"]],
					},
				});

				// Add heatmap layer (pollution gradient visualization)
				mapInstance.addLayer({
					id: "aqi-heatmap",
					type: "heatmap",
					source: "aqi-stations",
					paint: {
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
						"heatmap-intensity": [
							"interpolate",
							["linear"],
							["zoom"],
							0,
							0.5,
							9,
							1.5,
						],
						"heatmap-color": [
							"interpolate",
							["linear"],
							["heatmap-density"],
							0,
							"rgba(0, 0, 0, 0)",
							0.1,
							"rgba(0, 228, 0, 0.4)",
							0.3,
							"rgba(255, 255, 0, 0.5)",
							0.5,
							"rgba(255, 126, 0, 0.6)",
							0.7,
							"rgba(255, 0, 0, 0.7)",
							0.85,
							"rgba(153, 0, 76, 0.8)",
							1,
							"rgba(126, 0, 35, 0.9)",
						],
						"heatmap-radius": [
							"interpolate",
							["linear"],
							["zoom"],
							0,
							40,
							5,
							60,
							9,
							100,
						],
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

				// Clusters layer
				mapInstance.addLayer({
					id: "clusters",
					type: "circle",
					source: "aqi-stations",
					filter: ["has", "point_count"],
					layout: { visibility: showMarkers ? "visible" : "none" },
					paint: {
						"circle-color": [
							"step",
							["get", "max_aqi"],
							"rgba(0, 228, 0, 0.9)",
							50,
							"rgba(255, 255, 0, 0.9)",
							100,
							"rgba(255, 126, 0, 0.9)",
							150,
							"rgba(255, 0, 0, 0.9)",
							200,
							"rgba(153, 0, 76, 0.9)",
							300,
							"rgba(126, 0, 35, 0.9)",
						],
						"circle-radius": [
							"step",
							["get", "point_count"],
							20,
							10,
							30,
							50,
							40,
						],
						"circle-stroke-width": 2,
						"circle-stroke-color": "#ffffff",
					},
				});

				// Cluster count label
				mapInstance.addLayer({
					id: "cluster-count",
					type: "symbol",
					source: "aqi-stations",
					filter: ["has", "point_count"],
					layout: {
						"text-field": "{point_count_abbreviated}",
						"text-size": 12,
						visibility: showMarkers ? "visible" : "none",
					},
					paint: { "text-color": "#000000" },
				});

				// Unclustered point layer
				mapInstance.addLayer({
					id: "unclustered-point",
					type: "circle",
					source: "aqi-stations",
					filter: ["!", ["has", "point_count"]],
					layout: { visibility: showMarkers ? "visible" : "none" },
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
							"rgba(126, 0, 35, 1)",
						],
						"circle-radius": 8,
						"circle-stroke-width": 2,
						"circle-stroke-color": "#fff",
					},
				});

				// Unclustered point AQI label
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
						visibility: showMarkers ? "visible" : "none",
					},
					paint: {
						"text-color": "#333",
						"text-halo-color": "#fff",
						"text-halo-width": 1,
					},
				});
			} else {
				// Source already exists → update data + visibility in place.
				(
					mapInstance.getSource("aqi-stations") as maplibregl.GeoJSONSource
				).setData(geojson as any);
				const visibility = showMarkers ? "visible" : "none";
				for (const id of [
					"clusters",
					"cluster-count",
					"unclustered-point",
					"unclustered-point-label",
				]) {
					if (mapInstance.getLayer(id)) {
						mapInstance.setLayoutProperty(id, "visibility", visibility);
					}
				}
			}

			// Auto-fit bounds ONLY once on first station load
			if (
				autoFitStations &&
				stations.length > 0 &&
				!fitBoundsTriggered.current &&
				!autoLocateOnMount
			) {
				fitBoundsTriggered.current = true;

				const bounds = new maplibregl.LngLatBounds();
				stations.forEach((station) => {
					bounds.extend([station.longitude, station.latitude]);
				});

				mapInstance.fitBounds(bounds, {
					padding: 100,
					maxZoom: 10,
					duration: 1000,
				});
			}
		}
	}, [
		stations,
		stationsLoading,
		autoFitStations,
		autoLocateOnMount,
		aqiFilter,
		showMarkers,
	]);

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
			const pointsWithRain = precipitationPoints.filter(
				(p) => p.precipitation > 0,
			);

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

			console.log(
				"[Precipitation Layer] GeoJSON features:",
				geojson.features.length,
			);

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
						0,
						0.1, // Even 0mm gets small weight for visibility
						0.5,
						0.3, // Light drizzle
						2,
						0.6, // Light rain
						5,
						0.8, // Moderate rain
						10,
						1, // Heavy rain
					],
					// Increase intensity as zoom level increases
					"heatmap-intensity": [
						"interpolate",
						["linear"],
						["zoom"],
						0,
						1,
						9,
						2,
					],
					// Color gradient: blue (light) → dark blue → purple (heavy)
					"heatmap-color": [
						"interpolate",
						["linear"],
						["heatmap-density"],
						0,
						"rgba(0, 0, 0, 0)",
						0.1,
						"rgba(96, 165, 250, 0.3)", // light blue
						0.3,
						"rgba(59, 130, 246, 0.5)", // blue
						0.5,
						"rgba(37, 99, 235, 0.7)", // darker blue
						0.7,
						"rgba(30, 64, 175, 0.85)", // dark blue
						1,
						"rgba(124, 58, 237, 1)", // purple
					],
					// Radius of each point's influence (larger for better visibility)
					"heatmap-radius": [
						"interpolate",
						["linear"],
						["zoom"],
						0,
						30,
						5,
						60,
						9,
						100,
					],
					// Overall layer opacity controlled by toggle
					"heatmap-opacity": showRainRadar ? 0.85 : 0,
				},
			});

			console.log("[Precipitation Layer] Heatmap layer added successfully");
		}
	}, [precipitationPoints, showRainRadar]);

	// Add Fire Hotspots Heatmap visualization layer
	useEffect(() => {
		if (!map.current || fireLoading) {
			console.log("[Fire Layer] Waiting for map or fire data...", {
				mapReady: !!map.current,
				fireLoading,
			});
			return;
		}

		const mapInstance = map.current;

		// Try to add layer immediately if style is already loaded
		if (mapInstance.isStyleLoaded()) {
			addFireLayer();
			return;
		}

		// Otherwise wait for style to load (with timeout)
		const timeoutId = setTimeout(() => {
			if (mapInstance.isStyleLoaded()) {
				addFireLayer();
			}
		}, 3000);

		const handleStyleLoad = () => {
			clearTimeout(timeoutId);
			addFireLayer();
		};

		mapInstance.once("styledata", handleStyleLoad);

		return () => {
			clearTimeout(timeoutId);
			mapInstance.off("styledata", handleStyleLoad);
		};

		function addFireLayer() {
			if (!mapInstance) return;

			console.log("[Fire Layer] Starting fire layer rendering...");
			console.log(
				"[Fire Layer] Total fire points available:",
				firePoints.length,
			);

			// Remove existing layers if any
			if (mapInstance.getLayer("fire-heatmap")) {
				mapInstance.removeLayer("fire-heatmap");
				console.log("[Fire Layer] Removed existing fire-heatmap layer");
			}
			if (mapInstance.getSource("fire-source")) {
				mapInstance.removeSource("fire-source");
				console.log("[Fire Layer] Removed existing fire-source");
			}

			// If no fire data, don't add any layer
			if (firePoints.length === 0) {
				console.log("[Fire Layer] ℹ️ No fire points to display");
				return;
			}

			// Convert fire points to GeoJSON
			const geojson = {
				type: "FeatureCollection" as const,
				features: firePoints.map((point) => ({
					type: "Feature" as const,
					geometry: {
						type: "Point" as const,
						coordinates: [point.lon, point.lat],
					},
					properties: {
						brightness: point.brightness,
						confidence: point.confidence,
						frp: point.frp,
					},
				})),
			};

			console.log(
				"[Fire Layer] 🔥 GeoJSON features created:",
				geojson.features.length,
			);
			console.log("[Fire Layer] 🔥 Sample fire point:", {
				coords: geojson.features[0]?.geometry.coordinates,
				props: geojson.features[0]?.properties,
			});

			// Add fire data source
			mapInstance.addSource("fire-source", {
				type: "geojson",
				data: geojson,
			});

			// Add fire points as precise circles (like NASA FIRMS)
			mapInstance.addLayer({
				id: "fire-heatmap",
				type: "circle",
				source: "fire-source",
				paint: {
					// Color based on confidence level
					"circle-color": [
						"case",
						[">=", ["get", "confidence"], 80],
						"#dc2626", // High confidence (red)
						[">=", ["get", "confidence"], 65],
						"#f97316", // Medium-high confidence (orange)
						"#fbbf24", // Medium confidence (yellow)
					],
					// Small precise circles
					"circle-radius": [
						"interpolate",
						["linear"],
						["zoom"],
						0,
						1, // Far zoom: tiny dots
						5,
						2, // Medium zoom: visible dots
						9,
						4, // Close zoom: clear circles
						12,
						6, // Very close: larger circles
					],
					// Slight opacity for overlapping fires
					"circle-opacity": showFireLayer ? 0.8 : 0,
					// Bright stroke for visibility
					"circle-stroke-width": [
						"interpolate",
						["linear"],
						["zoom"],
						0,
						0,
						5,
						0.5,
						9,
						1,
					],
					"circle-stroke-color": "#ffffff",
					"circle-stroke-opacity": showFireLayer ? 0.6 : 0,
				},
			});

			console.log(
				"[Fire Layer] ✅ Fire circle markers layer added successfully",
			);
			console.log(
				"[Fire Layer] Visualization: Precise circles (like NASA FIRMS)",
			);
			console.log(
				"[Fire Layer] Layer visibility:",
				showFireLayer ? "visible" : "hidden",
			);
		}
	}, [firePoints, fireLoading, showFireLayer]);

	const handleZoom = (delta: number) => {
		if (!map.current) return;
		map.current.zoomTo(map.current.getZoom() + delta);
	};

	// Add elevation hillshade layer (AWS Open Data terrarium DEM tiles)
	useEffect(() => {
		if (!map.current || !mapLoaded) return;

		const mapInstance = map.current;

		const removeElevation = () => {
			if (mapInstance.getLayer("terrain-relief")) {
				mapInstance.removeLayer("terrain-relief");
			}
			if (mapInstance.getLayer("terrain-hillshade")) {
				mapInstance.removeLayer("terrain-hillshade");
			}
			if (mapInstance.getSource("terrain-dem")) {
				mapInstance.removeSource("terrain-dem");
			}
			mapInstance.setPaintProperty("osm", "raster-opacity", 1);
		};

		if (!showElevation) {
			if (
				mapInstance.getLayer("terrain-relief") ||
				mapInstance.getLayer("terrain-hillshade") ||
				mapInstance.getSource("terrain-dem")
			) {
				removeElevation();
			}
			return;
		}

		const addElevation = () => {
			if (!mapInstance.isStyleLoaded() || mapInstance.getSource("terrain-dem")) {
				return;
			}

			mapInstance.addSource("terrain-dem", {
				type: "raster-dem",
				tiles: [
					"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
				],
				tileSize: 256,
				maxzoom: 15,
				encoding: "terrarium",
				attribution: "Terrain tiles by Mapzen, hosted on AWS Open Data",
			});

			// Hypsometric tint: vegetation green -> tan -> mountain white.
			// Elevation <= 0 (ocean) maps to transparent so the sea stays visible.
			mapInstance.addLayer(
				{
					id: "terrain-relief",
					type: "color-relief",
					source: "terrain-dem",
					paint: {
						"color-relief-color": [
							"interpolate",
							["linear"],
							["elevation"],
							-10,
							"rgba(0, 0, 0, 0)",
							0,
							"rgba(0, 0, 0, 0)",
							1,
							"rgb(122, 184, 98)",
							150,
							"rgb(196, 207, 94)",
							400,
							"rgb(214, 186, 84)",
							800,
							"rgb(205, 153, 79)",
							1500,
							"rgb(180, 120, 70)",
							2500,
							"rgb(150, 95, 55)",
							4000,
							"rgb(190, 185, 175)",
							5000,
							"rgb(255, 255, 255)",
						],
					},
				},
				"osm",
			);

			// Subtle hillshade on top of the tint for relief depth
			mapInstance.addLayer(
				{
					id: "terrain-hillshade",
					type: "hillshade",
					source: "terrain-dem",
					paint: {
						"hillshade-exaggeration": 0.25,
						"hillshade-shadow-color": "#3b4a4f",
					},
				},
				"osm",
			);

			mapInstance.setPaintProperty("osm", "raster-opacity", 0.55);
		};

		if (mapInstance.isStyleLoaded()) {
			addElevation();
		} else {
			mapInstance.once("styledata", addElevation);
		}
	}, [mapLoaded, showElevation]);

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
		showFireLayer,
		setShowFireLayer,
		showElevation,
		setShowElevation,
		firePoints,
		fireLoading,
		aqiFilter,
		setAqiFilter,
		showMarkers,
		setShowMarkers,
	};

	return (
		<div className="relative h-full w-full bg-white dark:bg-neutral-900">
			<div ref={mapContainer} className="h-full w-full" />
			{children?.(mapContext)}
		</div>
	);
}
