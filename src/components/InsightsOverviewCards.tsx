import {
  FileText,
  MapPin,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

type InsightsOverviewCardsProps = {
  totalReports: number;
  totalInsights: number;
  highImpactCount: number;
  trendDirection: "up" | "down" | "stable";
};

export default function InsightsOverviewCards({
  totalReports,
  totalInsights,
  highImpactCount,
  trendDirection,
}: InsightsOverviewCardsProps) {
  const trendConfig = {
    up: {
      label: "Meningkat",
      icon: TrendingUp,
      iconBg: "bg-red-500/10 dark:bg-red-500/20",
      iconColor: "text-red-600 dark:text-red-400",
      valueColor: "text-red-600 dark:text-red-400",
    },
    down: {
      label: "Menurun",
      icon: TrendingDown,
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    stable: {
      label: "Stabil",
      icon: Minus,
      iconBg: "bg-neutral-500/10 dark:bg-neutral-500/20",
      iconColor: "text-neutral-600 dark:text-neutral-400",
      valueColor: "text-neutral-600 dark:text-neutral-300",
    },
  };

  const trend = trendConfig[trendDirection];
  const TrendIcon = trend.icon;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Total laporan
          </span>
          <div className="rounded-lg bg-sky-500/10 p-2 dark:bg-sky-500/20">
            <FileText className="size-4 text-sky-600 dark:text-sky-400" />
          </div>
        </div>

        <p className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {totalReports}
        </p>

        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          dari {totalInsights} isu terdeteksi
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Isu aktif
          </span>
          <div className="rounded-lg bg-violet-500/10 p-2 dark:bg-violet-500/20">
            <MapPin className="size-4 text-violet-600 dark:text-violet-400" />
          </div>
        </div>

        <p className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {totalInsights}
        </p>

        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          berdasarkan clustering laporan
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Dampak tinggi
          </span>
          <div className="rounded-lg bg-red-500/10 p-2 dark:bg-red-500/20">
            <ShieldAlert className="size-4 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <p className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {highImpactCount}
        </p>

        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          isu yang perlu diperhatikan
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Tren risiko
          </span>
          <div className={`rounded-lg ${trend.iconBg} p-2`}>
            <TrendIcon className={`size-4 ${trend.iconColor}`} />
          </div>
        </div>

        <p className={`mt-3 text-2xl font-bold ${trend.valueColor}`}>
          {trend.label}
        </p>

        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          dibandingkan periode sebelumnya
        </p>
      </div>
    </div>
  );
}
