import { ArrowRight, BarChart3, FileText } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { InsightItem } from "#/components/InsightsPriorityTable";

type InsightsLatestCardsProps = {
	insights: InsightItem[];
};

function timeAgo(date: Date): string {
	const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
	if (seconds < 60) return "baru saja";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes} menit lalu`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} jam lalu`;
	const days = Math.floor(hours / 24);
	return `${days} hari lalu`;
}

export default function InsightsLatestCards({
	insights,
}: InsightsLatestCardsProps) {
	const navigate = useNavigate();

	return (
		<div className="flex flex-col space-y-4">
			<div>
				<h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
					Insight terbaru
				</h2>

				<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
					Analisis yang dihasilkan dari perkembangan laporan lingkungan
				</p>
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{insights.slice(0, 6).map((insight) => (
					<button
						key={insight.id}
						type="button"
						onClick={() =>
							navigate({ to: "/dashboard/insights/$insightId", params: { insightId: insight.id } })
						}
						className="group flex flex-col rounded-lg border border-neutral-200 bg-white p-4 text-left transition-all hover:border-sky-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900/50 dark:hover:border-sky-600"
					>
						{/* Header */}
						<div className="flex items-center justify-between">
							<span className="flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
								<FileText className="size-3.5" />
								Analisis lingkungan
							</span>

							<span className="text-[11px] text-neutral-400 dark:text-neutral-500">
								{timeAgo(insight.generatedAt)}
							</span>
						</div>

						{/* Title */}
						<h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-neutral-900 dark:text-neutral-100">
							{insight.title}
						</h3>

						{/* Summary */}
						<p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
							{insight.summary}
						</p>

						{/* Footer */}
						<div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-700">
							<div className="flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
								<BarChart3 className="size-3.5" />
								Score {insight.impactScore}
							</div>

							<span className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 transition-colors group-hover:text-sky-700 dark:text-sky-400 dark:group-hover:text-sky-300">
								Baca
								<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
							</span>
						</div>
					</button>
				))}
			</div>
		</div>
	);
}
