import { useState, useEffect } from "react";
import { Skeleton } from "./ui/skeleton";
import { CloudRain, Settings } from "lucide-react";

export default function RainfallWidget() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    const skeletonBars = Array.from(
      { length: 24 },
      (_, i) => `skeleton-bar-${i}`,
    );
    const skeletonLabels = Array.from(
      { length: 6 },
      (_, i) => `skeleton-label-${i}`,
    );

    return (
      <div className="relative mx-auto w-full rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-6 rounded-md" />
        </div>
        <div className="mt-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-24 mt-1" />
        </div>
        <div className="mt-3 flex h-24 items-end gap-0.5 px-2">
          {skeletonBars.map((id) => (
            <Skeleton key={id} className="h-16 flex-1 rounded-t-sm" />
          ))}
        </div>
        <div className="mt-2 flex justify-between px-1">
          {skeletonLabels.map((id) => (
            <Skeleton key={id} className="h-2 w-4" />
          ))}
        </div>
      </div>
    );
  }

  // Dummy data: 24 hours with varied precipitation
  const currentHour = new Date().getHours();
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = (currentHour - 12 + i) % 24;
    const normalizedHour = hour < 0 ? hour + 24 : hour;

    // Generate varied data to show all color ranges
    let actualMm = 0;
    const rand = Math.random();

    if (rand > 0.7) {
      // 30% chance: no rain
      actualMm = 0;
    } else if (rand > 0.4) {
      // 30% chance: light rain (0.1 - 2mm) -> sky-300
      actualMm = Math.random() * 1.9 + 0.1;
    } else {
      // 40% chance: moderate to heavy rain (2 - 5mm) -> sky-400/sky-500
      actualMm = Math.random() * 3 + 2;
    }

    return {
      time: `${normalizedHour.toString().padStart(2, "0")}.00`,
      mm: actualMm === 0 ? 0.01 : actualMm,
      actualMm,
      isNow: i === 12,
    };
  });

  const totalRain = hours.reduce((sum, h) => sum + h.actualMm, 0);
  const maxMm = Math.max(...hours.map((h) => h.mm), 1);

  return (
    <div className="relative mx-auto w-full max-w-md rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50">
            <CloudRain className="h-4.5 w-4.5 text-sky-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-none text-neutral-900">
              Intensitas Hujan
            </h3>
            <p className="mt-1 text-[10px] leading-none text-neutral-500">
              Estimasi curah hujan per jam
            </p>
          </div>
        </div>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          aria-label="Rainfall settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Summary */}
      <div className="mt-3">
        <p className="text-[9px] font-medium uppercase tracking-wide text-neutral-400">
          Total Curah Hujan
        </p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-bold leading-none text-neutral-900">
            {totalRain.toFixed(1)}
          </p>
          <span className="text-[11px] text-neutral-400">mm hari ini</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="relative mt-3 flex h-24 w-full items-end gap-0.5 px-2">
        {hours.map((hour) => {
          const heightPercent = (hour.mm / maxMm) * 100;

          return (
            <div key={hour.time} className="relative h-full flex-1">
              {/* "Sekarang" marker: label + dashed vertical line */}
              {hour.isNow && (
                <>
                  <div className="absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-[10px] font-semibold text-red-500">
                      Sekarang
                    </span>
                  </div>
                  <div className="absolute -top-1 bottom-0 left-1/2 z-0 w-0 -translate-x-1/2 border-l border-dashed border-red-300" />
                </>
              )}
              {/* Bar */}
              <div
                className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-300 ${
                  hour.actualMm <= 0
                    ? "bg-neutral-200"
                    : hour.actualMm <= 2
                      ? "bg-sky-300"
                      : "bg-sky-500"
                } ${hour.isNow ? "ring-2 ring-red-400" : ""}`}
                style={{
                  height: `${Math.max(heightPercent, 10)}%`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Time labels - every 4 hours */}
      <div className="mt-2 flex justify-between px-1">
        {hours
          .filter((_, i) => i % 4 === 0)
          .map((hour) => (
            <span key={hour.time} className="text-[9px] text-neutral-400">
              {hour.time}
            </span>
          ))}
      </div>
    </div>
  );
}
