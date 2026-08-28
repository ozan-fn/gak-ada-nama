import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import InsightsHeader from "#/components/InsightsHeader";
import InsightsOverviewCards from "#/components/InsightsOverviewCards";
import InsightsFilterBar from "#/components/InsightsFilterBar";
import RegionalRankingCard from "#/components/RegionalRankingCard";
import FeaturedInsightCard from "#/components/FeaturedInsightCard";
import InsightsPriorityTable from "#/components/InsightsPriorityTable";
import InsightsLatestCards from "#/components/InsightsLatestCards";
import { getInsightsFn } from "#/lib/insight.functions";

export const Route = createFileRoute("/_protected/dashboard/insights")({
	loader: () => getInsightsFn({ data: { scope: "Indonesia" } }),
	component: RouteComponent,
});

function RouteComponent() {
	const { insights, stats } = Route.useLoaderData();
	const [scope, setScope] = useState<"Indonesia" | "Sekitar Anda">("Indonesia");
	const [activeFilter, setActiveFilter] = useState("Semua");
	const [searchQuery, setSearchQuery] = useState("");

	const filteredInsights = useMemo(() => {
		return insights.filter((insight) => {
			const matchesFilter =
				activeFilter === "Semua" || insight.impact === activeFilter;

			const matchesSearch =
				insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				insight.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				insight.category.toLowerCase().includes(searchQuery.toLowerCase());

			return matchesFilter && matchesSearch;
		});
	}, [activeFilter, searchQuery, insights]);

	const featuredInsight = filteredInsights[0];

	return (
		<main className="min-h-screen">
			<div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-stretch">
				{/* Left Section: Main Insights Content */}
				<div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-2/3 lg:self-stretch">
					{/* Header Section */}
					<div className="flex shrink-0 flex-col gap-2 rounded-lg bg-white p-4 shadow-xs">
						<h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
							Insights
						</h1>

						<p className="text-sm text-neutral-500 dark:text-neutral-400">
							Analisis kondisi lingkungan berdasarkan laporan masyarakat dan
							data lingkungan.
						</p>

						<div className="mt-2">
							<InsightsHeader scope={scope} setScope={setScope} />
						</div>
					</div>

					{/* Overview Cards */}
					<div className="shrink-0 rounded-lg bg-white p-4 shadow-xs">
						<InsightsOverviewCards
							totalReports={stats.totalReports}
							totalInsights={stats.totalInsights}
							highImpactCount={stats.highImpactCount}
							trendDirection={stats.trendDirection}
						/>
					</div>

					{/* Filter & Search Bar */}
					<div className="shrink-0 rounded-lg bg-white p-4 shadow-xs">
						<InsightsFilterBar
							activeFilter={activeFilter}
							setActiveFilter={setActiveFilter}
							searchQuery={searchQuery}
							setSearchQuery={setSearchQuery}
						/>
					</div>

					{/* Featured Insight */}
					{featuredInsight && (
						<div className="shrink-0 rounded-lg bg-white p-4 shadow-xs">
							<FeaturedInsightCard insight={featuredInsight} />
						</div>
					)}

					{/* Empty state */}
					{filteredInsights.length === 0 && (
						<div className="rounded-lg bg-white p-8 text-center shadow-xs">
							<p className="text-sm text-neutral-500">
								Belum ada insight untuk ditampilkan.
							</p>
							<p className="mt-1 text-xs text-neutral-400">
								Insight akan muncul setelah ada cukup laporan masyarakat.
							</p>
						</div>
					)}

					{/* Priority Table */}
					{filteredInsights.length > 0 && (
						<div className="min-h-0 flex-1 rounded-lg bg-white p-4 shadow-xs">
							<InsightsPriorityTable insights={filteredInsights} />
						</div>
					)}
				</div>

				{/* Right Section: Regional Ranking & Latest Insights */}
				<div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-1/3 lg:self-stretch">
					{/* Regional Ranking */}
					{scope === "Indonesia" && (
						<div className="shrink-0 rounded-lg bg-white p-4 shadow-xs">
							<RegionalRankingCard insights={filteredInsights} />
						</div>
					)}

					{/* Latest Insights Cards */}
					<div className="min-h-0 flex-1 rounded-lg bg-white p-4 shadow-xs">
						<InsightsLatestCards insights={filteredInsights} />
					</div>
				</div>
			</div>
		</main>
	);
}
