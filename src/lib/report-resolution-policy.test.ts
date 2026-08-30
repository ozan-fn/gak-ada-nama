import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	getResolutionBlockCode,
	getResolutionBlockReason,
	hasResolutionQuorum,
	parseResolutionEvidenceAssessment,
} from "#/lib/report-resolution-policy";

const NOW = new Date("2026-08-30T12:00:00.000Z");
const OLD_ACCOUNT = new Date("2026-08-28T12:00:00.000Z");

function eligibility(
	overrides: Partial<Parameters<typeof getResolutionBlockCode>[0]> = {},
) {
	return getResolutionBlockCode({
		reportStatus: "VERIFIED",
		reportUserId: "reporter",
		reportHasCoordinates: true,
		viewerUserId: "validator",
		viewerCreatedAt: OLD_ACCOUNT,
		viewerHasValidated: false,
		now: NOW,
		...overrides,
	});
}

describe("report resolution eligibility", () => {
	test("requires two independent validations to reach quorum", () => {
		assert.equal(hasResolutionQuorum(0), false);
		assert.equal(hasResolutionQuorum(1), false);
		assert.equal(hasResolutionQuorum(2), true);
		assert.equal(hasResolutionQuorum(3), true);
	});

	test("allows an eligible independent validator", () => {
		assert.equal(eligibility(), null);
	});

	test("accepts every active report status", () => {
		for (const reportStatus of ["PENDING", "VERIFIED", "IN_PROGRESS"]) {
			assert.equal(eligibility({ reportStatus }), null);
		}
	});

	test("blocks the reporter, young accounts, duplicates, and missing location", () => {
		assert.equal(
			eligibility({ viewerUserId: "reporter" }),
			"REPORTER_CANNOT_VALIDATE",
		);
		assert.equal(
			eligibility({ viewerCreatedAt: new Date("2026-08-30T11:00:00Z") }),
			"ACCOUNT_TOO_NEW",
		);
		assert.equal(
			eligibility({ viewerHasValidated: true }),
			"ALREADY_VALIDATED",
		);
		assert.equal(
			eligibility({ reportHasCoordinates: false }),
			"LOCATION_UNAVAILABLE",
		);
	});

	test("keeps resolved and rejected reports final", () => {
		assert.equal(
			eligibility({ reportStatus: "RESOLVED" }),
			"REPORT_ALREADY_RESOLVED",
		);
		assert.equal(
			eligibility({ reportStatus: "REJECTED" }),
			"REPORT_NOT_ACTIVE",
		);
	});

	test("provides a user-facing explanation for every blocked state", () => {
		for (const code of [
			"REPORTER_CANNOT_VALIDATE",
			"ACCOUNT_TOO_NEW",
			"ALREADY_VALIDATED",
			"LOCATION_UNAVAILABLE",
			"REPORT_ALREADY_RESOLVED",
			"REPORT_NOT_ACTIVE",
		] as const) {
			assert.ok(getResolutionBlockReason(code));
		}
	});
});

describe("resolution evidence parsing", () => {
	test("accepts a clear and relevant evidence response", () => {
		assert.deepEqual(
			parseResolutionEvidenceAssessment(
				JSON.stringify({
					usable: true,
					summary: "Area terlihat jelas dan relevan dengan laporan awal.",
					rejectionReason: "",
					captureGuidance: "",
				}),
			),
			{
				usable: true,
				summary: "Area terlihat jelas dan relevan dengan laporan awal.",
			},
		);
	});

	test("parses a rejected photo with retake guidance", () => {
		assert.deepEqual(
			parseResolutionEvidenceAssessment(`\`\`\`json
{
  "usable": false,
  "summary": "",
  "rejectionReason": "Foto terlalu gelap.",
  "captureGuidance": "Ambil ulang foto dengan pencahayaan yang cukup."
}
\`\`\``),
			{
				usable: false,
				rejectionReason: "Foto terlalu gelap.",
				captureGuidance: "Ambil ulang foto dengan pencahayaan yang cukup.",
			},
		);
	});

	test("rejects malformed or incomplete model responses", () => {
		assert.equal(parseResolutionEvidenceAssessment("not-json"), null);
		assert.equal(
			parseResolutionEvidenceAssessment('{"usable":true,"summary":""}'),
			null,
		);
		assert.equal(
			parseResolutionEvidenceAssessment(
				'{"usable":false,"rejectionReason":"buram"}',
			),
			null,
		);
	});
});
