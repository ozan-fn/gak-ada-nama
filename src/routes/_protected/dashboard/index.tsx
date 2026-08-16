import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Clock, Download, MapPin } from "lucide-react";
import DashboardMapCard from "#/components/DashboardMapCard";
import { ChartAQITrend } from "#/components/ChartAQITrend";
import RegionalExtreme from "#/components/RegionalExtreme";
import PrecipitationOverview from "#/components/PrecipitationOverview";
import RegionRisk from "#/components/RegionRisk";
import WeatherInformation from "#/components/WeatherInformation";

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
              {/* Pemilih Lokasi */}
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/80 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
              >
                <MapPin className="h-3.5 w-3.5 text-neutral-600" />
                <span>Jakarta, ID</span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
              </button>

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
            <div className="flex w-full items-center justify-center rounded-lg bg-white shadow-sm sm:w-[37.5%]">
              <RegionalExtreme />
            </div>
            {/* Chart AQI */}
            <div className="w-full overflow-hidden rounded-lg bg-white shadow-sm sm:w-[62.5%]">
              <ChartAQITrend />
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
          {/* Weather Information */}
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
            <RegionRisk />
          </div>
          {/* 7 days forecast */}
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
            <WeatherInformation />
          </div>
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
            <PrecipitationOverview />
          </div>
        </div>
      </div>
    </main>
  );
}
