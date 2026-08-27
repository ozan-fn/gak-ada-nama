import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import RiskMap from "#/components/RiskMap";
import MobileRiskMap from "#/components/MobileRiskMap";
import SelectedRisk from "#/components/SelectedRisk";
import { useUserLocation } from "#/hooks/useUserLocation";
import { getIndonesianTimezone } from "#/lib/timezoneUtils";
import { getReportMapPinsFn } from "#/lib/reports.functions";
import { Skeleton } from "#/components/ui/skeleton";

// Define search params schema
type RiskMapSearch = {
  lat?: number;
  lng?: number;
  city?: string;
};

const REPORT_RADIUS_KM = 5;

function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const startLatitude = toRadians(latitudeA);
  const endLatitude = toRadians(latitudeB);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

export const Route = createFileRoute("/_protected/dashboard/risk-map")({
  validateSearch: (search: Record<string, unknown>): RiskMapSearch => {
    return {
      lat: typeof search.lat === "number" ? search.lat : undefined,
      lng: typeof search.lng === "number" ? search.lng : undefined,
      city: typeof search.city === "string" ? search.city : undefined,
    };
  },
  loader: () => getReportMapPinsFn(),
  staleTime: 30_000,
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
  const reportPins = Route.useLoaderData();
  const location = useUserLocation();
  const localTime = useLocalTime(location.longitude);
  const navigate = useNavigate({ from: Route.fullPath });
  const { lat, lng, city } = Route.useSearch();
  // Initialize with correct value to prevent double render
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // State for selected location from map click or search
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
  } | null>(null);

  // Stabilize location object
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

  // Sync search params to selectedLocation
  useEffect(() => {
    if (lat && lng && city) {
      setSelectedLocation({
        latitude: lat,
        longitude: lng,
        city,
      });
    }
  }, [lat, lng, city]);

  // Handle location selection from map
  const handleLocationSelect = (loc: {
    latitude: number;
    longitude: number;
    city: string;
  }) => {
    setSelectedLocation(loc);
    // Update URL search params
    navigate({
      search: { lat: loc.latitude, lng: loc.longitude, city: loc.city },
      replace: true,
    });
  };

  const nearbyReports = useMemo(() => {
    if (!selectedLocation) return [];

    return reportPins
      .map((report) => ({
        ...report,
        distanceKm: calculateDistanceKm(
          selectedLocation.latitude,
          selectedLocation.longitude,
          report.latitude,
          report.longitude,
        ),
      }))
      .filter((report) => report.distanceKm <= REPORT_RADIUS_KM)
      .sort((reportA, reportB) => reportA.distanceKm - reportB.distanceKm);
  }, [reportPins, selectedLocation]);

  // Render mobile layout if screen is small
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
        <MobileRiskMap
          location={location}
          stableLocation={stableLocation}
          reports={nearbyReports}
          radiusKm={REPORT_RADIUS_KM}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          renderSheetContent={() => (
            <SelectedRisk
              selectedLocation={selectedLocation}
              nearbyReports={nearbyReports}
            />
          )}
        />
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-stretch">
        {/* Left */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 lg:w-2/3 lg:self-stretch">
          {/* Header */}
          <div className="flex shrink-0 flex-col gap-2 rounded-lg bg-white p-2.5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-2.5 sm:py-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 sm:text-sm">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                <span>Peta Risiko</span>
              </div>

              <span className="text-xs font-medium text-neutral-800">
                Visualisasi risiko lingkungan per wilayah
              </span>

              {selectedLocation && (
                <span className="rounded-full border border-red-100 bg-white px-2 py-1 text-[11px] font-semibold text-red-600">
                  {nearbyReports.length} laporan dalam {REPORT_RADIUS_KM} km
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* Display Selected or Current Location */}
              {location.loading ? (
                <Skeleton className="h-8 w-32 rounded-lg" />
              ) : (
                <div
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/80 px-2.5 py-1.5 text-xs font-medium text-neutral-700"
                  title={
                    selectedLocation
                      ? "Lokasi Terpilih"
                      : location.error
                        ? `Fallback: ${location.error}`
                        : "Lokasi Anda Saat Ini"
                  }
                >
                  <MapPin className="h-3.5 w-3.5 text-neutral-600" />
                  <span>{selectedLocation?.city || location.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="h-[calc(100vh-9.5rem)] overflow-hidden rounded-lg bg-white shadow-sm">
            <RiskMap
              reports={nearbyReports}
              radiusKm={REPORT_RADIUS_KM}
              onLocationSelect={handleLocationSelect}
              flyToLocation={selectedLocation}
            />
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
          <SelectedRisk
            selectedLocation={selectedLocation}
            nearbyReports={nearbyReports}
          />
        </div>
      </div>
    </main>
  );
}
