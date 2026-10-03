import { Skeleton } from "@/components/ui/skeleton";

export default function CourseLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading course"
      className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-6 pb-16 sm:px-6 sm:pt-8"
    >
      <div className="space-y-5">
        {/* Back link */}
        <div className="flex min-h-11 items-center">
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Title, meta, actions */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-10 w-72 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
        {/* Chapter list */}
        <div>
          <Skeleton className="h-7 w-28" />
          <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
              >
                <div className="flex flex-1 gap-4">
                  <Skeleton className="size-7 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-11 sm:pl-0">
                  <Skeleton className="size-10" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
