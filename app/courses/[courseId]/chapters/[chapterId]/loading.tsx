import { Skeleton } from "@/components/ui/skeleton";

export default function ChapterLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Back link */}
      <Skeleton className="h-5 w-40 mb-8" />
      
      {/* Header */}
      <div className="space-y-5 border-b pb-8">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-12 w-3/4 max-w-[400px]" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
      </div>

      {/* Lesson Content Area */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-6 w-full max-w-[600px] mb-6" />
        
        {/* Paragraph 1 */}
        <div className="space-y-2 mb-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[98%]" />
          <Skeleton className="h-4 w-[96%]" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Fake Code Block / Mermaid Diagram */}
        <Skeleton className="h-[300px] w-full rounded-xl my-8 bg-muted/50 border" />
        
        {/* Paragraph 2 */}
        <div className="space-y-2 mb-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[95%]" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      
      {/* Quiz Area Placeholder */}
      <div className="pt-12 border-t mt-12 space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[120px] w-full rounded-xl bg-muted/30" />
      </div>
    </div>
  );
}
