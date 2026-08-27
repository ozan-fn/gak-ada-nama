import {
  CloudRain,
  Droplets,
  Wind,
  Gauge,
  Cloud,
  Sun,
  Sunrise,
} from "lucide-react";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { WeatherInformationSkeleton } from "./skeletons/WeatherInformationSkeleton";

type LocationParams =
  { latitude: number; longitude: number } | { city: string };

type WeatherInformationProps = {
  location?: LocationParams;
};

export default function WeatherInformation({
  location,
}: WeatherInformationProps) {
  const { weather, aqi, loading } = useEnvironmentData(location);

  if (loading || !weather) {
    return <WeatherInformationSkeleton />;
  }

  const temp = Math.round(weather.current.temperature);
  const feelsLike = Math.round(
    weather.current.apparentTemperature ?? weather.current.temperature,
  );
  const humidity = Math.round(weather.current.humidity);
  const windSpeed = Math.round(weather.current.windSpeed * 3.6);
  const pressure = aqi?.pressure || 1013;
  const uvIndex = Math.round(weather.current.uvIndex ?? 0);

  const isRaining = weather.current.precipitation > 0;
  const isCloudy = weather.current.cloudCover > 70;

  let weatherIcon = Sun;
  let weatherLabel = "Cerah";
  let iconColor = "text-amber-500";
  let insight = "Kondisi udara cerah, cocok untuk aktivitas luar ruangan.";

  if (isRaining) {
    weatherIcon = CloudRain;
    weatherLabel = "Hujan";
    iconColor = "text-blue-500";
    insight = "Bawa payung — hujan terdeteksi di wilayah Anda saat ini.";
  } else if (isCloudy) {
    weatherIcon = Cloud;
    weatherLabel = "Berawan";
    iconColor = "text-neutral-500";
    insight = "Langit didominasi awan, suhu terasa lebih sejuk dari biasanya.";
  }

  const WeatherIcon = weatherIcon;

  const details = [
    {
      icon: Droplets,
      label: "Kelembapan",
      value: `${humidity}%`,
      color: "text-blue-500",
    },
    {
      icon: Wind,
      label: "Kec. Angin",
      value: `${windSpeed} km/jam`,
      color: "text-teal-500",
    },
    {
      icon: Gauge,
      label: "Tekanan",
      value: `${pressure} hPa`,
      color: "text-orange-500",
    },
    {
      icon: Sunrise,
      label: "Indeks UV",
      value: `${uvIndex}`,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-white p-2 md:p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-neutral-400">
            Cuaca Saat Ini
          </p>

          <h2 className="mt-0.5 text-sm font-semibold text-neutral-900">
            Kondisi Cuaca
          </h2>
        </div>

        <WeatherIcon className={`h-8 w-8 ${iconColor}`} strokeWidth={1.8} />
      </div>

      {/* Main Weather */}
      <div className="mt-4 flex items-center gap-4">
        {/* Temperature */}
        <div className="flex items-start">
          <span className="text-5xl font-bold tracking-tight text-neutral-900">
            {temp}
          </span>

          <span className="ml-1 mt-1 text-lg font-medium text-neutral-500">
            °C
          </span>
        </div>

        <div className="h-10 w-px bg-neutral-200" />

        {/* Status */}
        <div>
          <p className="text-base font-bold text-neutral-800">{weatherLabel}</p>

          <p className="mt-0.5 text-[11px] text-neutral-400">
            Terasa seperti {feelsLike}°C
          </p>
        </div>
      </div>

      {/* Insight bar */}
      <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
        <p className="text-[11px] leading-relaxed text-emerald-700">
          {insight}
        </p>
      </div>

      {/* Weather Details */}
      <div className="mt-4 grid grid-cols-4 divide-x divide-neutral-100 border-t border-neutral-100 pt-3">
        {details.map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="flex min-w-0 flex-col items-center px-1 first:pl-0 last:pr-0"
          >
            <Icon className={`mb-1.5 h-4 w-4 ${color}`} />

            <span className="text-center text-[10px] text-neutral-400">
              {label}
            </span>

            <span className="mt-0.5 text-xs font-bold text-neutral-900">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
