import * as maplibregl from "maplibre-gl";
import type { NearbyReportPin } from "#/components/RiskMap";

export function groupNearbyReports(
	reports: NearbyReportPin[],
): NearbyReportPin[][] {
	const overlapThreshold = 0.0015;
	const groups: NearbyReportPin[][] = [];

	for (const report of reports) {
		const existingGroup = groups.find((group) =>
			group.some(
				(candidate) =>
					Math.abs(candidate.latitude - report.latitude) <= overlapThreshold &&
					Math.abs(candidate.longitude - report.longitude) <= overlapThreshold,
			),
		);

		if (existingGroup) {
			existingGroup.push(report);
		} else {
			groups.push([report]);
		}
	}

	return groups;
}

export function createReportMarkerElement(title: string, reportCount: number) {
	const marker = document.createElement("button");
	marker.type = "button";
	marker.className =
		"risk-report-marker flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-amber-400 text-amber-950 shadow-lg transition-colors hover:bg-amber-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2";
	marker.ariaLabel =
		reportCount > 1
			? `${reportCount} laporan di lokasi ini`
			: `Laporan: ${title}`;
	marker.title =
		reportCount > 1 ? `${reportCount} laporan di lokasi ini` : title;
	marker.style.pointerEvents = "auto";
	marker.style.zIndex = "20";

	const icon = document.createElement("span");
	icon.className = "text-xl font-black leading-none";
	icon.textContent = reportCount > 1 ? String(reportCount) : "!";
	icon.setAttribute("aria-hidden", "true");
	marker.appendChild(icon);

	return marker;
}

export function createReportMarkers(
	reports: NearbyReportPin[],
	mapInstance: maplibregl.Map,
	onReportSelect?: (report: NearbyReportPin) => void,
	reportGroups?: NearbyReportPin[][],
): maplibregl.Marker[] {
	// Reuse a pre-computed grouping when provided (avoids re-running the
	// O(n²) neighbour search that the click handler already computed).
	const groups = reportGroups ?? groupNearbyReports(reports);

	const markers = groups.map((reportGroup) => {
		const primaryReport = reportGroup[0];

		const markerElement = createReportMarkerElement(
			primaryReport.title,
			reportGroup.length,
		);
		const marker = new maplibregl.Marker({
			element: markerElement,
			anchor: "bottom",
		})
			.setLngLat([primaryReport.longitude, primaryReport.latitude])
			.addTo(mapInstance);

		// Force visibility on marker
		const markerContainer = marker.getElement();
		markerContainer.style.cssText =
			"display: block !important; visibility: visible !important; z-index: 999 !important; pointer-events: auto !important;";

		markerElement.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			onReportSelect?.(primaryReport);
		});
		markerElement.addEventListener("pointerdown", (event) => {
			event.stopPropagation();
		});

		return marker;
	});

	return markers;
}

export function createSelectedLocationMarker(
	latitude: number,
	longitude: number,
	mapInstance: maplibregl.Map,
): maplibregl.Marker {
	const marker = new maplibregl.Marker({ color: "#dc2626" })
		.setLngLat([longitude, latitude])
		.addTo(mapInstance);
	marker.getElement().ariaLabel = "Titik wilayah terpilih";
	marker.getElement().title = "Wilayah terpilih";
	return marker;
}
