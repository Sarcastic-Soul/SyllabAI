import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 mt-4 animate-in fade-in duration-300">
      {/* Header Profile Section Skeleton */}
      <div className="flex items-center gap-6 pb-8 border-b">
        <Skeleton className="w-24 h-24 rounded-full border-4 border-primary/10 shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Analytics Grid Skeleton (5 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { titleW: "w-32", valW: "w-24", subW: "w-20" },
          { titleW: "w-32", valW: "w-20", subW: "w-32" },
          { titleW: "w-32", valW: "w-20", subW: "w-32" },
          { titleW: "w-36", valW: "w-16", subW: "w-32" },
          { titleW: "w-40", valW: "w-16", subW: "w-32" },
        ].map((item, i) => (
          <div key={i} className="p-6 border rounded-2xl bg-card space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className={`h-5 ${item.titleW}`} />
            </div>
            <Skeleton className={`h-9 ${item.valW}`} />
            <Skeleton className={`h-4 ${item.subW}`} />
          </div>
        ))}
      </div>

      {/* Your Courses Section Skeleton */}
      <div className="pt-8">
        <Skeleton className="h-8 w-44 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-6 border rounded-xl bg-card space-y-4 flex flex-col justify-between h-[200px]"
            >
              <div className="space-y-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
              <div className="space-y-2 pt-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved for Later Bookmarks Section Skeleton */}
      <div className="pt-12 border-t mt-12">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-6 h-6 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-6 border rounded-xl bg-card space-y-3 h-full flex flex-col"
            >
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-6 w-4/5" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-4 w-28 mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
