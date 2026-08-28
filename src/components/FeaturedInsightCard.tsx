import {
	ArrowRight,
	ArrowUp,
	Clock3,
	MapPin,
	ShieldAlert,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { InsightItem } from "#/components/InsightsPriorityTable";

type FeaturedInsightCardProps = {
	insight: InsightItem;
};

export default function FeaturedInsightCard({
	insight,
}: FeaturedInsightCardProps) {
	const navigate = useNavigate();

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
						Isu paling berdampak
					</h2>

					<p className="text-xs text-neutral-500">
						Berdasarkan analisis laporan dan kondisi lingkungan
					</p>
				</div>

				<div className="flex items-center gap-1 text-xs text-neutral-500">
					<Clock3 className="size-3.5" />
					Diperbarui berkala
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
				<div className="grid lg:grid-cols-[1.4fr_0.6fr]">
					<div className="space-y-6 p-5 md:p-6">
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-3">
								<div className="flex flex-wrap items-center gap-2">
									<span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
										<ShieldAlert className="size-3" />
										Dampak {insight.impact}
									</span>

									<span className="text-xs text-neutral-400">prioritas #1</span>
								</div>

								<h3 className="max-w-2xl text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-xl">
									{insight.title}
								</h3>

								<div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
									<span className="flex items-center gap-1.5">
										<MapPin className="size-3.5" />
										{insight.locationName}
									</span>

									<span>{insight.category}</span>
								</div>
							</div>

							<div className="hidden rounded-lg bg-neutral-50 px-3 py-2 text-right dark:bg-neutral-800/70 sm:block">
								<p className="text-[10px] text-neutral-400">impact score</p>

								<p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
									{insight.impactScore}
								</p>
							</div>
						</div>

						<p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
							{insight.summary}
						</p>

						<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-500">
							<span>
								<strong className="font-medium text-neutral-900 dark:text-neutral-200">
									{insight.reportCount}
								</strong>{" "}
								laporan
							</span>

							<span>
								<strong className="font-medium text-neutral-900 dark:text-neutral-200">
									{insight.validatedCount}
								</strong>{" "}
								tervalidasi
							</span>

							{insight.trend === "up" && (
								<span className="flex items-center gap-1 text-red-500">
									<ArrowUp className="size-3.5" />
									Meningkat
								</span>
							)}

							{insight.trend === "down" && (
								<span className="flex items-center gap-1 text-emerald-500">
									<ArrowUp className="size-3.5 rotate-180" />
									Menurun
								</span>
							)}
						</div>

						<button
							type="button"
							onClick={() =>
								navigate({ to: "/dashboard/insights/$insightId", params: { insightId: insight.id } })
							}
							className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-medium text-white shadow-sm shadow-sky-500/20 transition-colors hover:bg-sky-400 hover:shadow-sky-500/30"
						>
							Baca insight
							<ArrowRight className="size-3.5" />
						</button>
					</div>

					<div className="flex items-center justify-center border-t border-neutral-200 bg-neutral-50/70 p-6 dark:border-neutral-800 dark:bg-neutral-950/40 lg:border-l lg:border-t-0">
						<div className="text-center">
							<div className="mx-auto flex size-28 items-center justify-center rounded-full border-8 border-neutral-200 dark:border-neutral-800">
								<div>
									<p className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
										{insight.impactScore}
									</p>

									<p className="text-[10px] text-neutral-400">impact score</p>
								</div>
							</div>

							<div className="mt-4">
								<p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
									{insight.impact === "Tinggi"
										? "Risiko perlu diperhatikan"
										: insight.impact === "Sedang"
											? "Risiko sedang"
											: "Risiko rendah"}
								</p>

								<p className="mt-1 text-[11px] text-neutral-500">
									Berdasarkan data yang tersedia
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
