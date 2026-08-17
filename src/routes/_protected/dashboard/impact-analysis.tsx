import CurrentConditionAnalysis from "#/components/CurrentConditionAnalysis";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock3,
  Droplets,
  HeartPulse,
  MapPin,
  ShieldAlert,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_protected/dashboard/impact-analysis")({
  component: ImpactAnalysisPage,
});

const impacts = [
  {
    title: "Kesehatan",
    level: "Sedang",
    levelClass: "bg-amber-50 text-amber-600",
    icon: HeartPulse,
    description:
      "Genangan yang bertahan dapat meningkatkan paparan terhadap air tercemar dan lingkungan yang kurang higienis.",
  },
  {
    title: "Lingkungan",
    level: "Tinggi",
    levelClass: "bg-red-50 text-red-500",
    icon: Droplets,
    description:
      "Genangan berpotensi membawa sampah dan material pencemar ke area sekitar.",
  },
  {
    title: "Aktivitas Masyarakat",
    level: "Sedang",
    levelClass: "bg-amber-50 text-amber-600",
    icon: Users,
    description:
      "Akses jalan dan aktivitas masyarakat di sekitar area terdampak berpotensi terganggu.",
  },
];

const timeline = [
  {
    time: "Saat ini",
    title: "Kondisi terdeteksi",
    description: "Curah hujan tinggi dan beberapa laporan genangan.",
  },
  {
    time: "+3 jam",
    title: "Potensi meluas",
    description:
      "Genangan berpotensi bertambah pada area dengan drainase rendah.",
  },
  {
    time: "+6 jam",
    title: "Aktivitas terganggu",
    description: "Akses dan aktivitas masyarakat berpotensi terdampak.",
  },
  {
    time: "+12 jam",
    title: "Risiko meningkat",
    description:
      "Paparan lingkungan dan gangguan aktivitas dapat menjadi lebih signifikan.",
  },
];

const recommendations = [
  "Hindari area yang telah dilaporkan mengalami genangan sampai kondisi membaik.",
  "Pantau perubahan curah hujan dan laporan terbaru dari pengguna di sekitar.",
  "Laporkan perubahan kondisi untuk membantu memperbarui tingkat risiko.",
];

function ImpactAnalysisPage() {
  return (
    <main className="min-h-screen">
      <div className="flex flex-col gap-2 p-4">
        <div className="mx-auto flex w-full flex-col gap-3 rounded-xl bg-muted/50 p-2">
          {/* Header */}
          <section className="rounded-lg bg-white p-4 shadow-sm">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <Brain className="h-3.5 w-3.5" />
              Analisis AI
            </div>

            <h1 className="mt-2.5 text-base font-semibold tracking-tight text-neutral-900">
              Pahami Apa yang Bisa Terjadi Selanjutnya
            </h1>

            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Lihat bagaimana kondisi lingkungan saat ini dapat berkembang dan
              memengaruhi kesehatan, lingkungan, serta aktivitas masyarakat.
            </p>
          </section>

          {/* Selected Risk */}
          <section className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                    Risiko yang dianalisis
                  </p>

                  <h2 className="mt-1 text-sm font-semibold text-neutral-900">
                    Genangan Air
                  </h2>

                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      Cempaka Putih
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      Diperbarui 12 menit lalu
                    </span>
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 sm:self-auto">
                <ShieldAlert className="h-3.5 w-3.5" />
                Risiko Tinggi
              </div>
            </div>
          </section>

          {/* Current Condition */}
          <CurrentConditionAnalysis />

          {/* Scenario Timeline */}
          <section className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">
                  Jika Kondisi Berlanjut
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Skenario berdasarkan kondisi dan informasi yang tersedia saat
                  ini.
                </p>
              </div>
              <Brain className="h-5 w-5 text-emerald-500" />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-4">
              {timeline.map((item, index) => (
                <div key={item.time} className="relative">
                  {index < timeline.length - 1 && (
                    <div className="absolute left-2.5 top-2.5 hidden h-px w-full bg-neutral-200 md:block" />
                  )}

                  <div className="relative">
                    <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-4 border-emerald-50 bg-emerald-500" />

                    <p className="mt-3 text-xs font-semibold text-emerald-600">
                      {item.time}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-neutral-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Impact Cards */}
          <section>
            <div className="mb-3 px-1">
              <h2 className="text-sm font-semibold text-neutral-900">
                Dampak yang Diperkirakan
              </h2>
              <p className="mt-1 text-xs text-neutral-400">
                Area yang berpotensi terdampak jika kondisi terus berlanjut.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {impacts.map((impact) => {
                const Icon = impact.icon;

                return (
                  <div
                    key={impact.title}
                    className="rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${impact.levelClass}`}
                      >
                        {impact.level}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-semibold text-neutral-900">
                      {impact.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                      {impact.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recommendations */}
          <section className="rounded-lg bg-neutral-900 p-4 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                Rekomendasi Prita
              </span>
            </div>

            <h2 className="mt-2 text-base font-semibold">
              Tindakan yang dapat dilakukan
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              Langkah yang dapat membantu mengurangi paparan dan memperbarui
              informasi risiko.
            </p>

            <div className="mt-4 grid gap-2">
              {recommendations.map((recommendation) => (
                <div
                  key={recommendation}
                  className="flex items-start gap-3 rounded-lg bg-white/5 p-3"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs leading-relaxed text-white/70">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Lihat risiko di peta
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
