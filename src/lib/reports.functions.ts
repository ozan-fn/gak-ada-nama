import { createServerFn } from "@tanstack/react-start";
import type {
	CreateReportInput,
	CreateReportResult,
	ReportMapPin,
} from "#/lib/reports.server";

export type { CreateReportInput, CreateReportResult, ReportMapPin };

function validateCreateReportInput(data: CreateReportInput): CreateReportInput {
	if (!data.title?.trim()) throw new Error("Judul laporan wajib diisi");
	if (!data.description?.trim())
		throw new Error("Deskripsi laporan wajib diisi");
	if (!data.category?.trim()) throw new Error("Kategori laporan wajib diisi");
	if (!data.locationName?.trim())
		throw new Error("Lokasi kejadian wajib diisi");
	const hasLatitude = data.latitude !== undefined;
	const hasLongitude = data.longitude !== undefined;
	if (hasLatitude !== hasLongitude) {
		throw new Error("Koordinat laporan harus lengkap");
	}
	return data;
}

export const createReportFn = createServerFn({ method: "POST" })
	.validator(validateCreateReportInput)
	.handler(async ({ data }) => {
		const { createHumanReport } = await import("#/lib/reports.server");
		return createHumanReport(data);
	});

export const refreshReportAssessmentFn = createServerFn({ method: "POST" })
	.validator((data: { reportId: string }) => {
		if (!data.reportId?.trim()) throw new Error("ID laporan wajib diisi");
		return { reportId: data.reportId.trim() };
	})
	.handler(async ({ data }) => {
		const { refreshHumanReportAssessment } = await import(
			"#/lib/reports.server"
		);
		return refreshHumanReportAssessment(data.reportId);
	});

export const getMyReportsFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const { getMyReports } = await import("#/lib/reports.server");
		return getMyReports();
	},
);

export const getReportMapPinsFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<ReportMapPin[]> => {
		const { getReportMapPins } = await import("#/lib/reports.server");
		return getReportMapPins();
	},
);

export const getReportByIdFn = createServerFn({ method: "GET" })
	.validator((id: string) => id)
	.handler(async ({ data: id }) => {
		const { getReportById } = await import("#/lib/reports.server");
		return getReportById(id);
	});
