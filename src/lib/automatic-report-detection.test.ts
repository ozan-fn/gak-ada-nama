import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	type AutomaticReportRegion,
	validateAutomaticReportRegions,
} from "#/config/automatic-report-regions";
import { isAutomaticReportRequestAuthorized } from "./automatic-report-auth";
import {
	AUTOMATIC_DETECTOR_REGISTRY,
	type AutomaticFirePoint,
	buildAutomaticDeduplicationKey,
	createMonitoringGrid,
	detectFireCandidates,
	detectRegionalCandidates,
	FIRE_MAX_AGE_MS,
	FIRE_MIN_CONFIDENCE,
	FLOOD_MIN_HOURLY_RAIN_MM,
	POLLUTION_MIN_AQI,
	POLLUTION_MIN_BASELINE_DELTA,
	type RegionalEnvironmentObservation,
	selectFireClusterMedoid,
} from "./automatic-report-detection";
import { parseAutomaticReportNarrative } from "./automatic-report-narrative.server";
import { parseFirmsCsv } from "./firms.server";

const region: AutomaticReportRegion = {
	id: "purwokerto",
	name: "Purwokerto, Banyumas",
	enabled: true,
	center: { latitude: -7.424, longitude: 109.239 },
	radiusKm: 25,
	gridSizeKm: 5,
	baselineAqi: 50,
	categories: ["Kebakaran", "Polusi", "Drainase/Banjir"],
};

const now = new Date("2026-08-27T12:00:00.000Z");

function firePoint(
	latitude: number,
	longitude: number,
	confidence = 80,
	observedAt = new Date("2026-08-27T10:00:00.000Z"),
): AutomaticFirePoint {
	return {
		latitude,
		longitude,
		confidence,
		observedAt,
		brightness: 330,
		frp: 12,
	};
}

function observation(
	overrides: Partial<RegionalEnvironmentObservation> = {},
): RegionalEnvironmentObservation {
	return {
		observedAt: now,
		aqi: 80,
		baselineAqi: 50,
		pm25: 20,
		pm10: 30,
		co: 4,
		temperatureCelsius: 29,
		humidityPercent: 75,
		elevationMeters: 80,
		currentRainMm: 0,
		dailyRainMm: 0,
		windSpeedKmh: 8,
		providerErrors: [],
		...overrides,
	};
}

describe("automatic report region configuration", () => {
	test("accepts a valid editable region list", () => {
		assert.deepEqual(validateAutomaticReportRegions([region]), [region]);
	});

	test("rejects duplicate IDs and invalid coordinates", () => {
		assert.throws(
			() => validateAutomaticReportRegions([region, region]),
			/duplikat/,
		);
		assert.throws(
			() =>
				validateAutomaticReportRegions([
					{ ...region, id: "invalid", center: { latitude: 100, longitude: 0 } },
				]),
			/Koordinat/,
		);
	});

	test("creates grid centroids with half-diagonal accuracy radius", () => {
		const cells = createMonitoringGrid(region);
		const center = cells.find(
			(cell) =>
				cell.center.latitude === region.center.latitude &&
				cell.center.longitude === region.center.longitude,
		);
		assert.ok(center);
		assert.equal(center.accuracyRadiusMeters, 3536);
		assert.ok(cells.length > 1);
	});
});

describe("FIRMS coordinate detection", () => {
	test("selects the real medoid from a hotspot cluster", () => {
		const points = [
			firePoint(-7.424, 109.235),
			firePoint(-7.424, 109.239, 82),
			firePoint(-7.424, 109.243),
		];
		assert.equal(selectFireClusterMedoid(points), points[1]);
	});

	test("uses hotspot coordinates directly for a single valid point", () => {
		const point = firePoint(-7.424, 109.239);
		const [candidate] = detectFireCandidates({ region, points: [point], now });
		assert.ok(candidate);
		assert.deepEqual(candidate.coordinates, {
			latitude: point.latitude,
			longitude: point.longitude,
		});
		assert.equal(candidate.coordinateSource, "FIRMS_HOTSPOT");
	});

	test("rejects weak, stale, and out-of-region hotspots", () => {
		const candidates = detectFireCandidates({
			region,
			now,
			points: [
				firePoint(-7.424, 109.239, FIRE_MIN_CONFIDENCE - 1),
				firePoint(
					-7.424,
					109.239,
					80,
					new Date(now.getTime() - FIRE_MAX_AGE_MS - 1),
				),
				firePoint(-6.2, 106.8, 90),
			],
		});
		assert.equal(candidates.length, 0);
	});

	test("parses numeric and categorical FIRMS confidence", () => {
		const csv = [
			"latitude,longitude,bright_ti4,confidence,frp,acq_date,acq_time",
			"-7.424,109.239,330,high,15,2026-08-27,0930",
			"-7.425,109.240,320,72,10,2026-08-27,0945",
		].join("\n");
		const points = parseFirmsCsv(csv);
		assert.equal(points.length, 2);
		assert.equal(points[0].confidence, 90);
		assert.equal(points[1].confidence, 72);
	});
});

describe("regional anomaly detection", () => {
	const centerCell = createMonitoringGrid(region).find(
		(cell) =>
			cell.center.latitude === region.center.latitude &&
			cell.center.longitude === region.center.longitude,
	);
	assert.ok(centerCell);

	test("creates a pollution area report at the grid centroid", () => {
		const candidates = detectRegionalCandidates({
			region,
			cell: centerCell,
			observation: observation({
				aqi: POLLUTION_MIN_AQI,
				baselineAqi: POLLUTION_MIN_AQI - POLLUTION_MIN_BASELINE_DELTA,
			}),
		});
		const pollution = candidates.find((item) => item.category === "Polusi");
		assert.ok(pollution);
		assert.deepEqual(pollution.coordinates, centerCell.center);
		assert.equal(pollution.coordinateSource, "MONITORING_GRID_CENTROID");
	});

	test("does not create pollution below either threshold", () => {
		assert.equal(
			detectRegionalCandidates({
				region,
				cell: centerCell,
				observation: observation({
					aqi: POLLUTION_MIN_AQI - 1,
					baselineAqi: 50,
				}),
			}).filter((item) => item.category === "Polusi").length,
			0,
		);
		assert.equal(
			detectRegionalCandidates({
				region,
				cell: centerCell,
				observation: observation({
					aqi: POLLUTION_MIN_AQI,
					baselineAqi: POLLUTION_MIN_AQI - POLLUTION_MIN_BASELINE_DELTA + 1,
				}),
			}).filter((item) => item.category === "Polusi").length,
			0,
		);
	});

	test("detects flood potential and lowers confidence without elevation", () => {
		const withElevation = detectRegionalCandidates({
			region,
			cell: centerCell,
			observation: observation({
				currentRainMm: FLOOD_MIN_HOURLY_RAIN_MM,
			}),
		}).find((item) => item.category === "Drainase/Banjir");
		const withoutElevation = detectRegionalCandidates({
			region,
			cell: centerCell,
			observation: observation({
				currentRainMm: FLOOD_MIN_HOURLY_RAIN_MM,
				elevationMeters: null,
			}),
		}).find((item) => item.category === "Drainase/Banjir");
		assert.ok(withElevation);
		assert.ok(withoutElevation);
		assert.ok(
			withoutElevation.sourceConfidence < withElevation.sourceConfidence,
		);
	});

	test("keeps unsupported category detectors disabled", () => {
		assert.equal(
			AUTOMATIC_DETECTOR_REGISTRY.find((item) => item.category === "Sampah")
				?.enabled,
			false,
		);
		assert.equal(
			AUTOMATIC_DETECTOR_REGISTRY.find(
				(item) => item.category === "Fasilitas Rusak",
			)?.enabled,
			false,
		);
	});
});

describe("automatic narrative, idempotency, and endpoint auth", () => {
	test("accepts only sensor-grounded narrative fields", () => {
		assert.deepEqual(
			parseAutomaticReportNarrative(
				JSON.stringify({
					title: "Indikasi pembakaran terbuka terdeteksi",
					description:
						"Sistem pemantauan lingkungan mendeteksi hotspot yang memerlukan pemantauan lanjutan.",
				}),
			),
			{
				title: "Indikasi pembakaran terbuka terdeteksi",
				description:
					"Sistem pemantauan lingkungan mendeteksi hotspot yang memerlukan pemantauan lanjutan.",
			},
		);
	});

	test("rejects human claims and attempts to replace coordinates", () => {
		assert.equal(
			parseAutomaticReportNarrative(
				JSON.stringify({
					title: "Asap tercium",
					description:
						"Sistem pemantauan lingkungan dan warga melaporkan bau asap.",
				}),
			),
			null,
		);
		assert.equal(
			parseAutomaticReportNarrative(
				JSON.stringify({
					title: "Polusi terdeteksi",
					description: "Sistem pemantauan lingkungan mendeteksi polusi.",
					latitude: 0,
				}),
			),
			null,
		);
		assert.equal(
			parseAutomaticReportNarrative(
				JSON.stringify({
					title: "Pembakaran sampah",
					description:
						"Sistem pemantauan lingkungan menemukan pembakaran sampah.",
				}),
			),
			null,
		);
		assert.equal(
			parseAutomaticReportNarrative(
				JSON.stringify({
					title: "Kualitas udara memburuk",
					description:
						"Sistem pemantauan lingkungan mencatat kualitas udara yang tidak sehat.",
				}),
			),
			null,
		);
	});

	test("builds stable episode keys and compares secrets exactly", () => {
		const [candidate] = detectFireCandidates({
			region,
			points: [firePoint(-7.424, 109.239)],
			now,
		});
		assert.equal(
			buildAutomaticDeduplicationKey(candidate),
			buildAutomaticDeduplicationKey(candidate),
		);
		assert.equal(
			isAutomaticReportRequestAuthorized("Bearer secret", "secret"),
			true,
		);
		assert.equal(
			isAutomaticReportRequestAuthorized("Bearer wrong", "secret"),
			false,
		);
	});
});
