import { createFileRoute } from "@tanstack/react-router";
import { isAutomaticReportRequestAuthorized } from "@/lib/automatic-report-auth";
import { runAutomaticReports } from "@/lib/automatic-reports.server";

export const Route = createFileRoute("/api/internal/automatic-reports/run")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const secret = process.env.AUTOMATIC_REPORT_CRON_SECRET?.trim();
				if (!secret) {
					return Response.json(
						{ error: "AUTOMATIC_REPORT_CRON_SECRET_MISSING" },
						{ status: 503 },
					);
				}
				if (
					!isAutomaticReportRequestAuthorized(
						request.headers.get("authorization"),
						secret,
					)
				) {
					return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
				}

				let regionId: string | undefined;
				const rawBody = await request.text();
				if (rawBody.trim()) {
					try {
						const body = JSON.parse(rawBody) as { regionId?: unknown };
						if (
							body.regionId !== undefined &&
							typeof body.regionId !== "string"
						) {
							return Response.json(
								{ error: "INVALID_REGION_ID" },
								{ status: 400 },
							);
						}
						if (typeof body.regionId === "string" && body.regionId.trim()) {
							regionId = body.regionId.trim();
						}
					} catch {
						return Response.json({ error: "INVALID_JSON" }, { status: 400 });
					}
				}

				try {
					return Response.json(await runAutomaticReports({ regionId }));
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					const status = message.startsWith("AUTOMATIC_REPORT_REGION_NOT_FOUND")
						? 404
						: 500;
					return Response.json({ error: message }, { status });
				}
			},
		},
	},
});
