export default function FeatureSection() {
  return (
    <section className="relative z-10 pt-16 pb-24 px-6 bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-xl space-y-4 text-center">
          <span className="inline-flex items-center rounded-full text-cyan-500 border border-cyan-500 px-3 py-1 text-xs font-medium shadow-xs">
            Fitur Utama
          </span>

          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Semua yang kamu butuhkan untuk memahami risiko lingkungan
          </h2>
        </div>
        <div className="grid grid-cols-5 gap-4 auto-rows-fr">
          <div className="col-span-3 row-span-1 bg-muted rounded-lg p-6 min-h-50 border">
            {/* Feature 1 */}
          </div>
          <div className="col-span-2 row-span-1 bg-muted rounded-lg p-6 min-h-50 border">
            {/* Feature 2 */}
          </div>
          <div className="col-span-2 row-span-1 bg-muted rounded-lg p-6 min-h-50 border">
            {/* Feature 3 */}
          </div>
          <div className="col-span-3 row-span-1 bg-muted rounded-lg p-6 min-h-50 border">
            {/* Feature 4 */}
          </div>
        </div>
      </div>
    </section>
  );
}
