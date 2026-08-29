import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MobileRiskMap from "#/components/MobileRiskMap";
import RelatedRiskReports from "#/components/RelatedRiskReports";
import ReportRiskAssessment from "#/components/ReportRiskAssessment";
import RiskInformationHeader from "#/components/RiskInformationHeader";
import RiskMap, { type NearbyReportPin } from "#/components/RiskMap";
import SelectedRisk from "#/components/SelectedRisk";
import { Skeleton } from "#/components/ui/skeleton";
import { useLocalTime } from "#/hooks/useLocalTime";
import { useUserLocation } from "#/hooks/useUserLocation";
import { calculateDistanceKm } from "#/lib/distanceUtils";
import { getReportMapPinsFn } from "#/lib/reports.functions";

// Define search params schema
type RiskMapSearch = {
  lat?: number;
  lng?: number;
  city?: string;
};

const REPORT_RADIUS_KM = 5;

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

function RouteComponent() {
  const reportPins = Route.useLoaderData();
  const location = useUserLocation();
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
  const [selectedReport, setSelectedReport] = useState<NearbyReportPin | null>(
    null,
  );
  const localTime = useLocalTime(
    selectedLocation?.longitude ?? location.longitude,
  );

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
    if (lat !== undefined && lng !== undefined && city) {
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
    
    // Clear selected report if it's too far from the new location
    if (selectedReport) {
      const distanceToSelectedReport = calculateDistanceKm(
        loc.latitude,
        loc.longitude,
        selectedReport.latitude,
        selectedReport.longitude,
      );
      
      if (distanceToSelectedReport > REPORT_RADIUS_KM) {
        setSelectedReport(null);
      }
    }
    
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

  const prioritizedReports = useMemo(
    () =>
      [...nearbyReports].sort((reportA, reportB) => {
        const scoreDifference =
          (reportB.riskAssessment?.risk?.score ?? -1) -
          (reportA.riskAssessment?.risk?.score ?? -1);

        return scoreDifference || reportA.distanceKm - reportB.distanceKm;
      }),
    [nearbyReports],
  );

  const focusedAssessmentReport = useMemo(
    () =>
      selectedReport ??
      prioritizedReports.find((report) => report.riskAssessment?.risk) ??
      prioritizedReports.find((report) => report.riskAssessment) ??
      null,
    [prioritizedReports, selectedReport],
  );

  // Render mobile layout if screen is small
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
        <MobileRiskMap
          location={location}
          stableLocation={stableLocation}
          reports={nearbyReports}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          onReportSelect={setSelectedReport}
          renderSheetContent={() => (
            <div className="space-y-3">
              <RiskInformationHeader
                loading={location.loading}
                localTime={localTime}
              />
              {nearbyReports.length === 0 ? (
                <>
                  <SelectedRisk selectedLocation={selectedLocation} />
                  <ReportRiskAssessment
                    report={focusedAssessmentReport}
                    locationName={selectedLocation?.city}
                    selectionMode={selectedReport ? "manual" : "location"}
                  />
                  <RelatedRiskReports
                    reports={prioritizedReports}
                    selectedReport={focusedAssessmentReport}
                    onReportSelect={setSelectedReport}
                  />
                </>
              ) : (
                <>
                  <ReportRiskAssessment
                    report={focusedAssessmentReport}
                    locationName={selectedLocation?.city}
                    selectionMode={selectedReport ? "manual" : "location"}
                  />
                  <SelectedRisk selectedLocation={selectedLocation} />
                  <RelatedRiskReports
                    reports={prioritizedReports}
                    selectedReport={focusedAssessmentReport}
                    onReportSelect={setSelectedReport}
                  />
                </>
              )}
            </div>
          )}
        />
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col gap-2 p-4 lg:flex-row lg:items-stretch">
        {/* Left */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 dark:bg-muted/30 lg:w-2/3 lg:self-stretch">
          {/* Header */}
          <div className="flex shrink-0 flex-col gap-2 rounded-lg bg-white p-2.5 shadow-xs dark:bg-neutral-800 sm:flex-row sm:items-center sm:justify-between sm:px-2.5 sm:py-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <span>Peta Risiko</span>
              </div>

              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-100">
                Visualisasi risiko lingkungan per wilayah
              </span>

              {selectedLocation && (
                <span className="rounded-full border border-red-100 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400">
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/80 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-700/40 dark:text-neutral-300"
                  title={
                    selectedLocation
                      ? "Lokasi Terpilih"
                      : location.error
                        ? `Fallback: ${location.error}`
                        : "Lokasi Anda Saat Ini"
                  }
                >
                  <MapPin className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />
                  <span>{selectedLocation?.city || location.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="h-[calc(100vh-9.5rem)] overflow-hidden rounded-lg bg-white shadow-sm dark:bg-neutral-800">
            <RiskMap
              reports={nearbyReports}
              onLocationSelect={handleLocationSelect}
              flyToLocation={selectedLocation}
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2 dark:bg-muted/30 lg:h-[calc(100vh-4.5rem)] lg:w-1/3">
          <RiskInformationHeader
            loading={location.loading}
            localTime={localTime}
          />

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
            {nearbyReports.length === 0 ? (
              <>
                {/* Current environmental conditions - shown first when no reports */}
                <div className="shrink-0">
                  <SelectedRisk selectedLocation={selectedLocation} />
                </div>

                {/* Report assessment (empty state) */}
                <div className="shrink-0">
                  <ReportRiskAssessment
                    report={focusedAssessmentReport}
                    locationName={selectedLocation?.city}
                    selectionMode={selectedReport ? "manual" : "location"}
                  />
                </div>

                {/* Related reports (empty state) */}
                <div className="shrink-0">
                  <RelatedRiskReports
                    reports={prioritizedReports}
                    selectedReport={focusedAssessmentReport}
                    onReportSelect={setSelectedReport}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Highest-risk report assessment from the selected location */}
                <div className="shrink-0">
                  <ReportRiskAssessment
                    report={focusedAssessmentReport}
                    locationName={selectedLocation?.city}
                    selectionMode={selectedReport ? "manual" : "location"}
                  />
                </div>

                {/* Current environmental conditions */}
                <div className="shrink-0">
                  <SelectedRisk selectedLocation={selectedLocation} />
                </div>

                {/* Reports available around the selected location */}
                <div className="shrink-0">
                  <RelatedRiskReports
                    reports={prioritizedReports}
                    selectedReport={focusedAssessmentReport}
                    onReportSelect={setSelectedReport}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
