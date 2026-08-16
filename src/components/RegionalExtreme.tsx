import { AlertTriangle, MoreVertical, Wind, CloudRain } from "lucide-react";

export default function RegionalExtreme() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-900">
            Cuaca Ekstrem Wilayah
          </h3>
          <span className="rounded-md border border-neutral-200 bg-neutral-100/80 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
            Hari Ini
          </span>
        </div>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100"
          aria-label="Opsi lainnya"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Alert Banner */}
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-900">
            Kondisi cuaca ekstrem terdeteksi di beberapa titik pemantauan
            wilayah Anda. Tetap waspada dan utamakan keselamatan.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-col divide-y divide-neutral-200/60">
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-teal-500" strokeWidth={2} />
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Hembusan Angin Maks
              </span>
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              42 km/jam
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-blue-500" strokeWidth={2} />
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Total Curah Hujan
              </span>
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              45,2 mm
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          className="mt-auto flex h-9 w-full items-center justify-center rounded-lg bg-neutral-100 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 active:bg-neutral-300"
        >
          Buat Laporan Cuaca
        </button>
      </div>
    </div>
  );
}
