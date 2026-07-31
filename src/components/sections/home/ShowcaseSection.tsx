export default function ShowcaseSection() {
  return (
    <section className="relative z-10 bg-gray-100 py-18 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs text-white">
            Hasil Nyata
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Results that speak for themselves.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-500">
            Learn how we help communities around the world.
          </p>
        </div>

        {/* Placeholder for Map - Will be replaced with Leaflet or similar */}
        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
          <div className="flex aspect-video items-center justify-center bg-gray-50">
            <p className="text-sm text-gray-400">Map placeholder - Leaflet integration coming soon</p>
          </div>
        </div>
      </div>
    </section>
  );
}
