import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Clock, Download, MapPin, Loader2 } from "lucide-react";
import DashboardMapCard from "#/components/DashboardMapCard";
import { ChartAQITrend } from "#/components/ChartAQITrend";
import RegionalExtreme from "#/components/RegionalExtreme";
import PrecipitationOverview from "#/components/PrecipitationOverview";
import RegionRisk from "#/components/RegionRisk";
import WeatherInformation from "#/components/WeatherInformation";
import { useUserLocation } from "#/hooks/useUserLocation";

// Import skeletons
import { ChartAQITrendSkeleton } from "#/components/skeletons/ChartAQITrendSkeleton";
import { RegionalExtremeSkeleton } from "#/components/skeletons/RegionalExtremeSkeleton";
import { PrecipitationOverviewSkeleton } from "#/components/skeletons/PrecipitationOverviewSkeleton";
import { RegionRiskSkeleton } from "#/components/skeletons/RegionRiskSkeleton";
import { WeatherInformationSkeleton } from "#/components/skeletons/WeatherInformationSkeleton";

export const Route = createFileRoute("/_protected/dashboard/")({
  component: Dashboard,
});

function useLocalTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  const time = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  return `${time} WIB`;
}

function Dashboard() {
  const localTime = useLocalTime();
  const location = useUserLocation();

  // Prepare location params for API calls
  const locationParams = location.latitude && location.longitude
    ? { latitude: location.latitude, longitude: location.longitude }
    : { city: "jakarta" }; // Fallback if geolocation failed

  return (
    <main className="min-h-screen">
      {/* Mobile */}
      {/* Dashboard */}
      <div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-stretch">
        {/* Left */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-2/3">
          {/* Live Alert Header */}
          <div className="flex flex-col gap-2 rounded-lg bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-2.5 sm:py-2 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 sm:text-sm">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                <span>Live update</span>
              </div>

              {/* Pesan Info */}
              <span className="font-medium text-xs text-neutral-800">
                Prakiraan hujan deras pukul 15:00
              </span>

              {/* Link aksi */}
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
              >
                <span>Lihat prakiraan</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>

            {/* Sisi Kanan: Kontrol Lokasi & Tombol Ekspor */}
            <div className="flex shrink-0 items-center gap-2">
              {/* Display Current Location */}
              <div 
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/80 px-2.5 py-1.5 text-xs font-medium text-neutral-700"
                title={location.error ? `Fallback: ${location.error}` : "Lokasi Anda Saat Ini"}
              >
                <MapPin className="h-3.5 w-3.5 text-neutral-600" />
                {location.loading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Detecting...
                  </span>
                ) : (
                  <span>{location.city}</span>
                )}
              </div>

              {/* Tombol Ekspor */}
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Ekspor</span>
              </button>
            </div>
          </div>

          {/* Map Integration */}
          <div className="h-125 overflow-hidden rounded-lg bg-white shadow-sm">
            <DashboardMapCard />
          </div>
          {/* Bottom */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            {/* Regional Extremes */}
            <div className="flex w-full items-center justify-center rounded-lg bg-white shadow-sm sm:w-[37.5%] transition-opacity duration-300">
              {location.loading ? (
                <RegionalExtremeSkeleton />
              ) : (
                <RegionalExtreme location={locationParams} />
              )}
            </div>
            {/* Chart AQI */}
            <div className="w-full overflow-hidden rounded-lg bg-white shadow-sm sm:w-[62.5%] transition-opacity duration-300">
              {location.loading ? (
                <ChartAQITrendSkeleton />
              ) : (
                <ChartAQITrend location={locationParams} />
              )}
            </div>
          </div>
        </div>
        {/* Right */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-1/3">
          {/* Detail Overview Header */}
          <div className="flex items-center justify-between px-1 py-1.5">
            {/* Title */}
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Detail Overview
            </h2>

            {/* Local Time Pill */}
            <div className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200/80 bg-neutral-100/70 px-2.5 py-1 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
              <Clock className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />
              <span>Waktu lokal:</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {localTime}
              </span>
            </div>
          </div>
          {/* Region Risk */}
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm transition-opacity duration-300">
            {location.loading ? (
              <RegionRiskSkeleton />
            ) : (
              <RegionRisk location={locationParams} />
            )}
          </div>
          {/* Weather Information */}
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm transition-opacity duration-300">
            {location.loading ? (
              <WeatherInformationSkeleton />
            ) : (
              <WeatherInformation location={locationParams} />
            )}
          </div>
          {/* Precipitation Overview */}
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm transition-opacity duration-300">
            {location.loading ? (
              <PrecipitationOverviewSkeleton />
            ) : (
              <PrecipitationOverview location={locationParams} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
