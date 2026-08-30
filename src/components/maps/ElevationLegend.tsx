const ELEVATION_STOPS = [
	{ label: "Dataran rendah", color: "rgb(122, 184, 98)", value: "0-400" },
	{ label: "Perbukitan", color: "rgb(205, 153, 79)", value: "400-1.500" },
	{ label: "Dataran tinggi", color: "rgb(180, 120, 70)", value: "1.500-2.500" },
	{ label: "Pegunungan", color: "rgb(150, 95, 55)", value: "2.500-4.000" },
	{ label: "Sangat tinggi", color: "rgb(190, 185, 175)", value: ">4.000" },
];

export function ElevationLegend() {
	return (
		<div className="mt-3 border-t border-neutral-100 dark:border-neutral-700 pt-3">
			<p className="mb-2 text-[10px] font-semibold text-neutral-700 dark:text-neutral-400">
				Elevation
			</p>

			<div className="flex flex-col gap-1 text-[10px] text-neutral-600 dark:text-neutral-400">
				{ELEVATION_STOPS.map((stop) => (
					<div key={stop.label} className="flex items-center gap-2">
						<span
							className="h-3 w-3 shrink-0 rounded-sm border border-black/10"
							style={{ backgroundColor: stop.color, opacity: 0.9 }}
						/>
						<span>
							{stop.label} ({stop.value}m)
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
