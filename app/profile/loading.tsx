import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 mt-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-6 pb-8 border-b">
        <Skeleton className="w-24 h-24 rounded-full shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-[320px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>

      {/* Analytics Grid — 5 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-6 border rounded-2xl bg-card space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded-sm" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Your Courses */}
      <div className="pt-8 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 border rounded-xl bg-card space-y-4">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-7 w-3/4" />
              <div className="space-y-2 pt-4">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved for Later */}
      <div className="pt-12 border-t space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-6 border rounded-xl bg-card space-y-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-24 mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
