import type {
	AutomaticReportCategory,
	AutomaticReportRegion,
} from "@/config/automatic-report-regions";

export const AUTOMATIC_REPORT_SOURCE = "ENVIRONMENT_MONITOR" as const;
export const FIRE_MIN_CONFIDENCE = 50;
export const FIRE_MAX_AGE_MS = 12 * 60 * 60 * 1_000;
export const FIRE_CLUSTER_DISTANCE_METERS = 1_000;
export const FIRE_CLUSTER_TIME_MS = 60 * 60 * 1_000;
export const POLLUTION_MIN_AQI = 101;
export const POLLUTION_MIN_BASELINE_DELTA = 30;
export const FLOOD_MIN_HOURLY_RAIN_MM = 10;
export const FLOOD_MIN_DAILY_RAIN_MM = 50;

const EARTH_RADIUS_METERS = 6_371_000;
const KM_PER_LATITUDE_DEGREE = 111.32;

export type AutomaticCoordinates = {
	latitude: number;
	longitude: number;
};

export type AutomaticCoordinateSource =
	| "FIRMS_HOTSPOT"
	| "FIRMS_CLUSTER_MEDOID"
	| "MONITORING_GRID_CENTROID";

export type AutomaticFirePoint = AutomaticCoordinates & {
	brightness: number;
	confidence: number;
	frp: number;
	observedAt: Date;
};

export type MonitoringGridCell = {
	id: string;
	center: AutomaticCoordinates;
	accuracyRadiusMeters: number;
};

export type RegionalEnvironmentObservation = {
	observedAt: Date;
	aqiObservedAt?: Date | null;
	weatherObservedAt?: Date | null;
	aqi: number | null;
	baselineAqi: number;
	pm25: number | null;
	pm10: number | null;
	co: number | null;
	aqiStationName?: string | null;
	aqiStationLatitude?: number | null;
	aqiStationLongitude?: number | null;
	temperatureCelsius: number | null;
	humidityPercent: number | null;
	elevationMeters: number | null;
	currentRainMm: number | null;
	dailyRainMm: number | null;
	windSpeedKmh: number | null;
	providerErrors: string[];
};

export type AutomaticReportCandidate = {
	detectorId: "fire-hotspot" | "air-pollution" | "flood-potential";
	category: Extract<
		AutomaticReportCategory,
		"Kebakaran" | "Polusi" | "Drainase/Banjir"
	>;
	urgency: "Sedang" | "Tinggi" | "Sangat Tinggi";
	regionId: string;
	regionName: string;
	coordinates: AutomaticCoordinates;
	coordinateSource: AutomaticCoordinateSource;
	accuracyRadiusMeters: number;
	sourceConfidence: number;
	observedAt: Date;
	spatialKey: string;
	evidence: string[];
	providerErrors: string[];
	facts: Record<string, string | number | boolean | null>;
	fallbackTitle: string;
	fallbackDescription: string;
};

export const AUTOMATIC_DETECTOR_REGISTRY = [
	{ category: "Kebakaran", enabled: true, detectorId: "fire-hotspot" },
	{ category: "Polusi", enabled: true, detectorId: "air-pollution" },
	{
		category: "Drainase/Banjir",
		enabled: true,
		detectorId: "flood-potential",
	},
	{
		category: "Sampah",
		enabled: false,
		detectorId: "waste-provider-required",
	},
	{
		category: "Fasilitas Rusak",
		enabled: false,
		detectorId: "facility-provider-required",
	},
] as const;

function toRadians(value: number) {
	return (value * Math.PI) / 180;
}

export function distanceMeters(
	from: AutomaticCoordinates,
	to: AutomaticCoordinates,
): number {
	const latitudeDelta = toRadians(to.latitude - from.latitude);
	const longitudeDelta = toRadians(to.longitude - from.longitude);
	const startLatitude = toRadians(from.latitude);
	const endLatitude = toRadians(to.latitude);
	const haversine =
		Math.sin(latitudeDelta / 2) ** 2 +
		Math.cos(startLatitude) *
			Math.cos(endLatitude) *
			Math.sin(longitudeDelta / 2) ** 2;

	return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function isValidCoordinates(coordinates: AutomaticCoordinates): boolean {
	return (
		Number.isFinite(coordinates.latitude) &&
		coordinates.latitude >= -90 &&
		coordinates.latitude <= 90 &&
		Number.isFinite(coordinates.longitude) &&
		coordinates.longitude >= -180 &&
		coordinates.longitude <= 180
	);
}

export function isPointInsideRegion(
	coordinates: AutomaticCoordinates,
	region: AutomaticReportRegion,
): boolean {
	return (
		isValidCoordinates(coordinates) &&
		distanceMeters(coordinates, region.center) <= region.radiusKm * 1_000
	);
}

export function createMonitoringGrid(
	region: AutomaticReportRegion,
): MonitoringGridCell[] {
	const longitudeKmPerDegree =
		KM_PER_LATITUDE_DEGREE * Math.cos(toRadians(region.center.latitude));
	const latitudeStep = region.gridSizeKm / KM_PER_LATITUDE_DEGREE;
	const longitudeStep = region.gridSizeKm / longitudeKmPerDegree;
	const stepCount = Math.ceil(region.radiusKm / region.gridSizeKm);
	const accuracyRadiusMeters = Math.ceil(
		(region.gridSizeKm * Math.SQRT2 * 1_000) / 2,
	);
	const cells: MonitoringGridCell[] = [];

	for (let row = -stepCount; row <= stepCount; row += 1) {
		for (let column = -stepCount; column <= stepCount; column += 1) {
			const center = {
				latitude: region.center.latitude + row * latitudeStep,
				longitude: region.center.longitude + column * longitudeStep,
			};

			if (!isPointInsideRegion(center, region)) continue;

			cells.push({
				id: `${row + stepCount}-${column + stepCount}`,
				center,
				accuracyRadiusMeters,
			});
		}
	}

	return cells;
}

function clusterFirePoints(points: AutomaticFirePoint[]) {
	const remaining = new Set(points.map((_, index) => index));
	const clusters: AutomaticFirePoint[][] = [];

	while (remaining.size > 0) {
		const firstIndex = remaining.values().next().value as number;
		remaining.delete(firstIndex);
		const queue = [firstIndex];
		const cluster: AutomaticFirePoint[] = [];

		while (queue.length > 0) {
			const currentIndex = queue.shift();
			if (currentIndex === undefined) continue;
			const current = points[currentIndex];
			cluster.push(current);

			for (const candidateIndex of [...remaining]) {
				const candidate = points[candidateIndex];
				const closeInSpace =
					distanceMeters(current, candidate) <= FIRE_CLUSTER_DISTANCE_METERS;
				const closeInTime =
					Math.abs(
						current.observedAt.getTime() - candidate.observedAt.getTime(),
					) <= FIRE_CLUSTER_TIME_MS;

				if (closeInSpace && closeInTime) {
					remaining.delete(candidateIndex);
					queue.push(candidateIndex);
				}
			}
		}

		clusters.push(cluster);
	}

	return clusters;
}

export function selectFireClusterMedoid(
	points: AutomaticFirePoint[],
): AutomaticFirePoint {
	if (points.length === 0) {
		throw new Error("Cluster hotspot tidak boleh kosong");
	}

	return [...points].sort((pointA, pointB) => {
		const distanceA = points.reduce(
			(total, point) => total + distanceMeters(pointA, point),
			0,
		);
		const distanceB = points.reduce(
			(total, point) => total + distanceMeters(pointB, point),
			0,
		);
		return (
			distanceA - distanceB ||
			pointB.confidence - pointA.confidence ||
			pointB.observedAt.getTime() - pointA.observedAt.getTime()
		);
	})[0];
}

export function detectFireCandidates({
	region,
	points,
	now = new Date(),
}: {
	region: AutomaticReportRegion;
	points: AutomaticFirePoint[];
	now?: Date;
}): AutomaticReportCandidate[] {
	if (!region.categories.includes("Kebakaran")) return [];

	const validPoints = points.filter((point) => {
		const age = now.getTime() - point.observedAt.getTime();
		return (
			point.confidence >= FIRE_MIN_CONFIDENCE &&
			age >= -10 * 60 * 1_000 &&
			age <= FIRE_MAX_AGE_MS &&
			isPointInsideRegion(point, region)
		);
	});

	return clusterFirePoints(validPoints).map((cluster) => {
		const medoid = selectFireClusterMedoid(cluster);
		const observedAt = cluster.reduce(
			(latest, point) =>
				point.observedAt > latest ? point.observedAt : latest,
			cluster[0].observedAt,
		);
		const confidence = Math.max(...cluster.map((point) => point.confidence));
		const accuracyRadiusMeters = Math.ceil(
			Math.max(500, ...cluster.map((point) => distanceMeters(medoid, point))),
		);
		const coordinateSource =
			cluster.length === 1 ? "FIRMS_HOTSPOT" : "FIRMS_CLUSTER_MEDOID";
		const spatialKey = `${medoid.latitude.toFixed(3)}:${medoid.longitude.toFixed(3)}`;

		return {
			detectorId: "fire-hotspot",
			category: "Kebakaran",
			urgency:
				confidence >= 85 || medoid.frp >= 20
					? "Sangat Tinggi"
					: confidence >= 70 || medoid.frp >= 10
						? "Tinggi"
						: "Sedang",
			regionId: region.id,
			regionName: region.name,
			coordinates: {
				latitude: medoid.latitude,
				longitude: medoid.longitude,
			},
			coordinateSource,
			accuracyRadiusMeters,
			sourceConfidence: Math.min(1, confidence / 100),
			observedAt,
			spatialKey,
			evidence: [
				`${cluster.length} hotspot FIRMS terdeteksi`,
				`Confidence tertinggi ${Math.round(confidence)}%`,
				`FRP representatif ${medoid.frp.toFixed(1)} MW`,
			],
			providerErrors: [],
			facts: {
				hotspotCount: cluster.length,
				firmsConfidence: confidence,
				brightness: medoid.brightness,
				frp: medoid.frp,
			},
			fallbackTitle: `Indikasi pembakaran terbuka di ${region.name}`,
			fallbackDescription: `Sistem pemantauan lingkungan mendeteksi ${cluster.length} hotspot FIRMS di ${region.name} dengan confidence tertinggi ${Math.round(confidence)}%. Kondisi ini merupakan indikasi pembakaran terbuka dan memerlukan pemantauan lanjutan.`,
		};
	});
}

export function detectRegionalCandidates({
	region,
	cell,
	observation,
}: {
	region: AutomaticReportRegion;
	cell: MonitoringGridCell;
	observation: RegionalEnvironmentObservation;
}): AutomaticReportCandidate[] {
	if (!isPointInsideRegion(cell.center, region)) return [];

	const candidates: AutomaticReportCandidate[] = [];
	const aqiDelta =
		observation.aqi === null ? null : observation.aqi - observation.baselineAqi;

	if (
		region.categories.includes("Polusi") &&
		observation.aqi !== null &&
		observation.aqi >= POLLUTION_MIN_AQI &&
		aqiDelta !== null &&
		aqiDelta >= POLLUTION_MIN_BASELINE_DELTA
	) {
		const confidence = Math.min(
			0.98,
			0.7 + (observation.aqi - POLLUTION_MIN_AQI) / 500,
		);
		candidates.push({
			detectorId: "air-pollution",
			category: "Polusi",
			urgency:
				observation.aqi >= 201
					? "Sangat Tinggi"
					: observation.aqi >= 151
						? "Tinggi"
						: "Sedang",
			regionId: region.id,
			regionName: region.name,
			coordinates: cell.center,
			coordinateSource: "MONITORING_GRID_CENTROID",
			accuracyRadiusMeters: cell.accuracyRadiusMeters,
			sourceConfidence: confidence,
			observedAt: observation.aqiObservedAt ?? observation.observedAt,
			spatialKey: cell.id,
			evidence: [
				`AQI ${Math.round(observation.aqi)}`,
				`${Math.round(aqiDelta)} poin di atas baseline wilayah`,
				...(observation.pm25 === null
					? []
					: [`PM2.5 ${observation.pm25.toFixed(1)}`]),
			],
			providerErrors: observation.providerErrors,
			facts: {
				aqi: observation.aqi,
				baselineAqi: observation.baselineAqi,
				aqiDelta,
				pm25: observation.pm25,
				pm10: observation.pm10,
				co: observation.co,
				temperatureCelsius: observation.temperatureCelsius,
				humidityPercent: observation.humidityPercent,
				windSpeedKmh: observation.windSpeedKmh,
				elevationMeters: observation.elevationMeters,
				aqiStationName: observation.aqiStationName ?? null,
				aqiStationLatitude: observation.aqiStationLatitude ?? null,
				aqiStationLongitude: observation.aqiStationLongitude ?? null,
			},
			fallbackTitle: `Polusi udara tidak sehat terdeteksi di ${region.name}`,
			fallbackDescription: `Sistem pemantauan lingkungan mendeteksi AQI ${Math.round(observation.aqi)} pada area ${region.name}, atau ${Math.round(aqiDelta)} poin di atas baseline wilayah. Laporan ini menunjukkan anomali kualitas udara regional, bukan lokasi pasti sumber emisi.`,
		});
	}

	const hourlyThresholdReached =
		observation.currentRainMm !== null &&
		observation.currentRainMm >= FLOOD_MIN_HOURLY_RAIN_MM;
	const dailyThresholdReached =
		observation.dailyRainMm !== null &&
		observation.dailyRainMm >= FLOOD_MIN_DAILY_RAIN_MM;

	if (
		region.categories.includes("Drainase/Banjir") &&
		(hourlyThresholdReached || dailyThresholdReached)
	) {
		const rainReference = Math.max(
			observation.currentRainMm ?? 0,
			(observation.dailyRainMm ?? 0) / 5,
		);
		let confidence = Math.min(0.95, 0.65 + rainReference / 200);
		if (observation.elevationMeters === null) confidence -= 0.1;

		candidates.push({
			detectorId: "flood-potential",
			category: "Drainase/Banjir",
			urgency:
				(observation.dailyRainMm ?? 0) >= 100
					? "Sangat Tinggi"
					: (observation.currentRainMm ?? 0) >= 20 ||
							(observation.dailyRainMm ?? 0) >= 75
						? "Tinggi"
						: "Sedang",
			regionId: region.id,
			regionName: region.name,
			coordinates: cell.center,
			coordinateSource: "MONITORING_GRID_CENTROID",
			accuracyRadiusMeters: cell.accuracyRadiusMeters,
			sourceConfidence: Math.max(0.5, confidence),
			observedAt: observation.weatherObservedAt ?? observation.observedAt,
			spatialKey: cell.id,
			evidence: [
				`Hujan terkini ${(observation.currentRainMm ?? 0).toFixed(1)} mm`,
				`Akumulasi harian ${(observation.dailyRainMm ?? 0).toFixed(1)} mm`,
				...(observation.elevationMeters === null
					? ["Data elevasi tidak tersedia"]
					: [`Elevasi ${Math.round(observation.elevationMeters)} mdpl`]),
			],
			providerErrors: observation.providerErrors,
			facts: {
				currentRainMm: observation.currentRainMm,
				dailyRainMm: observation.dailyRainMm,
				elevationMeters: observation.elevationMeters,
				humidityPercent: observation.humidityPercent,
				windSpeedKmh: observation.windSpeedKmh,
			},
			fallbackTitle: `Potensi genangan atau banjir di ${region.name}`,
			fallbackDescription: `Sistem pemantauan lingkungan mendeteksi intensitas hujan yang melewati threshold pada area ${region.name}. Kondisi ini menunjukkan potensi genangan atau banjir regional dan tidak menyatakan bahwa banjir telah dikonfirmasi di seluruh area.`,
		});
	}

	return candidates;
}

export function buildAutomaticDeduplicationKey(
	candidate: AutomaticReportCandidate,
): string {
	const episodeWindowMs =
		candidate.category === "Kebakaran"
			? 24 * 60 * 60 * 1_000
			: 72 * 60 * 60 * 1_000;
	const episode = Math.floor(candidate.observedAt.getTime() / episodeWindowMs);
	return [
		candidate.detectorId,
		candidate.regionId,
		candidate.spatialKey,
		episode,
	].join(":");
}
