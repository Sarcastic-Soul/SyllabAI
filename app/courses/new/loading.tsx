import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export default function NewCourseLoading() {
  return (
    <div className="max-w-2xl mx-auto p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center mb-10 space-y-3">
        <div className="flex justify-center">
          <div className="p-3 rounded-2xl bg-primary/10">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </div>
        <Skeleton className="h-9 w-64 mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-11 w-full rounded-lg mb-8" />

      {/* Form fields */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  );
}
