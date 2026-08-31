import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Clock } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { LiveEnvironmentMap } from "@/components/LiveEnvironmentMap";
import SelectedRisk from "@/components/SelectedRisk";
import ReportRiskAssessment from "@/components/ReportRiskAssessment";
import RelatedRiskReports from "@/components/RelatedRiskReports";
import { useLocalTime } from "@/hooks/useLocalTime";
import { getReportMapPinsFn } from "@/lib/reports.functions";
import { calculateDistanceKm } from "@/lib/distanceUtils";
import type { NearbyReportPin } from "@/components/RiskMap";

export const Route = createFileRoute("/_public/livemap")({
  component: LiveMapPage,
});

const REPORT_RADIUS_KM = 5;

// Dummy report untuk demo di Semarang (defined outside component to prevent re-creation)
const dummyReport = {
  id: "dummy-semarang-flood-001",
  title: "Banjir di Kawasan Pusat Kota Semarang",
  category: "Banjir",
  urgency: "high",
  locationName: "Jl. Pemuda, Semarang Tengah, Kota Semarang",
  latitude: -6.9837,
  longitude: 110.4205,
  source: "HUMAN_REPORT",
  sourceConfidence: 0.95,
  accuracyRadiusMeters: 50,
  coordinateSource: "USER_PROVIDED",
  locationProvider: "GPS",
  locationAttribution: null,
  riskAssessment: {
    id: "dummy-assessment-001",
    reportId: "dummy-semarang-flood-001",
    status: "COMPLETE" as const,
    nearbyReportCount: 3,
    incidentClusterId: null,
    providerErrors: [],
    risk: {
      score: 75,
      level: "HIGH" as const,
      confidence: 0.88,
      summary:
        "Banjir dengan ketinggian air 30-50 cm telah merendam sebagian jalan utama di kawasan Simpang Lima. Tingkat risiko tinggi karena berpotensi mengganggu mobilitas warga dan aktivitas ekonomi.",
      horizons: {
        "24H": {
          score: 80,
          level: "HIGH" as const,
          summary:
            "Air masih menggenang di jalan utama dengan ketinggian stabil 30-50 cm. Arus lalu lintas terganggu parah di sekitar Simpang Lima, beberapa ruko mulai terendam bagian depan.",
        },
        "72H": {
          score: 65,
          level: "HIGH" as const,
          summary:
            "Jika hujan berlanjut, genangan dapat meluas ke area perumahan sekitar. Drainase terlihat tidak mampu menampung limpasan air. Risiko gangguan sanitasi meningkat.",
        },
        "7D": {
          score: 40,
          level: "MODERATE" as const,
          summary:
            "Air akan surut secara bertahap jika hujan berhenti. Namun endapan lumpur dan sampah akan memerlukan pembersihan intensif. Pemulihan aktivitas ekonomi memakan waktu.",
        },
      },
      factors: [
        "Curah hujan tinggi (50mm/jam selama 2 jam)",
        "Kapasitas drainase terbatas dan tersumbat",
        "Topografi rendah (2-3m di bawah permukaan laut)",
        "Area komersial padat dengan lalu lintas tinggi",
        "Potensi hujan lanjutan dalam 6 jam ke depan",
      ],
      potentialImpacts: [
        "Gangguan mobilitas dan transportasi di pusat kota",
        "Kerugian ekonomi bagi pedagang dan pelaku usaha",
        "Risiko kesehatan dari air tergenang",
        "Kerusakan infrastruktur jalan dan fasilitas umum",
      ],
      recommendedActions: [
        "Hindari melintas di kawasan tergenang",
        "Amankan barang berharga dan elektronik dari lantai",
        "Siapkan jalur evakuasi alternatif",
        "Pantau informasi cuaca dan peringatan dini",
        "Koordinasi dengan BPBD setempat untuk pompa air",
        "Lakukan pembersihan saluran drainase",
        "Pasang rambu peringatan di area genangan",
        "Sediakan layanan kesehatan preventif",
      ],
    },
    model: "gpt-4o-2024-08-06",
    errorCode: null,
  },
};

function LiveMapPage() {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    city: string;
  }>({
    latitude: -6.9932,
    longitude: 110.4203,
    city: "Semarang, Jawa Tengah",
  });

  const [selectedReport, setSelectedReport] = useState<NearbyReportPin | null>(
    null,
  );

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );

  const localTime = useLocalTime(selectedLocation.longitude);

  const { data: reportPins = [] } = useQuery({
    queryKey: ["reportMapPins"],
    queryFn: () => getReportMapPinsFn(),
    staleTime: 60_000,
  });

  const allReports = useMemo(() => [...reportPins, dummyReport], [reportPins]);

  // Calculate nearby reports based on selected location
  const nearbyReports = useMemo(() => {
    return allReports
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
  }, [allReports, selectedLocation]);

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
  };

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="flex h-screen w-full flex-col bg-white">
        {/* Simple Mobile Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">
              Peta Monitoring
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">
                {selectedLocation.city.split(",")[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="relative flex-1">
          <LiveEnvironmentMap
            reports={allReports}
            selectedLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
            onReportSelect={setSelectedReport}
          />
        </div>

        {/* Bottom Panel */}
        <div className="border-t border-gray-200 bg-white p-4">
          {nearbyReports.length > 0 && focusedAssessmentReport ? (
            <ReportRiskAssessment
              report={focusedAssessmentReport}
              locationName={selectedLocation.city}
              selectionMode={selectedReport ? "manual" : "location"}
            />
          ) : (
            <SelectedRisk selectedLocation={selectedLocation} />
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Simple Header */}
        <div className="mb-6 border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Peta Monitoring Lingkungan
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Pemantauan kualitas lingkungan real-time
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <MapPin className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                {selectedLocation.city}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left - Map (2/3) */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="h-150">
                <LiveEnvironmentMap
                  reports={allReports}
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                  onReportSelect={setSelectedReport}
                />
              </div>
            </div>
          </div>

          {/* Right - Info Panel (1/3) - Scrollable */}
          <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <div className="space-y-4">
              {/* Time Header */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-600">Waktu lokal</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    {localTime}
                  </span>
                </div>
              </div>

              {nearbyReports.length === 0 ? (
                <>
                  {/* Environment Card */}
                  <div>
                    <SelectedRisk selectedLocation={selectedLocation} />
                  </div>

                  {/* Info Card */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Tentang Peta
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      Klik pada peta untuk melihat kondisi lingkungan di lokasi
                      tersebut. Data ditampilkan secara real-time dari berbagai
                      sumber monitoring.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Report Assessment */}
                  <div>
                    <ReportRiskAssessment
                      report={focusedAssessmentReport}
                      locationName={selectedLocation.city}
                      selectionMode={selectedReport ? "manual" : "location"}
                    />
                  </div>

                  {/* Environment Card */}
                  <div>
                    <SelectedRisk selectedLocation={selectedLocation} />
                  </div>

                  {/* Related Reports */}
                  <div>
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
      </div>
    </main>
  );
}
