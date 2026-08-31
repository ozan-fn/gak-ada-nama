import WeatherWidget from "#/components/WeatherWidget";
import AlertWidget from "#/components/AlertWidget";
import RainfallWidget from "#/components/RainfallWidget";
import AQITrendWidget from "#/components/AQITrendWidget";
import { Cloud, CloudDrizzle, CloudRain, Sun } from "lucide-react";

export default function FeatureSection() {
  return (
    <section className="relative z-10 bg-background px-6 pt-16 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mx-auto mb-14 max-w-xl space-y-4 text-center">
          <span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-cyan-500 shadow-xs">
            Fitur Utama
          </span>

          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Semua yang kamu butuhkan untuk memahami risiko lingkungan
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {/* Row 1 Grid Layout */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-9">
            {/* Live Weather Monitoring */}
            <div className="flex flex-col overflow-hidden rounded-lg border bg-sky-50/30 p-6 md:col-span-1 lg:col-span-5">
              {/* Live Status Indicator Badge */}
              <div className="mb-5 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-neutral-600 shadow-sm backdrop-blur-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
                  </span>

                  <span>Pembaruan langsung</span>

                  <span className="text-neutral-300">•</span>

                  <span className="text-neutral-400">Data cuaca real-time</span>
                </div>
              </div>

              {/* Weather Widget Canvas */}
              <div className="relative flex flex-1 justify-center">
                <div className="pointer-events-none absolute inset-y-0 left-6 flex items-center gap-6">
                  <div className="h-48 border-l border-dashed border-neutral-300/70" />
                  <div className="h-36 border-l border-dashed border-neutral-300/55" />
                  <div className="h-24 border-l border-dashed border-neutral-300/45" />
                </div>

                <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center gap-6">
                  <div className="h-24 border-l border-dashed border-neutral-300/45" />
                  <div className="h-36 border-l border-dashed border-neutral-300/55" />
                  <div className="h-48 border-l border-dashed border-neutral-300/70" />
                </div>

                <WeatherWidget />
              </div>

              <div className="relative z-20 -mx-2 mt-5 rounded-lg bg-white px-2 pt-1">
                <h3 className="text-base font-semibold">
                  Pantau Cuaca Secara Langsung
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Akses data lengkap suhu, curah hujan, kecepatan angin,
                  kelembapan, dan tekanan udara dalam satu dashboard terpadu.
                  Informasi akurat untuk keputusan yang lebih baik.
                </p>
              </div>
            </div>

            {/* Automated Alert System */}
            <div className="flex flex-col overflow-hidden rounded-lg border bg-purple-50/30 p-6 md:col-span-1 lg:col-span-4">
              <div className="mb-5" />

              {/* Alert System Radar Backdrop */}
              <div className="relative flex flex-1 items-center justify-center">
                <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-purple-100/40 via-transparent to-amber-100/30 blur-2xl" />

                <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-neutral-300/50" />

                <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-neutral-300/30" />

                <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-80 w-80 -translate-x-1/2 -translate-y-1/2">
                  <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-400/70" />
                  <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-400/70" />
                  <span className="absolute left-0 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300" />
                  <span className="absolute right-0 top-1/2 h-1 w-1 translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300" />
                </div>

                <div className="relative z-10">
                  <AlertWidget />
                </div>
              </div>

              <div className="relative z-20 -mx-2 mt-5 rounded-lg bg-white px-2 pt-1">
                <h3 className="text-base font-semibold">
                  Peringatan Dini Otomatis
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Notifikasi instan untuk kualitas udara buruk, titik api, cuaca
                  ekstrem, dan ancaman lingkungan di sekitar Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2 Grid Layout */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-9">
            {/* Rainfall Prediction */}
            <div className="flex flex-col overflow-hidden rounded-lg border bg-sky-50/30 p-6 md:col-span-1 lg:col-span-4">
              {/* Floating Weather Icons Overlay */}
              <div className="relative flex flex-1 items-center justify-center">
                {/* Sun - top left */}
                <div
                  className="
                    pointer-events-none absolute z-0
                    -left-3.5 top-2
                    flex h-8 w-8 items-center justify-center
                    rounded-full border border-neutral-200/70 bg-white shadow-sm
                    sm:-left-3
                    max-sm:h-9 max-sm:w-9
                  "
                >
                  <Sun className="h-5 w-5 text-amber-400 max-sm:h-4 max-sm:w-4" />
                </div>

                {/* Cloud - top right */}
                <div
                  className="
                    pointer-events-none absolute z-0
                    -right-2 top-6
                    flex h-9 w-9 items-center justify-center
                    rounded-full border border-neutral-200/70 bg-white shadow-sm
                    sm:-right-3
                    max-sm:right-1 max-sm:top-4
                    max-sm:h-8 max-sm:w-8
                  "
                >
                  <Cloud className="h-4 w-4 text-neutral-400 max-sm:h-3.5 max-sm:w-3.5" />
                </div>

                {/* Cloud drizzle - right middle */}
                <div
                  className="
                    pointer-events-none absolute z-0
                    -right-3 top-1/2
                    flex h-9 w-9 -translate-y-1/2 items-center justify-center
                    rounded-full border border-neutral-200/70 bg-white shadow-sm
                    sm:-right-3
                    max-sm:right-0 max-sm:h-9 max-sm:w-9
                  "
                >
                  <CloudDrizzle className="h-5 w-5 text-sky-400 max-sm:h-4 max-sm:w-4" />
                </div>

                {/* Cloud rain - bottom left */}
                <div
                  className="
                    pointer-events-none absolute z-0
                    -left-3 bottom-2
                    flex h-9 w-9 items-center justify-center
                    rounded-full border border-neutral-200/70 bg-white shadow-sm
                    sm:-left-3
                    max-sm:left-0 max-sm:bottom-3 max-sm:h-9 max-sm:w-9
                  "
                >
                  <CloudRain className="h-5 w-5 text-sky-500 max-sm:h-4 max-sm:w-4" />
                </div>

                {/* Ambient glow */}
                <div
                  className="
                    pointer-events-none absolute left-1/2 top-1/2 z-0
                    h-64 w-64 -translate-x-1/2 -translate-y-1/2
                    rounded-full
                    bg-linear-to-br from-sky-100/40 via-transparent to-transparent
                    blur-2xl
                    max-sm:h-52 max-sm:w-52
                  "
                />

                {/* Rainfall widget */}
                <div className="relative z-10 mx-auto w-full max-w-xs">
                  <RainfallWidget />
                </div>
              </div>

              <div className="relative z-20 -mx-2 mt-5 rounded-lg bg-white px-2 pt-1">
                <h3 className="text-base font-semibold">
                  Prediksi Curah Hujan
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Pantau intensitas hujan per jam untuk perencanaan aktivitas.
                  Data estimasi akurat membantu keputusan tepat waktu.
                </p>
              </div>
            </div>

            {/* AQI Trend Analytics */}
            <div className="flex flex-col overflow-hidden rounded-lg border bg-purple-50/30 p-6 md:col-span-1 lg:col-span-5">
              <div className="relative flex flex-1 items-center justify-center">
                <AQITrendWidget />
              </div>

              <div className="relative z-20 -mx-2 mt-5 rounded-lg bg-white px-2 pt-1">
                <h3 className="text-base font-semibold">
                  Analisis Kualitas Udara
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Tren PM2.5 mingguan untuk memantau polusi udara. Rencanakan
                  aktivitas outdoor dengan data prediksi akurat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
