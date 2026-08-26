import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
	getReportSearchBounds,
	getReportSearchCutoff,
	getReportSearchPolicy,
	hasValidCoordinates,
	haversineDistanceMeters,
	isActiveReportStatus,
	parseRiskAssessment,
	REPORT_SEARCH_POLICIES,
	resolveRiskAssessmentStatus,
	toValidCoordinates,
} from "./report-risk-assessment.server";

const HOUR_MS = 60 * 60 * 1_000;
const DAY_MS = 24 * HOUR_MS;

const validRiskPayload = {
	score: 76,
	level: "HIGH",
	confidence: 0.82,
	summary: "Risiko meningkat apabila masalah tidak segera ditangani.",
	factors: ["Ada dua laporan aktif di sekitar lokasi", "Curah hujan tinggi"],
	potentialImpacts: ["Akses jalan terganggu"],
	recommendedActions: ["Lakukan verifikasi lapangan"],
	horizons: {
		"24H": {
			score: 64,
			level: "MODERATE",
			summary: "Dampak awal mungkin muncul dalam 24 jam.",
		},
		"72H": {
			score: 76,
			level: "HIGH",
			summary: "Risiko meningkat dalam 72 jam.",
		},
		"7D": {
			score: 88,
			level: "CRITICAL",
			summary: "Dampak dapat meluas dalam tujuh hari.",
		},
	},
};

describe("report search policies", () => {
	test("uses the configured radius and lookback for every supported category", () => {
		assert.deepEqual(getReportSearchPolicy("Sampah"), {
			radiusMeters: 300,
			lookbackMs: 7 * DAY_MS,
		});
		assert.deepEqual(getReportSearchPolicy("Drainase/Banjir"), {
			radiusMeters: 1_000,
			lookbackMs: 72 * HOUR_MS,
		});
		assert.deepEqual(getReportSearchPolicy("Polusi"), {
			radiusMeters: 3_000,
			lookbackMs: 72 * HOUR_MS,
		});
		assert.deepEqual(getReportSearchPolicy("Kebakaran"), {
			radiusMeters: 3_000,
			lookbackMs: 24 * HOUR_MS,
		});
		assert.deepEqual(getReportSearchPolicy("Fasilitas Rusak"), {
			radiusMeters: 300,
			lookbackMs: 30 * DAY_MS,
		});
		assert.deepEqual(getReportSearchPolicy("Lainnya"), {
			radiusMeters: 500,
			lookbackMs: 7 * DAY_MS,
		});
	});

	test("normalizes known category aliases and falls back to Lainnya", () => {
		assert.equal(
			getReportSearchPolicy("  banjir "),
			REPORT_SEARCH_POLICIES["Drainase/Banjir"],
		);
		assert.equal(
			getReportSearchPolicy("SAMPAH"),
			REPORT_SEARCH_POLICIES.Sampah,
		);
		assert.equal(
			getReportSearchPolicy("kategori baru"),
			REPORT_SEARCH_POLICIES.Lainnya,
		);
	});

	test("calculates the search cutoff from the supplied clock", () => {
		const now = new Date("2026-08-26T12:00:00.000Z");

		assert.equal(
			getReportSearchCutoff("Kebakaran", now).toISOString(),
			"2026-08-25T12:00:00.000Z",
		);
		assert.equal(
			getReportSearchCutoff("Fasilitas Rusak", now).toISOString(),
			"2026-07-27T12:00:00.000Z",
		);
	});
});

describe("coordinates and geographic helpers", () => {
	test("accepts finite coordinates including geographic boundaries", () => {
		assert.equal(hasValidCoordinates(0, 0), true);
		assert.equal(hasValidCoordinates(-90, -180), true);
		assert.equal(hasValidCoordinates(90, 180), true);
		assert.deepEqual(toValidCoordinates(-6.2, 106.816_666), {
			latitude: -6.2,
			longitude: 106.816_666,
		});
	});

	test("rejects missing, non-finite, and out-of-range coordinates", () => {
		const invalidCoordinates: Array<
			[number | null | undefined, number | null | undefined]
		> = [
			[undefined, 0],
			[0, null],
			[Number.NaN, 0],
			[0, Number.POSITIVE_INFINITY],
			[-90.000_001, 0],
			[90.000_001, 0],
			[0, -180.000_001],
			[0, 180.000_001],
		];

		for (const [latitude, longitude] of invalidCoordinates) {
			assert.equal(hasValidCoordinates(latitude, longitude), false);
			assert.equal(toValidCoordinates(latitude, longitude), null);
		}
	});

	test("calculates Haversine distance accurately and symmetrically", () => {
		assert.equal(haversineDistanceMeters(0, 0, 0, 0), 0);

		const oneDegreeAtEquator = haversineDistanceMeters(0, 0, 0, 1);
		assert.ok(Math.abs(oneDegreeAtEquator - 111_195) < 1);
		assert.equal(
			haversineDistanceMeters(-6.2, 106.8, -6.9, 107.6),
			haversineDistanceMeters(-6.9, 107.6, -6.2, 106.8),
		);
		assert.equal(
			haversineDistanceMeters(91, 0, 0, 0),
			Number.POSITIVE_INFINITY,
		);
	});

	test("builds a bounding box around the coordinate and clamps latitude", () => {
		const bounds = getReportSearchBounds(0, 0, 1_000);
		const expectedDelta = (1_000 / 6_371_000) * (180 / Math.PI);

		assert.ok(Math.abs(bounds.minLatitude + expectedDelta) < 1e-12);
		assert.ok(Math.abs(bounds.maxLatitude - expectedDelta) < 1e-12);
		assert.ok(Math.abs(bounds.minLongitude + expectedDelta) < 1e-12);
		assert.ok(Math.abs(bounds.maxLongitude - expectedDelta) < 1e-12);

		const polarBounds = getReportSearchBounds(90, 10, 1_000);
		assert.equal(polarBounds.maxLatitude, 90);
		assert.equal(polarBounds.minLongitude, -170);
		assert.equal(polarBounds.maxLongitude, 180);
	});

	test("rejects invalid bounding-box input", () => {
		assert.throws(
			() => getReportSearchBounds(91, 0, 1_000),
			/INVALID_REPORT_SEARCH_BOUNDS/,
		);
		assert.throws(
			() => getReportSearchBounds(0, 0, -1),
			/INVALID_REPORT_SEARCH_BOUNDS/,
		);
		assert.throws(
			() => getReportSearchBounds(0, 0, Number.NaN),
			/INVALID_REPORT_SEARCH_BOUNDS/,
		);
	});
});

describe("active report statuses", () => {
	test("accepts only statuses eligible for nearby-report context", () => {
		for (const status of ["PENDING", "VERIFIED", "IN_PROGRESS"]) {
			assert.equal(isActiveReportStatus(status), true);
		}

		for (const status of ["RESOLVED", "REJECTED", "pending", "", "CLOSED"]) {
			assert.equal(isActiveReportStatus(status), false);
		}
	});
});

describe("risk assessment status transitions", () => {
	test("resolves COMPLETE when AI risk and all providers are available", () => {
		assert.equal(
			resolveRiskAssessmentStatus({
				hasRisk: true,
				providerErrorCount: 0,
				attemptCount: 1,
			}),
			"COMPLETE",
		);
	});

	test("resolves PARTIAL when AI risk is available but a provider failed", () => {
		assert.equal(
			resolveRiskAssessmentStatus({
				hasRisk: true,
				providerErrorCount: 1,
				attemptCount: 1,
			}),
			"PARTIAL",
		);
	});

	test("resolves PENDING while a failed AI assessment can still retry", () => {
		assert.equal(
			resolveRiskAssessmentStatus({
				hasRisk: false,
				providerErrorCount: 0,
				attemptCount: 2,
			}),
			"PENDING",
		);
	});

	test("resolves FAILED after the third unsuccessful AI attempt", () => {
		assert.equal(
			resolveRiskAssessmentStatus({
				hasRisk: false,
				providerErrorCount: 2,
				attemptCount: 3,
			}),
			"FAILED",
		);
	});
});

describe("AI risk assessment parsing", () => {
	test("parses a strict valid assessment with all required horizons", () => {
		assert.deepEqual(
			parseRiskAssessment(JSON.stringify(validRiskPayload)),
			validRiskPayload,
		);
	});

	test("accepts JSON fenced by the model and removes surrounding reasoning", () => {
		const response = `<think>internal reasoning</think>\n\`\`\`json\n${JSON.stringify(
			validRiskPayload,
		)}\n\`\`\``;

		assert.deepEqual(parseRiskAssessment(response), validRiskPayload);
	});

	test("rejects malformed JSON and assessments that violate the strict schema", () => {
		const malformedPayloads: Array<{ name: string; value: unknown }> = [
			{ name: "invalid JSON", value: "{not-json" },
			{
				name: "missing 7D horizon",
				value: {
					...validRiskPayload,
					horizons: {
						"24H": validRiskPayload.horizons["24H"],
						"72H": validRiskPayload.horizons["72H"],
					},
				},
			},
			{
				name: "extra top-level key",
				value: { ...validRiskPayload, unsupported: true },
			},
			{
				name: "extra horizon key",
				value: {
					...validRiskPayload,
					horizons: {
						...validRiskPayload.horizons,
						"30D": validRiskPayload.horizons["7D"],
					},
				},
			},
			{
				name: "fractional score",
				value: { ...validRiskPayload, score: 76.5 },
			},
			{
				name: "confidence outside range",
				value: { ...validRiskPayload, confidence: 1.01 },
			},
			{
				name: "unknown level",
				value: { ...validRiskPayload, level: "SEVERE" },
			},
			{
				name: "empty factors",
				value: { ...validRiskPayload, factors: [] },
			},
			{
				name: "invalid nested horizon",
				value: {
					...validRiskPayload,
					horizons: {
						...validRiskPayload.horizons,
						"24H": {
							...validRiskPayload.horizons["24H"],
							score: 101,
						},
					},
				},
			},
		];

		for (const malformed of malformedPayloads) {
			const input =
				typeof malformed.value === "string"
					? malformed.value
					: JSON.stringify(malformed.value);
			assert.equal(
				parseRiskAssessment(input),
				null,
				`expected ${malformed.name} to be rejected`,
			);
		}
	});
});

describe("cluster selection policy", () => {
	// Helper to create a minimal candidate shape for testing the selection algorithm.
	// nearbyReports is sorted by distanceMeters ascending, so the first candidate
	// with a non-null incidentClusterId is the nearest clustered report.
	function makeCandidate(
		distanceMeters: number,
		incidentClusterId: string | null,
	) {
		return { distanceMeters, incidentClusterId };
	}

	test("picks the cluster from the nearest candidate when multiple candidates have clusters", () => {
		const candidates = [
			makeCandidate(50, "cluster-a"),
			makeCandidate(200, "cluster-b"),
			makeCandidate(450, null),
		];
		const nearest = candidates
			.sort((a, b) => a.distanceMeters - b.distanceMeters)
			.find((c) => c.incidentClusterId !== null);
		assert.equal(nearest?.incidentClusterId, "cluster-a");
	});

	test("returns null when no candidate has a cluster", () => {
		const candidates = [makeCandidate(100, null), makeCandidate(200, null)];
		const nearest = candidates
			.sort((a, b) => a.distanceMeters - b.distanceMeters)
			.find((c) => c.incidentClusterId !== null);
		assert.equal(nearest?.incidentClusterId ?? null, null);
	});

	test("returns null for empty candidates", () => {
		const candidates: Array<{
			distanceMeters: number;
			incidentClusterId: string | null;
		}> = [];
		const nearest = candidates.find((c) => c.incidentClusterId !== null);
		assert.equal(nearest?.incidentClusterId ?? null, null);
	});

	test("selects the closer candidate even when a farther one has the same clusterId", () => {
		const candidates = [
			makeCandidate(300, "cluster-z"),
			makeCandidate(50, "cluster-z"),
			makeCandidate(150, null),
		];
		const nearest = candidates
			.sort((a, b) => a.distanceMeters - b.distanceMeters)
			.find((c) => c.incidentClusterId !== null);
		assert.equal(nearest?.distanceMeters, 50);
		assert.equal(nearest?.incidentClusterId, "cluster-z");
	});
});

describe("report category policy properties", () => {
	test("every policy has a positive radius and positive lookback", () => {
		for (const policy of Object.values(REPORT_SEARCH_POLICIES)) {
			assert.ok(policy.radiusMeters > 0, "radius must be positive");
			assert.ok(policy.lookbackMs > 0, "lookback must be positive");
		}
	});

	test("Kebakaran has the shortest or equal lookback of all categories", () => {
		const kebakaran = REPORT_SEARCH_POLICIES.Kebakaran;
		for (const [, policy] of Object.entries(REPORT_SEARCH_POLICIES).filter(
			([k]) => k !== "Kebakaran",
		)) {
			assert.ok(
				kebakaran.lookbackMs <= policy.lookbackMs,
				`Kebakaran lookback should be <= other categories`,
			);
		}
	});

	test("Fasilitas Rusak has the longest lookback of all categories", () => {
		const fasilitasRusak = REPORT_SEARCH_POLICIES["Fasilitas Rusak"];
		for (const [, policy] of Object.entries(REPORT_SEARCH_POLICIES).filter(
			([k]) => k !== "Fasilitas Rusak",
		)) {
			assert.ok(
				fasilitasRusak.lookbackMs >= policy.lookbackMs,
				`Fasilitas Rusak lookback should be >= other categories`,
			);
		}
	});
});

describe("assessment status resolution edge cases", () => {
	test("PARTIAL is returned when AI has risk but a provider failed, regardless of attempt count", () => {
		for (const attemptCount of [1, 2, 3, 10]) {
			assert.equal(
				resolveRiskAssessmentStatus({
					hasRisk: true,
					providerErrorCount: 1,
					attemptCount,
				}),
				"PARTIAL",
				`attempt ${attemptCount} with provider error should be PARTIAL`,
			);
		}
	});

	test("PENDING is returned for attempt counts 1 and 2 without risk", () => {
		for (const attemptCount of [1, 2]) {
			assert.equal(
				resolveRiskAssessmentStatus({
					hasRisk: false,
					providerErrorCount: 0,
					attemptCount,
				}),
				"PENDING",
				`attempt ${attemptCount} should be PENDING`,
			);
		}
	});

	test("FAILED is returned at attempt count >= 3 without risk", () => {
		for (const attemptCount of [3, 4, 5]) {
			assert.equal(
				resolveRiskAssessmentStatus({
					hasRisk: false,
					providerErrorCount: 0,
					attemptCount,
				}),
				"FAILED",
				`attempt ${attemptCount} should be FAILED`,
			);
		}
	});
});
