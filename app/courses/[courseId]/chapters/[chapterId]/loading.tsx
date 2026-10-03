import { Skeleton } from "@/components/ui/skeleton";

export default function ChapterLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading chapter"
      className="mx-auto w-full max-w-[43rem] px-4 pt-6 pb-20 sm:px-6 sm:pt-8"
    >
      {/* Back link */}
      <div className="flex min-h-11 items-center">
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Header */}
      <div className="mt-4 space-y-4 border-b border-border pb-8">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-10 w-4/5" />
        <div className="space-y-2.5 pt-1">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      </div>

      {/* Lesson text */}
      <div className="space-y-8 pt-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[97%]" />
          <Skeleton className="h-4 w-[94%]" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-[96%]" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </main>
  );
}
