import { createFileRoute } from "@tanstack/react-router";
import { EcoLensWorkspace } from "#/components/ecolens/EcoLensWorkspace";

export const Route = createFileRoute("/_protected/dashboard/report")({
	component: EcoLensReportPage,
});

function EcoLensReportPage() {
	return <EcoLensWorkspace />;
}
