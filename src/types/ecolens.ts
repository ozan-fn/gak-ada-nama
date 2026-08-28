export const ECO_LENS_CATEGORIES = [
	"Sampah",
	"Drainase/Banjir",
	"Polusi",
	"Kebakaran",
	"Fasilitas Rusak",
	"Lainnya",
] as const;

export const ECO_LENS_URGENCIES = [
	"Rendah",
	"Sedang",
	"Tinggi",
	"Sangat Tinggi",
] as const;

export const MAX_ECO_LENS_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_ECO_LENS_LOCATION_LENGTH = 240;

export type EcoLensCategory = (typeof ECO_LENS_CATEGORIES)[number];
export type EcoLensUrgency = (typeof ECO_LENS_URGENCIES)[number];

export type AnalyzeEcoLensInput = {
	imageDataUrl: string;
	location?: string;
};

export type EcoLensAnalysis = {
	category: EcoLensCategory;
	urgency: EcoLensUrgency;
	summary: string;
	suggestedDescription: string;
};

export type AnalyzeEcoLensErrorCode =
	| "INVALID_IMAGE"
	| "UNAUTHORIZED"
	| "CONFIGURATION"
	| "RATE_LIMITED"
	| "AI_UNAVAILABLE"
	| "INVALID_RESPONSE";

export type AnalyzeEcoLensResult =
	| {
			success: true;
			analysis: EcoLensAnalysis;
	  }
	| {
			success: false;
			code: AnalyzeEcoLensErrorCode;
			message: string;
			details?: string;
	  };
