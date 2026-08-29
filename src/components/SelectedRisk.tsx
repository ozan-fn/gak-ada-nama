import { MapPin, Mountain, Thermometer, Wind, Droplets } from "lucide-react";
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

  const levelStyles =
    score >= 70
      ? {
          bg: "bg-red-50 dark:bg-red-900/20",
          text: "text-red-600 dark:text-red-400",
          bar: "bg-red-500 dark:bg-red-400",
        }
      : score >= 30
        ? {
            bg: "bg-amber-50 dark:bg-amber-900/20",
            text: "text-amber-600 dark:text-amber-400",
            bar: "bg-amber-500 dark:bg-amber-400",
          }
        : {
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            text: "text-emerald-600 dark:text-emerald-400",
            bar: "bg-emerald-500 dark:bg-emerald-400",
          };

  const conditions = [
    {
      icon: Thermometer,
      label: "Suhu",
      value: `${temperature}°C`,
      color: "text-orange-500",
    },
    {
      icon: Droplets,
      label: "Humiditas",
      value: `${humidity}%`,
      color: "text-blue-500",
    },
    {
      icon: Wind,
      label: "Udara",
      value: `${aqiValue}`,
      suffix: "AQI",
      color: "text-teal-500",
    },
    ...(elevation !== null
      ? [
          {
            icon: Mountain,
            label: "Ketinggian",
            value: `${elevation}`,
            suffix: "mdpl",
            color: "text-emerald-500",
          },
        ]
      : []),
  ];

  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-neutral-200
        bg-white
        dark:border-neutral-700
        dark:bg-neutral-800
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Location Icon */}
          <div
            className="
              flex
              size-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-sky-50
              dark:bg-sky-900/30
            "
          >
            <MapPin className="size-4 text-sky-600 dark:text-sky-400" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
              Kondisi lingkungan
            </p>

            <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
              <h3
                className="
                  truncate
                  text-[13px]
                  font-semibold
                  text-neutral-900
                  dark:text-neutral-100
                "
              >
                {activeLocation.city || "Wilayah Anda"}
              </h3>

              <span className="size-1 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />

              <span className="shrink-0 text-[10px] text-neutral-400 dark:text-neutral-500">
                Saat ini
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="px-4 pb-3.5 sm:px-5">
        <div
          className="
            rounded-xl
            bg-neutral-50
            px-3.5
            py-3
            dark:bg-neutral-700
          "
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-400">
                Skor kondisi
              </p>

              <div className="mt-1 flex items-baseline">
                <span
                  className="
                    font-mono
                    text-[28px]
                    font-semibold
                    leading-none
                    tracking-tight
                    text-neutral-900
                    dark:text-neutral-100
                  "
                >
                  {score}
                </span>

                <span className="ml-1 text-[11px] text-neutral-400 dark:text-neutral-400">
                  / 100
                </span>
              </div>
            </div>

            <div className="w-24 shrink-0">
              <div className="flex justify-end">
                <span className={`text-[10px] font-medium ${levelStyles.text}`}>
                  {level}
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-600">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${levelStyles.bar}`}
                  style={{
                    width: `${score}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <p className="mt-2.5 max-w-125 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Skor menunjukkan seberapa jauh kondisi cuaca dan kualitas udara saat
            ini dari pola normal wilayah.
          </p>
        </div>
      </div>

      {/* Environmental Metrics */}
      <div className="border-t border-neutral-100 px-4 py-1 dark:border-neutral-700">
        <div
          className={`
            grid
            ${
              conditions.length === 4
                ? "grid-cols-2 sm:grid-cols-4"
                : "grid-cols-3"
            }
            divide-x
            divide-neutral-100
            dark:divide-neutral-700
          `}
        >
          {conditions.map(
            ({ icon: Icon, label, value, suffix, color }, index) => (
              <div
                key={label}
                className={`
                  min-w-0
                  px-2.5
                  py-3

                  ${
                    conditions.length === 4 && index < 2
                      ? "border-b border-neutral-100 dark:border-neutral-700 sm:border-b-0"
                      : ""
                  }
                `}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`size-3 shrink-0 ${color}`} />

                  <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400">
                    {label}
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline gap-1">
                  <span
                    className="
                      text-[14px]
                      font-semibold
                      leading-none
                      text-neutral-900
                      dark:text-neutral-100
                    "
                  >
                    {value}
                  </span>

                  {suffix && (
                    <span className="text-[9px] font-medium text-neutral-400 dark:text-neutral-500">
                      {suffix}
                    </span>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
