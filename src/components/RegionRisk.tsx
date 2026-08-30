import {
  CloudRain,
  Thermometer,
  Wind,
  ArrowRight,
  MoreVertical,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
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
  reportCount?: number;
};

export default function RegionRisk({
  location,
  reportCount = 0,
}: RegionRiskProps) {
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

  const safeReportCount = Number.isFinite(reportCount)
    ? Math.max(0, Math.floor(reportCount))
    : 0;

  // Community evidence contributes up to 30 points.
  const reportRisk = Math.min(30, safeReportCount * 5);

  const score = Math.min(
    100,
    Math.round(tempRisk + rainRisk + aqiRisk + humidityRisk + reportRisk),
  );

  let level = "Rendah";

  let levelColor = "text-emerald-600 dark:text-emerald-400";

  let barBg =
    "border-emerald-200 bg-emerald-50/80 " +
    "dark:border-emerald-900/50 dark:bg-emerald-900/20";

  let barText = "text-emerald-900 dark:text-emerald-200";

  if (score >= 70) {
    level = "Tinggi";

    levelColor = "text-red-600 dark:text-red-400";

    barBg =
      "border-red-200 bg-red-50/80 " +
      "dark:border-red-900/50 dark:bg-red-900/20";

    barText = "text-red-900 dark:text-red-200";
  } else if (score >= 30) {
    level = "Sedang";

    levelColor = "text-amber-600 dark:text-amber-400";

    barBg =
      "border-amber-200 bg-amber-50/80 " +
      "dark:border-amber-900/50 dark:bg-amber-900/20";

    barText = "text-amber-900 dark:text-amber-200";
  }

  // Faktor dominan penyumbang skor risiko
  const factors = [
    {
      risk: tempRisk,
      insight: `Suhu ${
        tempAnomaly > 0 ? "lebih tinggi" : "lebih rendah"
      } ${Math.abs(Math.round(tempAnomaly))}°C dari rata-rata wilayah.`,
    },
    {
      risk: rainRisk,
      insight: `Peluang hujan ${Math.round(
        rainAnomaly,
      )}% di atas rata-rata wilayah.`,
    },
    {
      risk: aqiRisk,
      insight: `Kualitas udara ${Math.round(
        aqiAnomaly,
      )} AQI lebih buruk dari rata-rata wilayah.`,
    },
    {
      risk: reportRisk,
      insight: `${safeReportCount} laporan terdeteksi di sekitar lokasi pengguna.`,
    },
  ].sort((a, b) => b.risk - a.risk);

  const topFactor = factors[0];

  const factorInsight =
    topFactor.risk > 5
      ? `Penyumbang utama: ${topFactor.insight}`
      : "Semua indikator berada dekat dengan rata-rata normal wilayah.";

  const conditions = [
    {
      icon: CloudRain,
      label: "Curah Hujan",
      value: `${rainProb}%`,
      iconColor: "text-blue-500",
    },
    {
      icon: Thermometer,
      label: "Suhu",
      value: `${temp}°C`,
      iconColor: "text-orange-500",
    },
    {
      icon: Wind,
      label: "Kualitas Udara",
      value: `${aqiValue} AQI`,
      iconColor: "text-teal-500",
    },
  ];

  return (
    <div className="flex h-full w-full flex-col justify-between bg-white p-2 dark:bg-neutral-800 md:p-4">
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          {/* Score Detail */}
          <div className="flex items-start">
            <span className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {score}
            </span>

            <span className="ml-1 text-lg font-medium text-neutral-500 dark:text-neutral-400">
              /100
            </span>
          </div>

          {/* Risk Status */}
          <div>
            <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
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
            className="
              flex h-8 w-8 items-center justify-center
              rounded-md
              text-neutral-500
              transition-colors
              hover:bg-neutral-100
              hover:text-neutral-700
              dark:text-neutral-400
              dark:hover:bg-neutral-700
              dark:hover:text-neutral-200
            "
            aria-label="Opsi lainnya"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="
              w-56
              border-neutral-200
              bg-white
              dark:border-neutral-700
              dark:bg-neutral-800
            "
          >
            <DropdownMenuItem
              render={<Link to="/dashboard/warnings" preload="intent" />}
              className="
                cursor-pointer
                focus:bg-neutral-100
                dark:focus:bg-neutral-700
              "
            >
              <div className="flex flex-1 flex-col">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  Laporan Komunitas
                </span>

                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {safeReportCount > 0
                    ? `${safeReportCount} laporan mendukung`
                    : "Belum ada laporan"}
                </span>
              </div>

              <ArrowRight className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        Kondisi lingkungan saat ini menunjukkan{" "}
        {score >= 50
          ? "peningkatan risiko dibanding pola normal"
          : "kondisi dalam batas normal"}
        .
        {safeReportCount > 0 &&
          ` ${safeReportCount} laporan sekitar turut memperkuat penilaian.`}
      </p>

      {/* Insight Bar */}
      <div
        className={`
          mt-2 rounded-lg border px-3 py-2
          ${barBg}
        `}
      >
        <p
          className={`
            text-[11px] leading-relaxed
            ${barText}
          `}
        >
          {factorInsight}
        </p>
      </div>

      {/* Conditions */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {conditions.map(({ icon: Icon, label, value, iconColor }) => (
          <div key={label}>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
              <Icon className={`h-3.5 w-3.5 ${iconColor}`} strokeWidth={2} />

              {label}
            </p>

            <p className="mt-1.5 text-base font-bold text-neutral-900 dark:text-neutral-100">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
