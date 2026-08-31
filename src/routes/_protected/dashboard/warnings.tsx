import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Bell,
  BellOff,
  Users,
  Clock3,
  MapPin,
  ArrowRight,
  Map as MapIcon,
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  Bot,
  ChevronRight,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { useUserLocation } from "#/hooks/useUserLocation";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import {
  useEnvironmentWarnings,
  type Warning,
} from "#/hooks/useEnvironmentWarnings";
import { Skeleton } from "#/components/ui/skeleton";
import WarningsMap from "#/components/WarningsMap";
import { calculateDistanceKm } from "#/lib/distanceUtils";
import { getReportMapPinsFn } from "#/lib/reports.functions";

const NEARBY_REPORT_RADIUS_KM = 5;

export const Route = createFileRoute("/_protected/dashboard/warnings")({
  loader: () => getReportMapPinsFn(),
  staleTime: 30_000,
  component: RouteComponent,
});

type Severity = "tinggi" | "sedang" | "rendah";

const severityConfig: Record<
  Severity,
  { label: string; dot: string; badge: string; icon: string }
> = {
  tinggi: {
    label: "Risiko Tinggi",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    icon: "bg-red-50/80 text-red-500 dark:bg-red-900/20 dark:text-red-400",
  },
  sedang: {
    label: "Risiko Sedang",
    dot: "bg-amber-500",
    badge:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    icon: "bg-amber-50/80 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400",
  },
  rendah: {
    label: "Risiko Rendah",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    icon: "bg-emerald-50/80 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
};

const warningIcons: Record<Warning["type"], LucideIcon> = {
  flooding: CloudRain,
  rain: CloudRain,
  temperature: Thermometer,
  aqi: Wind,
  wind: Wind,
  humidity: Droplets,
};

const filters = ["Semua", "Tinggi", "Sedang", "Rendah"];

const reportRiskStyles = {
  LOW: "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400",
  MODERATE:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  HIGH: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  CRITICAL: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
} as const;

const reportUrgencyStyles: Record<string, string> = {
  Rendah:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  Sedang: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  Tinggi:
    "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  "Sangat Tinggi":
    "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

function RouteComponent() {
  const reportPins = Route.useLoaderData();
  const location = useUserLocation();
  const envData = useEnvironmentData(location);
  const warnings = useEnvironmentWarnings(envData);

  const [activeFilter, setActiveFilter] = useState("Semua");

  const nearbyReports = useMemo(() => {
    const latitude = location.latitude;
    const longitude = location.longitude;

    if (latitude === null || longitude === null) return [];

    return reportPins
      .map((report) => ({
        ...report,
        distanceKm: calculateDistanceKm(
          latitude,
          longitude,
          report.latitude,
          report.longitude,
        ),
      }))
      .filter((report) => report.distanceKm <= NEARBY_REPORT_RADIUS_KM)
      .sort((reportA, reportB) => reportA.distanceKm - reportB.distanceKm);
  }, [location.latitude, location.longitude, reportPins]);

  const filteredWarnings = useMemo(() => {
    if (activeFilter === "Semua") return warnings;

    return warnings.filter((warning) => {
      if (activeFilter === "Tinggi") {
        return warning.severity === "tinggi";
      }

      if (activeFilter === "Sedang") {
        return warning.severity === "sedang";
      }

      if (activeFilter === "Rendah") {
        return warning.severity === "rendah";
      }

      return true;
    });
  }, [warnings, activeFilter]);

  const isLoading = location.loading || envData.loading;

  return (
    <main className="min-h-screen">
      <div className="flex gap-2 p-4 lg:items-stretch">
        {/* Left */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 dark:bg-muted/30 lg:w-2/3">
          {/* Header */}
          <section
            className="
              flex shrink-0 flex-col gap-2
              rounded-lg
              border border-neutral-200/60
              bg-white/90
              p-2.5
              shadow-sm
              backdrop-blur-sm
              dark:border-neutral-700/60
              dark:bg-neutral-800/80
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-2.5
              sm:py-2
            "
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                </>
              ) : filteredWarnings.length > 0 ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                    <Bell className="h-3 w-3" />
                    <span>Peringatan Aktif</span>
                  </div>

                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-100">
                    {filteredWarnings.length} risiko terdeteksi di sekitar
                    lokasi kamu
                    {nearbyReports.length > 0 &&
                      `, didukung ${nearbyReports.length} laporan sekitar`}
                  </span>
                </>
              ) : nearbyReports.length > 0 ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/20 dark:text-sky-400">
                    <FileText className="h-3 w-3" />
                    <span>Laporan Terdeteksi</span>
                  </div>

                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-100">
                    {nearbyReports.length} laporan ditemukan dalam radius{" "}
                    {NEARBY_REPORT_RADIUS_KM} km
                  </span>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    <span>Aman</span>
                  </div>

                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-100">
                    Tidak ada peringatan saat ini
                  </span>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-t border-neutral-200/60 pt-2 dark:border-neutral-700/60 sm:border-t-0 sm:pt-0">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    activeFilter === filter
                      ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20 dark:bg-sky-600"
                      : "text-neutral-600 hover:bg-sky-50 hover:text-sky-600 dark:text-neutral-400 dark:hover:bg-sky-900/20 dark:hover:text-sky-400"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </section>

          {/* Nearby Reports */}
          {(location.loading || nearbyReports.length > 0) && (
            <section
              className="
                overflow-hidden
                rounded-lg
                border border-neutral-200/60
                bg-white/90
                shadow-sm
                backdrop-blur-sm
                dark:border-neutral-700/60
                dark:bg-neutral-800/80
              "
            >
              {/* Section Header */}
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200/60 bg-neutral-50/60 px-4 py-3.5 dark:border-neutral-700/60 dark:bg-neutral-800/40">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-900/20">
                    <FileText className="size-4 text-sky-600 dark:text-sky-400" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Laporan di sekitar Anda
                    </h2>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Dalam radius {NEARBY_REPORT_RADIUS_KM} km dari{" "}
                      {location.city}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:bg-sky-900/20 dark:text-sky-400">
                  {nearbyReports.length} laporan
                </span>
              </div>

              {location.loading ? (
                <div className="space-y-2 p-4">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-lg border border-neutral-200/60 bg-neutral-50/50 p-3 dark:border-neutral-700/60 dark:bg-neutral-800/40"
                    >
                      <Skeleton className="size-9 shrink-0 rounded-lg" />

                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-neutral-200/60 dark:divide-neutral-700/60">
                  {nearbyReports.map((report) => {
                    const risk = report.riskAssessment?.risk;
                    const isAutomatic = report.source === "ENVIRONMENT_MONITOR";

                    return (
                      <Link
                        key={report.id}
                        to="/dashboard/risk-map"
                        search={{
                          lat: report.latitude,
                          lng: report.longitude,
                          city: report.locationName,
                        }}
                        preload="intent"
                        className="
                          group flex items-start gap-3
                          px-4 py-3.5
                          transition-colors
                          hover:bg-neutral-50/80
                          dark:hover:bg-neutral-700/30
                        "
                      >
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                            isAutomatic
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                          }`}
                        >
                          {isAutomatic ? (
                            <Bot className="size-4" />
                          ) : (
                            <Users className="size-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                              {report.category}
                            </span>

                            <span className="text-neutral-300 dark:text-neutral-600">
                              •
                            </span>

                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                              {isAutomatic
                                ? "Pemantauan otomatis"
                                : "Komunitas"}
                            </span>
                          </div>

                          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
                            {report.title}
                          </h3>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <MapPin className="size-3 shrink-0" />

                              <span className="truncate">
                                {report.locationName}
                              </span>
                            </span>

                            <span className="text-neutral-300 dark:text-neutral-600">
                              •
                            </span>

                            <span className="font-medium text-neutral-700 dark:text-neutral-300">
                              {report.distanceKm.toFixed(1)} km
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                              risk
                                ? reportRiskStyles[risk.level]
                                : (reportUrgencyStyles[report.urgency] ??
                                  "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400")
                            }`}
                          >
                            {risk
                              ? `Skor ${Math.round(risk.score)}`
                              : report.urgency}
                          </span>

                          <ChevronRight className="size-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-400 dark:text-neutral-600 dark:group-hover:text-neutral-400" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Warning List */}
          {isLoading ? (
            <div className="flex w-full flex-col gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="w-full rounded-lg border border-neutral-200/60 bg-white/90 p-4 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800/80"
                >
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />

                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredWarnings.length > 0 ? (
            <div className="flex w-full flex-col gap-2">
              {filteredWarnings.map((warning, index) => {
                const severity = severityConfig[warning.severity];
                const Icon = warningIcons[warning.type];

                return (
                  <article
                    key={warning.id}
                    className={`
                      w-full
                      overflow-hidden
                      rounded-lg
                      border
                      border-neutral-200/60
                      shadow-sm
                      transition-colors
                      dark:border-neutral-700/60
                      ${
                        index % 2 === 0
                          ? "bg-white/90 dark:bg-neutral-800/80"
                          : "bg-neutral-50/70 dark:bg-neutral-800/50"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3 p-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${severity.icon}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${severity.badge}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${severity.dot}`}
                              />

                              {severity.label}
                            </span>

                            <h2 className="mt-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {warning.title}
                            </h2>
                          </div>

                          <div className="flex shrink-0 items-center gap-2.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span>
                              Confidence{" "}
                              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                {warning.confidence}%
                              </span>
                            </span>

                            <span className="text-neutral-300 dark:text-neutral-600">
                              •
                            </span>

                            <span>
                              Score{" "}
                              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                {warning.riskScore}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {warning.distance}
                          </span>

                          <span className="text-neutral-300 dark:text-neutral-600">
                            •
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {warning.timeAgo}
                          </span>

                          {warning.supportingReports > 1 && (
                            <>
                              <span className="text-neutral-300 dark:text-neutral-600">
                                •
                              </span>

                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {warning.supportingReports} laporan
                              </span>
                            </>
                          )}
                        </div>

                        <p className="mt-2.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                          {warning.reason}
                        </p>

                        <div className="mt-3 flex items-center gap-2 border-t border-neutral-200/60 pt-3 dark:border-neutral-700/60">
                          <Link
                            to="/dashboard/risk-map"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                          >
                            <MapIcon className="h-3.5 w-3.5" />
                            Lihat Peta
                          </Link>

                          <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            Lihat Detail
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div
              className="
                flex w-full flex-col items-center justify-center
                rounded-lg
                border border-dashed border-neutral-200/70
                bg-neutral-50/50
                px-6 py-20
                text-center
                dark:border-neutral-700/60
                dark:bg-neutral-800/30
              "
            >
              <div className="flex size-14 items-center justify-center rounded-xl bg-neutral-100/80 dark:bg-neutral-700/50">
                {nearbyReports.length === 0 ? (
                  <BellOff className="size-6 text-neutral-400 dark:text-neutral-500" />
                ) : (
                  <Bell className="size-6 text-neutral-400 dark:text-neutral-500" />
                )}
              </div>

              <h3 className="mt-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {nearbyReports.length === 0
                  ? "Tidak ada peringatan aktif"
                  : "Tidak ada peringatan dengan filter ini"}
              </h3>

              <p className="mt-2 max-w-sm text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                {nearbyReports.length === 0
                  ? "Kondisi lingkungan di sekitar Anda saat ini dalam keadaan aman. Tidak ada risiko signifikan yang terdeteksi."
                  : "Coba ubah filter peringatan atau lihat semua kategori untuk melihat risiko di sekitar Anda."}
              </p>
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div className="hidden lg:block lg:w-1/3">
          <div className="sticky top-0 rounded-xl bg-muted/50 p-2 dark:bg-muted/30">
            <div className="h-75 overflow-hidden rounded-lg border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800">
              <WarningsMap
                userLocation={location}
                warnings={filteredWarnings}
                reports={nearbyReports}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
