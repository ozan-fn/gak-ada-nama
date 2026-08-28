import { createFileRoute } from "@tanstack/react-router";
import InsightDetail from "#/components/InsightDetail";
import { getInsightByIdFn } from "#/lib/insight.functions";

export const Route = createFileRoute("/_protected/dashboard/insights/$insightId")({
	loader: async ({ params }) => {
		const insight = await getInsightByIdFn({ data: params.insightId });
		if (!insight) {
			throw new Error("Insight tidak ditemukan");
		}
		return insight;
	},
	component: InsightDetailPage,
});

function InsightDetailPage() {
	const insight = Route.useLoaderData();

	return <InsightDetail insight={insight} />;
}
