import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock,
  Clock3,
  CloudRain,
  Eye,
  FileQuestion,
  Flame,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Waves,
  Wind,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type CreateReportResult,
  getMyReportsFn,
  refreshReportAssessmentFn,
} from "@/lib/reports.functions";
import type {
  RiskAssessmentStatus,
  RiskLevel,
} from "@/types/report-assessment";

export const Route = createFileRoute("/_protected/dashboard/my-reports")({
  loader: async () => {
    return await getMyReportsFn();
  },
  component: MyReportsPage,
});

type ReportStatus = "verified" | "pending" | "rejected";

type ReportAssessmentDisplay = {
  status: RiskAssessmentStatus;
  score: number | null;
  level: RiskLevel | null;
  summary: string | null;
  nearbyReportCount: number;
  attemptCount: number;
  lastAttemptAt: Date | string | null;
};

type ReportDisplay = {
  id: string;
  title: string;
  category: string;
  location: string;
  status: ReportStatus;
  date: string;
  confidence?: number;
  supportingReports?: number;
  ecolensSummary?: string;
  assessment: ReportAssessmentDisplay | null;
};

type StoredAssessment = {
  status: string;
  score: number | null;
  level: string | null;
  summary: string | null;
  nearbyReportCount: number;
  attemptCount: number;
  lastAttemptAt: Date | string | null;
};

const ASSESSMENT_RETRY_COOLDOWN_MS = 5_000;
const MAX_AUTOMATIC_ATTEMPTS = 3;

const assessmentStatusConfig: Record<
  RiskAssessmentStatus,
  { label: string; className: string }
> = {
  COMPLETE: {
    label: "Analisis lengkap",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/60",
  },
  PARTIAL: {
    label: "Data sebagian",
    className:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/60",
  },
  PENDING: {
    label: "Sedang dianalisis",
    className:
      "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-900/60",
  },
  FAILED: {
    label: "Analisis tertunda",
    className:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-900/60",
  },
};

const riskLevelConfig: Record<
  RiskLevel,
  {
    label: string;
    className: string;
    scoreClassName: string;
  }
> = {
  LOW: {
    label: "Rendah",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/60",
    scoreClassName: "text-emerald-700 dark:text-emerald-400",
  },
  MODERATE: {
    label: "Sedang",
    className:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/60",
    scoreClassName: "text-amber-700 dark:text-amber-400",
  },
  HIGH: {
    label: "Tinggi",
    className:
      "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:ring-orange-900/60",
    scoreClassName: "text-orange-700 dark:text-orange-400",
  },
  CRITICAL: {
    label: "Kritis",
    className:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-900/60",
    scoreClassName: "text-rose-700 dark:text-rose-400",
  },
};

const statusConfig: Record<
  ReportStatus,
  {
    label: string;
    note: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  verified: {
    label: "Terverifikasi",
    note: "Didukung komunitas",
    className:
      "bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60",
    icon: CheckCircle2,
  },
  pending: {
    label: "Menunggu verifikasi",
    note: "Sedang dianalisis",
    className:
      "bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60",
    icon: Clock3,
  },
  rejected: {
    label: "Ditolak",
    note: "Bukti belum cukup",
    className:
      "bg-rose-50 text-rose-600 border border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60",
    icon: XCircle,
  },
};

const categoryIconMap: Record<
  string,
  { icon: typeof Waves; className: string }
> = {
  Banjir: {
    icon: Waves,
    className:
      "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  },
  "Drainase/Banjir": {
    icon: Waves,
    className:
      "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  },
  Cuaca: {
    icon: CloudRain,
    className: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
  },
  "Kualitas Udara": {
    icon: Wind,
    className:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  },
  Polusi: {
    icon: Wind,
    className:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  },
  Sampah: {
    icon: Trash2,
    className:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  Kebakaran: {
    icon: Flame,
    className:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
  },
  "Fasilitas Rusak": {
    icon: AlertTriangle,
    className:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  },
  Lainnya: {
    icon: FileQuestion,
    className:
      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
};

function formatStatus(status: string): ReportStatus {
  if (status === "VERIFIED") return "verified";
  if (status === "REJECTED") return "rejected";
  return "pending";
}

function formatDate(dateInput: string | Date): string {
  const date = new Date(dateInput);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeAssessmentStatus(status: string): RiskAssessmentStatus {
  if (status === "COMPLETE" || status === "PARTIAL" || status === "FAILED") {
    return status;
  }

  return "PENDING";
}

function normalizeRiskLevel(level: string | null): RiskLevel | null {
  if (
    level === "LOW" ||
    level === "MODERATE" ||
    level === "HIGH" ||
    level === "CRITICAL"
  ) {
    return level;
  }

  return null;
}

function storedAssessmentToDisplay(
  assessment: StoredAssessment | null | undefined,
): ReportAssessmentDisplay | null {
  if (!assessment) return null;

  return {
    status: normalizeAssessmentStatus(assessment.status),
    score: assessment.score,
    level: normalizeRiskLevel(assessment.level),
    summary: assessment.summary,
    nearbyReportCount: assessment.nearbyReportCount,
    attemptCount: assessment.attemptCount,
    lastAttemptAt: assessment.lastAttemptAt,
  };
}

function refreshedAssessmentToDisplay(
  result: CreateReportResult,
): ReportAssessmentDisplay {
  const storedAssessment = result.report.riskAssessment;

  return {
    status: result.assessment.status,
    score: result.assessment.risk?.score ?? storedAssessment?.score ?? null,
    level:
      result.assessment.risk?.level ??
      normalizeRiskLevel(storedAssessment?.level ?? null),
    summary:
      result.assessment.risk?.summary ?? storedAssessment?.summary ?? null,
    nearbyReportCount: result.assessment.nearbyReportCount,
    attemptCount: storedAssessment?.attemptCount ?? 0,
    lastAttemptAt: storedAssessment?.lastAttemptAt ?? null,
  };
}

function canAutomaticallyRetry(
  assessment: ReportAssessmentDisplay | null,
): boolean {
  if (
    !assessment ||
    assessment.status !== "PENDING" ||
    assessment.attemptCount >= MAX_AUTOMATIC_ATTEMPTS
  ) {
    return false;
  }

  if (!assessment.lastAttemptAt) return true;

  const lastAttemptTime = new Date(assessment.lastAttemptAt).getTime();

  return (
    !Number.isFinite(lastAttemptTime) ||
    Date.now() - lastAttemptTime >= ASSESSMENT_RETRY_COOLDOWN_MS
  );
}

function normalizeScore(score: number): number {
  return Math.round(Math.min(100, Math.max(0, score)));
}

const filters = ["Semua", "Menunggu verifikasi", "Terverifikasi", "Ditolak"];

function MyReportsPage() {
  const dbReports = Route.useLoaderData();

  const refreshReportAssessment = useServerFn(refreshReportAssessmentFn);

  const retryLocksRef = useRef(new Set<string>());
  const automaticRetriesRef = useRef(new Set<string>());

  const [activeFilter, setActiveFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const [assessmentOverrides, setAssessmentOverrides] = useState<
    Record<string, ReportAssessmentDisplay>
  >({});

  const [refreshingReportIds, setRefreshingReportIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [assessmentErrors, setAssessmentErrors] = useState<
    Record<string, string | null>
  >({});

  const reports: ReportDisplay[] = (dbReports || []).map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    location: item.locationName,
    status: formatStatus(item.status),
    date: formatDate(item.createdAt),
    confidence: item.ecolensAnalysis?.confidence
      ? Math.round(item.ecolensAnalysis.confidence * 100)
      : undefined,
    ecolensSummary: item.ecolensAnalysis?.summary,
    assessment:
      assessmentOverrides[item.id] ??
      storedAssessmentToDisplay(item.riskAssessment),
  }));

  const refreshAssessment = async (reportId: string) => {
    if (retryLocksRef.current.has(reportId)) return;

    retryLocksRef.current.add(reportId);

    setRefreshingReportIds((current) => new Set(current).add(reportId));

    setAssessmentErrors((current) => ({
      ...current,
      [reportId]: null,
    }));

    try {
      const result = await refreshReportAssessment({
        data: { reportId },
      });

      setAssessmentOverrides((current) => ({
        ...current,
        [reportId]: refreshedAssessmentToDisplay(result),
      }));
    } catch (error) {
      console.error("[MyReports] Gagal memperbarui analisis risiko:", error);

      setAssessmentErrors((current) => ({
        ...current,
        [reportId]:
          "Analisis belum dapat diperbarui. Tunggu sebentar lalu coba lagi.",
      }));
    } finally {
      retryLocksRef.current.delete(reportId);

      setRefreshingReportIds((current) => {
        const next = new Set(current);
        next.delete(reportId);
        return next;
      });
    }
  };

  const toggleAssessment = (report: ReportDisplay) => {
    const willOpen = expandedReportId !== report.id;

    setExpandedReportId(willOpen ? report.id : null);

    if (
      willOpen &&
      canAutomaticallyRetry(report.assessment) &&
      !automaticRetriesRef.current.has(report.id)
    ) {
      automaticRetriesRef.current.add(report.id);
      void refreshAssessment(report.id);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesFilter =
      activeFilter === "Semua" ||
      statusConfig[report.status].label === activeFilter;

    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      report.title.toLowerCase().includes(query) ||
      report.location.toLowerCase().includes(query) ||
      report.category.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const summary = [
    {
      label: "Total laporan",
      value: reports.length,
      icon: FileQuestion,
      iconClass:
        "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
      valueClass: "text-neutral-900 dark:text-neutral-100",
    },
    {
      label: "Menunggu",
      value: reports.filter((r) => r.status === "pending").length,
      icon: Clock3,
      iconClass:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
      valueClass: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Terverifikasi",
      value: reports.filter((r) => r.status === "verified").length,
      icon: CheckCircle2,
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      valueClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Ditolak",
      value: reports.filter((r) => r.status === "rejected").length,
      icon: XCircle,
      iconClass:
        "bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400",
      valueClass: "text-rose-500 dark:text-rose-400",
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-50/60 dark:bg-neutral-950">
      <div className="flex flex-col gap-2 p-3 sm:p-4 lg:flex-row lg:items-stretch">
        {/* LEFT COLUMN */}
        <div className="flex w-full min-w-0 flex-col gap-3 rounded-xl bg-muted/50 p-2 dark:bg-muted/30 lg:w-2/3">
          {/* Filter & Search */}
          <section className="rounded-lg border border-neutral-200/70 bg-white/95 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-800/80">
            <div className="flex flex-col gap-3 p-3.5 sm:px-4 sm:py-3.5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400">
                    <FileQuestion className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Laporan Anda
                    </h1>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Riwayat kontribusi lingkungan Anda
                    </p>
                  </div>
                </div>

                <div className="relative w-full lg:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari laporan..."
                    className="h-8.5 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-xs text-neutral-700 outline-none transition-colors placeholder:text-neutral-400 focus:border-sky-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:placeholder:text-neutral-600 dark:focus:border-sky-700 dark:focus:bg-neutral-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto border-t border-neutral-100 pt-2.5 dark:border-neutral-700/60">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      activeFilter === filter
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Reports */}
          <section className="overflow-hidden rounded-lg border border-neutral-200/70 bg-white/95 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-800/80">
            {filteredReports.length > 0 ? (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-700/60">
                  <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                    Menampilkan {filteredReports.length} laporan
                  </p>

                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1 text-[10px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  >
                    Terbaru
                    <ChevronDown className="size-3 text-neutral-400" />
                  </button>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-700/60">
                  {filteredReports.map((report) => {
                    const status = statusConfig[report.status];
                    const StatusIcon = status.icon;

                    const categoryData =
                      categoryIconMap[report.category] ||
                      categoryIconMap.Lainnya;

                    const CategoryIcon = categoryData.icon;

                    const assessment = report.assessment;

                    const assessmentMeta = assessment
                      ? assessmentStatusConfig[assessment.status]
                      : null;

                    const riskTone = assessment?.level
                      ? riskLevelConfig[assessment.level]
                      : null;

                    const isExpanded = expandedReportId === report.id;
                    const isRefreshing = refreshingReportIds.has(report.id);
                    const assessmentError = assessmentErrors[report.id];

                    const assessmentRegionId = `risk-assessment-${report.id}`;
                    const assessmentControlId = `risk-assessment-control-${report.id}`;

                    return (
                      <article
                        key={report.id}
                        className="group transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-700/30"
                      >
                        {/* Report row */}
                        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${categoryData.className}`}
                          >
                            <CategoryIcon className="size-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h2 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {report.title}
                            </h2>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3" />
                                <span className="truncate">
                                  {report.location}
                                </span>
                              </span>

                              <span className="inline-flex items-center gap-1">
                                <Clock className="size-3" />
                                {report.date}
                              </span>

                              {report.confidence && (
                                <span className="inline-flex items-center gap-1 font-medium text-neutral-600 dark:text-neutral-300">
                                  <Brain className="size-3 text-sky-500 dark:text-sky-400" />
                                  {report.confidence}% keyakinan ai
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:justify-end">
                            <div className="text-left sm:text-right">
                              <div
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}
                              >
                                <StatusIcon className="size-3" />
                                {status.label}
                              </div>

                              <p className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                                {status.note}
                              </p>
                            </div>

                            <button
                              id={assessmentControlId}
                              type="button"
                              aria-expanded={isExpanded}
                              aria-controls={assessmentRegionId}
                              onClick={() => toggleAssessment(report)}
                              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 text-[10px] font-semibold text-sky-700 outline-none transition-colors hover:border-sky-300 hover:bg-sky-100 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-400 dark:hover:border-sky-800 dark:hover:bg-sky-900/50 dark:focus-visible:ring-offset-neutral-800"
                            >
                              <ShieldAlert
                                className="size-3.5"
                                aria-hidden="true"
                              />

                              <span className="hidden sm:inline">
                                Analisis risiko
                              </span>

                              <ChevronDown
                                className={`size-3 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>

                        {/* Expanded assessment */}
                        {isExpanded && (
                          <section
                            id={assessmentRegionId}
                            aria-labelledby={assessmentControlId}
                            aria-live="polite"
                            className="border-t border-sky-100 bg-sky-50/50 px-3 py-3.5 sm:px-4 dark:border-neutral-700/60 dark:bg-sky-950/10"
                          >
                            <div className="rounded-lg border border-sky-100 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] sm:p-4 dark:border-sky-900/50 dark:bg-neutral-900 dark:shadow-none">
                              {/* Assessment header */}
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                                    <Sparkles
                                      className="size-3.5"
                                      aria-hidden="true"
                                    />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                      Analisis risiko
                                    </p>

                                    {assessment && (
                                      <p className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                                        {assessment.nearbyReportCount} laporan
                                        aktif di sekitar
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {assessmentMeta && (
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${assessmentMeta.className}`}
                                  >
                                    {assessmentMeta.label}
                                  </span>
                                )}
                              </div>

                              {/* Refresh state */}
                              {isRefreshing && (
                                <div className="mt-3 flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5 text-[11px] font-medium text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400">
                                  <RefreshCw
                                    className="size-3.5 animate-spin"
                                    aria-hidden="true"
                                  />

                                  <span>
                                    Memperbarui analisis dari kondisi terbaru...
                                  </span>
                                </div>
                              )}

                              {/* Assessment result */}
                              {assessment?.score !== null &&
                              assessment?.score !== undefined &&
                              assessment.summary &&
                              riskTone ? (
                                <div className="mt-3 grid gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
                                  {/* Score */}
                                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                                    <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                                      Skor risiko
                                    </p>

                                    <p
                                      className={`mt-1 font-mono text-2xl font-bold leading-none tabular-nums ${riskTone.scoreClassName}`}
                                    >
                                      {normalizeScore(assessment.score)}

                                      <span className="ml-0.5 text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                                        /100
                                      </span>
                                    </p>

                                    <span
                                      className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${riskTone.className}`}
                                    >
                                      {riskTone.label}
                                    </span>
                                  </div>

                                  {/* Summary */}
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                                        Ringkasan
                                      </p>

                                      <Button
                                        render={
                                          <Link
                                            to="/dashboard/report-detail/$reportId"
                                            params={{
                                              reportId: report.id,
                                            }}
                                          />
                                        }
                                        variant="outline"
                                        size="sm"
                                        className="h-7 gap-1.5 rounded-lg border-neutral-200 px-2.5 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
                                      >
                                        <Eye className="size-3" />
                                        Detail
                                      </Button>
                                    </div>

                                    <p className="mt-1.5 text-xs leading-5 text-neutral-600 dark:text-neutral-400">
                                      {assessment.summary}
                                    </p>

                                    {assessment.status === "PARTIAL" && (
                                      <p className="mt-2 inline-flex items-start gap-1.5 text-[10px] font-medium leading-4 text-amber-700 dark:text-amber-400">
                                        <AlertTriangle
                                          className="mt-0.5 size-3 shrink-0"
                                          aria-hidden="true"
                                        />

                                        <span>
                                          Sebagian sumber lingkungan belum
                                          tersedia.
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                !isRefreshing && (
                                  <div className="mt-3 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
                                    <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                                      {assessment?.status === "FAILED"
                                        ? "Analisis risiko belum berhasil dibuat. Laporan Anda tetap tersimpan dan dapat dianalisis kembali."
                                        : assessment?.status === "PENDING"
                                          ? "Analisis risiko masih menunggu data lingkungan atau respons layanan ai."
                                          : "Analisis risiko belum tersedia untuk laporan ini."}
                                    </p>
                                  </div>
                                )
                              )}

                              {/* Error */}
                              {assessmentError && (
                                <p
                                  className="mt-2 text-[10px] font-medium leading-4 text-rose-600 dark:text-rose-400"
                                  role="alert"
                                >
                                  {assessmentError}
                                </p>
                              )}

                              {/* Retry */}
                              {assessment?.status === "FAILED" && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={isRefreshing}
                                  onClick={() =>
                                    void refreshAssessment(report.id)
                                  }
                                  className="mt-3 h-8 rounded-lg border-sky-200 px-3 text-[10px] font-semibold text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-900/70 dark:bg-neutral-950 dark:text-sky-400 dark:hover:bg-sky-950/30 dark:hover:text-sky-300"
                                >
                                  <RefreshCw
                                    className={`size-3 ${
                                      isRefreshing ? "animate-spin" : ""
                                    }`}
                                    aria-hidden="true"
                                  />

                                  {isRefreshing
                                    ? "Mencoba kembali..."
                                    : "Coba analisis lagi"}
                                </Button>
                              )}
                            </div>
                          </section>
                        )}
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex min-h-88 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
                  <FileQuestion className="size-5" />
                </div>

                <h3 className="mt-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {searchQuery
                    ? "Laporan tidak ditemukan"
                    : "Belum ada laporan"}
                </h3>

                <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {searchQuery
                    ? "Coba gunakan kata kunci lain atau ubah filter yang sedang dipilih."
                    : "Anda belum memiliki laporan yang tersimpan. Gunakan EcoLens untuk membuat laporan pertama Anda."}
                </p>

                {!searchQuery && (
                  <Button
                    render={<Link to="/dashboard/report" />}
                    className="mt-4 h-8 gap-2 rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
                  >
                    <Plus className="size-3.5" />
                    Mulai dengan EcoLens
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="flex w-full min-w-0 flex-col gap-3 lg:w-1/3">
          {/* CTA */}
          <section className="relative overflow-hidden rounded-lg border border-sky-100 bg-linear-to-br from-sky-50 via-white to-white p-4 shadow-sm dark:border-sky-900/50 dark:from-sky-950/50 dark:via-neutral-800 dark:to-neutral-800">
            <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-sky-200/40 blur-2xl dark:bg-sky-500/10" />

            <div className="relative">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-xs ring-1 ring-sky-100 dark:bg-sky-900/40 dark:text-sky-400 dark:ring-sky-800/50">
                <Brain className="size-5" />
              </div>

              <h3 className="mt-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Punya sesuatu untuk dilaporkan?
              </h3>

              <p className="mt-1.5 max-w-[18rem] text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Bantu lingkungan sekitar dengan mengirim laporan. EcoLens akan
                membantu menganalisis kondisi secara otomatis.
              </p>

              <Button
                render={<Link to="/dashboard/report" />}
                className="mt-4 h-9 w-full gap-2 rounded-lg bg-sky-600 text-xs font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
              >
                <Plus className="size-3.5" />
                Buat laporan baru
              </Button>
            </div>
          </section>

          {/* Statistics */}
          <section className="overflow-hidden rounded-lg border border-neutral-200/70 bg-white/95 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-800/80">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-700/60">
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Ringkasan laporan
                </h3>

                <p className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                  Status kontribusi Anda
                </p>
              </div>

              <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                <FileQuestion className="size-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 dark:divide-neutral-700/60">
              {summary.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="group relative flex min-h-26 flex-col justify-between p-3.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/30"
                  >
                    <div
                      className={`flex size-7 items-center justify-center rounded-lg ${item.iconClass}`}
                    >
                      <Icon className="size-3.5" />
                    </div>

                    <div className="mt-3">
                      <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                        {item.label}
                      </p>

                      <p
                        className={`mt-0.5 text-xl font-semibold tracking-tight ${item.valueClass}`}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Contribution note */}
          <section className="rounded-lg bg-neutral-100/80 p-3.5 dark:bg-neutral-800/60">
            <div className="flex gap-3">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-sky-600 shadow-xs dark:bg-neutral-700 dark:text-sky-400">
                <Sparkles className="size-3.5" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
                  Sedikit kontribusi, dampak yang berarti
                </p>

                <p className="mt-1 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Laporan yang Anda kirim dapat membantu mengenali pola risiko
                  dan kondisi lingkungan di sekitar.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
