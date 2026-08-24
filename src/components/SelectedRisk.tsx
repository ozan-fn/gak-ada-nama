import {
  MoreVertical,
  CloudRain,
  Thermometer,
  Wind,
  FileText,
  ChevronRight,
  Mountain,
  AlertTriangle,
} from "lucide-react";
import { useMemo } from "react";
import { useUserLocation } from "#/hooks/useUserLocation";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { useDynamicBaseline } from "#/hooks/useDynamicBaseline";
import { getRegionalBaseline } from "#/lib/regionalBaselines";
import type { NearbyReportPin } from "./RiskMap";
import { SelectedRiskSkeleton } from "./skeletons/SelectedRiskSkeleton";

type SelectedRiskProps = {
  selectedLocation?: {
    latitude: number;
    longitude: number;
    city: string;
  } | null;
  nearbyReports?: NearbyReportPin[];
  selectedReport?: NearbyReportPin | null;
  onReportSelect?: (report: NearbyReportPin) => void;
};

export default function SelectedRisk({
  selectedLocation,
  nearbyReports = [],
  selectedReport,
  onReportSelect,
}: SelectedRiskProps) {
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
  if (
    loading ||
    (!selectedLocation && userLocation.loading) ||
    !weather ||
    !aqi
  ) {
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
  const updatedAt = "Baru saja";

  const conditions = [
    { icon: CloudRain, label: "Curah Hujan", value: `${rainProb}%` },
    { icon: Thermometer, label: "Suhu", value: `${temp}°C` },
    { icon: Wind, label: "Kualitas Udara", value: `${aqiValue} AQI` },
    ...(elevation !== null ? [{ icon: Mountain, label: "Ketinggian", value: `${elevation} mdpl` }] : []),
  ];

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
          {nearbyReports.length} Laporan di Sekitar
        </p>

        {selectedReport && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
            <div className="flex items-start gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950">
                <AlertTriangle className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Detail Laporan Terpilih
                </p>
                <h4 className="mt-1 text-sm font-bold leading-snug text-neutral-800">
                  {selectedReport.title}
                </h4>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <span className="text-neutral-500">Kategori</span>
                  <span className="text-right font-semibold text-neutral-700">
                    {selectedReport.category}
                  </span>
                  <span className="text-neutral-500">Urgensi</span>
                  <span className="text-right font-semibold text-amber-700">
                    {selectedReport.urgency}
                  </span>
                  <span className="text-neutral-500">Jarak</span>
                  <span className="text-right font-semibold text-neutral-700">
                    {selectedReport.distanceKm.toFixed(1)} km
                  </span>
                </div>
                <p className="mt-2 border-t border-amber-200/70 pt-2 text-[11px] leading-relaxed text-neutral-600">
                  {selectedReport.locationName}
                </p>
              </div>
            </div>
          </div>
        )}

        {nearbyReports.length > 0 ? (
          <div className="mt-2.5 max-h-64 divide-y divide-neutral-100 overflow-y-auto pr-1">
            {nearbyReports.map((report) => (
              <button
                type="button"
                key={report.id}
                onClick={() => onReportSelect?.(report)}
                className={`flex w-full items-start justify-between gap-3 rounded-md px-1 py-3 text-left transition-colors hover:bg-neutral-50 ${
                  selectedReport?.id === report.id ? "bg-amber-50" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-neutral-700">
                    {report.title}
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    {report.category} · {report.distanceKm.toFixed(1)} km
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                    {report.locationName}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                    {report.urgency}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-300" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-4 text-center">
            <p className="text-xs font-medium text-neutral-600">
              Belum ada laporan di sekitar wilayah ini
            </p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Pilih titik lain pada peta untuk melihat laporan terdekat.
            </p>
          </div>
        )}
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
