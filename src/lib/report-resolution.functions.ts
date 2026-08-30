import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import {
	REPORT_RESOLUTION_MAX_DESCRIPTION_LENGTH,
	REPORT_RESOLUTION_MIN_DESCRIPTION_LENGTH,
	type SubmitResolutionValidationInput,
} from "#/types/report-resolution";

function validateReportId(reportId: unknown): string {
	if (typeof reportId !== "string" || !reportId.trim()) {
		throw new Error("ID laporan wajib diisi.");
	}
	return reportId.trim();
}

export const getCommunityReportDetailFn = createServerFn({ method: "GET" })
	.validator((reportId: string) => validateReportId(reportId))
	.handler(async ({ data }) => {
		setResponseHeader("Cache-Control", "no-store");
		const { getCommunityReportDetail } = await import(
			"#/lib/report-resolution.server"
		);
		return getCommunityReportDetail(data);
	});

export const analyzeResolutionEvidenceFn = createServerFn({ method: "POST" })
	.validator((data: { reportId: string; imageDataUrl: string }) => {
		if (!data || typeof data !== "object")
			throw new Error("Input tidak valid.");
		if (typeof data.imageDataUrl !== "string") {
			throw new Error("Foto bukti wajib diisi.");
		}
		return {
			reportId: validateReportId(data.reportId),
			imageDataUrl: data.imageDataUrl,
		};
	})
	.handler(async ({ data }) => {
		setResponseHeader("Cache-Control", "no-store");
		const { analyzeResolutionEvidence } = await import(
			"#/lib/report-resolution.server"
		);
		return analyzeResolutionEvidence(data);
	});

export const submitResolutionValidationFn = createServerFn({ method: "POST" })
	.validator((data: SubmitResolutionValidationInput) => {
		if (!data || typeof data !== "object")
			throw new Error("Input tidak valid.");
		const description = data.description?.replace(/\s+/g, " ").trim();
		if (
			!description ||
			description.length < REPORT_RESOLUTION_MIN_DESCRIPTION_LENGTH ||
			description.length > REPORT_RESOLUTION_MAX_DESCRIPTION_LENGTH
		) {
			throw new Error("Keterangan harus terdiri dari 20–500 karakter.");
		}
		if (
			!Number.isFinite(data.latitude) ||
			data.latitude < -90 ||
			data.latitude > 90 ||
			!Number.isFinite(data.longitude) ||
			data.longitude < -180 ||
			data.longitude > 180
		) {
			throw new Error("Koordinat validator tidak valid.");
		}
		if (typeof data.imageDataUrl !== "string" || !data.imageDataUrl) {
			throw new Error("Foto bukti wajib diisi.");
		}
		if (typeof data.evidenceToken !== "string" || !data.evidenceToken) {
			throw new Error("Bukti belum diperiksa EcoLens.");
		}
		return {
			reportId: validateReportId(data.reportId),
			description,
			imageDataUrl: data.imageDataUrl,
			latitude: data.latitude,
			longitude: data.longitude,
			evidenceToken: data.evidenceToken,
		};
	})
	.handler(async ({ data }) => {
		setResponseHeader("Cache-Control", "no-store");
		const { submitResolutionValidation } = await import(
			"#/lib/report-resolution.server"
		);
		return submitResolutionValidation(data);
	});
