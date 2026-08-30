import {
	REPORT_RESOLUTION_REQUIRED_VALIDATIONS,
	REPORT_RESOLUTION_MIN_ACCOUNT_AGE_MS,
	type ReportResolutionBlockCode,
} from "#/types/report-resolution";

export const RESOLVABLE_REPORT_STATUSES = [
	"PENDING",
	"VERIFIED",
	"IN_PROGRESS",
] as const;

export type ResolutionEligibilityInput = {
	reportStatus: string;
	reportUserId: string;
	reportHasCoordinates: boolean;
	viewerUserId: string;
	viewerCreatedAt: Date;
	viewerHasValidated: boolean;
	now?: Date;
};

export type ResolutionEvidenceAssessment =
	| {
			usable: true;
			summary: string;
	  }
	| {
			usable: false;
			rejectionReason: string;
			captureGuidance: string;
	  };

function cleanJsonText(rawText: string): string {
	let text = rawText
		.trim()
		.replace(/<think>[\s\S]*?<\/think>/gi, "")
		.trim();
	const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (fenceMatch?.[1]) text = fenceMatch[1].trim();

	const firstBrace = text.indexOf("{");
	const lastBrace = text.lastIndexOf("}");
	return firstBrace >= 0 && lastBrace > firstBrace
		? text.slice(firstBrace, lastBrace + 1)
		: text;
}

function boundedText(value: unknown, maxLength: number): string | null {
	if (typeof value !== "string") return null;
	const text = value.replace(/\s+/g, " ").trim();
	return text && text.length <= maxLength ? text : null;
}

export function parseResolutionEvidenceAssessment(
	rawText: string,
): ResolutionEvidenceAssessment | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(cleanJsonText(rawText));
	} catch {
		return null;
	}
	if (!parsed || typeof parsed !== "object") return null;

	const candidate = parsed as Record<string, unknown>;
	if (candidate.usable === true) {
		const summary = boundedText(candidate.summary, 500);
		return summary ? { usable: true, summary } : null;
	}
	if (candidate.usable === false) {
		const rejectionReason = boundedText(candidate.rejectionReason, 300);
		const captureGuidance = boundedText(candidate.captureGuidance, 300);
		return rejectionReason && captureGuidance
			? { usable: false, rejectionReason, captureGuidance }
			: null;
	}
	return null;
}

export function getResolutionBlockCode({
	reportStatus,
	reportUserId,
	reportHasCoordinates,
	viewerUserId,
	viewerCreatedAt,
	viewerHasValidated,
	now = new Date(),
}: ResolutionEligibilityInput): ReportResolutionBlockCode | null {
	if (reportStatus === "RESOLVED") return "REPORT_ALREADY_RESOLVED";
	if (!RESOLVABLE_REPORT_STATUSES.some((status) => status === reportStatus)) {
		return "REPORT_NOT_ACTIVE";
	}
	if (reportUserId === viewerUserId) return "REPORTER_CANNOT_VALIDATE";
	if (!reportHasCoordinates) return "LOCATION_UNAVAILABLE";
	if (
		now.getTime() - viewerCreatedAt.getTime() <
		REPORT_RESOLUTION_MIN_ACCOUNT_AGE_MS
	) {
		return "ACCOUNT_TOO_NEW";
	}
	if (viewerHasValidated) return "ALREADY_VALIDATED";

	return null;
}

export function getResolutionBlockReason(
	code: ReportResolutionBlockCode | null,
): string | null {
	switch (code) {
		case "REPORTER_CANNOT_VALIDATE":
			return "Pelapor tidak dapat memvalidasi laporannya sendiri.";
		case "ACCOUNT_TOO_NEW":
			return "Akun harus berumur minimal 24 jam untuk mengirim validasi.";
		case "ALREADY_VALIDATED":
			return "Kamu sudah mengirim validasi untuk laporan ini.";
		case "LOCATION_UNAVAILABLE":
			return "Validasi tidak tersedia karena laporan tidak memiliki koordinat.";
		case "REPORT_ALREADY_RESOLVED":
			return "Laporan ini sudah dinyatakan selesai oleh komunitas.";
		case "REPORT_NOT_ACTIVE":
			return "Status laporan ini tidak menerima validasi penyelesaian.";
		default:
			return null;
	}
}

export function hasResolutionQuorum(validCount: number): boolean {
	return validCount >= REPORT_RESOLUTION_REQUIRED_VALIDATIONS;
}
