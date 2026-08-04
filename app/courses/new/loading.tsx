import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export default function NewCourseLoading() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 mt-10 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-primary/40 animate-pulse" />
          <Skeleton className="h-10 w-80" />
        </h1>
        <div className="space-y-2 pt-1">
          <Skeleton className="h-5 w-[520px] max-w-full mx-auto" />
          <Skeleton className="h-5 w-[420px] max-w-full mx-auto" />
        </div>
      </div>

      {/* Form Container Card Skeleton */}
      <div className="p-8 border rounded-2xl bg-card shadow-sm mt-8 space-y-6">
        {/* Tabs Bar Skeleton */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg h-11 mb-8">
          <Skeleton className="h-9 rounded-md bg-background" />
          <Skeleton className="h-9 rounded-md bg-transparent" />
        </div>

        {/* Form Fields Skeleton */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>

          <Skeleton className="h-11 w-full rounded-md mt-4" />
        </div>
      </div>
    </div>
  );
}
