import { Skeleton } from "@/components/ui/skeleton";

export default function NewCourseLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading new course form"
      className="mx-auto w-full max-w-2xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12"
    >
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-full max-w-md" />
        <Skeleton className="h-5 w-2/3 max-w-sm" />
      </div>

      {/* Form: topic, focus, file, two selects, submit */}
      <div className="mt-8 space-y-6 rounded-xl border border-border bg-card p-5 sm:p-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="h-11 w-full" />
      </div>
    </main>
  );
}
