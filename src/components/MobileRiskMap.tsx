import { Compass, Layers, MapPin, Minus, Navigation, Plus } from "lucide-react";
import type * as maplibregl from "maplibre-gl";
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
import { findNearestCity } from "#/lib/geoUtils";
import {
	createReportMarkers,
	createSelectedLocationMarker,
	groupNearbyReports,
} from "#/lib/mapMarkers";
import { BaseEnvironmentMap } from "./maps/BaseEnvironmentMap";
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

// Module-scope constant (stable reference) so BaseEnvironmentMap never re-inits the map
const defaultView = {
	center: [118.0, -2.5] as [number, number],
	zoom: 4.5,
};

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
	const mapInstanceRef = useRef<maplibregl.Map | null>(null);
	const reportMarkersRef = useRef<maplibregl.Marker[]>([]);
	const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);
	const lastLocationKey = useRef<string | null>(null);
	const [collapsedY, setCollapsedY] = useState<number | null>(null);
	const [expanded, setExpanded] = useState(false);
	const [bearing, setBearing] = useState(0);
	const [isMapReady, setIsMapReady] = useState(false);
	const y = useMotionValue(0);
	const dragControls = useDragControls();

	// Bottom sheet collapse logic
	useEffect(() => {
		if (!sheetRef.current) return;
		const fullHeight = sheetRef.current.offsetHeight;
		const peek = Math.max(fullHeight - HANDLE_HEIGHT, 0);
		setCollapsedY(peek);
		y.set(peek);
	}, [y]);

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

	// Compute grouping once per reports change; shared by markers + click handler.
	const reportGroups = useMemo(() => groupNearbyReports(reports), [reports]);

	// Report markers
	useEffect(() => {
		console.log("[MobileRiskMap] Marker effect triggered", {
			reportsCount: reports.length,
			isMapReady,
			mapExists: !!mapInstanceRef.current,
		});

		reportMarkersRef.current.forEach((marker) => {
			marker.remove();
		});
		reportMarkersRef.current = [];

		if (!mapInstanceRef.current || !isMapReady) {
			console.log("[MobileRiskMap] Skipping markers - map not ready");
			return;
		}
		const mapInstance = mapInstanceRef.current;

		console.log("[MobileRiskMap] Creating markers:", {
			totalReports: reports.length,
			groupCount: reportGroups.length,
		});

		const markers = createReportMarkers(
			reports,
			mapInstance,
			onReportSelect,
			reportGroups,
		);
		reportMarkersRef.current = markers;

		console.log("[MobileRiskMap] Total markers created:", markers.length);

		return () => {
			markers.forEach((marker) => {
				marker.remove();
			});
			reportMarkersRef.current = [];
		};
	}, [isMapReady, onReportSelect, reports, reportGroups]);

	// old outer handler disabled - now handled inside via context.map (identical to desktop)
	// kept for reference, inner MobileMapClickHandler does the work

	// Red marker for selected location - prevent effect loops
	useEffect(() => {
		if (!mapInstanceRef.current || !isMapReady || !selectedLocation) return;

		const map = mapInstanceRef.current;
		const { latitude, longitude } = selectedLocation;
		const locationKey = `${latitude},${longitude}`;

		// Skip if same location
		if (lastLocationKey.current === locationKey) {
			console.log("[MobileRiskMap] Skipping - same location key");
			return;
		}

		lastLocationKey.current = locationKey;

		console.log("[MobileRiskMap] Effect run for NEW location:", {
			latitude,
			longitude,
		});

		// Remove old marker FIRST
		if (selectedMarkerRef.current) {
			console.log("[MobileRiskMap] Removing old marker");
			selectedMarkerRef.current.remove();
			selectedMarkerRef.current = null;
		}

		// Create marker
		console.log("[MobileRiskMap] Creating new marker...");
		const selectedMarker = createSelectedLocationMarker(
			latitude,
			longitude,
			map,
		);
		selectedMarkerRef.current = selectedMarker;

		// Fly to location
		map.flyTo({
			center: [longitude, latitude],
			zoom: 10,
			duration: 1500,
		});

		// NO cleanup - let marker persist
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

	const handleMapReady = useCallback((map: maplibregl.Map) => {
		mapInstanceRef.current = map;
		setIsMapReady(true);
		map.on("rotate", () => {
			setBearing(map.getBearing() ?? 0);
		});
	}, []);

	// Module-scope handler component: stable identity so it is not re-mounted
	// (and does not re-register the map click listener) on every parent render.
	function MobileMapClickHandler({
		ctx,
		isMapReady,
		onLocationSelect,
		onReportSelect,
		reportGroups,
	}: {
		ctx: import("./maps/BaseEnvironmentMap").MapContext;
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
			if (!ctx.map.current || !isMapReady || !onLocationSelect) return;
			const handleMapClick = (e: maplibregl.MapMouseEvent) => {
				console.log("[MobileRiskMap] Map clicked at (ctx):", e.lngLat);
				if (e.originalEvent.defaultPrevented) return;
				const t = e.originalEvent.target;
				if (
					t instanceof Element &&
					t.closest(".maplibregl-marker, .maplibregl-popup")
				)
					return;
				const hit = reportGroups.find((g) => {
					const p = ctx.map.current?.project([g[0].longitude, g[0].latitude]);
					if (!p) return false;
					return Math.hypot(p.x - e.point.x, p.y - e.point.y) <= 24;
				});
				if (hit) {
					onReportSelect?.(hit[0]);
					return;
				}
				const { lng, lat } = e.lngLat;
				const nearestCity = findNearestCity(lat, lng, indonesiaLocations);
				console.log("[MobileRiskMap] ctx calling onLocationSelect", {
					lat,
					lng,
					city: `${nearestCity.name}, ${nearestCity.province}`,
				});
				onLocationSelect({
					latitude: lat,
					longitude: lng,
					city: `${nearestCity.name}, ${nearestCity.province}`,
				});
			};
			ctx.map.current.on("click", handleMapClick);
			return () => {
				ctx.map.current?.off("click", handleMapClick);
			};
		}, [ctx.map, isMapReady, onLocationSelect, onReportSelect, reportGroups]);
		return null;
	}

	return (
		<div className="relative h-full w-full overflow-hidden bg-neutral-100">
			<BaseEnvironmentMap
				initialCenter={defaultView.center}
				initialZoom={defaultView.zoom}
				autoFitStations={false}
				autoZoomOnLocate={false}
				autoLocateOnMount={false}
				aqiRadiusKm={1000}
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
						showFireLayer,
						setShowFireLayer,
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
													checked={showFireLayer}
													onChange={(e) => setShowFireLayer(e.target.checked)}
													className="h-4 w-4 rounded border-neutral-300 cursor-pointer"
												/>
												<span>Fire Hotspots</span>
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
