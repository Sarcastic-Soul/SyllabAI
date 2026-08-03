export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-neutral-800 rounded-lg"></div>
          <div className="h-4 w-72 bg-neutral-800/60 rounded"></div>
        </div>
        <div className="h-10 w-36 bg-neutral-800 rounded-xl"></div>
      </div>

      {/* Stats Cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3"
          >
            <div className="h-4 w-24 bg-neutral-800 rounded"></div>
            <div className="h-8 w-16 bg-neutral-700 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Courses grid skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-36 bg-neutral-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4"
            >
              <div className="h-5 w-3/4 bg-neutral-800 rounded"></div>
              <div className="h-4 w-1/2 bg-neutral-800/70 rounded"></div>
              <div className="h-2 w-full bg-neutral-800 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
