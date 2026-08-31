import { Wind, Gauge, Droplet, Settings, Cloud } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

export default function WeatherWidget() {
  const [pressure, setPressure] = useState(1010);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const newPressure = Math.floor(Math.random() * 11) + 1005;
      setPressure(newPressure);
    }, 180000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initialPressure = Math.floor(Math.random() * 11) + 1005;
    setPressure(initialPressure);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="relative mx-auto max-w-sm rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-7 w-16" />
            <div className="space-y-1">
              <Skeleton className="h-2 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
          <Skeleton className="h-6 w-6 rounded-md" />
        </div>
        <div className="mt-3 flex h-20 items-end gap-1">
          {Array.from({ length: 14 }, (_, i) => (
            <Skeleton key={`bar-${i}`} className="h-12 flex-1 rounded-sm" />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={`stat-${i}`} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const precipitationData = [
    { time: "08:00", mm: 0.01, actualMm: 0 },
    { time: "09:00", mm: 0.5, actualMm: 0.5 },
    { time: "10:00", mm: 1.2, actualMm: 1.2 },
    { time: "11:00", mm: 0.8, actualMm: 0.8 },
    { time: "12:00", mm: 2.5, actualMm: 2.5 },
    { time: "13:00", mm: 3.8, actualMm: 3.8 },
    { time: "14:00", mm: 4.2, actualMm: 4.2 },
    { time: "15:00", mm: 3.5, actualMm: 3.5 },
    { time: "16:00", mm: 2.1, actualMm: 2.1 },
    { time: "17:00", mm: 1.5, actualMm: 1.5 },
    { time: "18:00", mm: 0.6, actualMm: 0.6 },
    { time: "19:00", mm: 0.3, actualMm: 0.3 },
    { time: "20:00", mm: 0.01, actualMm: 0 },
    { time: "21:00", mm: 0.01, actualMm: 0 },
  ];

  return (
    <div className="relative mx-auto w-full max-w-sm rounded-xl border border-neutral-200/80 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50">
            <Cloud className="h-4.5 w-4.5 text-sky-500" />
          </div>
          <div className="flex items-start">
            <span className="text-2xl font-semibold leading-none tracking-tight text-neutral-900">
              28
            </span>
            <span className="ml-0.5 text-[11px] font-medium text-neutral-500">
              °C
            </span>
          </div>
          <div className="ml-0.5 border-l border-neutral-200 pl-2">
            <p className="text-[9px] font-medium leading-none text-neutral-400">
              Cuaca Saat Ini
            </p>
            <p className="mt-1 text-xs font-semibold leading-none text-neutral-700">
              Berawan Sebagian
            </p>
          </div>
        </div>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          aria-label="Weather settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex h-15 w-full items-end gap-0.5 px-2">
        {precipitationData.map((d) => (
          <div
            key={d.time}
            className={`flex-1 rounded-t transition-all duration-300 ${
              d.actualMm <= 0
                ? "bg-neutral-200/60"
                : d.actualMm > 2
                  ? "bg-sky-400"
                  : "bg-sky-300"
            }`}
            style={{
              height: `${Math.max((d.mm / 5) * 100, 8)}%`,
            }}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/60 px-2.5 py-1.5">
          <div className="flex items-center gap-1.5 text-[9px] font-medium text-neutral-400">
            <Droplet className="h-3 w-3" />
            <span>Kelembapan</span>
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-tight tracking-tight text-neutral-800">
            75%
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/60 px-2.5 py-1.5">
          <div className="flex items-center gap-1.5 text-[9px] font-medium text-neutral-400">
            <Wind className="h-3 w-3" />
            <span>Angin</span>
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-tight tracking-tight text-neutral-800">
            12
            <span className="ml-0.5 text-[9px] font-medium text-neutral-400">
              km/j
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/60 px-2.5 py-1.5 transition-all duration-500">
          <div className="flex items-center gap-1.5 text-[9px] font-medium text-neutral-400">
            <Gauge className="h-3 w-3" />
            <span>Tekanan</span>
          </div>
          <p className="mt-0.5 text-sm font-semibold leading-tight tracking-tight text-neutral-800 transition-all duration-500">
            {pressure}
            <span className="ml-0.5 text-[9px] font-medium text-neutral-400">
              hPa
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
