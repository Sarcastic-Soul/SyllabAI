"use client";

import { useEffect, useState } from "react";
import { AdaptiveMasteryMetrics } from "@/lib/adaptive";
import { Skeleton } from "@/components/ui/skeleton";

interface AdaptiveMasteryPanelProps {
  courseId: string;
  onRefresh?: () => void;
}

export function AdaptiveMasterySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading mastery"
      className="space-y-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="space-y-2.5 pt-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

export default function AdaptiveMasteryPanel({ courseId }: AdaptiveMasteryPanelProps) {
  // The result remembers which course it belongs to, so "loading" is simply
  // "no result for the current course yet".
  const [result, setResult] = useState<{
    courseId: string;
    metrics: AdaptiveMasteryMetrics | null;
    error: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}/adaptive`);
        if (!res.ok) throw new Error("Failed to load adaptive metrics");
        const data: AdaptiveMasteryMetrics = await res.json();
        if (!cancelled) setResult({ courseId, metrics: data, error: "" });
      } catch (e: unknown) {
        const message =
          (e instanceof Error && e.message) || "Could not calculate adaptive mastery";
        if (!cancelled) setResult({ courseId, metrics: null, error: message });
      }
    };

    fetchMetrics();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const loading = result?.courseId !== courseId;
  const metrics = loading ? null : result.metrics;
  const error = loading ? "" : result.error;

  if (loading) {
    return <AdaptiveMasterySkeleton />;
  }

  if (error || !metrics) {
    return null;
  }

  const { totalCards, reviewedCards, masteryScore, retentionLevel, recommendedDifficulty, weakConcepts } = metrics;

  // Nothing reviewed yet: one short line that says what to do next
  if (totalCards === 0 || reviewedCards === 0) {
    return (
      <div className="rounded-xl border border-dashed border-foreground/25 p-5">
        <h3 className="text-sm font-semibold">Mastery</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          No score yet. Open a chapter and review its flashcards. Your score and
          the cards you find hard will show up here.
        </p>
      </div>
    );
  }

  const retentionDot =
    retentionLevel === "Mastered"
      ? "bg-success"
      : retentionLevel === "Review Recommended"
        ? "bg-warning"
        : "bg-destructive";

  return (
    <section
      aria-label="Mastery"
      className="space-y-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-semibold">Mastery</h3>
        <p className="flex items-center gap-1.5 text-xs font-medium">
          <span aria-hidden className={`size-2 rounded-full ${retentionDot}`} />
          {retentionLevel}
        </p>
      </div>

      <div className="space-y-2">
        <p className="flex items-baseline gap-2">
          <span className="font-mono text-4xl leading-none font-medium tabular-nums">
            {masteryScore}%
          </span>
          <span className="text-sm text-muted-foreground">retention</span>
        </p>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
          role="progressbar"
          aria-valuenow={masteryScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Retention score"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${masteryScore}%` }}
          />
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {reviewedCards}/{totalCards} flashcards reviewed
        </p>
      </div>

      <dl className="divide-y divide-border border-t border-border text-sm">
        <div className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-muted-foreground">Suggested level</dt>
          <dd className="text-right font-medium">{recommendedDifficulty}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-muted-foreground">Next quiz</dt>
          <dd className="text-right font-medium">
            {weakConcepts.length > 0 ? "Covers your weak cards" : "Harder, applied questions"}
          </dd>
        </div>
      </dl>

      {weakConcepts.length > 0 && (
        <div className="border-l-2 border-warning pl-3">
          <h4 className="text-xs font-semibold">Review these next</h4>
          <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
            {weakConcepts.map((item, idx) => (
              <li key={idx} className="truncate" title={item.front}>
                {item.front}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
