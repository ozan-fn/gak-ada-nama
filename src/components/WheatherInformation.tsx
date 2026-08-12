import { CloudRain, MoreVertical, ArrowRight } from "lucide-react";

export default function WeatherInformation() {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-white p-5">
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Weather Icon */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center">
            <CloudRain className="h-12 w-12 text-sky-400" strokeWidth={1.5} />
          </div>

          {/* Temperature */}
          <div className="flex items-start">
            <span className="text-4xl font-bold tracking-tight text-neutral-900">
              26
            </span>
            <span className="ml-1 text-lg font-medium text-neutral-600">
              °C
            </span>
          </div>

          {/* Weather Status */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
              Cuaca Saat Ini
            </p>

            <h3 className="text-base font-bold text-neutral-800">
              Hujan Deras
            </h3>
          </div>
        </div>

        {/* More Button */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100"
          aria-label="Opsi lainnya"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
        Pembaruan cuaca dan suhu secara berkala setiap jam untuk wilayah Anda.
      </p>

      {/* Weather Details */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {/* Humidity */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Kelembapan
          </p>
          <p className="mt-1 text-sm font-bold text-neutral-900">88%</p>
        </div>

        {/* Wind Speed */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Kecepatan Angin
          </p>
          <p className="mt-1 text-sm font-bold text-neutral-900">15 km/jam</p>
        </div>

        {/* Pressure */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Tekanan Udara
          </p>
          <p className="mt-1 text-sm font-bold text-neutral-900">1010 hPa</p>
        </div>
      </div>

      {/* View Details */}
      <button
        type="button"
        className="mt-4 flex h-8 w-full items-center justify-between rounded-lg bg-neutral-100 px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
      >
        <span>Lihat Rincian</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
