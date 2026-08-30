import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bot,
  ChevronRight,
  FileText,
  MapPin,
} from "lucide-react";
import type { NearbyReportPin } from "./RiskMap";

type RelatedRiskReportsProps = {
  reports?: NearbyReportPin[];
  selectedReport?: NearbyReportPin | null;
  onReportSelect?: (report: NearbyReportPin) => void;
};

const levelStyles = {
  LOW: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  MODERATE:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  HIGH: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  CRITICAL: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
} as const;

export default function RelatedRiskReports({
  reports = [],
  selectedReport,
  onReportSelect,
}: RelatedRiskReportsProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3.5 sm:px-5 dark:border-neutral-700">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40">
            <FileText className="size-3.5 text-sky-600 dark:text-sky-400" />
          </div>

          <div>
            <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
              Laporan terkait
            </p>

            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Sumber laporan
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-400">
          {reports.length} laporan
        </span>
      </div>

      {/* Reports */}
      {reports.length > 0 ? (
        <div className="space-y-1.5 px-4 py-4 sm:px-5">
          {reports.slice(0, 5).map((report, index) => {
            const risk = report.riskAssessment?.risk;
            const isSelected = selectedReport?.id === report.id;
            const isAutomatic = report.source === "ENVIRONMENT_MONITOR";

            return (
              <Link
                key={report.id}
                to="/dashboard/report-detail/$reportId"
                params={{ reportId: report.id }}
                preload="intent"
                onClick={() => onReportSelect?.(report)}
                className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all ${
                  isSelected
                    ? "bg-sky-50/80 shadow-sm shadow-sky-100/50 dark:bg-sky-950/30 dark:shadow-sky-950/30"
                    : "hover:bg-neutral-50/80 dark:hover:bg-neutral-700/50"
                }`}
              >
                {/* Index */}
                <div
                  className={`flex size-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
                    isSelected
                      ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20 dark:bg-sky-500 dark:shadow-sky-500/20"
                      : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:group-hover:bg-neutral-600"
                  }`}
                >
                  {index + 1}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
                    {report.title}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {/* Automatic source */}
                    {isAutomatic && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-100/80 px-1.5 py-0.5 text-[9px] font-medium text-sky-700 dark:bg-sky-950/50 dark:text-sky-400">
                        <Bot className="size-2.5 shrink-0" />

                        <span>Auto</span>

                        {report.sourceConfidence !== null &&
                          ` ${Math.round(report.sourceConfidence * 100)}%`}
                      </span>
                    )}

                    {/* Metadata */}
                    <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                      <MapPin className="size-3 shrink-0" />

                      <span>{report.category}</span>

                      <span className="text-neutral-400 dark:text-neutral-600">
                        ·
                      </span>

                      <span>{report.distanceKm.toFixed(1)} km</span>
                    </span>
                  </div>
                </div>

                {/* Risk */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {risk ? (
                    <span
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold tabular-nums ${levelStyles[risk.level]}`}
                    >
                      {Math.round(risk.score)}
                    </span>
                  ) : (
                    <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                      {report.urgency}
                    </span>
                  )}

                  <ChevronRight
                    className={`size-3.5 transition-colors ${
                      isSelected
                        ? "text-sky-400 dark:text-sky-500"
                        : "text-neutral-300 group-hover:text-neutral-400 dark:text-neutral-600 dark:group-hover:text-neutral-500"
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center px-6 py-11 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-700/60">
            <AlertTriangle className="size-5 text-neutral-400 dark:text-neutral-500" />
          </div>

          <p className="mt-4 text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
            Belum ada laporan terkait
          </p>

          <p className="mt-1.5 max-w-65 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Pilih wilayah lain untuk memperluas konteks risiko.
          </p>
        </div>
      )}

      {/* More reports */}
      {reports.length > 5 && (
        <div className="border-t border-neutral-100 px-4 py-3 text-center sm:px-5 dark:border-neutral-700">
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            +{reports.length - 5} laporan lainnya tetap ditampilkan pada peta
          </p>
        </div>
      )}
    </section>
  );
}
