export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 space-y-8 animate-pulse max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-neutral-800"></div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-neutral-800 rounded"></div>
          <div className="h-4 w-32 bg-neutral-800/60 rounded"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 h-24"></div>
        ))}
      </div>
      <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 h-64"></div>
    </div>
  );
}
