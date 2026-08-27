import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPin,
  MousePointer2,
  ShieldAlert,
} from "lucide-react";
import type {
  RiskAssessmentStatus,
  RiskLevel,
} from "#/types/report-assessment";
import type { NearbyReportPin } from "./RiskMap";

type ReportRiskAssessmentProps = {
  report?: NearbyReportPin | null;
  locationName?: string;
  selectionMode?: "location" | "manual";
};

const statusConfig: Record<
  RiskAssessmentStatus,
  {
    label: string;
    className: string;
  }
> = {
  COMPLETE: {
    label: "Lengkap",
    className: "bg-emerald-50 text-emerald-700",
  },
  PARTIAL: {
    label: "Parsial",
    className: "bg-amber-50 text-amber-700",
  },
  PENDING: {
    label: "Diproses",
    className: "bg-sky-50 text-sky-700",
  },
  FAILED: {
    label: "Terkendala",
    className: "bg-red-50 text-red-700",
  },
};

const levelConfig: Record<
  RiskLevel,
  {
    label: string;
    scoreClassName: string;
    badgeClassName: string;
    dotClassName: string;
  }
> = {
  LOW: {
    label: "Rendah",
    scoreClassName: "text-emerald-600",
    badgeClassName: "bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500 ring-emerald-100",
  },
  MODERATE: {
    label: "Moderat",
    scoreClassName: "text-amber-600",
    badgeClassName: "bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500 ring-amber-100",
  },
  HIGH: {
    label: "Tinggi",
    scoreClassName: "text-orange-600",
    badgeClassName: "bg-orange-50 text-orange-700",
    dotClassName: "bg-orange-500 ring-orange-100",
  },
  CRITICAL: {
    label: "Kritis",
    scoreClassName: "text-red-600",
    badgeClassName: "bg-red-50 text-red-700",
    dotClassName: "bg-red-500 ring-red-100",
  },
};

const horizonLabels = {
  "24H": "24 jam",
  "72H": "72 jam",
  "7D": "7 hari",
} as const;

function EmptyAssessment({
  report,
  locationName,
}: {
  report?: NearbyReportPin | null;
  locationName?: string;
}) {
  const assessment = report?.riskAssessment;
  const isFailed = assessment?.status === "FAILED";
  const isPending = assessment?.status === "PENDING";

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium text-neutral-400">
            Assessment risiko
          </p>

          <h3 className="mt-1 text-sm font-semibold text-neutral-900">
            Risiko laporan
          </h3>
        </div>

        {assessment && (
          <span
            className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
              statusConfig[assessment.status].className
            }`}
          >
            {statusConfig[assessment.status].label}
          </span>
        )}
      </div>

      <div className="mt-3 flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-5 py-5 text-center">
        <div className="flex size-8 items-center justify-center rounded-full bg-white text-neutral-400 shadow-xs">
          {isFailed ? (
            <AlertCircle className="size-4 text-red-500" />
          ) : isPending ? (
            <Clock3 className="size-4 text-sky-500" />
          ) : (
            <MousePointer2 className="size-4" />
          )}
        </div>

        <p className="mt-2.5 text-xs font-semibold text-neutral-800">
          {!report
            ? locationName
              ? `Belum ada laporan di ${locationName}`
              : "Pilih lokasi pada peta"
            : isFailed
              ? "Assessment belum berhasil"
              : isPending
                ? "Assessment sedang diproses"
                : "Belum tersedia"}
        </p>

        <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-neutral-500">
          {!report
            ? locationName
              ? "Belum ditemukan laporan dengan assessment dalam radius wilayah ini."
              : "Pilih lokasi atau laporan pada peta untuk melihat informasi risikonya."
            : "Hasil penilaian akan ditampilkan setelah proses assessment selesai."}
        </p>
      </div>
    </section>
  );
}

export default function ReportRiskAssessment({
  report,
  locationName,
  selectionMode = "manual",
}: ReportRiskAssessmentProps) {
  const assessment = report?.riskAssessment;
  const risk = assessment?.risk;

  if (!report || !assessment || !risk) {
    return <EmptyAssessment report={report} locationName={locationName} />;
  }

  const level = levelConfig[risk.level];
  const status = statusConfig[assessment.status];
  const confidence = Math.round(risk.confidence * 100);

  return (
    <div className="space-y-3">
      {/* Report */}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
            <AlertTriangle className="size-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-medium text-neutral-400">
                {selectionMode === "location"
                  ? "Laporan utama"
                  : "Laporan terpilih"}
              </p>

              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${level.badgeClassName}`}
              >
                {level.label}
              </span>
            </div>

            <h3 className="mt-1 text-sm font-semibold leading-snug text-neutral-900">
              {report.title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {locationName && (
                <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
                  <MapPin className="size-3 text-neutral-400" />
                  {locationName}
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${status.className}`}
              >
                <Clock3 className="size-2.5" />
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Risk score */}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium text-neutral-400">
              Tingkat risiko
            </p>

            <div className="mt-1 flex items-baseline">
              <span
                className={`text-4xl font-bold tracking-tight ${level.scoreClassName}`}
              >
                {Math.round(risk.score)}
              </span>

              <span className="ml-1 text-xs text-neutral-400">/100</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-neutral-400">Kepercayaan hasil</p>

            <p className="mt-1 text-sm font-semibold text-neutral-800">
              {confidence}%
            </p>
          </div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full ${level.dotClassName.split(" ")[0]}`}
            style={{
              width: `${Math.min(100, Math.max(0, risk.score))}%`,
            }}
          />
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-neutral-600">
          {risk.summary}
        </p>

        {risk.factors.length > 0 && (
          <div className="mt-4 border-t border-neutral-100 pt-3">
            <p className="text-[10px] font-medium text-neutral-400">
              Faktor utama
            </p>

            <div className="mt-2 space-y-1.5">
              {risk.factors.slice(0, 3).map((factor) => (
                <div
                  key={factor}
                  className="flex items-start gap-2 text-[10px] leading-relaxed text-neutral-600"
                >
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange-400" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Projection */}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[10px] font-medium text-neutral-400">
            Perkiraan kondisi
          </p>

          <h3 className="mt-1 text-sm font-semibold text-neutral-900">
            Jika kondisi saat ini berlanjut
          </h3>
        </div>

        <div className="mt-4">
          {Object.entries(horizonLabels).map(([key, label], index) => {
            const horizon = risk.horizons[key as keyof typeof risk.horizons];

            const horizonLevel = levelConfig[horizon.level];

            return (
              <div key={key} className="relative flex gap-3 pb-4 last:pb-0">
                {index < Object.keys(horizonLabels).length - 1 && (
                  <span className="absolute bottom-0 left-1.5 top-3 w-px bg-neutral-200" />
                )}

                <span
                  className={`relative mt-1 size-3 shrink-0 rounded-full ring-4 ${horizonLevel.dotClassName}`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-neutral-800">
                      {label}
                    </p>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${horizonLevel.badgeClassName}`}
                    >
                      {Math.round(horizon.score)} · {horizonLevel.label}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
                    {horizon.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Potential impacts */}

      {risk.potentialImpacts.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] font-medium text-neutral-400">
              Dampak potensial
            </p>

            <h3 className="mt-1 text-sm font-semibold text-neutral-900">
              Hal yang perlu diperhatikan
            </h3>
          </div>

          <div className="mt-3 space-y-2">
            {risk.potentialImpacts.slice(0, 3).map((impact, index) => (
              <div
                key={impact}
                className="flex items-start gap-2.5 rounded-lg bg-neutral-50 p-2.5"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-500">
                  <AlertTriangle className="size-3.5" />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-medium text-neutral-400">
                    Dampak {index + 1}
                  </p>

                  <p className="mt-0.5 text-[10px] leading-relaxed text-neutral-700">
                    {impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}

      {risk.recommendedActions.length > 0 && (
        <section className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-white text-sky-600 shadow-xs">
              <ShieldAlert className="size-3.5" />
            </div>

            <div>
              <p className="text-[10px] font-medium text-sky-600">
                Tindakan yang disarankan
              </p>

              <h3 className="mt-0.5 text-sm font-semibold text-neutral-900">
                Prioritas penanganan
              </h3>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {risk.recommendedActions.slice(0, 3).map((action) => (
              <div
                key={action}
                className="flex items-start gap-2.5 rounded-lg bg-white px-3 py-2.5"
              >
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-sky-500" />

                <span className="text-[10px] leading-relaxed text-neutral-700">
                  {action}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
