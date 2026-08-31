import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CloudRain,
  FileText,
  Images,
  MapPin,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { InsightDetailView } from "@/lib/insight.functions";

type InsightDetailProps = {
  insight: InsightDetailView;
  rank?: number;
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "baru saja";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

const categoryColors: Record<string, string> = {
  Sampah:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400",
  "Drainase/Banjir":
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-400",
  Polusi:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-400",
  Kebakaran:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400",
  "Fasilitas Rusak":
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-400",
};

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu",
  VERIFIED: "Tervalidasi",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  REJECTED: "Ditolak",
};

function getImpactTone(impact: string) {
  if (impact === "Tinggi") {
    return {
      badge:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400",
      icon: "text-red-500",
      dot: "bg-red-500",
      border: "border-red-200 dark:border-red-900/60",
    };
  }

  if (impact === "Sedang") {
    return {
      badge:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400",
      icon: "text-amber-500",
      dot: "bg-amber-500",
      border: "border-amber-200 dark:border-amber-900/60",
    };
  }

  return {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400",
    icon: "text-emerald-500",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-900/60",
  };
}

export default function InsightDetail({ insight, rank }: InsightDetailProps) {
  const navigate = useNavigate();

  const impactTone = getImpactTone(insight.impact);

  const allImages = insight.reports.flatMap((report) => report.images).slice(0, 24);

  const scoreTone =
    insight.impactScore >= 70
      ? {
          text: "text-red-600 dark:text-red-400",
          border: "border-red-200 dark:border-red-900/60",
          bg: "bg-red-50 dark:bg-red-950/20",
          bar: "bg-red-500",
        }
      : insight.impactScore >= 40
        ? {
            text: "text-amber-600 dark:text-amber-400",
            border: "border-amber-200 dark:border-amber-900/60",
            bg: "bg-amber-50 dark:bg-amber-950/20",
            bar: "bg-amber-500",
          }
        : {
            text: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-200 dark:border-emerald-900/60",
            bg: "bg-emerald-50 dark:bg-emerald-950/20",
            bar: "bg-emerald-500",
          };

  const trendUp = insight.trend === "up";
  const trendDown = insight.trend === "down";

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            to="/dashboard/insights"
            className="
              group
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-transparent
              px-2
              py-1.5
              text-xs
              font-medium
              text-neutral-600
              transition-all
              hover:border-neutral-200
              hover:bg-white
              hover:text-neutral-950
              dark:text-neutral-400
              dark:hover:border-neutral-800
              dark:hover:bg-neutral-900
              dark:hover:text-neutral-100
            "
          >
            <ArrowLeft
              className="
                size-3.5
                transition-transform
                duration-150
                group-hover:-translate-x-0.5
              "
            />
            Kembali ke insight
          </Link>
        </div>

        {/* Hero */}
        <section
          className="
            relative
            mb-5
            overflow-hidden
            rounded-2xl
            border
            border-neutral-200
            bg-white
            shadow-[0_4px_14px_rgba(15,23,42,0.06)]
            dark:border-neutral-800
            dark:bg-neutral-900
            dark:shadow-none
          "
        >
          {/* Hero thumbnail from supporting reports */}
          {allImages.length > 0 && (
            <img
              src={allImages[0]}
              alt={insight.title}
              loading="lazy"
              className="
                pointer-events-none
                absolute
                right-0
                top-0
                h-full
                w-48
                object-cover
                opacity-20
                dark:opacity-10
                lg:w-64
              "
            />
          )}

          <div className="relative p-5 sm:p-6 lg:p-7">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  ${impactTone.badge}
                `}
              >
                Dampak {insight.impact}
              </span>

              <span
                className="
                  rounded-full
                  border
                  border-neutral-200
                  bg-neutral-100
                  px-2.5
                  py-1
                  text-[10px]
                  font-medium
                  text-neutral-600
                  dark:border-neutral-800
                  dark:bg-neutral-800/60
                  dark:text-neutral-400
                "
              >
                {rank ? `Prioritas #${rank}` : "Detail Insight"}
              </span>

              <span
                className={`
                  rounded-full
                  border
                  px-2.5
                  py-1
                  text-[10px]
                  font-medium
                  ${
                    categoryColors[insight.category] ??
                    "border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400"
                  }
                `}
              >
                {insight.category}
              </span>
            </div>

            {/* Title */}
            <div className="mt-4 max-w-3xl">
              <h1
                className="
                  text-2xl
                  font-semibold
                  leading-tight
                  tracking-tight
                  text-neutral-950
                  dark:text-neutral-50
                  sm:text-3xl
                  lg:text-[34px]
                  lg:leading-[1.15]
                "
              >
                {insight.title}
              </h1>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-neutral-600
                  dark:text-neutral-400
                "
              >
                Insight berbasis kumpulan laporan lingkungan yang dianalisis
                untuk membantu memahami kondisi dan potensi dampaknya.
              </p>
            </div>

            {/* Context */}
            <div
              className="
                mt-5
                flex
                flex-wrap
                items-center
                gap-x-5
                gap-y-2.5
                border-t
                border-neutral-200
                pt-4
                dark:border-neutral-800
              "
            >
              <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                <div
                  className="
                    grid
                    size-7
                    place-items-center
                    rounded-md
                    border
                    border-sky-200
                    bg-sky-50
                    text-sky-600
                    dark:border-sky-900/50
                    dark:bg-sky-950/40
                    dark:text-sky-400
                  "
                >
                  <MapPin className="size-3.5" />
                </div>

                <span className="font-medium">{insight.locationName}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                <div
                  className="
                    grid
                    size-7
                    place-items-center
                    rounded-md
                    border
                    border-neutral-200
                    bg-neutral-100
                    text-neutral-500
                    dark:border-neutral-800
                    dark:bg-neutral-800
                    dark:text-neutral-400
                  "
                >
                  <Clock className="size-3.5" />
                </div>

                <span>Diperbarui {timeAgo(insight.generatedAt)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main metrics */}
        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Reports */}
          <div
            className="
              rounded-xl
              border
              border-neutral-200
              bg-white
              p-4
              shadow-[0_2px_8px_rgba(15,23,42,0.05)]
              dark:border-neutral-800
              dark:bg-neutral-900
              dark:shadow-none
            "
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Laporan
              </span>

              <div
                className="
                  grid
                  size-7
                  place-items-center
                  rounded-md
                  border
                  border-neutral-200
                  bg-neutral-100
                  text-neutral-500
                  dark:border-neutral-800
                  dark:bg-neutral-800
                  dark:text-neutral-400
                "
              >
                <FileText className="size-3.5" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-100">
              {insight.reportCount}
            </p>

            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
              laporan · {insight.validatedCount} tervalidasi
            </p>
          </div>

          {/* Rain / Risk condition */}
          <div
            className="
              rounded-xl
              border
              border-neutral-200
              bg-white
              p-4
              shadow-[0_2px_8px_rgba(15,23,42,0.05)]
              dark:border-neutral-800
              dark:bg-neutral-900
              dark:shadow-none
            "
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Kondisi
              </span>

              <div
                className="
                  grid
                  size-7
                  place-items-center
                  rounded-md
                  border
                  border-blue-200
                  bg-blue-50
                  text-blue-600
                  dark:border-blue-900/50
                  dark:bg-blue-950/40
                  dark:text-blue-400
                "
              >
                <CloudRain className="size-3.5" />
              </div>
            </div>

            <div className="mt-2 space-y-0.5 text-xs text-neutral-600 dark:text-neutral-400">
              <p>Curah hujan: <span className="font-medium text-neutral-900 dark:text-neutral-200">{insight.rainCondition}</span></p>
              <p>Kualitas udara: <span className="font-medium text-neutral-900 dark:text-neutral-200">{insight.airQualityCondition}</span></p>
              {insight.riskLevel && (
                <p>Risiko: <span className="font-medium text-neutral-900 dark:text-neutral-200">{insight.riskLevel}</span></p>
              )}
            </div>
          </div>

          {/* Radius */}
          <div
            className="
              rounded-xl
              border
              border-neutral-200
              bg-white
              p-4
              shadow-[0_2px_8px_rgba(15,23,42,0.05)]
              dark:border-neutral-800
              dark:bg-neutral-900
              dark:shadow-none
            "
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Jangkauan
              </span>

              <div
                className="
                  grid
                  size-7
                  place-items-center
                  rounded-md
                  border
                  border-sky-200
                  bg-sky-50
                  text-sky-600
                  dark:border-sky-900/50
                  dark:bg-sky-950/40
                  dark:text-sky-400
                "
              >
                <MapPin className="size-3.5" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-100">
              {insight.affectedRadiusKm ?? "-"}
              <span className="ml-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                km
              </span>
            </p>

            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
              area yang terdampak
            </p>
          </div>

          {/* Score */}
          <div
            className={`
              rounded-xl
              border
              bg-white
              p-4
              shadow-[0_2px_8px_rgba(15,23,42,0.05)]
              dark:bg-neutral-900
              dark:shadow-none
              ${scoreTone.border}
            `}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Impact score
              </span>

              <div
                className={`
                  grid
                  size-7
                  place-items-center
                  rounded-md
                  border
                  ${scoreTone.bg}
                  ${scoreTone.text}
                  ${scoreTone.border}
                `}
              >
                <ShieldAlert className="size-3.5" />
              </div>
            </div>

            <div className="mt-3 flex items-end gap-1.5">
              <span
                className={`
                  font-mono
                  text-2xl
                  font-bold
                  leading-none
                  tabular-nums
                  ${scoreTone.text}
                `}
              >
                {insight.impactScore}
              </span>

              <span className="mb-0.5 text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                /100
              </span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className={`h-full rounded-full ${scoreTone.bar}`}
                style={{
                  width: `${Math.min(100, Math.max(0, insight.impactScore))}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* Trend */}
        <section
          className="
            mb-5
            flex
            flex-col
            gap-3
            rounded-xl
            border
            border-neutral-200
            bg-white
            px-4
            py-3.5
            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
            dark:border-neutral-800
            dark:bg-neutral-900
            dark:shadow-none
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="flex items-center gap-3">
            <div
              className={`
                grid
                size-8
                shrink-0
                place-items-center
                rounded-lg
                border
                ${
                  trendUp
                    ? "border-red-200 bg-red-50 text-red-500 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                    : trendDown
                      ? "border-emerald-200 bg-emerald-50 text-emerald-500 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400"
                }
              `}
            >
              {trendUp ? (
                <TrendingUp className="size-4" />
              ) : trendDown ? (
                <TrendingDown className="size-4" />
              ) : (
                <TrendingUp className="size-4" />
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Perkembangan risiko
              </p>

              <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                Berdasarkan pola laporan yang terdeteksi
              </p>
            </div>
          </div>

          <span
            className={`
              inline-flex
              w-fit
              items-center
              rounded-full
              border
              px-2.5
              py-1
              text-[10px]
              font-semibold
              ${
                trendUp
                  ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                  : trendDown
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400"
              }
            `}
          >
            {trendUp ? "Meningkat" : trendDown ? "Menurun" : "Stabil"}
          </span>
        </section>

        {/* AI summary */}
        <section
          className="
            mb-5
            overflow-hidden
            rounded-2xl
            border
            border-neutral-200
            bg-white
            shadow-[0_3px_10px_rgba(15,23,42,0.05)]
            dark:border-neutral-800
            dark:bg-neutral-900
            dark:shadow-none
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
              border-b
              border-neutral-200
              bg-neutral-50/70
              px-5
              py-4
              dark:border-neutral-800
              dark:bg-transparent
            "
          >
            <div
              className="
                grid
                size-8
                shrink-0
                place-items-center
                rounded-lg
                border
                border-sky-200
                bg-sky-50
                text-sky-600
                dark:border-sky-900/50
                dark:bg-sky-950/40
                dark:text-sky-400
              "
            >
              <ShieldAlert className="size-4" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                Deskripsi insight
              </h2>

              <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                Ringkasan kondisi berdasarkan data laporan
              </p>
            </div>
          </div>

          <div className="px-5 py-5">
            <p className="max-w-3xl text-sm leading-7 text-neutral-700 dark:text-neutral-300">
              {insight.summary}
            </p>
          </div>
        </section>

        {/* Analysis grid */}
        <div className="mb-5 grid gap-5 lg:grid-cols-2">
          {/* Why risk */}
          {insight.whyRisks.length > 0 && (
            <section
              className="
                rounded-xl
                border
                border-neutral-200
                bg-white
                p-5
                shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                dark:border-neutral-800
                dark:bg-neutral-900
                dark:shadow-none
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    grid
                    size-8
                    shrink-0
                    place-items-center
                    rounded-lg
                    border
                    border-amber-200
                    bg-amber-50
                    text-amber-600
                    dark:border-amber-900/50
                    dark:bg-amber-950/30
                    dark:text-amber-400
                  "
                >
                  <Target className="size-4" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                    Mengapa risiko meningkat?
                  </h2>

                  <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                    Faktor yang memengaruhi pola risiko
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {insight.whyRisks.map((reason, index) => (
                  <div
                    key={`${reason}-${index}`}
                    className="
                      flex
                      items-start
                      gap-3
                      rounded-lg
                      border
                      border-neutral-200
                      bg-neutral-50
                      px-3
                      py-2.5
                      dark:border-transparent
                      dark:bg-neutral-800/50
                    "
                  >
                    <span
                      className="
                        mt-1.5
                        size-1.5
                        shrink-0
                        rounded-full
                        bg-amber-500
                      "
                    />

                    <p className="text-xs leading-5 text-neutral-700 dark:text-neutral-300">
                      {reason}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Potential impacts */}
          {insight.potentialImpacts.length > 0 && (
            <section
              className="
                rounded-xl
                border
                border-neutral-200
                bg-white
                p-5
                shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                dark:border-neutral-800
                dark:bg-neutral-900
                dark:shadow-none
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    grid
                    size-8
                    shrink-0
                    place-items-center
                    rounded-lg
                    border
                    border-red-200
                    bg-red-50
                    text-red-600
                    dark:border-red-900/50
                    dark:bg-red-950/30
                    dark:text-red-400
                  "
                >
                  <ShieldAlert className="size-4" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                    Dampak yang berpotensi terjadi
                  </h2>

                  <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                    Kemungkinan dampak yang perlu diperhatikan
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {insight.potentialImpacts.map((impact, index) => (
                  <div
                    key={`${impact}-${index}`}
                    className="
                      flex
                      items-start
                      gap-3
                      rounded-lg
                      border
                      border-neutral-200
                      bg-neutral-50
                      px-3
                      py-2.5
                      dark:border-transparent
                      dark:bg-neutral-800/50
                    "
                  >
                    <span
                      className="
                        mt-1.5
                        size-1.5
                        shrink-0
                        rounded-full
                        bg-red-500
                      "
                    />

                    <p className="text-xs leading-5 text-neutral-700 dark:text-neutral-300">
                      {impact}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Factors */}
        {insight.factors.length > 0 && (
          <section
            className="
              mb-5
              rounded-xl
              border
              border-neutral-200
              bg-white
              p-5
              shadow-[0_2px_8px_rgba(15,23,42,0.04)]
              dark:border-neutral-800
              dark:bg-neutral-900
              dark:shadow-none
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  grid
                  size-8
                  shrink-0
                  place-items-center
                  rounded-lg
                  border
                  border-sky-200
                  bg-sky-50
                  text-sky-600
                  dark:border-sky-900/50
                  dark:bg-sky-950/40
                  dark:text-sky-400
                "
              >
                <TrendingUp className="size-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                  Faktor penyebab
                </h2>

                <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                  Kondisi yang berkontribusi terhadap insight
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {insight.factors.map((factor, index) => (
                <div
                  key={`${factor}-${index}`}
                  className="
                    flex
                    items-start
                    gap-3
                    rounded-lg
                    border
                    border-neutral-200
                    bg-neutral-50
                    px-3
                    py-2.5
                    dark:border-neutral-800
                    dark:bg-neutral-800/40
                  "
                >
                  <span
                    className="
                      mt-1.5
                      size-1.5
                      shrink-0
                      rounded-full
                      bg-sky-500
                    "
                  />

                  <p className="text-xs leading-5 text-neutral-700 dark:text-neutral-300">
                    {factor}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Supporting reports */}
        {insight.reports.length > 0 && (
          <section
            className="
              mb-5
              overflow-hidden
              rounded-xl
              border
              border-neutral-200
              bg-white
              shadow-[0_2px_8px_rgba(15,23,42,0.04)]
              dark:border-neutral-800
              dark:bg-neutral-900
              dark:shadow-none
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                border-b
                border-neutral-200
                bg-neutral-50/70
                px-5
                py-4
                dark:border-neutral-800
                dark:bg-transparent
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    grid
                    size-8
                    shrink-0
                    place-items-center
                    rounded-lg
                    border
                    border-neutral-200
                    bg-white
                    text-neutral-500
                    dark:border-neutral-800
                    dark:bg-neutral-800
                    dark:text-neutral-400
                  "
                >
                  <FileText className="size-4" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                    Laporan pendukung
                  </h2>

                  <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                    {insight.reports.length} laporan digunakan sebagai konteks
                  </p>
                </div>
              </div>

              <span
                className="
                  hidden
                  rounded-full
                  border
                  border-neutral-200
                  bg-white
                  px-2
                  py-1
                  text-[9px]
                  font-medium
                  text-neutral-500
                  dark:border-neutral-800
                  dark:bg-neutral-800
                  dark:text-neutral-400
                  sm:inline-flex
                "
              >
                Data sumber
              </span>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {insight.reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/dashboard/report-detail/$reportId",
                      params: {
                        reportId: report.id,
                      },
                    })
                  }
                  className="
                    group
                    flex
                    w-full
                    items-center
                    gap-4
                    px-5
                    py-3.5
                    text-left
                    transition-colors
                    hover:bg-neutral-50
                    dark:hover:bg-neutral-800/50
                  "
                >
                  <div
                    className="
                      grid
                      size-8
                      shrink-0
                      place-items-center
                      rounded-lg
                      border
                      border-neutral-200
                      bg-neutral-100
                      text-neutral-400
                      transition-colors
                      group-hover:border-sky-200
                      group-hover:bg-sky-50
                      group-hover:text-sky-600
                      dark:border-neutral-800
                      dark:bg-neutral-800
                      dark:text-neutral-500
                      dark:group-hover:border-sky-900/50
                      dark:group-hover:bg-sky-950/40
                      dark:group-hover:text-sky-400
                    "
                  >
                    {report.images[0] ? (
                      <img
                        src={report.images[0]}
                        alt={report.title}
                        className="size-8 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <FileText className="size-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="
                        truncate
                        text-xs
                        font-semibold
                        text-neutral-900
                        dark:text-neutral-200
                      "
                    >
                      {report.title}
                    </p>

                    <div
                      className="
                        mt-1
                        flex
                        flex-wrap
                        items-center
                        gap-x-2
                        gap-y-0.5
                        text-[10px]
                        text-neutral-500
                        dark:text-neutral-400
                      "
                    >
                      <span>{report.category}</span>
                      <span>·</span>
                      <span>{report.urgency}</span>
                      <span>·</span>
                      <span>
                        {statusLabels[report.status] ?? report.status}
                      </span>
                    </div>
                  </div>

                  <ArrowRight
                    className="
                      size-4
                      shrink-0
                      text-neutral-400
                      transition-all
                      duration-150
                      group-hover:translate-x-0.5
                      group-hover:text-sky-500
                      dark:text-neutral-600
                    "
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Photo gallery (horizontal scroll) */}
        {allImages.length > 0 && (
          <section
            className="
              mb-5
              overflow-hidden
              rounded-xl
              border
              border-neutral-200
              bg-white
              shadow-[0_2px_8px_rgba(15,23,42,0.04)]
              dark:border-neutral-800
              dark:bg-neutral-900
              dark:shadow-none
            "
          >
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/70 px-5 py-4 dark:border-neutral-800 dark:bg-transparent">
              <div className="flex items-center gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400">
                  <Images className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                    Galeri foto laporan
                  </h2>
                  <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                    Geser untuk melihat foto dari laporan terkait
                  </p>
                </div>
              </div>
              <span className="hidden rounded-full border border-neutral-200 bg-white px-2 py-1 text-[9px] font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 sm:inline-flex">
                {allImages.length} foto
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto p-4">
              {allImages.map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt={`Foto laporan ${index + 1}`}
                  loading="lazy"
                  className="h-40 w-40 shrink-0 rounded-xl border border-neutral-200 object-cover dark:border-neutral-800"
                />
              ))}
            </div>
          </section>
        )}

        {/* Bottom action */}
        <section
          className="
            flex
            flex-col
            gap-3
            rounded-xl
            border
            border-neutral-200
            bg-white
            p-4
            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
            dark:border-neutral-800
            dark:bg-neutral-900
            dark:shadow-none
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-200">
              Jelajahi lokasi insight
            </p>

            <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
              Lihat persebaran laporan dan kondisi risiko di peta.
            </p>
          </div>

          <Link
            to="/dashboard/risk-map"
            search={{
              lat: insight.centerLatitude,
              lng: insight.centerLongitude,
              city: insight.locationName,
            }}
            className="
              inline-flex
              h-9
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-sky-500
              px-4
              text-xs
              font-semibold
              text-white
              shadow-sm
              shadow-sky-500/20
              transition-all
              hover:bg-sky-600
              hover:shadow-md
              hover:shadow-sky-500/20
              active:scale-[0.99]
              dark:bg-sky-500
              dark:hover:bg-sky-400
            "
          >
            Lihat di peta risiko
            <ArrowRight className="size-3.5" />
          </Link>
        </section>
      </div>
    </main>
  );
}
