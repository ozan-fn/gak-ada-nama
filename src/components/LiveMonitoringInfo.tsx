import { MapPin, Thermometer, Wind, Droplets, AlertTriangle } from "lucide-react";
import type { MonitoringPoint } from "@/types/livemap";
import { getAqiColorClass } from "@/types/livemap";

interface LiveMonitoringInfoProps {
  point: MonitoringPoint | null;
}

export function LiveMonitoringInfo({ point }: LiveMonitoringInfoProps) {
  if (!point) {
    return (
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex items-center justify-center p-8 text-center">
          <div>
            <MapPin className="mx-auto size-12 text-neutral-300 dark:text-neutral-600" />
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              Pilih titik monitoring di peta
            </p>
          </div>
        </div>
      </section>
    );
  }

  const aqiColorClass = getAqiColorClass(point.aqiColor);
  const aqiLevel = point.aqiStatus;

  const conditions = [
    {
      icon: Thermometer,
      label: "Suhu",
      value: `${point.temp}°C`,
      color: "text-orange-500",
    },
    {
      icon: Droplets,
      label: "Humiditas",
      value: `${point.humidity}%`,
      color: "text-blue-500",
    },
    {
      icon: Wind,
      label: "Angin",
      value: `${point.wind}`,
      suffix: "km/j",
      color: "text-teal-500",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-900/30">
            <MapPin className="size-4 text-sky-600 dark:text-sky-400" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
              Stasiun monitoring
            </p>

            <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
              <h3 className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                {point.name}
              </h3>

              <span className="size-1 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />

              <span className="shrink-0 text-[10px] text-neutral-400 dark:text-neutral-500">
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AQI Score */}
      <div className="px-4 pb-3.5 sm:px-5">
        <div className="rounded-xl bg-neutral-50 px-3.5 py-3 dark:bg-neutral-700">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-400">
                Kualitas udara (AQI)
              </p>

              <div className="mt-1 flex items-baseline">
                <span className="font-mono text-[28px] font-semibold leading-none tracking-tight text-neutral-900 dark:text-neutral-100">
                  {point.aqi}
                </span>

                <span className="ml-1 text-[11px] text-neutral-400 dark:text-neutral-400">
                  US AQI
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <span className={`inline-block rounded-full px-3 py-1.5 text-[10px] font-medium ${aqiColorClass}`}>
                {aqiLevel}
              </span>
            </div>
          </div>

          <p className="mt-2.5 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Kualitas udara {aqiLevel.toLowerCase()} berdasarkan standar US EPA Air Quality Index.
          </p>
        </div>
      </div>

      {/* Environmental Metrics */}
      <div className="border-t border-neutral-100 px-4 py-1 dark:border-neutral-700">
        <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-700">
          {conditions.map(({ icon: Icon, label, value, suffix, color }) => (
            <div key={label} className="min-w-0 px-2.5 py-3">
              <div className="flex items-center gap-1.5">
                <Icon className={`size-3 shrink-0 ${color}`} />

                <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {label}
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-[14px] font-semibold leading-none text-neutral-900 dark:text-neutral-100">
                  {value}
                </span>

                {suffix && (
                  <span className="text-[9px] font-medium text-neutral-400 dark:text-neutral-500">
                    {suffix}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues Alert */}
      {point.issues > 0 && (
        <div className="border-t border-neutral-100 px-4 py-3.5 dark:border-neutral-700 sm:px-5">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 dark:bg-amber-900/20">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />

            <div>
              <p className="text-[10px] font-semibold text-amber-900 dark:text-amber-400">
                {point.issues} Masalah Terdeteksi
              </p>

              <p className="mt-0.5 text-[10px] leading-relaxed text-amber-700 dark:text-amber-500">
                Terdapat laporan masalah lingkungan di wilayah ini.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
