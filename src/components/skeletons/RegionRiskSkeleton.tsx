import { Skeleton } from "@/components/ui/skeleton";

export function RegionRiskSkeleton() {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-white p-6">
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          {/* Score Detail */}
          <div className="flex items-start">
            <Skeleton className="h-10 w-12 rounded-md" />
            <Skeleton className="ml-1 mt-1 h-5 w-8 rounded-md" />
          </div>

          {/* Risk Status */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
        </div>

        {/* More Button */}
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* Description */}
      <div className="mt-3 space-y-1.5">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-3/4 rounded-md" />
      </div>

      {/* Conditions */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {/* Curah Hujan */}
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>

        {/* Suhu */}
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-16 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>

        {/* Kualitas Udara */}
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      </div>

      {/* Footer */}
      <Skeleton className="mt-6 h-9 w-full rounded-lg" />
    </div>
  );
}
