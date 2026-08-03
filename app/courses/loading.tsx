export default function CoursesLoading() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 space-y-8 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="h-6 w-24 bg-neutral-800 rounded"></div>
        <div className="h-6 w-32 bg-neutral-800/60 rounded"></div>
      </div>
      <div className="space-y-4 max-w-4xl">
        <div className="h-10 w-2/3 bg-neutral-800 rounded-lg"></div>
        <div className="h-4 w-1/3 bg-neutral-800/70 rounded"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 h-20"></div>
          ))}
        </div>
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 h-64"></div>
      </div>
    </div>
  );
}
