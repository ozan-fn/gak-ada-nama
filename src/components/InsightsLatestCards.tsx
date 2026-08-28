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
		<div className="flex flex-col space-y-3">
			<div>
				<h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
					Insight terbaru
				</h2>

				<p className="text-xs text-neutral-500">
					Analisis yang dihasilkan dari perkembangan laporan lingkungan
				</p>
			</div>

			<div className="flex flex-col gap-3">
				{insights.map((insight) => (
					<button
						key={insight.id}
						type="button"
						onClick={() =>
							navigate({ to: "/dashboard/insights/$insightId", params: { insightId: insight.id } })
						}
						className="group flex flex-col rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 text-left transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:border-neutral-700"
					>
						<div className="flex items-center justify-between">
							<span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
								<FileText className="size-3.5" />
								Analisis lingkungan
							</span>

							<span className="text-[11px] text-neutral-400">
								{timeAgo(insight.generatedAt)}
							</span>
						</div>

						<h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-neutral-900 dark:text-neutral-100">
							{insight.title}
						</h3>

						<p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
							{insight.summary}
						</p>

						<div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-700">
							<div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
								<BarChart3 className="size-3.5" />
								Score {insight.impactScore}
							</div>

							<span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 transition-colors group-hover:text-neutral-900 dark:text-neutral-300 dark:group-hover:text-white">
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
