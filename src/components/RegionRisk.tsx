import {
  CloudRain,
  Thermometer,
  Wind,
  MoreVertical,
  ArrowRight,
} from "lucide-react";
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

  // Fetch DYNAMIC baseline from real APIs (Open-Meteo + AQICN)
  const { baseline: dynamicBaseline, loading: baselineLoading } = useDynamicBaseline(
    userLocation.latitude,
    userLocation.longitude,
    userLocation.city
  );

  if (loading || !weather || !aqi) {
    return <RegionRiskSkeleton />;
  }

  // Determine which city to use for baseline
  let cityForBaseline: string | null = null;
  
  if (location && 'city' in location) {
    cityForBaseline = location.city;
  } else {
    cityForBaseline = userLocation.city;
  }

  // Use dynamic baseline if available, otherwise fallback to static regional baseline
  let NORMAL_TEMP: number;
  let NORMAL_RAIN_PROB: number;
  let NORMAL_AQI: number;
  let NORMAL_HUMIDITY: number;

  if (dynamicBaseline && !baselineLoading) {
    // ✅ REAL historical data from APIs!
    NORMAL_TEMP = dynamicBaseline.temp;
    NORMAL_AQI = dynamicBaseline.aqi;       // Local area median from nearby stations
    NORMAL_HUMIDITY = dynamicBaseline.humidity;
    
    // Convert rainSum (mm/day) to rough precipitation probability
    // Formula: higher daily rainfall = higher probability of rain
    // 0mm = ~10%, 5mm = ~50%, 10mm = ~80%, 20mm+ = ~95%
    NORMAL_RAIN_PROB = Math.min(95, Math.round(10 + dynamicBaseline.rainSum * 7));
  } else {
    // ⏳ Fallback to static baseline while loading
    const staticBaseline = getRegionalBaseline(cityForBaseline);
    NORMAL_TEMP = staticBaseline.temp;
    NORMAL_RAIN_PROB = staticBaseline.rainProb;
    NORMAL_AQI = staticBaseline.aqi;
    NORMAL_HUMIDITY = staticBaseline.humidity;
  }

  // Current values
  const temp = Math.round(weather.current.temperature);
  const rainProb = Math.round(weather.daily.precipitationProbability[0] || 0);
  const aqiValue = aqi.aqi;
  const humidity = Math.round(weather.current.humidity);

  // Anomaly detection
  const tempAnomaly = temp - NORMAL_TEMP;
  const rainAnomaly = rainProb - NORMAL_RAIN_PROB;
  const aqiAnomaly = aqiValue - NORMAL_AQI;
  const humidityAnomaly = humidity - NORMAL_HUMIDITY;

  // Layer 1: Environmental Risk (weighted composite)
  const tempRisk = Math.abs(tempAnomaly) * 2;
  const rainRisk = Math.max(0, rainAnomaly) * 1.5;
  const aqiRisk = Math.max(0, aqiAnomaly) * 0.8;
  const humidityRisk = Math.abs(humidityAnomaly) * 0.5;

  const score = Math.min(
    100,
    Math.round(tempRisk + rainRisk + aqiRisk + humidityRisk),
  );

  // Real report count from API (currently 0, will fetch from backend later)
  const reportCount = 0;

  // Calculate risk level based on composite Environmental Risk
  let level = "Rendah";
  let levelColor = "text-emerald-600";

  if (score >= 70) {
    level = "Tinggi";
    levelColor = "text-red-600";
  } else if (score >= 50) {
    level = "Sedang";
    levelColor = "text-amber-600";
  } else if (score >= 30) {
    level = "Sedang";
    levelColor = "text-amber-600";
  }

  const conditions = [
    { icon: CloudRain, label: "Curah Hujan", value: `${rainProb}%` },
    { icon: Thermometer, label: "Suhu", value: `${temp}°C` },
    { icon: Wind, label: "Kualitas Udara", value: `${aqiValue} AQI` },
  ];

  return (
    <div className="flex h-full w-full flex-col justify-between bg-white p-6">
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

        {/* More Button */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100"
          aria-label="Opsi lainnya"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
        Kondisi lingkungan saat ini menunjukkan{" "}
        {score >= 50
          ? "peningkatan risiko dibanding pola normal"
          : "kondisi dalam batas normal"}
        .
      </p>

      {/* Conditions */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {conditions.map(({ icon: Icon, label, value }) => (
          <div key={label}>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </p>
            <p className="mt-1.5 text-base font-bold text-neutral-900">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <button
        type="button"
        className="mt-6 flex h-9 w-full items-center justify-between rounded-lg bg-neutral-100 px-3.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
      >
        <span>
          {reportCount > 0
            ? `${reportCount} laporan mendukung`
            : "Belum ada laporan komunitas"}
        </span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
