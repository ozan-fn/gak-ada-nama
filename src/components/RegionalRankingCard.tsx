import { ArrowDown, ArrowUp } from "lucide-react";

type RegionalRankingItem = {
  rank: number;
  location: string;
  score: number;
  reports: number;
  trend: "up" | "down" | "stable";
};

type RegionalRankingCardProps = {
  data: RegionalRankingItem[];
};

export default function RegionalRankingCard({
  data,
}: RegionalRankingCardProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Wilayah dengan dampak tertinggi
          </h2>

          <p className="text-xs text-neutral-500">
            Peringkat wilayah berdasarkan kondisi dan dampak lingkungan
          </p>
        </div>

        <span className="hidden text-xs text-neutral-400 sm:block">
          7 hari terakhir
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {data.map((region) => (
          <div
            key={region.location}
            className="flex items-center gap-4 border-b border-neutral-100 px-4 py-4 last:border-b-0 dark:border-neutral-800"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-500 dark:bg-neutral-800">
              {region.rank}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {region.location}
              </p>

              <div className="mt-1 flex items-center gap-3 text-[11px] text-neutral-400">
                <span>{region.reports} laporan</span>

                <span className="flex items-center gap-1">
                  {region.trend === "up" ? (
                    <>
                      <ArrowUp className="size-3 text-red-500" />
                      meningkat
                    </>
                  ) : region.trend === "down" ? (
                    <>
                      <ArrowDown className="size-3 text-emerald-500" />
                      menurun
                    </>
                  ) : (
                    <>stabil</>
                  )}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {region.score}
              </p>
              <p className="text-[10px] text-neutral-400">impact score</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
