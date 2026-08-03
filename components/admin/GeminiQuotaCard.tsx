"use client";

import { useEffect, useState } from "react";
import { QuotaStatusSummary } from "@/lib/quota";
import { Cpu, ShieldCheck, Zap, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GeminiQuotaCard() {
  const [quota, setQuota] = useState<QuotaStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuota = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/quota");
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch {
      // Ignore error for card fetch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
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
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Smart Fallback Active":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-rose-100 text-rose-800 border-rose-200";
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 border border-slate-200 rounded-2xl shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              Gemini API Quota & Smart Router
            </h3>
            <p className="text-xs text-slate-500">
              Live daily allocation meters & smart model degradation protection
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}>
            {quota.healthStatus}
          </span>
          <Button variant="outline" size="sm" onClick={fetchQuota} className="h-8 px-2">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Usage Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        {/* Gemini 3.6 Flash Bar */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-800">Gemini 3.6 Flash (Primary)</span>
            <span className="font-mono font-bold text-indigo-600">
              {quota.flash36.used} / {quota.flash36.limit} RPD
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                quota.flash36.percent >= 90 ? "bg-amber-500" : "bg-indigo-600"
              }`}
              style={{ width: `${quota.flash36.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            5 RPM ceiling • Used for main course syllabus creation
          </p>
        </div>

        {/* Gemini 3.5 Flash Lite Bar */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-800">Gemini 3.5 Flash Lite (High-Vol & Fallback)</span>
            <span className="font-mono font-bold text-purple-600">
              {quota.flash35Lite.used} / {quota.flash35Lite.limit} RPD
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${quota.flash35Lite.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            15 RPM ceiling • Used for quizzes, Study Buddy, & smart fallback
          </p>
        </div>
      </div>

      {/* Quota Shielding Note */}
      <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl flex items-center text-xs text-emerald-900">
        <Zap className="w-4 h-4 mr-2 text-emerald-600 shrink-0 fill-emerald-600" />
        <span>
          <strong className="font-semibold">Redis Quota Shielding Active:</strong> Repeated topics and PDF requests pull from Upstash Redis cache consuming <strong>0 Gemini API calls</strong>.
        </span>
      </div>
    </div>
  );
}
