export const REPORT_RESOLUTION_REQUIRED_VALIDATIONS = 2;
export const REPORT_RESOLUTION_MAX_DISTANCE_METERS = 500;
export const REPORT_RESOLUTION_MIN_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1_000;
export const REPORT_RESOLUTION_MIN_DESCRIPTION_LENGTH = 20;
export const REPORT_RESOLUTION_MAX_DESCRIPTION_LENGTH = 500;

export type ReportResolutionBlockCode =
	| "REPORTER_CANNOT_VALIDATE"
	| "ACCOUNT_TOO_NEW"
	| "ALREADY_VALIDATED"
	| "LOCATION_UNAVAILABLE"
	| "REPORT_ALREADY_RESOLVED"
	| "REPORT_NOT_ACTIVE";

export type ReportResolutionValidationView = {
	id: string;
	description: string;
	image: string;
	latitude: number;
	longitude: number;
	distanceMeters: number;
	ecolensSummary: string;
	visionModel: string;
	createdAt: Date | string;
	user: {
		id: string;
		name: string;
		image: string | null;
	};
};

export type ReportResolutionSummary = {
	validCount: number;
	requiredCount: number;
	isResolved: boolean;
	viewerCanValidate: boolean;
	viewerBlockCode: ReportResolutionBlockCode | null;
	viewerBlockReason: string | null;
	validations: ReportResolutionValidationView[];
};

export type AnalyzeResolutionEvidenceInput = {
	reportId: string;
	imageDataUrl: string;
};

export type AnalyzeResolutionEvidenceResult =
	| {
			success: true;
			evidenceToken: string;
			summary: string;
			visionModel: string;
	  }
	| {
			success: false;
			code:
				| "INVALID_IMAGE"
				| "UNSUITABLE_EVIDENCE"
				| "NOT_ELIGIBLE"
				| "RATE_LIMITED"
				| "AI_UNAVAILABLE"
				| "INVALID_RESPONSE";
			message: string;
			guidance?: string;
	  };

export type SubmitResolutionValidationInput = {
	reportId: string;
	description: string;
	imageDataUrl: string;
	latitude: number;
	longitude: number;
	evidenceToken: string;
};

export type SubmitResolutionValidationResult = {
	validationId: string;
	validCount: number;
	requiredCount: number;
	resolved: boolean;
};
