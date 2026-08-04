"use client";

import { useEffect, useState } from "react";
import { AdaptiveMasteryMetrics } from "@/lib/adaptive";
import { Brain, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";

interface AdaptiveMasteryPanelProps {
  courseId: string;
  onRefresh?: () => void;
}

export function AdaptiveMasterySkeleton() {
  return (
    <div className="p-4 bg-card rounded-xl border shadow-xs space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-lg" />
          <div className="space-y-1.5">
            <div className="w-32 h-3.5 bg-muted rounded-xs" />
            <div className="w-20 h-2.5 bg-muted rounded-xs" />
          </div>
        </div>
        <div className="w-16 h-5 bg-muted rounded-full" />
      </div>
      <div className="w-full h-2 bg-muted rounded-full" />
    </div>
  );
}

export default function AdaptiveMasteryPanel({ courseId }: AdaptiveMasteryPanelProps) {
  const [metrics, setMetrics] = useState<AdaptiveMasteryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/adaptive`);
      if (!res.ok) throw new Error("Failed to load adaptive metrics");
      const data = await res.json();
      setMetrics(data);
    } catch (e: any) {
      setError(e.message || "Could not calculate adaptive mastery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [courseId]);

  if (loading) {
    return <AdaptiveMasterySkeleton />;
  }

  if (error || !metrics) {
    return null;
  }

  const { totalCards, reviewedCards, masteryScore, retentionLevel, recommendedDifficulty, weakConcepts } = metrics;

  // Render a compact, subtle inline alert if no flashcards have been reviewed yet
  if (totalCards === 0 || reviewedCards === 0) {
    return (
      <div className="p-3 px-4 bg-muted/30 border border-dashed border-border rounded-xl flex items-center gap-3 text-xs text-muted-foreground">
        <Brain className="w-4 h-4 text-primary shrink-0" />
        <p className="flex-1">
          <strong className="font-medium text-foreground">Adaptive Engine:</strong> Review flashcards in any chapter to unlock personalized mastery scores & automatic quiz scaling.
        </p>
      </div>
    );
  }

  const getRetentionBadgeStyle = () => {
    switch (retentionLevel) {
      case "Mastered":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Review Recommended":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    }
  };

  return (
    <div className="p-5 bg-card border border-border rounded-xl shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg shadow-xs">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              Adaptive Mastery Engine
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                SM-2 Powered
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {reviewedCards} of {totalCards} flashcards reviewed
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRetentionBadgeStyle()}`}>
          {retentionLevel}
        </span>
      </div>

      {/* Progress Bar & Scores */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-foreground">
          <span>Overall Retention Score</span>
          <span className="text-primary font-bold">{masteryScore}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${masteryScore}%` }}
          />
        </div>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-2.5 bg-muted/40 border border-border rounded-lg space-y-0.5">
          <div className="flex items-center text-[11px] text-muted-foreground">
            <TrendingUp className="w-3 h-3 mr-1 text-primary" />
            Recommended Difficulty
          </div>
          <p className="font-bold text-foreground text-xs">{recommendedDifficulty}</p>
        </div>

        <div className="p-2.5 bg-muted/40 border border-border rounded-lg space-y-0.5">
          <div className="flex items-center text-[11px] text-muted-foreground">
            <Sparkles className="w-3 h-3 mr-1 text-primary" />
            AI Quiz Adaptation
          </div>
          <p className="font-bold text-foreground text-xs">
            {weakConcepts.length > 0 ? "Targeting Weak Concepts" : "Advanced Application"}
          </p>
        </div>
      </div>

      {/* Weak Concepts Warning Alert */}
      {weakConcepts.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1.5 text-xs text-amber-500">
          <div className="flex items-center font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            Focus Areas
          </div>
          <ul className="space-y-0.5 pl-4 list-disc text-muted-foreground text-[11px]">
            {weakConcepts.map((item, idx) => (
              <li key={idx} className="truncate">
                <strong className="font-medium text-foreground">{item.front}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
