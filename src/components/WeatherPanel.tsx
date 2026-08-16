import type { LucideIcon } from "lucide-react";
import { Droplet, Wind, Gauge, Eye, Sun, CloudSun, Cloud } from "lucide-react";

interface WeatherData {
  temp: number;
  condition: string;
  feelsLike: number;
  humidity: number;
  wind: number;
  pressure: number;
  visibility: number;
}

interface HourlyItem {
  label: string;
  icon: LucideIcon;
  temp: number;
}

interface WeatherPanelProps {
  weather: WeatherData;
  hourly: HourlyItem[];
}

const defaultHourly: HourlyItem[] = [
  { label: "Now", icon: Sun, temp: 28 },
  { label: "11 AM", icon: Sun, temp: 29 },
  { label: "12 PM", icon: CloudSun, temp: 30 },
  { label: "1 PM", icon: Sun, temp: 30 },
  { label: "2 PM", icon: Cloud, temp: 29 },
  { label: "3 PM", icon: Cloud, temp: 28 },
  { label: "4 PM", icon: Cloud, temp: 27 },
];

export default function WeatherPanel({
  weather,
  hourly = defaultHourly,
}: WeatherPanelProps) {
  return (
    <div className="absolute bottom-3 left-3 z-10 w-104 overflow-hidden rounded-2xl border border-white/40 bg-white/60 shadow-xl shadow-black/5 backdrop-blur-xl sm:w-120">
      {/* subtle top sheen */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/40 via-transparent to-transparent" />

      {/* Current conditions */}
      <div className="relative grid grid-cols-2 gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/50 backdrop-blur-sm">
            <Sun
              className="h-8 w-8 text-amber-500 drop-shadow-sm"
              strokeWidth={1.5}
            />
          </div>
          <div>
            <p className="text-4xl font-bold leading-none text-neutral-900 drop-shadow-sm">
              {weather.temp}°
            </p>
            <p className="mt-1.5 text-sm font-semibold text-neutral-700">
              {weather.condition}
            </p>
            <p className="text-xs text-neutral-500">
              Terasa seperti {weather.feelsLike}°
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-3 border-l border-white/50 pl-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/50">
              <Droplet className="h-3.5 w-3.5 text-sky-500" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                Kelembapan
              </p>
              <p className="text-sm font-bold text-neutral-900">
                {weather.humidity}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/50">
              <Wind className="h-3.5 w-3.5 text-neutral-600" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                Angin
              </p>
              <p className="text-sm font-bold text-neutral-900">
                {weather.wind} km/h
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/50">
              <Gauge className="h-3.5 w-3.5 text-neutral-600" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                Tekanan
              </p>
              <p className="text-sm font-bold text-neutral-900">
                {weather.pressure} hPa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/50">
              <Eye className="h-3.5 w-3.5 text-neutral-600" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                Jarak Pandang
              </p>
              <p className="text-sm font-bold text-neutral-900">
                {weather.visibility} km
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly strip */}
      <div className="relative grid grid-cols-7 gap-1 border-t border-white/50 bg-white/30 px-2 py-3">
        {hourly.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`flex flex-col items-center gap-1.5 rounded-xl py-2 transition-colors ${
                i === 0 ? "bg-white/70 shadow-sm" : "hover:bg-white/40"
              }`}
            >
              <span
                className={`text-[11px] font-semibold ${
                  i === 0 ? "text-amber-600" : "text-neutral-500"
                }`}
              >
                {item.label}
              </span>
              <Icon
                className={`h-5 w-5 ${
                  i === 0 ? "text-amber-500" : "text-neutral-500"
                }`}
                strokeWidth={1.5}
              />
              <span className="text-xs font-bold text-neutral-900">
                {item.temp}°
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
