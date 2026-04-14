import { Skeleton } from "@/components/ui/skeleton";

export default function CourseLoading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 animate-in fade-in duration-500">
      <div className="space-y-4">
        {/* Header Title & Buttons */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <Skeleton className="h-12 w-3/4 max-w-[400px]" />
          <div className="flex gap-2 flex-wrap">
             <Skeleton className="h-10 w-[80px]" />
             <Skeleton className="h-10 w-[120px]" />
             <Skeleton className="h-10 w-[100px]" />
             <Skeleton className="h-10 w-[40px] rounded-full" />
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex gap-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Progress Bar Area */}
        <div className="flex justify-between items-center mt-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full mt-2" />
        
        {/* Banner Skeleton */}
        <Skeleton className="h-[180px] w-full rounded-2xl mt-4" />
      </div>

      {/* Chapters Column */}
      <div className="flex flex-col-reverse lg:flex-row gap-8 items-start pt-4">
        <div className="flex-1 space-y-6 w-full">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 border rounded-xl flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                 <div className="space-y-3 flex-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-7 w-3/4 max-w-[300px]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                 </div>
                 <div className="flex items-center gap-3 shrink-0 mt-4 xl:mt-0">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="h-10 w-[140px] rounded-md" />
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
