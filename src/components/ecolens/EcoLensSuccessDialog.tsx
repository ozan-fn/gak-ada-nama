import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Clock3,
  Leaf,
  MapPin,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import type { CreateReportResult } from "#/lib/reports.functions";
import type { RiskLevel } from "#/types/report-assessment";

const AUTO_RETRY_DELAY_MS = 5_500;

const HORIZON_META = [
  {
    key: "24H",
    label: "24 jam",
    caption: "Respons cepat",
  },
  {
    key: "72H",
    label: "72 jam",
    caption: "Perkembangan",
  },
  {
    key: "7D",
    label: "7 hari",
    caption: "Dampak lanjutan",
  },
] as const;

const RISK_TONES: Record<
  RiskLevel,
  {
    label: string;
    badge: string;
    score: string;
    border: string;
    dot: string;
    surface: string;
    icon: string;
  }
> = {
  LOW: {
    label: "Rendah",
    badge:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800",
    score: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-900/70",
    dot: "bg-emerald-500",
    surface: "bg-emerald-50/60 dark:bg-emerald-950/20",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  MODERATE: {
    label: "Sedang",
    badge:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800",
    score: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-900/70",
    dot: "bg-amber-500",
    surface: "bg-amber-50/60 dark:bg-amber-950/20",
    icon: "text-amber-600 dark:text-amber-400",
  },
  HIGH: {
    label: "Tinggi",
    badge:
      "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:ring-orange-800",
    score: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-900/70",
    dot: "bg-orange-500",
    surface: "bg-orange-50/60 dark:bg-orange-950/20",
    icon: "text-orange-600 dark:text-orange-400",
  },
  CRITICAL: {
    label: "Kritis",
    badge:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-800",
    score: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-900/70",
    dot: "bg-rose-500",
    surface: "bg-rose-50/60 dark:bg-rose-950/20",
    icon: "text-rose-600 dark:text-rose-400",
  },
};

type RetryMode = "automatic" | "manual";
type AutoRetryPhase = "idle" | "scheduled" | "running" | "done";

type EcoLensSuccessDialogProps = {
  open: boolean;
  result: CreateReportResult | null;
  onCreateAnother: () => void;
  onRefreshAssessment: (reportId: string) => Promise<CreateReportResult>;
};

function normalizeScore(score: number) {
  return Math.round(Math.min(100, Math.max(0, score)));
}

function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const tone = RISK_TONES[level];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full px-2.5 py-1
        text-[10px] font-semibold
        ring-1 ring-inset
        ${tone.badge}
      `}
    >
      <span className={`size-1.5 rounded-full ${tone.dot}`} />
      {tone.label}
    </span>
  );
}

export function EcoLensSuccessDialog({
  open,
  result,
  onCreateAnother,
  onRefreshAssessment,
}: EcoLensSuccessDialogProps) {
  const refreshHandlerRef = useRef(onRefreshAssessment);
  const automaticReportRef = useRef<string | null>(null);
  const retryLockRef = useRef(false);

  const [autoRetryPhase, setAutoRetryPhase] = useState<AutoRetryPhase>("idle");

  const [retryMode, setRetryMode] = useState<RetryMode | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    refreshHandlerRef.current = onRefreshAssessment;
  }, [onRefreshAssessment]);

  const runRefresh = useCallback(async (reportId: string, mode: RetryMode) => {
    if (retryLockRef.current) return;

    retryLockRef.current = true;
    setRetryMode(mode);
    setRetryError(null);

    if (mode === "automatic") {
      setAutoRetryPhase("running");
    }

    try {
      await refreshHandlerRef.current(reportId);
    } catch (error) {
      console.error("[EcoLens] Gagal memperbarui analisis risiko:", error);

      setRetryError(
        "Analisis belum dapat diperbarui. Coba lagi beberapa saat.",
      );
    } finally {
      retryLockRef.current = false;
      setRetryMode(null);

      if (mode === "automatic") {
        setAutoRetryPhase("done");
      }
    }
  }, []);

  const reportId = result?.report.id ?? null;
  const assessmentStatus = result?.assessment.status ?? null;

  useEffect(() => {
    if (!open) {
      automaticReportRef.current = null;
      setAutoRetryPhase("idle");
      setRetryMode(null);
      setRetryError(null);
      return;
    }

    if (
      !reportId ||
      assessmentStatus !== "PENDING" ||
      automaticReportRef.current === reportId
    ) {
      return;
    }

    automaticReportRef.current = reportId;
    setAutoRetryPhase("scheduled");

    const retryTimer = window.setTimeout(() => {
      void runRefresh(reportId, "automatic");
    }, AUTO_RETRY_DELAY_MS);

    return () => window.clearTimeout(retryTimer);
  }, [assessmentStatus, open, reportId, runRefresh]);

  const assessment = result?.assessment ?? null;
  const risk = assessment?.risk ?? null;

  const isRefreshing = retryMode !== null;

  const canRetryManually =
    assessment?.status === "FAILED" ||
    (assessment?.status === "PENDING" && autoRetryPhase === "done");

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="
          flex h-[calc(100dvh-1rem)] max-h-225
          w-[calc(100%-1rem)]
          max-w-3xl
          flex-col
          gap-0
          overflow-hidden
          rounded-2xl
          border-neutral-200
          bg-white
          p-0
          text-neutral-900
          shadow-[0_24px_80px_rgba(15,23,42,0.18)]

          dark:border-neutral-700/80
          dark:bg-neutral-900
          dark:text-neutral-100
          dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]

          sm:w-[calc(100%-2rem)]
          lg:h-auto
          lg:max-h-[90dvh]
          lg:max-w-4xl
        "
      >
        {/* ===================================================== */}
        {/* Header */}
        {/* ===================================================== */}

        <div
          className="
            relative shrink-0 overflow-hidden
            border-b border-neutral-100
            bg-white
            dark:border-neutral-800
            dark:bg-neutral-900
          "
        >
          {/* Decorative background */}
          <div
            className="
              pointer-events-none absolute
              -right-20 -top-24
              size-56 rounded-full
              bg-sky-50
              dark:bg-sky-950/20
            "
            aria-hidden="true"
          />

          <div
            className="
              pointer-events-none absolute
              right-10 -top-14
              size-32 rounded-full
              border-18
              border-sky-100
              dark:border-sky-900/30
            "
            aria-hidden="true"
          />

          <DialogHeader
            className="
              relative
              px-4 pb-4 pt-4
              text-left
              sm:px-6 sm:pb-5 sm:pt-5
              lg:px-7
            "
          >
            <div className="min-w-0">
              {/* Status */}
              <div className="flex items-center justify-between gap-3">
                <span
                  className="
                    inline-flex items-center gap-1.5
                    rounded-full
                    bg-sky-50
                    px-2.5 py-1
                    text-[10px] font-semibold
                    text-sky-700
                    ring-1 ring-inset ring-sky-200

                    dark:bg-sky-950/40
                    dark:text-sky-400
                    dark:ring-sky-800/70
                  "
                >
                  <Leaf className="size-2.5" />
                  Laporan tersimpan
                </span>

                {assessment?.status === "COMPLETE" && (
                  <span
                    className="
                      inline-flex shrink-0
                      items-center gap-1.5
                      text-[10px] font-medium
                      text-emerald-700
                      dark:text-emerald-400
                    "
                  >
                    <ShieldCheck className="size-3.5" />
                    Analisis lengkap
                  </span>
                )}
              </div>

              <DialogTitle
                className="
                  mt-2.5
                  text-lg font-semibold
                  tracking-tight
                  text-neutral-950
                  dark:text-neutral-50
                  sm:text-xl
                "
              >
                Laporan berhasil dikirim
              </DialogTitle>

              <DialogDescription
                className="
                  mt-1
                  max-w-xl
                  text-xs leading-5
                  text-neutral-500
                  dark:text-neutral-400
                  sm:text-sm
                "
              >
                Laporan sudah tersimpan. EcoLens menganalisis kondisi lingkungan
                untuk membantu menentukan tingkat risiko.
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        {/* ===================================================== */}
        {/* Body */}
        {/* ===================================================== */}

        <div
          className="
            min-h-0 flex-1
            overflow-y-auto
            overscroll-contain
            bg-neutral-50/70
            px-3 py-3
            sm:px-5 sm:py-4
            lg:px-6

            dark:bg-neutral-950/70
          "
        >
          <div className="mx-auto max-w-4xl space-y-3">
            {/* Loading */}
            {!result && (
              <div
                className="
                  flex items-center gap-3
                  rounded-xl
                  border border-sky-100
                  bg-white
                  px-4 py-4

                  dark:border-sky-900/60
                  dark:bg-neutral-900
                "
                aria-live="polite"
              >
                <div
                  className="
                    grid size-9 shrink-0 place-items-center
                    rounded-lg
                    bg-sky-50
                    dark:bg-sky-950/40
                  "
                >
                  <RefreshCw
                    className="
                      size-4 animate-spin
                      text-sky-600
                      dark:text-sky-400
                    "
                  />
                </div>

                <div>
                  <p
                    className="
                      text-sm font-semibold
                      text-neutral-800
                      dark:text-neutral-100
                    "
                  >
                    Menyiapkan hasil laporan
                  </p>

                  <p
                    className="
                      mt-0.5 text-xs
                      text-neutral-400
                      dark:text-neutral-500
                    "
                  >
                    Tunggu sebentar...
                  </p>
                </div>
              </div>
            )}

            {/* Pending / Failed */}
            {assessment &&
              (assessment.status === "PENDING" ||
                assessment.status === "FAILED") && (
                <div
                  className="
                    flex items-start gap-3
                    rounded-xl
                    border
                    border-sky-100
                    bg-white
                    px-4 py-3.5

                    dark:border-sky-900/60
                    dark:bg-neutral-900
                  "
                  aria-live="polite"
                >
                  <div
                    className="
                      grid size-9 shrink-0 place-items-center
                      rounded-lg
                      bg-sky-50
                      dark:bg-sky-950/40
                    "
                  >
                    {assessment.status === "PENDING" ? (
                      <Clock3
                        className="
                          size-4
                          text-sky-600
                          dark:text-sky-400
                        "
                      />
                    ) : (
                      <AlertTriangle
                        className="
                          size-4
                          text-amber-600
                          dark:text-amber-400
                        "
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="
                        text-sm font-semibold
                        text-neutral-900
                        dark:text-neutral-100
                      "
                    >
                      {assessment.status === "PENDING"
                        ? "Analisis risiko sedang diproses"
                        : "Analisis risiko belum tersedia"}
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-xs leading-5
                        text-neutral-500
                        dark:text-neutral-400
                      "
                    >
                      Laporan tetap berhasil tersimpan dan dapat dilihat di
                      halaman laporan.
                    </p>

                    {assessment.status === "PENDING" &&
                      (autoRetryPhase === "scheduled" ||
                        autoRetryPhase === "running") && (
                        <div
                          className="
                            mt-1.5
                            flex items-center gap-1.5
                            text-[10px] font-medium
                            text-sky-700
                            dark:text-sky-400
                          "
                        >
                          <RefreshCw
                            className={`
                              size-3
                              ${
                                autoRetryPhase === "running"
                                  ? "animate-spin"
                                  : ""
                              }
                            `}
                          />

                          {autoRetryPhase === "running"
                            ? "Memperbarui analisis..."
                            : "Akan diperbarui otomatis"}
                        </div>
                      )}
                  </div>
                </div>
              )}

            {/* Partial */}
            {assessment?.status === "PARTIAL" && (
              <div
                className="
                  flex items-start gap-2.5
                  rounded-xl
                  border
                  border-amber-200
                  bg-amber-50
                  px-3.5 py-3

                  dark:border-amber-900/70
                  dark:bg-amber-950/25
                "
              >
                <AlertTriangle
                  className="
                    mt-0.5 size-4 shrink-0
                    text-amber-600
                    dark:text-amber-400
                  "
                />

                <div>
                  <p
                    className="
                      text-sm font-semibold
                      text-amber-900
                      dark:text-amber-300
                    "
                  >
                    Sebagian data lingkungan belum tersedia
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-xs leading-5
                      text-amber-800
                      dark:text-amber-400/80
                    "
                  >
                    Analisis tetap dibuat dari sumber yang berhasil dikumpulkan
                    {assessment.providerErrors.length > 0 &&
                      ` (${assessment.providerErrors.length} sumber terkendala).`}
                  </p>
                </div>
              </div>
            )}

            {/* ================================================= */}
            {/* Risk */}
            {/* ================================================= */}

            {risk && (
              <section
                className={`
                  overflow-hidden
                  rounded-2xl
                  border
                  bg-white
                  shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                  dark:bg-neutral-900
                  dark:shadow-none

                  ${RISK_TONES[risk.level].border}
                `}
              >
                {/* Main risk */}
                <div className="grid lg:grid-cols-[190px_1fr]">
                  {/* Score */}
                  <div
                    className={`
                      border-b
                      border-neutral-100
                      px-5 py-4
                      dark:border-neutral-800
                      lg:border-b-0
                      lg:border-r
                      lg:px-5
                      lg:py-5
                      ${RISK_TONES[risk.level].surface}
                    `}
                  >
                    <p
                      className="
                        text-[10px] font-semibold
                        text-neutral-400
                        dark:text-neutral-500
                      "
                    >
                      Tingkat risiko
                    </p>

                    <div className="mt-1 flex items-end gap-2">
                      <span
                        className={`
                          font-mono
                          text-4xl
                          font-bold
                          leading-none
                          tracking-tight
                          tabular-nums
                          ${RISK_TONES[risk.level].score}
                        `}
                      >
                        {normalizeScore(risk.score)}
                      </span>

                      <span
                        className="
                          mb-0.5 text-xs
                          text-neutral-400
                          dark:text-neutral-500
                        "
                      >
                        /100
                      </span>
                    </div>

                    <div className="mt-2">
                      <RiskLevelBadge level={risk.level} />
                    </div>

                    <p
                      className="
                        mt-1.5
                        text-[10px]
                        text-neutral-400
                        dark:text-neutral-500
                      "
                    >
                      Keyakinan {Math.round(risk.confidence * 100)}%
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="px-5 py-4 lg:px-6 lg:py-5">
                    <div className="flex items-center gap-2">
                      <div
                        className="
                          grid size-7 place-items-center
                          rounded-md
                          bg-sky-50
                          dark:bg-sky-950/40
                        "
                      >
                        <Sparkles
                          className="
                            size-3.5
                            text-sky-600
                            dark:text-sky-400
                          "
                        />
                      </div>

                      <h2
                        className="
                          text-sm font-semibold
                          text-neutral-950
                          dark:text-neutral-100
                        "
                      >
                        Analisis risiko
                      </h2>
                    </div>

                    <p
                      className="
                        mt-2
                        text-sm leading-6
                        text-neutral-600
                        dark:text-neutral-300
                      "
                    >
                      {risk.summary}
                    </p>

                    {risk.factors.length > 0 && (
                      <div
                        className="
                          mt-3
                          border-t
                          border-neutral-100
                          pt-3
                          dark:border-neutral-800
                        "
                      >
                        <p
                          className="
                            text-[10px] font-semibold
                            text-neutral-400
                            dark:text-neutral-500
                          "
                        >
                          Faktor utama
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                          {[...new Set(risk.factors)]
                            .slice(0, 3)
                            .map((factor) => (
                              <div
                                key={factor}
                                className="
                                  flex items-start gap-2
                                  text-xs leading-5
                                  text-neutral-600
                                  dark:text-neutral-300
                                "
                              >
                                <span
                                  className="
                                    mt-2 size-1.5 shrink-0
                                    rounded-full
                                    bg-sky-500
                                  "
                                />

                                <span>{factor}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Horizons */}
                <div
                  className="
                    border-t
                    border-neutral-100
                    dark:border-neutral-800
                  "
                >
                  <div
                    className="
                      grid
                      sm:grid-cols-3
                      sm:divide-x
                      sm:divide-neutral-100
                      sm:dark:divide-neutral-800
                    "
                  >
                    {HORIZON_META.map((item) => {
                      const horizon = risk.horizons[item.key];

                      return (
                        <div
                          key={item.key}
                          className="
                            flex items-center justify-between gap-3
                            border-b
                            border-neutral-100
                            px-4 py-3.5
                            last:border-b-0

                            dark:border-neutral-800

                            sm:block
                            sm:border-b-0
                            sm:px-4
                          "
                        >
                          <div>
                            <p
                              className="
                                text-xs font-semibold
                                text-neutral-800
                                dark:text-neutral-200
                              "
                            >
                              {item.label}
                            </p>

                            <p
                              className="
                                mt-0.5 text-[10px]
                                text-neutral-400
                                dark:text-neutral-500
                              "
                            >
                              {item.caption}
                            </p>
                          </div>

                          <div className="text-right sm:mt-2 sm:text-left">
                            <span
                              className="
                                font-mono text-sm font-bold
                                tabular-nums
                                text-neutral-700
                                dark:text-neutral-200
                              "
                            >
                              {normalizeScore(horizon.score)}
                            </span>

                            <span
                              className={`
                                ml-1.5
                                text-[10px]
                                font-semibold
                                ${RISK_TONES[horizon.level].score}
                              `}
                            >
                              {RISK_TONES[horizon.level].label}
                            </span>

                            <p
                              className="
                                mt-0.5
                                hidden
                                text-[10px]
                                leading-4
                                text-neutral-400
                                dark:text-neutral-500
                                sm:block
                              "
                            >
                              {horizon.summary}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ================================================= */}
            {/* Context */}
            {/* ================================================= */}

            {assessment && (
              <div
                className="
                  flex items-center justify-between gap-3
                  rounded-xl
                  border
                  border-neutral-200
                  bg-white
                  px-3.5 py-3

                  dark:border-neutral-800
                  dark:bg-neutral-900
                "
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="
                      grid size-7 shrink-0 place-items-center
                      rounded-md
                      bg-sky-50
                      dark:bg-sky-950/40
                    "
                  >
                    <MapPin
                      className="
                        size-3.5
                        text-sky-600
                        dark:text-sky-400
                      "
                    />
                  </div>

                  <p
                    className="
                      truncate text-xs
                      text-neutral-500
                      dark:text-neutral-400
                    "
                  >
                    <strong
                      className="
                        font-semibold
                        text-neutral-800
                        dark:text-neutral-200
                      "
                    >
                      {assessment.nearbyReportCount}
                    </strong>{" "}
                    laporan sekitar digunakan sebagai konteks
                  </p>
                </div>

                {assessment.incidentClusterId && (
                  <span
                    className="
                      hidden shrink-0
                      rounded-md
                      bg-neutral-100
                      px-2 py-1
                      text-[10px] font-medium
                      text-neutral-500
                      dark:bg-neutral-800
                      dark:text-neutral-400
                      sm:inline-flex
                    "
                  >
                    Insiden terkait
                  </span>
                )}
              </div>
            )}

            {/* Retry error */}
            {retryError && (
              <p
                className="
                  text-center
                  text-xs font-medium
                  text-rose-600
                  dark:text-rose-400
                "
                role="alert"
              >
                {retryError}
              </p>
            )}

            {/* Retry */}
            {canRetryManually && result && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isRefreshing}
                  onClick={() => void runRefresh(result.report.id, "manual")}
                  className="
                    h-9
                    rounded-lg
                    border-sky-200
                    bg-white
                    px-3.5
                    text-xs
                    font-semibold
                    text-sky-700
                    hover:bg-sky-50

                    dark:border-sky-800
                    dark:bg-neutral-900
                    dark:text-sky-400
                    dark:hover:bg-sky-950/30
                  "
                >
                  <RefreshCw
                    className={`
                      size-3.5
                      ${retryMode === "manual" ? "animate-spin" : ""}
                    `}
                  />

                  {retryMode === "manual"
                    ? "Mencoba analisis..."
                    : "Coba analisis lagi"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================== */}
        {/* Footer */}
        {/* ===================================================== */}

        <DialogFooter
          className="
            grid
            shrink-0
            gap-2
            border-t
            border-neutral-100
            bg-white
            px-3 py-3

            dark:border-neutral-800
            dark:bg-neutral-900

            sm:grid-cols-[auto_1fr]
            sm:px-5
            sm:py-3.5
            lg:px-6
          "
        >
          <Button
            type="button"
            variant="outline"
            onClick={onCreateAnother}
            className="
              h-9
              rounded-lg
              border-neutral-200
              bg-white
              text-xs
              font-medium
              text-neutral-700
              hover:bg-neutral-50

              dark:border-neutral-700
              dark:bg-neutral-900
              dark:text-neutral-300
              dark:hover:bg-neutral-800

              sm:px-4
            "
          >
            <RotateCcw className="size-3.5" />
            Buat laporan baru
          </Button>

          <Button
            render={<Link to="/dashboard/my-reports" />}
            className="
              h-9
              rounded-lg
              bg-sky-600
              text-xs
              font-semibold
              text-white
              shadow-sm
              hover:bg-sky-700

              dark:bg-sky-600
              dark:hover:bg-sky-500

              sm:px-5
            "
          >
            Lihat laporan saya
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
