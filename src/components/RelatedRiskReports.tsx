import {
	AlertTriangle,
	Bot,
	ChevronRight,
	FileText,
	MapPin,
} from "lucide-react";
import type { NearbyReportPin } from "./RiskMap";

type RelatedRiskReportsProps = {
	reports?: NearbyReportPin[];
	selectedReport?: NearbyReportPin | null;
	onReportSelect?: (report: NearbyReportPin) => void;
};

const levelLabels = {
	LOW: "Rendah",
	MODERATE: "Moderat",
	HIGH: "Tinggi",
	CRITICAL: "Kritis",
} as const;

const levelStyles = {
	LOW: "bg-emerald-50 text-emerald-700",
	MODERATE: "bg-amber-50 text-amber-700",
	HIGH: "bg-orange-50 text-orange-700",
	CRITICAL: "bg-red-50 text-red-700",
} as const;

export default function RelatedRiskReports({
	reports = [],
	selectedReport,
	onReportSelect,
}: RelatedRiskReportsProps) {
	return (
		<section className="rounded-lg bg-white p-4 shadow-sm">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-start gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
						<FileText className="size-4.5" />
					</div>
					<div>
						<p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
							Sumber laporan
						</p>
						<h3 className="mt-1 text-sm font-semibold text-neutral-900">
							Laporan terkait
						</h3>
					</div>
				</div>
				<span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-semibold text-neutral-600">
					{reports.length} laporan
				</span>
			</div>

			{reports.length > 0 ? (
				<div className="mt-3 space-y-2">
					{reports.slice(0, 5).map((report, index) => {
						const risk = report.riskAssessment?.risk;
						const isSelected = selectedReport?.id === report.id;
						const isAutomatic = report.source === "ENVIRONMENT_MONITOR";

						return (
							<button
								type="button"
								key={report.id}
								onClick={() => onReportSelect?.(report)}
								className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-neutral-100 ${
									isSelected
										? "bg-sky-50 ring-1 ring-inset ring-sky-100"
										: "bg-neutral-50"
								}`}
							>
								<div
									className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold ${
										isSelected
											? "bg-sky-600 text-white"
											: "bg-white text-neutral-600 shadow-sm"
									}`}
								>
									{index + 1}
								</div>
								<div className="min-w-0 flex-1">
									<p className="line-clamp-2 text-xs font-semibold leading-snug text-neutral-800">
										{report.title}
									</p>
									{isAutomatic && (
										<p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-700">
											<Bot className="size-2.5" />
											Terdeteksi otomatis
											{report.sourceConfidence !== null &&
												` · ${Math.round(report.sourceConfidence * 100)}%`}
										</p>
									)}
									<p className="mt-1 flex items-center gap-1 text-[10px] text-neutral-500">
										<MapPin className="size-3" />
										{report.category} · {report.distanceKm.toFixed(1)} km
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-1.5">
									{risk ? (
										<span
											className={`rounded-full px-2 py-1 text-[9px] font-semibold ${levelStyles[risk.level]}`}
										>
											{risk.score} · {levelLabels[risk.level]}
										</span>
									) : (
										<span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-700">
											{report.urgency}
										</span>
									)}
									<ChevronRight className="size-3.5 text-neutral-300" />
								</div>
							</button>
						);
					})}
				</div>
			) : (
				<div className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center">
					<AlertTriangle className="size-5 text-neutral-400" />
					<p className="mt-2 text-xs font-semibold text-neutral-700">
						Belum ada laporan terkait
					</p>
					<p className="mt-1 text-[10px] text-neutral-400">
						Pilih wilayah lain untuk memperluas konteks risiko.
					</p>
				</div>
			)}

			{reports.length > 5 && (
				<p className="mt-2 text-center text-[10px] text-neutral-400">
					+{reports.length - 5} laporan lainnya tetap ditampilkan pada peta
				</p>
			)}
		</section>
	);
}
