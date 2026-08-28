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
    badge: "bg-red-50 text-red-600",
    icon: "bg-red-50 text-red-500",
  },
  sedang: {
    label: "Risiko Sedang",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-600",
    icon: "bg-amber-50 text-amber-500",
  },
  rendah: {
    label: "Risiko Rendah",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
    icon: "bg-emerald-50 text-emerald-500",
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
  LOW: "bg-sky-50 text-sky-700",
  MODERATE: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
} as const;

const reportUrgencyStyles: Record<string, string> = {
  Rendah: "bg-emerald-50 text-emerald-700",
  Sedang: "bg-amber-50 text-amber-700",
  Tinggi: "bg-orange-50 text-orange-700",
  "Sangat Tinggi": "bg-red-50 text-red-700",
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
      if (activeFilter === "Tinggi") return warning.severity === "tinggi";
      if (activeFilter === "Sedang") return warning.severity === "sedang";
      if (activeFilter === "Rendah") return warning.severity === "rendah";
      return true;
    });
  }, [warnings, activeFilter]);

  const isLoading = location.loading || envData.loading;

  return (
    <main className="min-h-screen">
      <div className="flex gap-2 p-4 lg:items-stretch">
        {/* Left: Warnings List */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-2/3">
          {/* Header */}
          <section className="flex shrink-0 flex-col gap-2 rounded-lg bg-white p-2.5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-2.5 sm:py-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 sm:text-sm">
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                </>
              ) : filteredWarnings.length > 0 ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Bell className="h-3 w-3" />
                    <span>Peringatan Aktif</span>
                  </div>

                  <span className="text-xs font-medium text-neutral-800">
                    {filteredWarnings.length} risiko terdeteksi di sekitar
                    lokasi kamu
                    {nearbyReports.length > 0 &&
                      `, didukung ${nearbyReports.length} laporan sekitar`}
                  </span>
                </>
              ) : nearbyReports.length > 0 ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    <FileText className="h-3 w-3" />
                    <span>Laporan Terdeteksi</span>
                  </div>

                  <span className="text-xs font-medium text-neutral-800">
                    {nearbyReports.length} laporan ditemukan dalam radius{" "}
                    {NEARBY_REPORT_RADIUS_KM} km
                  </span>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <span>Aman</span>
                  </div>

                  <span className="text-xs font-medium text-neutral-800">
                    Tidak ada peringatan saat ini
                  </span>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-t border-neutral-100 pt-2 sm:border-t-0 sm:pt-0">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    activeFilter === filter
                      ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20"
                      : "text-neutral-600 hover:bg-sky-50 hover:text-sky-600"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </section>

          {/* Nearby community reports */}
          <section className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50">
                  <FileText className="size-4 text-sky-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-neutral-900">
                    Laporan di sekitar Anda
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    Dalam radius {NEARBY_REPORT_RADIUS_KM} km dari{" "}
                    {location.city}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                {nearbyReports.length} laporan
              </span>
            </div>

            {location.loading ? (
              <div className="space-y-2 p-4">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3"
                  >
                    <Skeleton className="size-9 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : nearbyReports.length > 0 ? (
              <div className="divide-y divide-neutral-100">
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
                      className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-sky-50/40"
                    >
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                          isAutomatic
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
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
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                            {report.category}
                          </span>
                          <span className="text-neutral-300">•</span>
                          <span className="text-[10px] text-neutral-500">
                            {isAutomatic ? "Pemantauan otomatis" : "Komunitas"}
                          </span>
                        </div>
                        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-neutral-900">
                          {report.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-neutral-500">
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">
                              {report.locationName}
                            </span>
                          </span>
                          <span className="text-neutral-300">•</span>
                          <span className="font-medium text-neutral-700">
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
                                "bg-neutral-100 text-neutral-600")
                          }`}
                        >
                          {risk
                            ? `Skor ${Math.round(risk.score)}`
                            : report.urgency}
                        </span>
                        <ChevronRight className="size-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-500" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-neutral-100">
                  <FileText className="size-4 text-neutral-400" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-neutral-800">
                  Belum ada laporan di sekitar Anda
                </h3>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">
                  Laporan dalam radius {NEARBY_REPORT_RADIUS_KM} km akan tampil
                  di sini.
                </p>
              </div>
            )}
          </section>

          {/* Warning list */}
          {isLoading ? (
            <div className="flex w-full flex-col gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="w-full rounded-lg bg-white p-4 shadow-sm"
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
            <div className="flex w-full flex-col gap-3">
              {filteredWarnings.map((warning) => {
                const severity = severityConfig[warning.severity];
                const Icon = warningIcons[warning.type];

                return (
                  <article
                    key={warning.id}
                    className="w-full rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${severity.icon}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${severity.badge}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${severity.dot}`}
                              />
                              {severity.label}
                            </span>
                            <h2 className="mt-1.5 text-sm font-semibold text-neutral-900">
                              {warning.title}
                            </h2>
                          </div>
                          <div className="flex shrink-0 items-center gap-2.5 text-[11px] text-neutral-500">
                            <span>
                              Confidence{" "}
                              <span className="font-semibold text-neutral-800">
                                {warning.confidence}%
                              </span>
                            </span>
                            <span className="text-neutral-300">•</span>
                            <span>
                              Score{" "}
                              <span className="font-semibold text-neutral-800">
                                {warning.riskScore}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-neutral-400">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {warning.distance}
                          </span>
                          <span className="text-neutral-300">•</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {warning.timeAgo}
                          </span>
                          {warning.supportingReports > 1 && (
                            <>
                              <span className="text-neutral-300">•</span>
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {warning.supportingReports} laporan
                              </span>
                            </>
                          )}
                        </div>

                        <p className="mt-2.5 text-xs leading-relaxed text-neutral-600">
                          {warning.reason}
                        </p>

                        <div className="mt-3 flex items-center gap-2 border-t border-neutral-100 pt-3">
                          <Link
                            to="/dashboard/risk-map"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-sky-500/20 transition-all duration-200 hover:bg-sky-400 hover:shadow-sky-500/30"
                          >
                            <MapIcon className="h-3.5 w-3.5" />
                            Lihat Peta
                          </Link>
                          <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
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
          ) : nearbyReports.length === 0 ? (
            <div className="flex w-full flex-col items-center justify-center rounded-lg bg-white px-6 py-16 text-center shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                <BellOff className="h-4 w-4 text-neutral-400" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-neutral-800">
                Tidak ada peringatan aktif
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">
                Belum ada risiko lingkungan yang signifikan terdeteksi di
                sekitar lokasi kamu.
              </p>
            </div>
          ) : null}
        </div>

        {/* Right: Map - Desktop Only */}
        <div className="hidden lg:block lg:w-1/3">
          <div className="sticky top-0 rounded-xl bg-muted/50 p-2">
            <div className="h-75 overflow-hidden rounded-lg bg-white shadow-sm">
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
