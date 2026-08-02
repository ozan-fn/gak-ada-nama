import { MapLibre } from '#/components/MapLibre'

export default function ShowcaseSection() {
  return (
    <section className="relative z-10 bg-gray-100 py-18 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs text-white">
            Live Map
          </span>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Semua Informasi Lingkungan, Dalam Satu Tampilan.
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-gray-500">
            Lihat persebaran laporan, kondisi lingkungan, dan analisis AI secara
            real-time melalui peta interaktif yang mudah dipahami.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-2 translate-y-4 rounded-lg bg-gray-200/60" />
          <div className="absolute -inset-1 translate-y-2 rounded-lg bg-gray-300/40" />
          <div className="relative overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
            <MapLibre />
          </div>
        </div>
      </div>
    </section>
  );
}
