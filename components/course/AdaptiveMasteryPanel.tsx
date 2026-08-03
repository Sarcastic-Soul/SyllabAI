"use client";

import { useEffect, useState } from "react";
import { AdaptiveMasteryMetrics } from "@/lib/adaptive";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdaptiveMasteryPanelProps {
  courseId: string;
  onRefresh?: () => void;
}

export function AdaptiveMasterySkeleton() {
  return (
    <div className="p-6 bg-card rounded-2xl border shadow-xs space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-muted rounded-xl" />
          <div className="space-y-2">
            <div className="w-36 h-4 bg-muted rounded-xs" />
            <div className="w-24 h-3 bg-muted rounded-xs" />
          </div>
        </div>
        <div className="w-20 h-6 bg-muted rounded-full" />
      </div>
      <div className="w-full h-3 bg-muted rounded-full" />
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="h-12 bg-muted rounded-xl" />
        <div className="h-12 bg-muted rounded-xl" />
      </div>
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

  // Render empty state if no flashcards have been reviewed yet
  if (totalCards === 0 || reviewedCards === 0) {
    return (
      <div className="p-6 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Brain className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-slate-800 text-sm">Adaptive Engine Ready</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          No SM-2 review data recorded yet. Practice flashcards in any chapter to unlock personalized mastery scores and automatic quiz difficulty adaptation!
        </p>
      </div>
    );
  }

  const getRetentionBadgeStyle = () => {
    switch (retentionLevel) {
      case "Mastered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Review Recommended":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-rose-100 text-rose-800 border-rose-200";
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-white via-indigo-50/30 to-slate-50 border border-indigo-100 rounded-2xl shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              Adaptive Mastery Engine
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                SM-2 Powered
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {reviewedCards} of {totalCards} flashcards reviewed
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRetentionBadgeStyle()}`}>
          {retentionLevel}
        </span>
      </div>

      {/* Progress Bar & Scores */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-700">
          <span>Overall Retention Score</span>
          <span className="text-indigo-600 font-bold">{masteryScore}%</span>
        </div>
        <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${masteryScore}%` }}
          />
        </div>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 bg-white/80 border border-slate-200/60 rounded-xl space-y-1">
          <div className="flex items-center text-xs text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            Recommended Difficulty
          </div>
          <p className="font-bold text-slate-900 text-sm">{recommendedDifficulty}</p>
        </div>

        <div className="p-3 bg-white/80 border border-slate-200/60 rounded-xl space-y-1">
          <div className="flex items-center text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-500" />
            AI Quiz Adaptation
          </div>
          <p className="font-bold text-slate-900 text-sm">
            {weakConcepts.length > 0 ? "Targeting Weak Concepts" : "Advanced Application"}
          </p>
        </div>
      </div>

      {/* Weak Concepts Warning Alert */}
      {weakConcepts.length > 0 && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-xl space-y-2 text-xs">
          <div className="flex items-center text-amber-800 font-semibold">
            <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0 text-amber-600" />
            Focus Areas (Ease Factor Below Threshold)
          </div>
          <ul className="space-y-1 pl-5 list-disc text-amber-900">
            {weakConcepts.map((item, idx) => (
              <li key={idx} className="truncate">
                <strong className="font-medium">{item.front}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
