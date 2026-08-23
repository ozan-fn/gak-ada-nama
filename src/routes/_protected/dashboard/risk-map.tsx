import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import RiskMap from "#/components/RiskMap";
import SelectedRisk from "#/components/SelectedRisk";
import { useUserLocation } from "#/hooks/useUserLocation";
import { getIndonesianTimezone } from "#/lib/timezoneUtils";
import { Skeleton } from "#/components/ui/skeleton";

export const Route = createFileRoute("/_protected/dashboard/risk-map")({
  component: RouteComponent,
});

function useLocalTime(longitude?: number | null) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
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

function RouteComponent() {
  const location = useUserLocation();
  const localTime = useLocalTime(location.longitude);
  
  // State for selected location from map click
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
  } | null>(null);

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-stretch">
        {/* Left */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-2/3">
          {/* Header */}
          <div className="flex flex-col gap-2 rounded-lg bg-white p-2.5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-2.5 sm:py-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 sm:text-sm">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                <span>Peta Risiko</span>
              </div>

              <span className="text-xs font-medium text-neutral-800">
                Visualisasi risiko lingkungan per wilayah
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* Display Selected or Current Location */}
              {location.loading ? (
                <Skeleton className="h-8 w-32 rounded-lg" />
              ) : (
                <div 
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/80 px-2.5 py-1.5 text-xs font-medium text-neutral-700"
                  title={selectedLocation ? "Lokasi Terpilih" : (location.error ? `Fallback: ${location.error}` : "Lokasi Anda Saat Ini")}
                >
                  <MapPin className="h-3.5 w-3.5 text-neutral-600" />
                  <span>{selectedLocation?.city || location.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="h-[calc(100vh-9.5rem)] overflow-hidden rounded-lg bg-white shadow-sm">
            <RiskMap onLocationSelect={setSelectedLocation} />
          </div>
        </div>

        {/* Right */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-1/3">
          {/* Header */}
          <div className="flex items-center justify-between px-1 py-1.5">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Informasi Risiko
            </h2>

            {/* Local Time Pill */}
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

          {/* Selection panel - shows selected location or user location */}
          <SelectedRisk selectedLocation={selectedLocation} />
        </div>
      </div>
    </main>
  );
}
