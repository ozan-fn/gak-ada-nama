import { Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type RiskInformationHeaderProps = {
  loading: boolean;
  localTime: string;
};

export default function RiskInformationHeader({
  loading,
  localTime,
}: RiskInformationHeaderProps) {
  return (
    <section
      className="
        rounded-xl
        border border-neutral-200/80
        bg-white
        p-4
        shadow-xs
        dark:border-neutral-700
        dark:bg-neutral-800
      "
    >
      <div className="flex items-center justify-between gap-4">
        {/* Title */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Icon */}
          <div
            className="
              flex size-9 shrink-0 items-center justify-center
              rounded-lg
              bg-sky-50
              text-sky-600
              dark:bg-sky-900/30
              dark:text-sky-400
            "
          >
            <MapPin className="size-4" strokeWidth={2} />
          </div>

          {/* Text */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                className="
                  truncate
                  text-sm
                  font-semibold
                  text-neutral-900
                  dark:text-neutral-100
                "
              >
                Informasi Risiko
              </h2>

              {/* AI Badge */}
              <span
                className="
                  hidden
                  rounded-full
                  bg-sky-50
                  px-2
                  py-0.5
                  text-[9px]
                  font-medium
                  text-sky-600
                  sm:inline-flex
                  dark:bg-sky-900/30
                  dark:text-sky-400
                "
              >
                AI Assessment
              </span>
            </div>

            <p
              className="
                mt-0.5
                truncate
                text-[11px]
                text-neutral-500
                dark:text-neutral-400
              "
            >
              Kondisi dan tingkat risiko wilayah
            </p>
          </div>
        </div>

        {/* Local Time */}
        {loading ? (
          <Skeleton
            className="
              h-7
              w-24
              shrink-0
              rounded-lg
              bg-neutral-100
              dark:bg-neutral-700
            "
          />
        ) : (
          <div
            className="
              flex
              shrink-0
              items-center
              gap-1.5
              rounded-lg
              border
              border-neutral-200
              bg-neutral-50
              px-2.5
              py-1.5
              dark:border-neutral-700
              dark:bg-neutral-700
            "
          >
            <Clock
              className="
                size-3.5
                text-neutral-400
                dark:text-neutral-400
              "
            />

            <span
              className="
                text-[10px]
                font-medium
                text-neutral-600
                dark:text-neutral-200
              "
            >
              {localTime}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
