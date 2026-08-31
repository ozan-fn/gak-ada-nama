import { ArrowRight, ArrowUp, MapPin, ShieldAlert } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { InsightItem } from "#/components/InsightsPriorityTable";

type FeaturedInsightCardProps = {
  insight: InsightItem;
};

function cleanLocationName(name: string): string {
  // ponytail: strip "Koordinat X.XX" prefix if exists
  const coordMatch = name.match(/^Koordinat\s+-?[\d.]+/i);
  if (coordMatch)
    return (
      name
        .replace(coordMatch[0], "")
        .replace(/^[,\s]+/, "")
        .trim() || "Lokasi tidak diketahui"
    );
  return name.split(",")[0]?.trim() ?? name;
}

function getImpactConfig(impact: "Tinggi" | "Sedang" | "Rendah") {
  if (impact === "Tinggi")
    return {
      bg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-300 dark:border-red-700",
      badgeBg: "bg-red-50 dark:bg-red-950/40",
      badgeText: "text-red-600 dark:text-red-400",
      message: "Perlu penanganan segera",
      scoreText: "text-red-600 dark:text-red-400",
    };
  if (impact === "Sedang")
    return {
      bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-300 dark:border-amber-700",
      badgeBg: "bg-amber-50 dark:bg-amber-950/40",
      badgeText: "text-amber-600 dark:text-amber-400",
      message: "Perlu dimonitor",
      scoreText: "text-amber-600 dark:text-amber-400",
    };
  return {
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-300 dark:border-emerald-700",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    message: "Kondisi terkendali",
    scoreText: "text-emerald-600 dark:text-emerald-400",
  };
}

export default function FeaturedInsightCard({
  insight,
}: FeaturedInsightCardProps) {
  const navigate = useNavigate();
  const config = getImpactConfig(insight.impact);

  return (
    <div className="space-y-3">
      <div className="flex">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Isu paling berdampak
          </h2>

          <p className="text-xs text-neutral-500">
            Berdasarkan analisis laporan dan kondisi lingkungan
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="grid lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6 p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${config.badgeBg} ${config.badgeText}`}
                  >
                    <ShieldAlert className="size-3" />
                    Dampak {insight.impact}
                  </span>

                  <span className="text-xs text-neutral-400">prioritas #1</span>
                </div>

                <h3 className="max-w-2xl text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-xl">
                  {insight.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {cleanLocationName(insight.locationName)}
                  </span>

                  <span>{insight.category}</span>
                </div>
              </div>

              <div className="hidden rounded-lg bg-neutral-50 px-3 py-2 text-right dark:bg-neutral-800/70 sm:block">
                <p className="text-[10px] text-neutral-400">impact score</p>

                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {insight.impactScore}
                </p>
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              {insight.summary}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-500">
              <span>
                <strong className="font-medium text-neutral-900 dark:text-neutral-200">
                  {insight.reportCount}
                </strong>{" "}
                laporan
              </span>

              <span>
                <strong className="font-medium text-neutral-900 dark:text-neutral-200">
                  {insight.validatedCount}
                </strong>{" "}
                tervalidasi
              </span>

              {insight.rainCondition && insight.rainCondition !== "Tidak tersedia" && (
                <span className="text-neutral-600 dark:text-neutral-400">
                  Curah hujan: {insight.rainCondition}
                </span>
              )}

              {insight.trend === "up" && (
                <span className="flex items-center gap-1 text-red-500">
                  <ArrowUp className="size-3.5" />
                  Meningkat
                </span>
              )}

              {insight.trend === "down" && (
                <span className="flex items-center gap-1 text-emerald-500">
                  <ArrowUp className="size-3.5 rotate-180" />
                  Menurun
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard/insight/$insightId", params: { insightId: insight.id }, search: { rank: 1 } })}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3.5 py-2 text-xs font-medium text-white shadow-sm shadow-sky-500/20 transition-colors hover:bg-sky-400 hover:shadow-sky-500/30"
            >
              Baca insight
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          <div
            className={`flex items-center justify-center border-t ${config.bg} p-6 dark:border-neutral-800 lg:border-l lg:border-t-0`}
          >
            <div className="text-center">
              <div
                className={`mx-auto flex size-28 items-center justify-center rounded-full border-8 ${config.border} bg-white dark:bg-neutral-900`}
              >
                <div>
                  <p className={`text-3xl font-bold ${config.scoreText}`}>
                    {insight.impactScore}
                  </p>

                  <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                    impact score
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className={`text-xs font-semibold ${config.text}`}>
                  {config.message}
                </p>

                <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                  Berdasarkan {insight.reportCount} laporan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
