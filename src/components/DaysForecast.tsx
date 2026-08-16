import {
  MoreVertical,
  CloudDrizzle,
  CloudRain,
  CloudSun,
  Sun,
} from "lucide-react";

const forecastData = [
  {
    date: 13,
    day: "Sen",
    icon: CloudDrizzle,
    degree: 22,
    color: "text-sky-400",
  },
  { date: 14, day: "Sel", icon: CloudRain, degree: 23, color: "text-blue-500" },
  {
    date: 15,
    day: "Rab",
    icon: CloudDrizzle,
    degree: 23,
    color: "text-sky-400",
  },
  { date: 16, day: "Kam", icon: Sun, degree: 23, color: "text-amber-500" },
  { date: 17, day: "Jum", icon: CloudSun, degree: 21, color: "text-amber-400" },
  {
    date: 18,
    day: "Sab",
    icon: CloudDrizzle,
    degree: 22,
    color: "text-sky-400",
  },
  {
    date: 19,
    day: "Min",
    icon: CloudDrizzle,
    degree: 22,
    color: "text-sky-400",
  },
];

export default function DaysForecast() {
  return (
    <div className="flex h-full w-full flex-col justify-between p-5">
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Prakiraan 7 Hari
            </h2>
            <span className="rounded-md border border-neutral-200 bg-neutral-100/80 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
              Mei 2026
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
            Pantau prakiraan cuaca 7 hari ke depan, diperbarui secara berkala.
          </p>
        </div>

        {/* More Button */}
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-neutral-400"
          aria-label="Opsi lainnya"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* 7-Day Strip */}
      <div className="mt-3 grid grid-cols-7 gap-1">
        {forecastData.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.date}
              className="flex flex-col items-center gap-1 rounded-lg py-2 transition-colors hover:bg-neutral-100/60 dark:hover:bg-neutral-800/50"
            >
              <span className="text-[11px] font-bold tracking-wide text-neutral-900 dark:text-neutral-100">
                {item.date}
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {item.day}
              </span>

              {/* Icon Cuaca Berwarna */}
              <div className="my-0.5 flex h-6 w-6 items-center justify-center">
                <Icon className={`h-5 w-5 ${item.color}`} strokeWidth={2} />
              </div>

              <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                {item.degree}°
              </span>
            </div>
          );
        })}
      </div>

      {/* Analyze with AI */}
      <button
        type="button"
        className="mt-4 flex h-8 w-full items-center justify-center rounded-lg bg-neutral-100 px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
      >
        <span>Analisis dengan AI</span>
      </button>
    </div>
  );
}
