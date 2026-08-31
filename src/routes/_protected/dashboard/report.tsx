import { createFileRoute } from "@tanstack/react-router";
import { EcoLensWorkspace } from "#/components/ecolens/EcoLensWorkspace";
import { EcoLensLocationProvider } from "#/contexts/EcoLensLocationContext";

function ReportPage() {
	return (
		<EcoLensLocationProvider>
			<EcoLensWorkspace />
		</EcoLensLocationProvider>
	);
}

export const Route = createFileRoute("/_protected/dashboard/report")({
	component: ReportPage,
});
