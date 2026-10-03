import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading your courses"
      className="mx-auto w-full max-w-6xl space-y-8 px-4 pt-8 pb-16 sm:px-6 sm:pt-10"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-5 w-64 max-w-full" />
        </div>
        <Skeleton className="h-11 w-full sm:w-36" />
      </div>

      {/* Stats panel: one bordered panel, three columns */}
      <div className="grid grid-cols-1 divide-y divide-border rounded-xl border border-border bg-card md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="space-y-4 p-5 sm:p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-28" />
          <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1">
            {[...Array(30)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-[3px]" />
            ))}
          </div>
        </div>
        {[...Array(2)].map((_, col) => (
          <div key={col} className="space-y-4 p-5 sm:p-6">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
          <Skeleton className="h-10 min-w-36 flex-1 sm:w-40 sm:flex-none" />
          <Skeleton className="h-10 min-w-36 flex-1 sm:w-40 sm:flex-none" />
          <Skeleton className="h-10 min-w-36 flex-1 sm:w-44 sm:flex-none" />
        </div>

        {/* Course cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex h-[188px] flex-col rounded-xl border border-border bg-card p-5"
            >
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="mt-3 h-6 w-3/4" />
              <div className="mt-3 flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="mt-auto space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3.5 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
