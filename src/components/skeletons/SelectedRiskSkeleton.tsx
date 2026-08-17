import { Skeleton } from "../ui/skeleton";

export function SelectedRiskSkeleton() {
  return (
    <div className="flex h-full w-full flex-col bg-white p-6 rounded-lg">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="mt-4 h-12 w-32" />
      <Skeleton className="mt-3 h-16 w-full" />
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="mt-6 h-24 w-full" />
      <Skeleton className="mt-6 h-9 w-full" />
    </div>
  );
}
