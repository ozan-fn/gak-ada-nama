import { ArrowRight, BarChart3, FileText } from "lucide-react";

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

type InsightsLatestCardsProps = {
  insights: Insight[];
};

export default function InsightsLatestCards({
  insights,
}: InsightsLatestCardsProps) {
  return (
    <div className="flex flex-col space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Insight terbaru
        </h2>

        <p className="text-xs text-neutral-500">
          Analisis yang dihasilkan dari perkembangan laporan lingkungan
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {insights.map((insight) => (
          <article
            key={insight.id}
            className="group flex flex-col rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:border-neutral-700"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <FileText className="size-3.5" />
                Analisis lingkungan
              </span>

              <span className="text-[11px] text-neutral-400">
                {insight.time}
              </span>
            </div>

            <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-neutral-900 dark:text-neutral-100">
              {insight.title}
            </h3>

            <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              {insight.summary}
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-700">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <BarChart3 className="size-3.5" />
                Score {insight.score}
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 transition-colors group-hover:text-neutral-900 dark:text-neutral-300 dark:group-hover:text-white"
              >
                Baca
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
