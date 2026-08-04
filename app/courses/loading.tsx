import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="p-5 rounded-2xl h-20" />
          ))}
        </div>
        <Skeleton className="p-5 rounded-2xl h-64" />
      </div>
    </div>
  );
}
