import { AlertTriangle, Wind, CloudRain, Mountain } from "lucide-react";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";
import { RegionalExtremeSkeleton } from "./skeletons/RegionalExtremeSkeleton";

type LocationParams =
  { latitude: number; longitude: number } | { city: string };

type RegionalExtremeProps = {
  location?: LocationParams;
};

export default function RegionalExtreme({ location }: RegionalExtremeProps) {
  const { weather, loading } = useEnvironmentData(location);

  if (loading || !weather) {
    return <RegionalExtremeSkeleton />;
  }

  const windSpeed = Math.round(weather.current.windSpeed * 3.6);
  const totalRain = Math.round(weather.daily.rainSum[0] * 10) / 10;

  const elevation = weather.elevation ? Math.round(weather.elevation) : null;

  // Show alert if wind > 30 km/h or rain > 20mm
  const isExtreme = windSpeed > 30 || totalRain > 20;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/60 dark:border-neutral-700 p-2 md:px-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Cuaca Ekstrem Wilayah
          </h3>

          <span className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
            Hari Ini
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-3 md:p-4">
        {/* Alert Banner */}
        {isExtreme ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-900/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

            <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              Kondisi cuaca ekstrem terdeteksi di wilayah Anda. Tetap waspada
              dan utamakan keselamatan.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 dark:border-emerald-900/50 dark:bg-emerald-900/20">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />

            <p className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
              Kondisi cuaca dalam keadaan normal. Lingkungan aman untuk
              aktivitas luar ruangan.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-col divide-y divide-neutral-200/60 dark:divide-neutral-700">
          {/* Wind */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-teal-500" strokeWidth={2} />

              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Hembusan Angin Maks
              </span>
            </div>

            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {windSpeed} km/jam
            </span>
          </div>

          {/* Rain */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-blue-500" strokeWidth={2} />

              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Total Curah Hujan
              </span>
            </div>

            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {totalRain} mm
            </span>
          </div>

          {/* Elevation */}
          {elevation !== null && (
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <Mountain className="h-4 w-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />

                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Ketinggian
                </span>
              </div>

              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {elevation} mdpl
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          className="mt-auto flex h-9 w-full items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 active:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 dark:active:bg-neutral-500"
        >
          Buat Laporan Cuaca
        </button>
      </div>
    </div>
  );
}
