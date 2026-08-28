import { FileText, MapPin, ShieldAlert, TrendingUp } from "lucide-react";

type InsightsOverviewCardsProps = {
	totalReports: number;
	totalInsights: number;
	highImpactCount: number;
	trendDirection: "up" | "down" | "stable";
};

export default function InsightsOverviewCards({
	totalReports,
	totalInsights,
	highImpactCount,
	trendDirection,
}: InsightsOverviewCardsProps) {
	const trendLabel =
		trendDirection === "up"
			? "Meningkat"
			: trendDirection === "down"
				? "Menurun"
				: "Stabil";

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
				<div className="flex items-center justify-between">
					<span className="text-xs text-neutral-500">Total laporan</span>
					<FileText className="size-4 text-neutral-400" />
				</div>

				<p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
					{totalReports}
				</p>

				<p className="mt-1 text-[11px] text-neutral-400">
					dari {totalInsights} isu terdeteksi
				</p>
			</div>

			<div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
				<div className="flex items-center justify-between">
					<span className="text-xs text-neutral-500">Isu aktif</span>
					<MapPin className="size-4 text-neutral-400" />
				</div>

				<p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
					{totalInsights}
				</p>

				<p className="mt-1 text-[11px] text-neutral-400">
					berdasarkan clustering laporan
				</p>
			</div>

			<div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
				<div className="flex items-center justify-between">
					<span className="text-xs text-neutral-500">Dampak tinggi</span>
					<ShieldAlert className="size-4 text-neutral-400" />
				</div>

				<p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
					{highImpactCount}
				</p>

				<p className="mt-1 text-[11px] text-neutral-400">
					isu yang perlu diperhatikan
				</p>
			</div>

			<div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
				<div className="flex items-center justify-between">
					<span className="text-xs text-neutral-500">Tren risiko</span>
					<TrendingUp className="size-4 text-neutral-400" />
				</div>

				<p className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
					{trendLabel}
				</p>

				<p className="mt-1 text-[11px] text-neutral-400">
					dibandingkan periode sebelumnya
				</p>
			</div>
		</div>
	);
}
