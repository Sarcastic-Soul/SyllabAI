import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading your progress"
      className="mx-auto w-full max-w-6xl space-y-12 px-4 pt-8 pb-16 sm:px-6 sm:pt-10"
    >
      {/* Header */}
      <div className="flex items-center gap-4 sm:gap-5">
        <Skeleton className="size-14 shrink-0 rounded-full sm:size-16" />
        <div className="space-y-2.5">
          <Skeleton className="h-9 w-56 max-w-full" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>

      {/* Stats panel: 5 cells */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`space-y-3 bg-card p-4 sm:p-5 ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Course rows, then bookmark rows */}
      {[0, 1].map((section) => (
        <div key={section}>
          <Skeleton className="h-7 w-40" />
          <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:px-5"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-3.5 w-40" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full sm:w-56" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
