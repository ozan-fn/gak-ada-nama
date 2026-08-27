import {
  CloudRain,
  Thermometer,
  Wind,
  ArrowRight,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { useUserLocation } from "#/hooks/useUserLocation";
import { useDynamicBaseline } from "#/hooks/useDynamicBaseline";
import { getRegionalBaseline } from "#/lib/regionalBaselines";
import { RegionRiskSkeleton } from "./skeletons/RegionRiskSkeleton";

type LocationParams =
  { latitude: number; longitude: number } | { city: string };

type RegionRiskProps = {
  location?: LocationParams;
};

export default function RegionRisk({ location }: RegionRiskProps) {
  const userLocation = useUserLocation();

  const { weather, aqi, loading } = useEnvironmentData(location);

  const { baseline: dynamicBaseline, loading: baselineLoading } =
    useDynamicBaseline(
      userLocation.latitude,
      userLocation.longitude,
      userLocation.city,
    );

  if (loading || !weather || !aqi) {
    return <RegionRiskSkeleton />;
  }

  let cityForBaseline: string | null = null;

  if (location && "city" in location) {
    cityForBaseline = location.city;
  } else {
    cityForBaseline = userLocation.city;
  }

  let NORMAL_TEMP: number;
  let NORMAL_RAIN_PROB: number;
  let NORMAL_AQI: number;
  let NORMAL_HUMIDITY: number;

  if (dynamicBaseline && !baselineLoading) {
    NORMAL_TEMP = dynamicBaseline.temp;
    NORMAL_AQI = dynamicBaseline.aqi;
    NORMAL_HUMIDITY = dynamicBaseline.humidity;
    NORMAL_RAIN_PROB = Math.min(
      95,
      Math.round(10 + dynamicBaseline.rainSum * 7),
    );
  } else {
    const staticBaseline = getRegionalBaseline(cityForBaseline);

    NORMAL_TEMP = staticBaseline.temp;
    NORMAL_RAIN_PROB = staticBaseline.rainProb;
    NORMAL_AQI = staticBaseline.aqi;
    NORMAL_HUMIDITY = staticBaseline.humidity;
  }

  const temp = Math.round(weather.current.temperature);
  const rainProb = Math.round(weather.daily.precipitationProbability[0] || 0);
  const aqiValue = aqi.aqi;
  const humidity = Math.round(weather.current.humidity);

  const tempAnomaly = temp - NORMAL_TEMP;
  const rainAnomaly = rainProb - NORMAL_RAIN_PROB;
  const aqiAnomaly = aqiValue - NORMAL_AQI;
  const humidityAnomaly = humidity - NORMAL_HUMIDITY;

  const tempRisk = Math.abs(tempAnomaly) * 2;
  const rainRisk = Math.max(0, rainAnomaly) * 1.5;
  const aqiRisk = Math.max(0, aqiAnomaly) * 0.8;
  const humidityRisk = Math.abs(humidityAnomaly) * 0.5;

  const score = Math.min(
    100,
    Math.round(tempRisk + rainRisk + aqiRisk + humidityRisk),
  );

  const reportCount = 0;

  let level = "Rendah";
  let levelColor = "text-emerald-600";
  let barBg = "border-emerald-100 bg-emerald-50";
  let barText = "text-emerald-700";

  if (score >= 70) {
    level = "Tinggi";
    levelColor = "text-red-600";
    barBg = "border-red-100 bg-red-50";
    barText = "text-red-700";
  } else if (score >= 30) {
    level = "Sedang";
    levelColor = "text-amber-600";
    barBg = "border-amber-100 bg-amber-50";
    barText = "text-amber-700";
  }

  // Faktor dominan penyumbang skor risiko
  const factors = [
    { label: "suhu", risk: tempRisk, anomaly: tempAnomaly, unit: "°C" },
    { label: "curah hujan", risk: rainRisk, anomaly: rainAnomaly, unit: "%" },
    {
      label: "kualitas udara",
      risk: aqiRisk,
      anomaly: aqiAnomaly,
      unit: " AQI",
    },
  ].sort((a, b) => b.risk - a.risk);

  const topFactor = factors[0];
  const factorInsight =
    topFactor.risk > 5
      ? `Penyumbang utama: ${topFactor.label} ${
          topFactor.anomaly > 0 ? "lebih tinggi" : "lebih rendah"
        } ${Math.abs(Math.round(topFactor.anomaly))}${topFactor.unit} dari rata-rata wilayah.`
      : "Semua indikator berada dekat dengan rata-rata normal wilayah.";

  const conditions = [
    {
      icon: CloudRain,
      label: "Curah Hujan",
      value: `${rainProb}%`,
    },
    {
      icon: Thermometer,
      label: "Suhu",
      value: `${temp}°C`,
    },
    {
      icon: Wind,
      label: "Kualitas Udara",
      value: `${aqiValue} AQI`,
    },
  ];

  return (
    <div className="flex h-full w-full flex-col justify-between bg-white p-2 md:p-4">
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          {/* Score Detail */}
          <div className="flex items-start">
            <span className="text-4xl font-bold tracking-tight text-neutral-900">
              {score}
            </span>

            <span className="ml-1 text-lg font-medium text-neutral-600">
              /100
            </span>
          </div>

          {/* Risk Status */}
          <div>
            <p className="text-[11px] font-medium text-neutral-400">
              Risiko Wilayah
            </p>

            <h3 className={`text-base font-bold ${levelColor}`}>
              Risiko {level}
            </h3>
          </div>
        </div>

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100"
            aria-label="Opsi lainnya"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <div className="flex flex-1 flex-col">
                <span className="font-medium">Laporan Komunitas</span>
                <span className="text-xs text-neutral-500">
                  {reportCount > 0
                    ? `${reportCount} laporan mendukung`
                    : "Belum ada laporan"}
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        Kondisi lingkungan saat ini menunjukkan{" "}
        {score >= 50
          ? "peningkatan risiko dibanding pola normal"
          : "kondisi dalam batas normal"}
        .
      </p>

      {/* Insight bar — faktor dominan */}
      <div className={`mt-2 rounded-lg border ${barBg} px-3 py-2`}>
        <p className={`text-[11px] leading-relaxed ${barText}`}>
          {factorInsight}
        </p>
      </div>

      {/* Conditions */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {conditions.map(({ icon: Icon, label, value }, idx) => {
          const colors = ["text-blue-500", "text-orange-500", "text-teal-500"];

          return (
            <div key={label}>
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
                <Icon className={`h-3.5 w-3.5 ${colors[idx]}`} />
                {label}
              </p>

              <p className="mt-1.5 text-base font-bold text-neutral-900">
                {value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
