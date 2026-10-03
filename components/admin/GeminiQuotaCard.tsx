"use client";

import { useEffect, useState } from "react";
import { QuotaStatusSummary } from "@/lib/quota";
import { Cpu, ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Returns null when the request fails, so the card keeps what it had.
async function requestQuota(): Promise<QuotaStatusSummary | null> {
  try {
    const res = await fetch("/api/admin/quota");
    if (res.ok) return await res.json();
  } catch {
    // Ignore error for card fetch
  }
  return null;
}

export default function GeminiQuotaCard() {
  const [quota, setQuota] = useState<QuotaStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const applyQuota = (data: QuotaStatusSummary | null) => {
    if (data) setQuota(data);
    setLoading(false);
  };

  const fetchQuota = async () => {
    setLoading(true);
    applyQuota(await requestQuota());
  };

  // Loading starts as true, so the first load only sets state when it finishes.
  useEffect(() => {
    requestQuota().then((data) => {
      if (data) setQuota(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-card border rounded-2xl shadow-xs space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="w-48 h-6 bg-muted rounded-xs" />
          <div className="w-24 h-6 bg-muted rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="w-full h-3 bg-muted rounded-full" />
          <div className="w-full h-3 bg-muted rounded-full" />
        </div>
      </div>
    );
  }

  if (!quota) return null;

  const getBadgeStyle = () => {
    switch (quota.healthStatus) {
      case "Optimal":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Smart Fallback Active":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    }
  };

  return (
    <div className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base flex items-center gap-2">
              Gemini API Quota & Smart Router
            </h3>
            <p className="text-xs text-muted-foreground">
              Live daily allocation meters & smart model degradation protection
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}>
            {quota.healthStatus}
          </span>
          <Button variant="outline" size="sm" onClick={fetchQuota} className="h-8 px-2">
            <ArrowsClockwise className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Usage Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        {/* Gemini 3.8 Flash Bar */}
        <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground">Gemini 3.8 Flash (Primary)</span>
            <span className="font-mono font-bold text-primary">
              {quota.flash38.used} / {quota.flash38.limit} RPD
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                quota.flash38.percent >= 90 ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${quota.flash38.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            5 RPM ceiling • Used for main course syllabus creation
          </p>
        </div>

        {/* Gemini 3.5 Flash Lite Bar */}
        <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground">Gemini 3.5 Flash Lite (High-Vol & Fallback)</span>
            <span className="font-mono font-bold text-primary">
              {quota.flash35Lite.used} / {quota.flash35Lite.limit} RPD
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${quota.flash35Lite.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            15 RPM ceiling • Used for quizzes, Study Buddy, & smart fallback
          </p>
        </div>
      </div>

    </div>
  );
}
