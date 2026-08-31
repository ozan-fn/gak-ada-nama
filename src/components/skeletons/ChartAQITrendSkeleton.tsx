import { Skeleton } from "#/components/ui/skeleton";

export function ChartAQITrendSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-44 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-sm" />
        </div>

        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>

      {/* Chart Content */}
      <div className="relative flex-1 px-2 py-1">
        {/* Background Pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 8px,
              hsl(var(--muted-foreground) / 0.08) 8px,
              hsl(var(--muted-foreground) / 0.08) 9px
            )`,
            marginLeft: "32px",
            marginTop: "8px",
            marginBottom: "32px",
            marginRight: "12px",
          }}
        />

        {/* Chart Skeleton */}
        <div className="relative z-10 h-full w-full">
          {/* Y Axis */}
          <div className="absolute bottom-8 left-0 top-2 flex w-7 flex-col justify-between">
            <Skeleton className="h-3 w-5 rounded-sm" />
            <Skeleton className="h-3 w-5 rounded-sm" />
            <Skeleton className="h-3 w-5 rounded-sm" />
            <Skeleton className="h-3 w-5 rounded-sm" />
          </div>

          {/* Chart Area */}
          <div className="absolute bottom-8 left-8 right-3 top-2">
            {/* Horizontal Grid */}
            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="border-t border-dashed border-neutral-200" />
              <div className="border-t border-dashed border-neutral-200" />
              <div className="border-t border-dashed border-neutral-200" />
              <div className="border-t border-dashed border-neutral-200" />
            </div>

            {/* Fake Area Chart */}
            <div className="absolute inset-x-0 bottom-0 top-4">
              <svg
                className="h-full w-full"
                viewBox="0 0 700 250"
                preserveAspectRatio="none"
              >
                <path
                  d="
                    M 0 170
                    L 100 145
                    L 200 160
                    L 300 105
                    L 400 125
                    L 500 75
                    L 600 105
                    L 700 65
                    L 700 250
                    L 0 250
                    Z
                  "
                  fill="currentColor"
                  className="text-neutral-100"
                />

                <path
                  d="
                    M 0 170
                    L 100 145
                    L 200 160
                    L 300 105
                    L 400 125
                    L 500 75
                    L 600 105
                    L 700 65
                  "
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-neutral-200"
                />
              </svg>
            </div>

            {/* Today Reference Line */}
            <div className="absolute bottom-0 left-[14%] top-0 border-l-2 border-dashed border-neutral-200">
              <Skeleton className="absolute -left-7 -top-1 h-3 w-14 rounded-sm" />
            </div>
          </div>

          {/* X Axis */}
          <div className="absolute bottom-0 left-8 right-3 flex justify-between">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-7 rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
