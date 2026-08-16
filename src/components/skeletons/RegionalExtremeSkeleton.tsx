import { Skeleton } from "@/components/ui/skeleton";

export function RegionalExtremeSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/60 px-4 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>

        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Alert Banner */}
        <div className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />

          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-[88%] rounded-md" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col divide-y divide-neutral-200/60">
          {/* Wind */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-36 rounded-md" />
            </div>

            <Skeleton className="h-4 w-20 rounded-md" />
          </div>

          {/* Rain */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>

            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        </div>

        {/* CTA */}
        <Skeleton className="mt-auto h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}
