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

  // UV Index categorization
  let uvLabel = "Rendah";
  let uvColor = "text-green-500";
  let uvInsight =
    "Aman untuk aktivitas luar ruangan tanpa perlindungan khusus.";

  if (uvIndex >= 11) {
    uvLabel = "Ekstrem";
    uvColor = "text-purple-500";

    uvInsight = "Bahaya tinggi — hindari sinar matahari langsung.";
  } else if (uvIndex >= 8) {
    uvLabel = "Sangat Tinggi";
    uvColor = "text-red-500";

    uvInsight = "Hindari paparan langsung. Gunakan tabir surya SPF 50+.";
  } else if (uvIndex >= 6) {
    uvLabel = "Tinggi";
    uvColor = "text-orange-500";

    uvInsight = "Perlindungan diperlukan — gunakan tabir surya SPF 30+.";
  } else if (uvIndex >= 3) {
    uvLabel = "Sedang";
    uvColor = "text-yellow-500";

    uvInsight =
      "Gunakan tabir surya dan topi saat beraktivitas di luar ruangan.";
  }

  const isRaining = weather.current.precipitation > 0;
  const isCloudy = weather.current.cloudCover > 70;

  let weatherIcon = Sun;
  let weatherLabel = "Cerah";
  let iconColor = "text-amber-500";

  let insight =
    uvIndex >= 6
      ? uvInsight
      : "Kondisi udara cerah, cocok untuk aktivitas luar ruangan.";

  // Insight styling
  let insightContainer =
    "border-emerald-200 bg-emerald-50/80 " +
    "dark:border-emerald-900/50 dark:bg-emerald-900/20";

  let insightText = "text-emerald-900 dark:text-emerald-200";

  if (isRaining) {
    weatherIcon = CloudRain;
    weatherLabel = "Hujan";
    iconColor = "text-blue-500";

    insight = "Bawa payung — hujan terdeteksi di wilayah Anda saat ini.";

    insightContainer =
      "border-blue-200 bg-blue-50/80 " +
      "dark:border-blue-900/50 dark:bg-blue-900/20";

    insightText = "text-blue-900 dark:text-blue-200";
  } else if (isCloudy) {
    weatherIcon = Cloud;
    weatherLabel = "Berawan";
    iconColor = "text-neutral-500 dark:text-neutral-400";

    insight = "Langit didominasi awan, suhu terasa lebih sejuk dari biasanya.";

    insightContainer =
      "border-neutral-200 bg-neutral-100/80 " +
      "dark:border-neutral-700 dark:bg-neutral-700/40";

    insightText = "text-neutral-700 dark:text-neutral-200";
  } else if (uvIndex >= 11) {
    insightContainer =
      "border-purple-200 bg-purple-50/80 " +
      "dark:border-purple-900/50 dark:bg-purple-900/20";

    insightText = "text-purple-900 dark:text-purple-200";
  } else if (uvIndex >= 8) {
    insightContainer =
      "border-red-200 bg-red-50/80 " +
      "dark:border-red-900/50 dark:bg-red-900/20";

    insightText = "text-red-900 dark:text-red-200";
  } else if (uvIndex >= 6) {
    insightContainer =
      "border-orange-200 bg-orange-50/80 " +
      "dark:border-orange-900/50 dark:bg-orange-900/20";

    insightText = "text-orange-900 dark:text-orange-200";
  } else if (uvIndex >= 3) {
    insightContainer =
      "border-yellow-200 bg-yellow-50/80 " +
      "dark:border-yellow-900/50 dark:bg-yellow-900/20";

    insightText = "text-yellow-900 dark:text-yellow-200";
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
      value: `${uvIndex} - ${uvLabel}`,
      color: uvColor,
    },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-white p-2 dark:bg-neutral-800 md:p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
            Cuaca Saat Ini
          </p>

          <h2 className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Kondisi Cuaca
          </h2>
        </div>

        <WeatherIcon className={`h-8 w-8 ${iconColor}`} strokeWidth={1.8} />
      </div>

      {/* Main Weather */}
      <div className="mt-4 flex items-center gap-4">
        {/* Temperature */}
        <div className="flex items-start">
          <span className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {temp}
          </span>

          <span className="ml-1 mt-1 text-lg font-medium text-neutral-500 dark:text-neutral-400">
            °C
          </span>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-neutral-200 dark:bg-neutral-700" />

        {/* Status */}
        <div>
          <p className="text-base font-bold text-neutral-800 dark:text-neutral-100">
            {weatherLabel}
          </p>

          <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
            Terasa seperti {feelsLike}°C
          </p>
        </div>
      </div>

      {/* Insight Bar */}
      <div
        className={`
          mt-3 rounded-lg border px-3 py-2
          ${insightContainer}
        `}
      >
        <p
          className={`
            text-[11px] leading-relaxed
            ${insightText}
          `}
        >
          {insight}
        </p>
      </div>

      {/* Weather Details */}
      <div className="mt-4 grid grid-cols-4 divide-x divide-neutral-100 border-t border-neutral-100 pt-3 dark:divide-neutral-700 dark:border-neutral-700">
        {details.map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="flex min-w-0 flex-col items-center px-1 first:pl-0 last:pr-0"
          >
            <Icon className={`mb-1.5 h-4 w-4 ${color}`} strokeWidth={2} />

            <span className="text-center text-[10px] text-neutral-400 dark:text-neutral-500">
              {label}
            </span>

            <span className="mt-0.5 text-xs font-bold text-neutral-900 dark:text-neutral-100">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
