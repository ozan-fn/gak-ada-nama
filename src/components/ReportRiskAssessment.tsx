import { AlertTriangle, Bot, Brain, CheckCircle2, Clock3, MapPin, MousePointer2 } from "lucide-react";
import type { RiskAssessmentStatus, RiskLevel } from "#/types/report-assessment";
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
    icon: typeof Clock3;
  }
> = {
  COMPLETE: {
    label: "Analisis selesai",
    className: "bg-sky-50 text-sky-700",
    icon: CheckCircle2,
  },
  PARTIAL: {
    label: "Analisis sebagian",
    className: "bg-amber-50 text-amber-700",
    icon: Clock3,
  },
  PENDING: {
    label: "Sedang dianalisis",
    className: "bg-sky-50 text-sky-700",
    icon: Clock3,
  },
  FAILED: {
    label: "Analisis terkendala",
    className: "bg-red-50 text-red-700",
    icon: AlertTriangle,
  },
};

const levelConfig: Record<
  RiskLevel,
  {
    label: string;
    description: string;
    text: string;
    bg: string;
    dot: string;
    hex: string;
  }
> = {
  LOW: {
    label: "Rendah",
    description: "Kondisi relatif aman",
    text: "text-sky-600",
    bg: "bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
    hex: "#0ea5e9",
  },
  MODERATE: {
    label: "Moderat",
    description: "Perlu diperhatikan",
    text: "text-amber-600",
    bg: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  HIGH: {
    label: "Tinggi",
    description: "Perlu diwaspadai",
    text: "text-orange-600",
    bg: "bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
    hex: "#f97316",
  },
  CRITICAL: {
    label: "Kritis",
    description: "Perlu penanganan segera",
    text: "text-red-600",
    bg: "bg-red-50 text-red-700",
    dot: "bg-red-500",
    hex: "#ef4444",
  },
};

const horizonLabels = {
  "24H": "24 jam ke depan",
  "72H": "72 jam ke depan",
  "7D": "7 hari ke depan",
} as const;

function EmptyAssessment({ report, locationName }: { report?: NearbyReportPin | null; locationName?: string }) {
  const assessment = report?.riskAssessment;
  const isFailed = assessment?.status === "FAILED";
  const isPending = assessment?.status === "PENDING";

  const Icon = isFailed ? AlertTriangle : isPending ? Clock3 : MousePointer2;
  const iconClassName = isFailed ? "text-red-500" : isPending ? "text-sky-500" : "text-neutral-400";

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-sky-50">
            <Brain className="size-3.5 text-sky-600" />
          </div>

          <div>
            <p className="text-[13px] font-semibold text-neutral-900">Analisis risiko</p>
            <p className="text-[11px] text-neutral-400">Penilaian berdasarkan laporan</p>
          </div>
        </div>

        {assessment && <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${statusConfig[assessment.status].className}`}>{statusConfig[assessment.status].label}</span>}
      </div>

      <div className="flex flex-col items-center px-6 py-11 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-neutral-50">
          <Icon className={`size-5 ${iconClassName}`} />
        </div>

        <p className="mt-4 text-[13px] font-semibold text-neutral-800">{!report ? (locationName ? `Belum ada analisis di ${locationName}` : "Pilih lokasi pada peta") : isFailed ? "Analisis belum dapat diselesaikan" : isPending ? "Analisis sedang diproses" : "Belum ada analisis risiko"}</p>

        <p className="mt-1.5 max-w-65 text-[12px] leading-relaxed text-neutral-500">
          {!report ? (locationName ? "Tidak ditemukan laporan dengan hasil analisis risiko di sekitar lokasi ini." : "Pilih lokasi atau laporan pada peta untuk melihat penilaian risikonya.") : isPending ? "Hasil analisis akan muncul setelah proses selesai." : isFailed ? "Silakan coba lagi setelah data laporan berhasil diproses." : "Penilaian risiko akan ditampilkan setelah tersedia."}
        </p>
      </div>
    </section>
  );
}

function ScoreRing({ score, hex }: { score: number; hex: string }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(100, Math.max(0, score));

  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="relative flex size-18 shrink-0 items-center justify-center">
      <svg viewBox="0 0 72 72" className="size-full -rotate-90" aria-label={`Skor risiko ${score} dari 100`}>
        <title>Skor risiko {score} dari 100</title>
        <circle cx="36" cy="36" r={radius} fill="none" strokeWidth="7" className="stroke-neutral-100" />

        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          stroke={hex}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 500ms ease",
          }}
        />
      </svg>

      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-[17px] font-semibold leading-none tabular-nums text-neutral-900">{score}</span>

        <span className="mt-0.5 text-[9px] text-neutral-400">dari 100</span>
      </div>
    </div>
  );
}

export default function ReportRiskAssessment({ report, locationName, selectionMode = "manual" }: ReportRiskAssessmentProps) {
  const assessment = report?.riskAssessment;
  const risk = assessment?.risk;

  if (!report || !assessment || !risk) {
    return <EmptyAssessment report={report} locationName={locationName} />;
  }

  const level = levelConfig[risk.level];
  const status = statusConfig[assessment.status];
  const StatusIcon = status.icon;

  const confidence = Math.round(risk.confidence * 100);
  const score = Math.round(risk.score);

  const isAutomatic = report.source === "ENVIRONMENT_MONITOR";

  const horizonEntries = Object.entries(horizonLabels);

  return (
    <div className="w-full space-y-3 overflow-hidden">
      {/* Ringkasan Risiko */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {/* Header */}
        <div className="border-b border-neutral-100 px-4 py-3.5 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-neutral-400">{isAutomatic ? "Terdeteksi otomatis" : selectionMode === "location" ? "Laporan prioritas di lokasi" : "Penilaian risiko"}</p>

            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${status.className}`}>
              <StatusIcon className="size-3" />
              {status.label}
            </span>
          </div>

          <h3 id="report-risk-assessment-title" className="mt-3 text-[15px] font-semibold leading-snug tracking-tight text-neutral-900 wrap-anywhere">
            {report.title}
          </h3>

          {/* Metadata */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-neutral-500">
            {isAutomatic && (
              <span className="inline-flex min-w-0 items-center gap-1 font-medium text-sky-700">
                <Bot className="size-3 shrink-0" />

                <span className="truncate">
                  Prita Environmental Monitor
                  {report.sourceConfidence !== null && ` · ${Math.round(report.sourceConfidence * 100)}% sumber`}
                </span>
              </span>
            )}

            {locationName && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{locationName}</span>
              </span>
            )}

            {isAutomatic && report.accuracyRadiusMeters && <span className="shrink-0 text-neutral-400">Radius ±{report.accuracyRadiusMeters >= 1_000 ? `${(report.accuracyRadiusMeters / 1_000).toFixed(1)} km` : `${report.accuracyRadiusMeters} m`}</span>}
          </div>
        </div>

        {/* Score */}
        <div className="px-4 py-5 sm:px-5">
          <div className="flex items-center gap-4">
            <ScoreRing score={score} hex={level.hex} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${level.bg}`}>{level.label}</span>

                <span className="text-[11px] text-neutral-500">{level.description}</span>
              </div>

              <div className="mt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400">Keyakinan analisis</span>

                  <span className="text-[10px] font-medium tabular-nums text-neutral-600">{confidence}%</span>
                </div>

                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, confidence)}%`,
                      backgroundColor: level.hex,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-4 rounded-xl bg-neutral-50 px-3.5 py-3">
            <p className="text-[11px] font-medium text-neutral-500">Ringkasan</p>

            <p className="mt-1 text-[12px] leading-relaxed text-neutral-700">{risk.summary}</p>
          </div>
        </div>

        {/* Automatic source explanation */}
        {isAutomatic && (
          <div className="mx-4 mb-4 flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50/60 px-3.5 py-3 sm:mx-5">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/70">
              <Bot className="size-3.5 text-sky-600" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium text-sky-800">Terdeteksi oleh sistem</p>

              <p className="mt-0.5 text-[10px] leading-relaxed text-sky-700/80">Penilaian ini dibuat dari kondisi sensor lingkungan yang memenuhi ambang batas sistem. Ini bukan konfirmasi dari saksi manusia.</p>

              {report.locationAttribution && <p className="mt-1 text-[10px] text-sky-700/60">Lokasi berdasarkan {report.locationAttribution}</p>}
            </div>
          </div>
        )}

        {/* Factors */}
        {risk.factors.length > 0 && (
          <div className="border-t border-neutral-100 px-4 py-4 sm:px-5">
            <div>
              <p className="text-[12px] font-semibold text-neutral-800">Mengapa risikonya seperti ini?</p>

              <p className="mt-0.5 text-[10px] text-neutral-400">Faktor utama yang memengaruhi penilaian</p>
            </div>

            <div className="mt-3 space-y-1.5">
              {risk.factors.slice(0, 3).map((factor, index) => (
                <div key={factor} className="flex items-start gap-2.5 rounded-xl border border-neutral-100 bg-neutral-100/70 px-3 py-2.5">
                  <span className="mt-0.5 flex size-5.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: level.hex }}>
                    {index + 1}
                  </span>

                  <p className="min-w-0 pt-0.5 text-[11px] leading-relaxed text-neutral-600 wrap-anywhere">{factor}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* =========================================================
          2. PROYEKSI
      ========================================================= */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div>
          <p className="text-[13px] font-semibold text-neutral-900">Jika kondisi berlanjut</p>

          <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-400">Perkiraan tingkat risiko berdasarkan kondisi saat ini.</p>
        </div>

        <div className="mt-5">
          {horizonEntries.map(([key, label], index) => {
            const horizon = risk.horizons[key as keyof typeof risk.horizons];

            const horizonLevel = levelConfig[horizon.level];

            const isLast = index === horizonEntries.length - 1;

            return (
              <div key={key} className="relative flex gap-3 pb-5 last:pb-0">
                {!isLast && <span className="absolute bottom-0 left-1.25 top-4 w-px bg-neutral-100" />}

                <span className="relative mt-1.5 flex size-2.75 shrink-0 items-center justify-center rounded-full ring-4 ring-white" style={{ backgroundColor: horizonLevel.hex }} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12px] font-medium text-neutral-800">{label}</p>

                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold tabular-nums ${horizonLevel.bg}`}>{Math.round(horizon.score)}</span>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: horizonLevel.hex }} />

                    <span className={`text-[10px] font-semibold ${horizonLevel.text}`}>Risiko {horizonLevel.label.toLowerCase()}</span>
                  </div>

                  <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">{horizon.summary}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          3. DAMPAK
      ========================================================= */}
      {risk.potentialImpacts.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
          <div>
            <p className="text-[13px] font-semibold text-neutral-900">Dampak yang mungkin terjadi</p>

            <p className="mt-0.5 text-[11px] text-neutral-400">Hal yang perlu diperhatikan jika kondisi memburuk.</p>
          </div>

          <div className="mt-4 space-y-2">
            {risk.potentialImpacts.slice(0, 3).map((impact) => (
              <div key={impact} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border border-neutral-100 bg-neutral-100/70">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: level.hex }}>
                  <AlertTriangle className="size-3 text-white" />
                </div>

                <p className="min-w-0 pt-0.5 text-[11px] leading-relaxed text-neutral-700 wrap-anywhere">{impact}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================
          4. REKOMENDASI
      ========================================================= */}
      {risk.recommendedActions.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-neutral-900">Tindakan yang disarankan</p>
                <p className="text-[11px] text-neutral-400">Disusun Prita dari analisis risiko</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ backgroundColor: `${level.hex}14`, color: level.hex }}>
              {risk.recommendedActions.length} langkah
            </span>
          </div>

          <div className="space-y-2 px-4 pb-4 sm:px-5 sm:pb-5">
            {risk.recommendedActions.slice(0, 3).map((action, index) => {
              const isPriority = index === 0;

              return (
                <div key={action} className={`flex items-start gap-3 rounded-xl px-3.5 py-3 ${isPriority ? "" : "border border-neutral-100"}`} style={isPriority ? { backgroundColor: level.hex } : undefined}>
                  {isPriority ? (
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <CheckCircle2 className="size-3.5 text-white" />
                    </span>
                  ) : (
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: `${level.hex}14`, color: level.hex }}>
                      {index + 1}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    {isPriority && <p className="text-[9px] font-semibold tracking-wide text-white/70">Prioritas utama</p>}
                    <p className={`min-w-0 text-[12px] leading-relaxed wrap-anywhere ${isPriority ? "mt-0.5 font-medium text-white" : "pt-0.5 text-neutral-700"}`}>{action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
