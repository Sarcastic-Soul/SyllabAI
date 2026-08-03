export default function AdminStatsLoading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2 border-b pb-6">
        <div className="w-64 h-8 bg-muted rounded-md" />
        <div className="w-96 h-4 bg-muted rounded-xs" />
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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

      {/* Chart Skeleton */}
      <div className="p-6 border bg-card rounded-2xl space-y-4">
        <div className="w-48 h-6 bg-muted rounded-xs" />
        <div className="h-64 bg-muted/40 rounded-xl" />
      </div>
    </div>
  );
}
