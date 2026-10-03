import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading plans"
      className="mx-auto w-full max-w-4xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12"
    >
      <div className="space-y-3">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-5 w-full max-w-lg" />
        <Skeleton className="h-5 w-2/3 max-w-sm" />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-4 rounded-lg border border-border bg-card p-6">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-9 w-28" />
            <div className="space-y-2.5 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
