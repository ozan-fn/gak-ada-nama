import {
	AlertCircle,
	AlertTriangle,
	Brain,
	CheckCircle2,
	Clock3,
	MapPin,
	MousePointer2,
	ShieldAlert,
	Sparkles,
} from "lucide-react";
import type {
	RiskAssessmentStatus,
	RiskLevel,
} from "#/types/report-assessment";
import type { NearbyReportPin } from "./RiskMap";

type ReportRiskAssessmentProps = {
	report?: NearbyReportPin | null;
	locationName?: string;
	selectionMode?: "location" | "manual";
};

const statusConfig: Record<
	RiskAssessmentStatus,
	{ label: string; className: string }
> = {
	COMPLETE: {
		label: "Analisis lengkap",
		className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
	},
	PARTIAL: {
		label: "Analisis parsial",
		className: "bg-amber-50 text-amber-700 ring-amber-200",
	},
	PENDING: {
		label: "Sedang dianalisis",
		className: "bg-sky-50 text-sky-700 ring-sky-200",
	},
	FAILED: {
		label: "Analisis terkendala",
		className: "bg-red-50 text-red-700 ring-red-200",
	},
};

const levelConfig: Record<
	RiskLevel,
	{
		label: string;
		scoreClassName: string;
		badgeClassName: string;
		dotClassName: string;
	}
> = {
	LOW: {
		label: "Rendah",
		scoreClassName: "text-emerald-600",
		badgeClassName: "bg-emerald-50 text-emerald-700",
		dotClassName: "bg-emerald-500 ring-emerald-100",
	},
	MODERATE: {
		label: "Moderat",
		scoreClassName: "text-amber-600",
		badgeClassName: "bg-amber-50 text-amber-700",
		dotClassName: "bg-amber-500 ring-amber-100",
	},
	HIGH: {
		label: "Tinggi",
		scoreClassName: "text-orange-600",
		badgeClassName: "bg-orange-50 text-orange-700",
		dotClassName: "bg-orange-500 ring-orange-100",
	},
	CRITICAL: {
		label: "Kritis",
		scoreClassName: "text-red-600",
		badgeClassName: "bg-red-50 text-red-700",
		dotClassName: "bg-red-500 ring-red-100",
	},
};

const horizonLabels = {
	"24H": "24 jam",
	"72H": "72 jam",
	"7D": "7 hari",
} as const;

function EmptyAssessment({
	report,
	locationName,
}: {
	report?: NearbyReportPin | null;
	locationName?: string;
}) {
	const assessment = report?.riskAssessment;
	const isFailed = assessment?.status === "FAILED";
	const isPending = assessment?.status === "PENDING";

	return (
		<section className="rounded-lg bg-white p-4 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div>
					<div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
						<Brain className="size-3.5" />
						Assessment AI
					</div>
					<h3 className="mt-2 text-sm font-semibold text-neutral-900">
						Risiko laporan
					</h3>
				</div>
				{assessment && (
					<span
						className={`rounded-full px-2 py-1 text-[9px] font-semibold ring-1 ring-inset ${statusConfig[assessment.status].className}`}
					>
						{statusConfig[assessment.status].label}
					</span>
				)}
			</div>

			<div className="mt-4 flex min-h-28 flex-col items-center justify-center rounded-lg bg-neutral-50 px-5 py-6 text-center">
				<div className="flex size-9 items-center justify-center rounded-full bg-white shadow-sm">
					{isFailed ? (
						<AlertCircle className="size-4.5 text-red-500" />
					) : isPending ? (
						<Clock3 className="size-4.5 text-sky-500" />
					) : (
						<MousePointer2 className="size-4.5 text-neutral-400" />
					)}
				</div>
				<p className="mt-3 text-xs font-semibold text-neutral-800">
					{!report
						? locationName
							? `Belum ada assessment laporan di ${locationName}`
							: "Pilih sebuah wilayah pada peta"
						: isFailed
							? "Assessment laporan belum berhasil"
							: isPending
								? "Assessment laporan sedang diproses"
								: "Laporan ini belum memiliki assessment"}
				</p>
				<p className="mt-1 max-w-xs text-[10px] leading-relaxed text-neutral-500">
					{!report
						? locationName
							? "Tidak ditemukan laporan dengan hasil assessment dalam radius wilayah ini."
							: "Pilih lokasi untuk menampilkan assessment laporan yang tersedia di sekitarnya."
						: "Informasi risiko akan tampil di sini ketika hasil analisis tersedia."}
				</p>
			</div>
		</section>
	);
}

export default function ReportRiskAssessment({
	report,
	locationName,
	selectionMode = "manual",
}: ReportRiskAssessmentProps) {
	const assessment = report?.riskAssessment;
	const risk = assessment?.risk;

	if (!report || !assessment || !risk) {
		return <EmptyAssessment report={report} locationName={locationName} />;
	}

	const level = levelConfig[risk.level];
	const status = statusConfig[assessment.status];
	const confidence = Math.round(risk.confidence * 100);

	return (
		<div className="space-y-3">
			<section className="rounded-lg bg-white p-4 shadow-sm">
				<div className="flex items-start justify-between gap-3">
					<div className="flex min-w-0 items-start gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
							<AlertTriangle className="size-5" />
						</div>
						<div className="min-w-0">
							<p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
								{selectionMode === "location"
									? "Laporan prioritas di lokasi"
									: "Risiko yang dianalisis"}
							</p>
							<h3
								id="report-risk-assessment-title"
								className="mt-1 text-sm font-semibold leading-snug text-neutral-900"
							>
								{report.title}
							</h3>
							<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-500">
								{locationName && (
									<span className="inline-flex items-center gap-1">
										<MapPin className="size-3" />
										{locationName}
									</span>
								)}
								<span
									className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${status.className}`}
								>
									<Clock3 className="size-2.5" />
									{status.label}
								</span>
							</div>
						</div>
					</div>
					<span
						className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${level.badgeClassName}`}
					>
						<ShieldAlert className="size-3" />
						{level.label}
					</span>
				</div>
			</section>

			<section className="rounded-lg bg-white p-4 shadow-sm">
				<div className="flex items-center justify-between gap-3">
					<div>
						<div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
							<Brain className="size-3.5" />
							Kondisi risiko saat ini
						</div>
						<div className="mt-2 flex items-end">
							<span
								className={`font-mono text-4xl font-semibold leading-none tabular-nums ${level.scoreClassName}`}
							>
								{Math.round(risk.score)}
							</span>
							<span className="mb-0.5 ml-1 text-xs text-neutral-400">/100</span>
						</div>
					</div>
					<div className="text-right">
						<p className="text-[9px] uppercase tracking-wide text-neutral-400">
							Keyakinan
						</p>
						<p className="mt-1 text-base font-semibold text-neutral-800">
							{confidence}%
						</p>
					</div>
				</div>
				<p className="mt-3 text-[11px] leading-relaxed text-neutral-600">
					{risk.summary}
				</p>

				{risk.factors.length > 0 && (
					<div className="mt-4 border-t border-neutral-100 pt-3">
						<p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
							Faktor pendukung
						</p>
						<div className="mt-2 space-y-1.5">
							{risk.factors.slice(0, 3).map((factor) => (
								<div
									key={factor}
									className="flex items-start gap-2 text-[10px] leading-relaxed text-neutral-600"
								>
									<span className="mt-1.5 size-1 shrink-0 rounded-full bg-red-400" />
									<span>{factor}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</section>

			<section className="rounded-lg bg-white p-4 shadow-sm">
				<div>
					<p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
						Proyeksi risiko
					</p>
					<h3 className="mt-1 text-sm font-semibold text-neutral-900">
						Jika kondisi berlanjut
					</h3>
				</div>
				<div className="mt-4">
					{Object.entries(horizonLabels).map(([key, label], index) => {
						const horizon = risk.horizons[key as keyof typeof risk.horizons];
						const horizonLevel = levelConfig[horizon.level];

						return (
							<div key={key} className="relative flex gap-3 pb-4 last:pb-0">
								{index < Object.keys(horizonLabels).length - 1 && (
									<span className="absolute bottom-0 left-[5px] top-3 w-px bg-neutral-200" />
								)}
								<span
									className={`relative mt-1 size-3 shrink-0 rounded-full ring-4 ${horizonLevel.dotClassName}`}
								/>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-3">
										<p className="text-xs font-semibold text-neutral-800">
											{label}
										</p>
										<span
											className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${horizonLevel.badgeClassName}`}
										>
											{Math.round(horizon.score)} · {horizonLevel.label}
										</span>
									</div>
									<p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
										{horizon.summary}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</section>

			{risk.potentialImpacts.length > 0 && (
				<section>
					<div className="px-1">
						<p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
							Konsekuensi
						</p>
						<h3 className="mt-1 text-sm font-semibold text-neutral-900">
							Dampak yang diperkirakan
						</h3>
					</div>
					<div className="mt-3 grid gap-2">
						{risk.potentialImpacts.slice(0, 3).map((impact, index) => (
							<div
								key={impact}
								className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm"
							>
								<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
									<AlertTriangle className="size-4" />
								</div>
								<div>
									<p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
										Dampak {String(index + 1).padStart(2, "0")}
									</p>
									<p className="mt-1 text-[11px] leading-relaxed text-neutral-700">
										{impact}
									</p>
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			{risk.recommendedActions.length > 0 && (
				<section className="rounded-lg bg-neutral-900 p-4 text-white shadow-sm">
					<div className="flex items-center gap-2 text-emerald-400">
						<Sparkles className="size-4" />
						<p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
							Rekomendasi Prita
						</p>
					</div>
					<h3 className="mt-2 text-sm font-semibold">
						Langkah yang disarankan
					</h3>
					<p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
						Tindakan prioritas berdasarkan kondisi dan proyeksi laporan ini.
					</p>
					<div className="mt-3 space-y-2">
						{risk.recommendedActions.slice(0, 3).map((action) => (
							<div
								key={action}
								className="flex gap-2.5 rounded-lg bg-white/5 p-2.5 text-[10px] leading-relaxed text-neutral-200"
							>
								<CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
								<span>{action}</span>
							</div>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
