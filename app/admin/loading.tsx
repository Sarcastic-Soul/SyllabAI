export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2 border-b pb-6">
        <div className="w-56 h-8 bg-muted rounded-md" />
        <div className="w-96 h-4 bg-muted rounded-xs" />
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 border bg-card rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-20 h-4 bg-muted rounded-xs" />
              <div className="w-8 h-8 bg-muted rounded-lg" />
            </div>
            <div className="w-16 h-8 bg-muted rounded-md" />
            <div className="w-28 h-3 bg-muted rounded-xs" />
          </div>
        ))}
      </div>

      {/* Popular Topics Skeleton */}
      <div className="p-6 border bg-card rounded-2xl space-y-4">
        <div className="w-40 h-5 bg-muted rounded-xs" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-32 h-8 bg-muted rounded-full" />
          ))}
        </div>
      </div>

      {/* Table View Skeleton */}
      <div className="p-6 border bg-card rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-48 h-6 bg-muted rounded-xs" />
          <div className="w-64 h-10 bg-muted rounded-xl" />
        </div>

        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center p-3 border rounded-xl">
              <div className="w-48 h-4 bg-muted rounded-xs" />
              <div className="w-24 h-4 bg-muted rounded-xs" />
              <div className="w-16 h-4 bg-muted rounded-xs" />
              <div className="w-20 h-4 bg-muted rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
