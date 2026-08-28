import { Skeleton } from "@/components/ui/skeleton";

export function PrecipitationOverviewSkeleton() {
  const bars = [
    "h-8",
    "h-12",
    "h-6",
    "h-16",
    "h-10",
    "h-20",
    "h-14",
    "h-8",
    "h-16",
    "h-11",
    "h-18",
    "h-7",
  ];

  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="mt-2 h-3 w-52 rounded-md" />
        </div>

        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* Summary */}
      <div className="mt-3">
        <Skeleton className="h-3 w-28 rounded-md" />

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-3 w-12 rounded-md" />
        </div>
      </div>

      {/* Chart */}
      <div className="relative -mt-8 h-36 w-full">
        {/* Reference Line */}
        <div className="absolute bottom-5 left-[42%] top-3 border-l-2 border-dashed border-neutral-200">
          <Skeleton className="absolute -left-5 -top-1 h-3 w-10 rounded-sm" />
        </div>

        {/* Bars */}
        <div className="absolute inset-x-2 bottom-6 top-4 flex items-end justify-between gap-1">
          {bars.map((height, index) => (
            <div
              key={index}
              className="flex h-full flex-1 items-end justify-center"
            >
              <Skeleton
                className={`w-[65%] min-w-1.5 max-w-4.5 rounded-t-[3px] ${height}`}
              />
            </div>
          ))}
        </div>

        {/* X Axis */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-8 rounded-sm" />
          ))}
        </div>
      </div>

      {/* CTA */}
      <Skeleton className="mt-3 h-8 w-full rounded-lg" />
    </div>
  );
}
