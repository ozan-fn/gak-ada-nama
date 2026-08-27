import { CloudRain, MapPin, Mountain, Thermometer, Wind } from "lucide-react";
import { useMemo } from "react";
import { useDynamicBaseline } from "#/hooks/useDynamicBaseline";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { useUserLocation } from "#/hooks/useUserLocation";
import { getRegionalBaseline } from "#/lib/regionalBaselines";
import { SelectedRiskSkeleton } from "./skeletons/SelectedRiskSkeleton";

type SelectedRiskProps = {
	selectedLocation?: {
		latitude: number;
		longitude: number;
		city: string;
	} | null;
};

export default function SelectedRisk({ selectedLocation }: SelectedRiskProps) {
	const userLocation = useUserLocation();
	const activeLocation = useMemo(() => {
		if (selectedLocation) return selectedLocation;
		if (!userLocation.latitude || !userLocation.longitude) {
			return {
				latitude: -6.2088,
				longitude: 106.8456,
				city: userLocation.city || "Jakarta, DKI Jakarta",
			};
		}

		return {
			latitude: userLocation.latitude,
			longitude: userLocation.longitude,
			city: userLocation.city,
		};
	}, [
		selectedLocation,
		userLocation.latitude,
		userLocation.longitude,
		userLocation.city,
	]);
	const { weather, aqi, loading } = useEnvironmentData(activeLocation);
	const { baseline: dynamicBaseline, loading: baselineLoading } =
		useDynamicBaseline(
			activeLocation.latitude,
			activeLocation.longitude,
			activeLocation.city,
		);

	if (
		loading ||
		(!selectedLocation && userLocation.loading) ||
		!weather ||
		!aqi
	) {
		return <SelectedRiskSkeleton />;
	}

	const staticBaseline = getRegionalBaseline(
		activeLocation.city || "Jakarta, ID",
	);
	const normalTemp =
		dynamicBaseline && !baselineLoading
			? dynamicBaseline.temp
			: staticBaseline.temp;
	const normalAqi =
		dynamicBaseline && !baselineLoading
			? dynamicBaseline.aqi
			: staticBaseline.aqi;
	const normalHumidity =
		dynamicBaseline && !baselineLoading
			? dynamicBaseline.humidity
			: staticBaseline.humidity;
	const normalRainProbability =
		dynamicBaseline && !baselineLoading
			? Math.min(95, Math.round(10 + dynamicBaseline.rainSum * 7))
			: staticBaseline.rainProb;
	const temperature = Math.round(weather.current.temperature);
	const rainProbability = Math.round(
		weather.daily.precipitationProbability[0] || 0,
	);
	const aqiValue = aqi.aqi;
	const humidity = Math.round(weather.current.humidity);
	const elevation = weather.elevation ? Math.round(weather.elevation) : null;
	const score = Math.min(
		100,
		Math.round(
			Math.abs(temperature - normalTemp) * 2 +
				Math.max(0, rainProbability - normalRainProbability) * 1.5 +
				Math.max(0, aqiValue - normalAqi) * 0.8 +
				Math.abs(humidity - normalHumidity) * 0.5,
		),
	);
	const level = score >= 70 ? "Tinggi" : score >= 30 ? "Sedang" : "Rendah";
	const levelColor =
		score >= 70
			? "bg-red-50 text-red-600"
			: score >= 30
				? "bg-amber-50 text-amber-600"
				: "bg-emerald-50 text-emerald-600";
	const conditions = [
		{ icon: CloudRain, label: "Curah Hujan", value: `${rainProbability}%` },
		{ icon: Thermometer, label: "Suhu", value: `${temperature}°C` },
		{ icon: Wind, label: "Kualitas Udara", value: `${aqiValue} AQI` },
		...(elevation !== null
			? [{ icon: Mountain, label: "Ketinggian", value: `${elevation} mdpl` }]
			: []),
	];

	return (
		<section className="rounded-lg bg-white p-4 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-start gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
						<Wind className="size-4.5" />
					</div>
					<div className="min-w-0">
						<p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
							Kondisi lingkungan saat ini
						</p>
						<h3 className="mt-1 flex items-center gap-1 text-sm font-semibold text-neutral-900">
							<MapPin className="size-3.5 text-neutral-400" />
							<span className="truncate">
								{activeLocation.city || "Wilayah Anda"}
							</span>
						</h3>
					</div>
				</div>
				<span
					className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold ${levelColor}`}
				>
					Risiko {level}
				</span>
			</div>

			<div className="mt-4 rounded-lg bg-neutral-50 p-3">
				<div className="flex items-end">
					<span className="font-mono text-3xl font-semibold leading-none text-neutral-900">
						{score}
					</span>
					<span className="mb-0.5 ml-1 text-xs text-neutral-400">/100</span>
				</div>
				<p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
					Skor membandingkan cuaca dan kualitas udara terkini dengan pola normal
					wilayah.
				</p>
			</div>

			<div className="mt-3 grid grid-cols-3 gap-2">
				{conditions.slice(0, 3).map(({ icon: Icon, label, value }) => (
					<div
						key={label}
						className="rounded-lg border border-neutral-100 p-2.5"
					>
						<p className="flex items-center gap-1 text-[8px] font-medium text-neutral-400">
							<Icon className="size-3 text-emerald-600" />
							{label}
						</p>
						<p className="mt-1.5 text-xs font-semibold text-neutral-900">
							{value}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
