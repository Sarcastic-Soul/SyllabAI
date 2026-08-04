import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck } from "lucide-react";

export default function AdminStatsLoading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary/40 animate-pulse" />
            <Skeleton className="h-9 w-64" />
          </h1>
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-9 w-48 rounded-xl" />
      </div>

      {/* Gemini Quota Skeleton Card */}
      <Skeleton className="h-44 w-full rounded-2xl" />

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 border bg-card rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>
            <Skeleton className="w-16 h-8" />
            <Skeleton className="w-28 h-3" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="p-6 border bg-card rounded-2xl space-y-4">
        <Skeleton className="w-48 h-6" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
