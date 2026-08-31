import { Skeleton } from "#/components/ui/skeleton";

export function WeatherInformationSkeleton() {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-white p-5">
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Weather Icon */}
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />

          {/* Temperature */}
          <div className="flex items-start">
            <Skeleton className="h-10 w-14 rounded-md" />
            <Skeleton className="ml-1 mt-1 h-5 w-5 rounded-md" />
          </div>

          {/* Weather Status */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        </div>

        {/* More Button */}
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* Description */}
      <div className="mt-2 space-y-1.5">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-[82%] rounded-md" />
      </div>

      {/* Weather Details */}
      <div className="mt-3 flex flex-col divide-y divide-neutral-100 border-t border-neutral-100">
        {/* Humidity */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>

          <Skeleton className="h-4 w-12 rounded-md" />
        </div>

        {/* Wind */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>

          <Skeleton className="h-4 w-20 rounded-md" />
        </div>

        {/* Pressure */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>

          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
      </div>

      {/* View Details */}
      <Skeleton className="mt-4 h-8 w-full rounded-lg" />
    </div>
  );
}
