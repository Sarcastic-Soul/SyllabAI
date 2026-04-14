import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <Skeleton className="h-10 w-[200px] mb-2" />
          <Skeleton className="h-5 w-[300px]" />
        </div>
        <Skeleton className="h-12 w-[160px]" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap items-center justify-end gap-3 pb-4">
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[140px]" />
      </div>

      {/* Courses Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[240px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
