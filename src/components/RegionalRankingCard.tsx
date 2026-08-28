import { ArrowDown, ArrowUp } from "lucide-react";
import type { InsightItem } from "#/components/InsightsPriorityTable";

type RegionalRankingCardProps = {
	insights: InsightItem[];
};

type RegionAgg = {
	rank: number;
	location: string;
	score: number;
	reports: number;
	trend: "up" | "down" | "stable";
};

function aggregateByLocation(insights: InsightItem[]): RegionAgg[] {
	const byLocation = new Map<string, { location: string; score: number; reports: number; trend: "up" | "down" | "stable" }>();

	for (const insight of insights) {
		const loc = insight.locationName.split(",")[0]?.trim() ?? insight.locationName;
		const existing = byLocation.get(loc);
		if (existing) {
			existing.score = Math.max(existing.score, insight.impactScore);
			existing.reports += insight.reportCount;
			if (insight.trend === "up") existing.trend = "up";
		} else {
			byLocation.set(loc, {
				location: loc,
				score: insight.impactScore,
				reports: insight.reportCount,
				trend: insight.trend,
			});
		}
	}

	return [...byLocation.values()]
		.sort((a, b) => b.score - a.score)
		.slice(0, 5)
		.map((item, index) => ({ ...item, rank: index + 1 }));
}

export default function RegionalRankingCard({
	insights,
}: RegionalRankingCardProps) {
	const regions = aggregateByLocation(insights);

	if (regions.length === 0) {
		return (
			<div className="space-y-3">
				<div>
					<h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
						Wilayah dengan dampak tertinggi
					</h2>
					<p className="text-xs text-neutral-500">
						Peringkat wilayah berdasarkan kondisi dan dampak lingkungan
					</p>
				</div>
				<p className="text-xs text-neutral-400">Belum ada data wilayah</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-end justify-between">
				<div>
					<h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
						Wilayah dengan dampak tertinggi
					</h2>

					<p className="text-xs text-neutral-500">
						Peringkat wilayah berdasarkan kondisi dan dampak lingkungan
					</p>
				</div>

				<span className="hidden text-xs text-neutral-400 sm:block">
					14 hari terakhir
				</span>
			</div>

			<div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
				{regions.map((region) => (
					<div
						key={region.location}
						className="flex items-center gap-4 border-b border-neutral-100 px-4 py-4 last:border-b-0 dark:border-neutral-800"
					>
						<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-500 dark:bg-neutral-800">
							{region.rank}
						</div>

						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
								{region.location}
							</p>

							<div className="mt-1 flex items-center gap-3 text-[11px] text-neutral-400">
								<span>{region.reports} laporan</span>

								<span className="flex items-center gap-1">
									{region.trend === "up" ? (
										<>
											<ArrowUp className="size-3 text-red-500" />
											meningkat
										</>
									) : region.trend === "down" ? (
										<>
											<ArrowDown className="size-3 text-emerald-500" />
											menurun
										</>
									) : (
										<>stabil</>
									)}
								</span>
							</div>
						</div>

						<div className="text-right">
							<p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
								{region.score}
							</p>
							<p className="text-[10px] text-neutral-400">impact score</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
