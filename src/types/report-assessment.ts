export const RISK_LEVELS = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;

export const RISK_HORIZONS = ["24H", "72H", "7D"] as const;

export const RISK_ASSESSMENT_STATUSES = [
	"COMPLETE",
	"PARTIAL",
	"PENDING",
	"FAILED",
] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];
export type RiskHorizonKey = (typeof RISK_HORIZONS)[number];
export type RiskAssessmentStatus = (typeof RISK_ASSESSMENT_STATUSES)[number];

export type RiskHorizonView = {
	score: number;
	level: RiskLevel;
	summary: string;
};

export type RiskAssessmentView = {
	score: number;
	level: RiskLevel;
	confidence: number;
	summary: string;
	factors: string[];
	potentialImpacts: string[];
	recommendedActions: string[];
	horizons: Record<RiskHorizonKey, RiskHorizonView>;
};

export type ReportRiskContext = {
	id?: string;
	title: string;
	description: string;
	category: string;
	urgency: string;
	locationName: string;
	latitude?: number | null;
	longitude?: number | null;
	ecolensSummary?: string | null;
};

export type NearbyReportRiskContext = {
	id: string;
	title: string;
	description?: string | null;
	category: string;
	urgency: string;
	status: string;
	locationName: string;
	latitude: number;
	longitude: number;
	createdAt: Date | string;
	distanceMeters: number;
};

export type RiskAssessmentErrorCode =
	| "CONFIGURATION"
	| "RATE_LIMITED"
	| "TIMEOUT"
	| "AI_UNAVAILABLE"
	| "INVALID_RESPONSE";

export type AssessReportRiskInput = {
	rateLimitKey: string;
	report: ReportRiskContext;
	nearbyReports: NearbyReportRiskContext[];
	environmentSnapshot: unknown;
};

export type AssessReportRiskResult =
	| {
			success: true;
			risk: RiskAssessmentView;
			model: string;
	  }
	| {
			success: false;
			errorCode: RiskAssessmentErrorCode;
			model: string;
	  };

export type ReportAssessmentSummary = {
	status: RiskAssessmentStatus;
	nearbyReportCount: number;
	incidentClusterId: string | null;
	risk: RiskAssessmentView | null;
	providerErrors: string[];
};

export type CreateReportResult<TReport = unknown> = {
	report: TReport;
	assessment: ReportAssessmentSummary;
};

export type RefreshReportAssessmentResult = ReportAssessmentSummary;
