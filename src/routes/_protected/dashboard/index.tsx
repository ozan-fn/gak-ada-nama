import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Download, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ChartAQITrend } from "#/components/ChartAQITrend";
import DashboardMapCard from "#/components/DashboardMapCard";
import MobileDashboard from "#/components/MobileDashboard";
import PrecipitationOverview from "#/components/PrecipitationOverview";
import RegionalExtreme from "#/components/RegionalExtreme";
import RegionRisk from "#/components/RegionRisk";
import type { NearbyReportPin } from "#/components/RiskMap";
import { Skeleton } from "#/components/ui/skeleton";
import WeatherInformation from "#/components/WeatherInformation";
import { useEnvironmentAlerts } from "#/hooks/useEnvironmentAlerts";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { useUserLocation } from "#/hooks/useUserLocation";
import { calculateDistanceKm } from "#/lib/distanceUtils";
import { getReportMapPinsFn } from "#/lib/reports.functions";
import { getIndonesianTimezone } from "#/lib/timezoneUtils";

const NEARBY_REPORT_RADIUS_KM = 5;

export const Route = createFileRoute("/_protected/dashboard/")({
  loader: () => getReportMapPinsFn(),
  staleTime: 30_000,
  component: Dashboard,
});

/** Custom hook to track real-time local clock according to regional timezone. */
function useLocalTime(longitude?: number | null) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000 * 30);

    return () => clearInterval(interval);
  }, []);

  const timezone = getIndonesianTimezone(longitude);

  const time = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone.zone,
  });

  return `${time} ${timezone.label}`;
}

function Dashboard() {
  const reportPins = Route.useLoaderData();
  const location = useUserLocation();
  const localTime = useLocalTime(location.longitude);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Memoize location payload to preserve reference equality and prevent child map re-renders
  const stableLocation = useMemo(
    () => ({
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      loading: location.loading,
      error: location.error,
    }),
    [
      location.latitude,
      location.longitude,
      location.city,
      location.loading,
      location.error,
    ],
  );

  const locationParams = useMemo(
    () =>
      location.latitude && location.longitude
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
          }
        : {
            city: "jakarta",
          },
    [location.latitude, location.longitude],
  );

  const envData = useEnvironmentData(location);

  const nearbyReports = useMemo<NearbyReportPin[]>(() => {
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

  const alerts = useEnvironmentAlerts(envData);
  const primaryAlert = alerts[0];

  const severityColors = {
    info: "bg-sky-50 text-sky-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  };

  if (isMobile) {
    return (
      <MobileDashboard
        location={location}
        stableLocation={stableLocation}
        locationParams={locationParams}
        envData={envData}
        reports={nearbyReports}
        reportRadiusKm={NEARBY_REPORT_RADIUS_KM}
      />
    );
  }

  return (
    <main className="min-h-screen">
      <div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-stretch">
        {/* Left Section: Map & Key Environmental Trends */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 dark:bg-muted/30 lg:w-2/3 lg:self-stretch">
          {/* Live Alert Header */}
          <div className="flex shrink-0 flex-col gap-2 rounded-lg bg-white p-2.5 shadow-xs dark:bg-neutral-800 sm:flex-row sm:items-center sm:justify-between sm:px-2.5 sm:py-2">
            {/* Alert Information */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
              {envData.loading ? (
                <>
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : primaryAlert ? (
                <>
                  {/* Severity */}
                  <div
                    className={`
                      inline-flex items-center gap-1.5
                      rounded-full
                      px-2.5 py-1
                      text-xs font-medium
                      ${severityColors[primaryAlert.severity]}
                    `}
                  >
                    <span>
                      {primaryAlert.severity === "danger"
                        ? "Bahaya"
                        : primaryAlert.severity === "warning"
                          ? "Peringatan"
                          : "Info"}
                    </span>
                  </div>

                  {/* Alert Message */}
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-100">
                    {primaryAlert.message}
                  </span>

                  {/* Action */}
                  {primaryAlert.actionLink ? (
                    <Link
                      to={primaryAlert.actionLink}
                      className="
                        inline-flex items-center gap-1
                        text-xs font-semibold
                        text-sky-600
                        transition-colors
                        hover:text-sky-700
                        hover:underline
                        dark:text-sky-400
                        dark:hover:text-sky-300
                      "
                    >
                      <span>{primaryAlert.actionText}</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="
                        inline-flex items-center gap-1
                        text-xs font-semibold
                        text-sky-600
                        transition-colors
                        hover:text-sky-700
                        hover:underline
                        dark:text-sky-400
                        dark:hover:text-sky-300
                      "
                    >
                      <span>{primaryAlert.actionText}</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* Safe Status */}
                  <div
                    className="
                      inline-flex items-center gap-1.5
                      rounded-full
                      bg-emerald-50
                      px-2.5 py-1
                      text-xs font-medium
                      text-emerald-700
                      dark:bg-emerald-900/30
                      dark:text-emerald-400
                    "
                  >
                    <span>Aman</span>
                  </div>

                  {/* Safe Message */}
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-100">
                    Tidak ada peringatan cuaca saat ini
                  </span>
                </>
              )}
            </div>

            {/* Location Indicator & Data Export */}
            <div className="flex shrink-0 items-center gap-2">
              {/* Location */}
              {location.loading ? (
                <Skeleton className="h-8 w-32 rounded-lg" />
              ) : (
                <div
                  className="
                    inline-flex items-center gap-1.5
                    rounded-lg
                    border
                    border-neutral-200
                    bg-neutral-50/80
                    px-2.5 py-1.5
                    text-xs font-medium
                    text-neutral-700
                    transition-colors
                    dark:border-neutral-700
                    dark:bg-neutral-700/40
                    dark:text-neutral-300
                  "
                  title={
                    location.error
                      ? `Fallback: ${location.error}`
                      : "Lokasi Anda Saat Ini"
                  }
                >
                  <MapPin className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />

                  <span>{location.city}</span>
                </div>
              )}

              {/* Export */}
              <button
                type="button"
                className="
                  inline-flex items-center gap-1.5
                  rounded-lg
                  border
                  border-sky-400/30
                  bg-sky-500
                  px-3 py-1.5
                  text-xs font-semibold
                  text-white
                  shadow-sm
                  shadow-sky-500/20
                  transition-all
                  duration-200
                  hover:bg-sky-400
                  hover:shadow-sky-500/30
                  dark:border-sky-500/30
                  dark:bg-sky-600
                  dark:hover:bg-sky-500
                "
              >
                <Download className="h-3.5 w-3.5" />

                <span>Ekspor</span>
              </button>
            </div>
          </div>

          {/* Interactive Environment Map */}
          <div className="h-125 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm dark:bg-neutral-800">
            <DashboardMapCard
              userLocation={stableLocation}
              reports={nearbyReports}
              reportRadiusKm={NEARBY_REPORT_RADIUS_KM}
            />
          </div>

          {/* Environmental Extremes & Air Quality Analytics */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 sm:flex-row">
            <div className="flex w-full items-stretch justify-center overflow-hidden rounded-lg bg-white shadow-sm dark:bg-neutral-800 sm:w-[37.5%]">
              <RegionalExtreme location={locationParams} />
            </div>

            <div className="flex w-full items-stretch overflow-hidden rounded-lg bg-white shadow-sm dark:bg-neutral-800 sm:w-[62.5%]">
              <ChartAQITrend location={locationParams} />
            </div>
          </div>
        </div>

        {/* Right Section: Regional Risk & Weather Analytics */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 dark:bg-muted/30 lg:w-1/3 lg:self-stretch">
          {/* Detail Overview Header & Timezone Clock */}
          <div className="flex shrink-0 items-center justify-between px-1 py-1.5">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Detail Overview
            </h2>

            {location.loading ? (
              <Skeleton className="h-7 w-36 rounded-md" />
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200/80 bg-neutral-100/70 px-2.5 py-1 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <Clock className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />

                <span>Waktu lokal:</span>

                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {localTime}
                </span>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex flex-1 items-stretch overflow-hidden rounded-lg bg-white shadow-sm dark:bg-neutral-800">
              <RegionRisk
                location={locationParams}
                reportCount={nearbyReports.length}
              />
            </div>

            <div className="flex flex-1 items-stretch overflow-hidden rounded-lg bg-white shadow-sm dark:bg-neutral-800">
              <WeatherInformation location={locationParams} />
            </div>

            <div className="flex flex-1 items-stretch overflow-hidden rounded-lg bg-white shadow-sm dark:bg-neutral-800">
              <PrecipitationOverview location={locationParams} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
