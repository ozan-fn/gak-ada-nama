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

const levelStyles = {
	LOW: "bg-sky-50 text-sky-700",
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
		<section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
			<div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3.5 sm:px-5">
				<div className="flex items-center gap-2.5">
					<div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-50">
						<FileText className="size-3.5 text-sky-600" />
					</div>
					<div>
						<p className="text-[13px] font-semibold text-neutral-900">
							Laporan terkait
						</p>
						<p className="text-[11px] text-neutral-400">Sumber laporan</p>
					</div>
				</div>
				<span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-medium text-sky-700">
					{reports.length} laporan
				</span>
			</div>

			{reports.length > 0 ? (
				<div className="space-y-1.5 px-4 py-4 sm:px-5">
					{reports.slice(0, 5).map((report, index) => {
						const risk = report.riskAssessment?.risk;
						const isSelected = selectedReport?.id === report.id;
						const isAutomatic = report.source === "ENVIRONMENT_MONITOR";

						return (
							<button
								type="button"
								key={report.id}
								onClick={() => onReportSelect?.(report)}
								className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all ${
									isSelected
										? "bg-sky-50/80 shadow-sm shadow-sky-100/50"
										: "hover:bg-neutral-50/80"
								}`}
							>
								<div
									className={`flex size-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
										isSelected
											? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
											: "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
									}`}
								>
									{index + 1}
								</div>
								<div className="min-w-0 flex-1">
									<p className="line-clamp-2 text-[12px] font-semibold leading-snug text-neutral-900">
										{report.title}
									</p>
									<div className="mt-1.5 flex flex-wrap items-center gap-2">
										{isAutomatic && (
											<span className="inline-flex items-center gap-1 rounded-md bg-sky-100/80 px-1.5 py-0.5 text-[9px] font-medium text-sky-700">
												<Bot className="size-2.5 shrink-0" />
												<span>Auto</span>
												{report.sourceConfidence !== null &&
													` ${Math.round(report.sourceConfidence * 100)}%`}
											</span>
										)}
										<span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
											<MapPin className="size-3 shrink-0" />
											<span>{report.category}</span>
											<span className="text-neutral-400">·</span>
											<span>{report.distanceKm.toFixed(1)} km</span>
										</span>
									</div>
								</div>
								<div className="flex shrink-0 items-center gap-1.5">
									{risk ? (
										<span
											className={`rounded-lg px-2 py-1 text-[10px] font-bold tabular-nums ${levelStyles[risk.level]}`}
										>
											{Math.round(risk.score)}
										</span>
									) : (
										<span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
											{report.urgency}
										</span>
									)}
									<ChevronRight className={`size-3.5 transition-colors ${isSelected ? "text-sky-400" : "text-neutral-300 group-hover:text-neutral-400"}`} />
								</div>
							</button>
						);
					})}
				</div>
			) : (
				<div className="flex flex-col items-center px-6 py-11 text-center">
					<div className="flex size-12 items-center justify-center rounded-full bg-neutral-50">
						<AlertTriangle className="size-5 text-neutral-400" />
					</div>
					<p className="mt-4 text-[13px] font-semibold text-neutral-800">
						Belum ada laporan terkait
					</p>
					<p className="mt-1.5 max-w-65 text-[12px] leading-relaxed text-neutral-500">
						Pilih wilayah lain untuk memperluas konteks risiko.
					</p>
				</div>
			)}

			{reports.length > 5 && (
				<div className="border-t border-neutral-100 px-4 py-3 text-center sm:px-5">
					<p className="text-[11px] text-neutral-500">
						+{reports.length - 5} laporan lainnya tetap ditampilkan pada peta
					</p>
				</div>
			)}
		</section>
	);
}
