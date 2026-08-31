import {
  Droplets,
  Wind,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useEnvironmentData } from "@/hooks/useEnvironmentData";
import { useDynamicBaseline } from "@/hooks/useDynamicBaseline";
import { Skeleton } from "@/components/ui/skeleton";

type Trend = "up" | "down" | "flat";

const trendIcon: Record<Trend, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const trendColor: Record<Trend, string> = {
  up: "text-red-500",
  down: "text-emerald-500",
  flat: "text-neutral-400",
};

// Helper to determine trend by comparing current vs baseline
function calculateTrend(
  current: number,
  baseline: number,
  threshold: number = 10,
): Trend {
  const diff = current - baseline;
  const percentDiff = (Math.abs(diff) / baseline) * 100;

  if (percentDiff < threshold) return "flat";
  return diff > 0 ? "up" : "down";
}

// Helper to format trend label
function getTrendLabel(
  current: number,
  baseline: number,
  trend: Trend,
  unit: string = "",
): string {
  if (trend === "flat") return "Stabil";

  const diff = Math.abs(current - baseline);
  const sign = trend === "up" ? "+" : "-";
  return `${sign}${Math.round(diff)}${unit}`;
}

export default function CurrentConditionAnalysis() {
  const userLocation = useUserLocation();
  const { weather, aqi, loading } = useEnvironmentData(userLocation);
  const { baseline, loading: baselineLoading } = useDynamicBaseline(
    userLocation.latitude,
    userLocation.longitude,
    userLocation.city,
  );

  // Loading state
  if (loading || userLocation.loading) {
    return (
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="mt-3 h-12 w-full" />
      </section>
    );
  }

  if (!weather || !aqi) {
    return null;
  }

  // Current values from real APIs
  const currentRainProb = Math.round(
    weather.daily.precipitationProbability[0] || 0,
  );
  const currentAQI = aqi.aqi;
  const reportCount = 0; // ponytail: will fetch from backend later

  // Calculate trends (compare to baseline if available)
  let rainTrend: Trend = "flat";
  let rainTrendLabel = "Stabil";
  let aqiTrend: Trend = "flat";
  let aqiTrendLabel = "Stabil";

  if (baseline && !baselineLoading) {
    // Convert baseline rainSum to probability for comparison
    const baselineRainProb = Math.min(
      95,
      Math.round(10 + baseline.rainSum * 7),
    );
    rainTrend = calculateTrend(currentRainProb, baselineRainProb, 15);
    rainTrendLabel = getTrendLabel(
      currentRainProb,
      baselineRainProb,
      rainTrend,
      "%",
    );

    // AQI trend
    aqiTrend = calculateTrend(currentAQI, baseline.aqi, 10);
    aqiTrendLabel = getTrendLabel(currentAQI, baseline.aqi, aqiTrend);
  }

  const metrics = [
    {
      label: "Curah Hujan",
      value: `${currentRainProb}%`,
      icon: Droplets,
      trend: rainTrend,
      trendLabel: rainTrendLabel,
    },
    {
      label: "Kualitas Udara",
      value: `${currentAQI} AQI`,
      icon: Wind,
      trend: aqiTrend,
      trendLabel: aqiTrendLabel,
    },
    {
      label: "Laporan Masuk",
      value: reportCount.toString(),
      icon: FileText,
      trend: "flat" as Trend,
      trendLabel: reportCount > 0 ? `+${reportCount}/jam` : "Tidak ada",
    },
  ];

  // Generate dynamic insight text based on conditions
  let insightText = "Kondisi lingkungan dalam batas normal.";

  if (rainTrend === "up" && aqiTrend === "up") {
    insightText =
      "Curah hujan tinggi bersamaan dengan peningkatan polusi udara menjadi faktor utama risiko saat ini.";
  } else if (rainTrend === "up") {
    insightText =
      "Curah hujan meningkat signifikan dibanding pola normal. Waspadai potensi genangan.";
  } else if (aqiTrend === "up") {
    insightText =
      "Kualitas udara menurun dibanding baseline area. Hindari aktivitas outdoor berkepanjangan.";
  } else if (rainTrend === "down" && currentRainProb < 20) {
    insightText =
      "Cuaca cerah dengan probabilitas hujan rendah. Kondisi ideal untuk aktivitas luar ruangan.";
  }

  return (
    <section className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">
          Kondisi Saat Ini
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-600">
          Live
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-neutral-100">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const TrendI = trendIcon[metric.trend];

          return (
            <div
              key={metric.label}
              className="flex flex-col gap-1.5 px-3 first:pl-0 last:pr-0"
            >
              <div className="flex items-center gap-1.5 text-neutral-400">
                <Icon className="h-3.5 w-3.5" />
                <p className="text-[11px]">{metric.label}</p>
              </div>

              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-semibold text-neutral-900">
                  {metric.value}
                </p>
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${trendColor[metric.trend]}`}
                >
                  <TrendI className="h-2.5 w-2.5" />
                  {metric.trendLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 border-t border-neutral-100 pt-3 text-xs leading-relaxed text-neutral-500">
        {insightText}
      </p>
    </section>
  );
}
