import { createFileRoute } from "@tanstack/react-router";
import {
	EnvironmentProviderError,
	fetchAQIByCity,
	fetchAQIByCoordinates,
} from "@/lib/environment.server";

export const Route = createFileRoute("/api/aqi")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const city = url.searchParams.get("city") || "jakarta";
				const lat = url.searchParams.get("lat");
				const lng = url.searchParams.get("lng") || url.searchParams.get("lon"); // Accept both lon and lng

				try {
					const parsedLatitude =
						lat === null ? Number.NaN : Number.parseFloat(lat);
					const parsedLongitude =
						lng === null ? Number.NaN : Number.parseFloat(lng);
					const data =
						Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude)
							? await fetchAQIByCoordinates(
									{
										latitude: parsedLatitude,
										longitude: parsedLongitude,
									},
									{ signal: request.signal },
								)
							: await fetchAQIByCity(city, { signal: request.signal });

					return new Response(JSON.stringify(data), {
						status: 200,
						headers: {
							"Content-Type": "application/json",
							"Cache-Control": "public, max-age=600", // 10 min cache
						},
					});
				} catch (error) {
					if (
						error instanceof EnvironmentProviderError &&
						error.code === "PROVIDER_ERROR"
					) {
						return new Response(
							JSON.stringify({
								error: "AQICN API returned error status",
								details: error.details,
							}),
							{
								status: 400,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					return new Response(
						JSON.stringify({
							error:
								error instanceof EnvironmentProviderError &&
								error.code === "NOT_CONFIGURED"
									? "AQICN_TOKEN not configured"
									: "Failed to fetch AQI data",
							message: error instanceof Error ? error.message : "Unknown error",
						}),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},
		},
	},
});
