export default function SubscriptionLoading() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 space-y-8 animate-pulse max-w-4xl mx-auto">
      <div className="space-y-3 text-center">
        <div className="h-8 w-64 bg-neutral-800 rounded mx-auto"></div>
        <div className="h-4 w-96 bg-neutral-800/60 rounded mx-auto"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 h-96"></div>
        ))}
      </div>
    </div>
  );
}
