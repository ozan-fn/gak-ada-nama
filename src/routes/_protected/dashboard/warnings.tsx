import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Users,
  Clock3,
  MapPin,
  ArrowRight,
  Map as MapIcon,
} from "lucide-react";

export const Route = createFileRoute("/_protected/dashboard/warnings")({
  component: RouteComponent,
});

type Severity = "tinggi" | "sedang" | "rendah";

type Warning = {
  id: number;
  title: string;
  severity: Severity;
  distance: string;
  timeAgo: string;
  supportingReports: number;
  reason: string;
  confidence: number;
  riskScore: number;
};

const severityConfig: Record<
  Severity,
  { label: string; dot: string; badge: string }
> = {
  tinggi: {
    label: "Risiko Tinggi",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600",
  },
  sedang: {
    label: "Risiko Sedang",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-600",
  },
  rendah: {
    label: "Risiko Rendah",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
  },
};

const warnings: Warning[] = [
  {
    id: 1,
    title: "Potensi Genangan",
    severity: "tinggi",
    distance: "850 m",
    timeAgo: "12 menit lalu",
    supportingReports: 3,
    reason:
      "Hujan dengan intensitas tinggi terdeteksi bersamaan dengan beberapa laporan genangan di area yang berdekatan.",
    confidence: 91,
    riskScore: 78,
  },
  {
    id: 2,
    title: "Sampah Menumpuk di Saluran Air",
    severity: "sedang",
    distance: "1.4 km",
    timeAgo: "28 menit lalu",
    supportingReports: 2,
    reason:
      "Beberapa laporan sampah menumpuk terdeteksi di saluran air yang sama dalam waktu berdekatan.",
    confidence: 84,
    riskScore: 56,
  },
  {
    id: 3,
    title: "Kualitas Udara Menurun",
    severity: "sedang",
    distance: "1.8 km",
    timeAgo: "1 jam lalu",
    supportingReports: 1,
    reason:
      "Indeks kualitas udara menunjukkan tren penurunan dibandingkan kondisi normal harian.",
    confidence: 76,
    riskScore: 48,
  },
];

const filters = ["Semua", "Di Sekitar", "Tinggi", "Sedang"];

function RouteComponent() {
  const [activeFilter, setActiveFilter] = useState("Semua");

  const filteredWarnings = warnings.filter((warning) => {
    if (activeFilter === "Semua" || activeFilter === "Di Sekitar") return true;
    if (activeFilter === "Tinggi") return warning.severity === "tinggi";
    if (activeFilter === "Sedang") return warning.severity === "sedang";
    return true;
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 p-4">
        {/* Header */}
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-base font-semibold tracking-tight text-neutral-900">
                Peringatan Risiko
              </h1>
              <p className="mt-1 text-xs text-neutral-500">
                {filteredWarnings.length} risiko aktif terdeteksi di sekitar
                lokasi kamu
              </p>
            </div>
            <Bell className="h-5 w-5 text-neutral-400" />
          </div>

          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto border-t border-neutral-100 pt-3">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeFilter === filter
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        {/* Warning list */}
        {filteredWarnings.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredWarnings.map((warning) => {
              const severity = severityConfig[warning.severity];

              return (
                <article
                  key={warning.id}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                      <AlertTriangle className="h-4 w-4" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
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
                        <div className="flex items-center gap-2.5 text-[11px] text-neutral-500">
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
                        <span className="text-neutral-300">•</span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {warning.supportingReports} laporan
                        </span>
                      </div>

                      <p className="mt-2.5 text-xs leading-relaxed text-neutral-600">
                        {warning.reason}
                      </p>

                      <div className="mt-3 flex items-center gap-2 border-t border-neutral-100 pt-3">
                        <Link
                          to="/dashboard/risk-map"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                        >
                          <MapIcon className="h-3.5 w-3.5" />
                          Lihat Peta
                        </Link>
                        <Link
                          to="/dashboard/impact-analysis"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
                        >
                          Analisis Dampak
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
          <div className="flex flex-col items-center justify-center rounded-lg bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
              <BellOff className="h-4 w-4 text-neutral-400" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-neutral-800">
              Tidak ada peringatan aktif
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">
              Belum ada risiko lingkungan yang signifikan terdeteksi di sekitar
              lokasi kamu.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
