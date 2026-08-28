import { ArrowDown, ArrowUp, MapPin } from "lucide-react";

type Insight = {
  id: number;
  title: string;
  location: string;
  province: string;
  impact: "Tinggi" | "Sedang" | "Rendah";
  reports: number;
  validated: number;
  score: number;
  trend: "up" | "down" | "stable";
  summary: string;
  time: string;
};

type InsightsPriorityTableProps = {
  insights: Insight[];
};

export default function InsightsPriorityTable({
  insights,
}: InsightsPriorityTableProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Prioritas risiko
        </h2>

        <p className="text-xs text-neutral-500">
          Peringkat isu berdasarkan tingkat dampak dan kondisi lingkungan
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="hidden grid-cols-[48px_1fr_100px_90px_80px_80px] items-center border-b border-neutral-200 bg-neutral-50/70 px-4 py-3 text-[11px] font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/40 md:grid">
          <span>#</span>
          <span>Isu</span>
          <span>Dampak</span>
          <span>Laporan</span>
          <span>Tren</span>
          <span className="text-right">Score</span>
        </div>

        {insights.map((insight, index) => (
          <div
            key={insight.id}
            className="grid gap-3 border-b border-neutral-100 px-4 py-4 last:border-b-0 dark:border-neutral-800 md:grid-cols-[48px_1fr_100px_90px_80px_80px] md:items-center"
          >
            <div className="text-sm font-semibold text-neutral-400">
              {index + 1}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {insight.title}
              </p>

              <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
                <MapPin className="size-3" />
                {insight.location}
              </div>
            </div>

            <div>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
                  insight.impact === "Tinggi"
                    ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                    : insight.impact === "Sedang"
                      ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                }`}
              >
                {insight.impact}
              </span>
            </div>

            <div className="text-xs text-neutral-500">
              <span className="font-medium text-neutral-900 dark:text-neutral-200">
                {insight.reports}
              </span>{" "}
              laporan
            </div>

            <div className="flex items-center gap-1 text-xs">
              {insight.trend === "up" && (
                <>
                  <ArrowUp className="size-3.5 text-red-500" />
                  <span className="text-red-500">Naik</span>
                </>
              )}

              {insight.trend === "down" && (
                <>
                  <ArrowDown className="size-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Turun</span>
                </>
              )}

              {insight.trend === "stable" && (
                <>
                  <span className="text-neutral-400">→</span>
                  <span className="text-neutral-500">Stabil</span>
                </>
              )}
            </div>

            <div className="text-right">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {insight.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
