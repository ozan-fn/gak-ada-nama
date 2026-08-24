import {
  MoreVertical,
  CloudRain,
  Thermometer,
  Wind,
  FileText,
  ChevronRight,
  Mountain,
} from "lucide-react";
import { useMemo } from "react";
import { useUserLocation } from "#/hooks/useUserLocation";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { useDynamicBaseline } from "#/hooks/useDynamicBaseline";
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
  
  // Memoize activeLocation to prevent infinite re-renders
  const activeLocation = useMemo(() => {
    if (selectedLocation) {
      return selectedLocation;
    }
    // Guard against null coordinates
    if (!userLocation.latitude || !userLocation.longitude) {
      return {
        latitude: -6.2088, // Jakarta fallback
        longitude: 106.8456,
        city: userLocation.city || "Jakarta, DKI Jakarta",
      };
    }
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      city: userLocation.city,
    };
  }, [selectedLocation, userLocation.latitude, userLocation.longitude, userLocation.city]);

  const { weather, aqi, loading } = useEnvironmentData(activeLocation);

  // Fetch DYNAMIC baseline from real APIs (Open-Meteo + AQICN)
  const { baseline: dynamicBaseline, loading: baselineLoading } =
    useDynamicBaseline(
      activeLocation.latitude,
      activeLocation.longitude,
      activeLocation.city,
    );

  // Loading state
  if (loading || userLocation.loading || !weather || !aqi) {
    return <SelectedRiskSkeleton />;
  }

  // Use dynamic baseline if available, otherwise fallback to static regional baseline
  let NORMAL_TEMP: number;
  let NORMAL_RAIN_PROB: number;
  let NORMAL_AQI: number;
  let NORMAL_HUMIDITY: number;

  if (dynamicBaseline && !baselineLoading) {
    // ✅ REAL historical data from APIs!
    NORMAL_TEMP = dynamicBaseline.temp;
    NORMAL_AQI = dynamicBaseline.aqi; // Local area median from nearby stations
    NORMAL_HUMIDITY = dynamicBaseline.humidity;

    // Convert rainSum (mm/day) to rough precipitation probability
    NORMAL_RAIN_PROB = Math.min(
      95,
      Math.round(10 + dynamicBaseline.rainSum * 7),
    );
  } else {
    // ⏳ Fallback to static baseline while loading
    const staticBaseline = getRegionalBaseline(activeLocation.city || "Jakarta, ID");
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
  const elevation = weather.elevation ? Math.round(weather.elevation) : null;

  // Anomaly detection
  const tempAnomaly = temp - NORMAL_TEMP;
  const rainAnomaly = rainProb - NORMAL_RAIN_PROB;
  const aqiAnomaly = aqiValue - NORMAL_AQI;
  const humidityAnomaly = humidity - NORMAL_HUMIDITY;

  // Environmental Risk calculation (weighted composite)
  const tempRisk = Math.abs(tempAnomaly) * 2;
  const rainRisk = Math.max(0, rainAnomaly) * 1.5;
  const aqiRisk = Math.max(0, aqiAnomaly) * 0.8;
  const humidityRisk = Math.abs(humidityAnomaly) * 0.5;

  const score = Math.min(
    100,
    Math.round(tempRisk + rainRisk + aqiRisk + humidityRisk),
  );

  // Calculate risk level
  let level = "Rendah";
  let levelColor = "bg-emerald-50 text-emerald-500";

  if (score >= 70) {
    level = "Tinggi";
    levelColor = "bg-red-50 text-red-500";
  } else if (score >= 50) {
    level = "Sedang";
    levelColor = "bg-amber-50 text-amber-500";
  } else if (score >= 30) {
    level = "Sedang";
    levelColor = "bg-amber-50 text-amber-500";
  }

  const regionName = activeLocation.city || "Wilayah Anda";
  const reportCount = 0; // ponytail: will fetch from backend later
  const updatedAt = "Baru saja";

  const conditions = [
    { icon: CloudRain, label: "Curah Hujan", value: `${rainProb}%` },
    { icon: Thermometer, label: "Suhu", value: `${temp}°C` },
    { icon: Wind, label: "Kualitas Udara", value: `${aqiValue} AQI` },
    ...(elevation !== null ? [{ icon: Mountain, label: "Ketinggian", value: `${elevation} mdpl` }] : []),
  ];

  // ponytail: fake reports for now, backend later
  const reports =
    reportCount > 0
      ? []
      : [{ title: "Belum ada laporan dari komunitas", time: "—" }];

  return (
    <div className="flex h-full w-full flex-col bg-white p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-neutral-400">
            Wilayah Terpilih
          </p>
          <h3 className="text-base font-bold text-neutral-800">{regionName}</h3>
        </div>

        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100"
          aria-label="Opsi lainnya"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Score */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-start">
          <span className="text-4xl font-bold tracking-tight text-neutral-900">
            {score}
          </span>
          <span className="ml-1 text-lg font-medium text-neutral-600">
            /100
          </span>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${levelColor}`}
        >
          Risiko {level}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        Kondisi lingkungan saat ini menunjukkan peningkatan risiko dibanding
        pola normal. Terakhir diperbarui {updatedAt}.
      </p>

      {/* Conditions */}
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-4">
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

      {/* Reports */}
      <div className="mt-6 flex flex-1 flex-col border-t border-neutral-100 pt-4">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
          <FileText className="h-3.5 w-3.5" />
          {reports.length} Laporan Mendukung
        </p>

        <div className="mt-2.5 flex flex-col divide-y divide-neutral-100">
          {reports.map((report) => (
            <div
              key={report.title}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-neutral-700">
                  {report.title}
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  {report.time}
                </p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <button
        type="button"
        className="mt-6 flex h-9 w-full items-center justify-center rounded-lg bg-neutral-100 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
      >
        Lihat Laporan Lengkap
      </button>
    </div>
  );
}
