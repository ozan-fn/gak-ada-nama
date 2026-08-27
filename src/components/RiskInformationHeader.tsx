import { Clock, MapPin } from "lucide-react";
import { Skeleton } from "#/components/ui/skeleton";

type RiskInformationHeaderProps = {
  loading: boolean;
  localTime: string;
};

export default function RiskInformationHeader({
  loading,
  localTime,
}: RiskInformationHeaderProps) {
  return (
    <section className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Title */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <MapPin className="size-4" strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-neutral-900">
                Informasi Risiko
              </h2>

              <span className="hidden rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-medium text-sky-600 sm:inline-flex">
                AI Assessment
              </span>
            </div>

            <p className="mt-0.5 truncate text-[11px] text-neutral-500">
              Kondisi dan tingkat risiko wilayah
            </p>
          </div>
        </div>

        {/* Local Time */}
        {loading ? (
          <Skeleton className="h-7 w-24 shrink-0 rounded-lg" />
        ) : (
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5">
            <Clock className="size-3.5 text-neutral-400" />

            <span className="text-[10px] font-medium text-neutral-600">
              {localTime}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
