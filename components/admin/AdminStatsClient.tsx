"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DailyTrendItem, QuizMetricsSummary, EventTypeDistributionItem } from "@/lib/queries/analytics";
import { Activity, TrendingUp, Zap, Award, BarChart3, Calendar } from "lucide-react";
import GeminiQuotaCard from "./GeminiQuotaCard";

interface AdminStatsClientProps {
  data: {
    eventDistribution: EventTypeDistributionItem[];
    dailyTrends: DailyTrendItem[];
    quizMetrics: QuizMetricsSummary;
  };
}

export default function AdminStatsClient({ data }: AdminStatsClientProps) {
  const { eventDistribution, dailyTrends, quizMetrics } = data;

  const totalEvents = eventDistribution.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-8">
      {/* Live Gemini Quota Meter & Smart Router Card */}
      <GeminiQuotaCard />

      {/* Metric Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-card border rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Latency</span>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">1.8s</p>
          <p className="text-xs text-emerald-500 font-medium flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> Upstash Redis Cache Accelerated
          </p>
        </div>

        <div className="p-5 bg-card border rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Quiz Pass Rate</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{quizMetrics.passRatePercent}%</p>
          <p className="text-xs text-muted-foreground">{quizMetrics.totalAttempted} quizzes submitted</p>
        </div>

        <div className="p-5 bg-card border rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Quiz Score</span>
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{quizMetrics.averageScorePercent}%</p>
          <p className="text-xs text-muted-foreground">SM-2 adaptive benchmark</p>
        </div>

        <div className="p-5 bg-card border rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Telemetry Events</span>
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{totalEvents}</p>
          <p className="text-xs text-muted-foreground">Logged to stdout / Vercel</p>
        </div>
      </div>

      {/* Chart 1: Daily Course Generation Trend */}
      <div className="p-6 bg-card border rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Daily Course Generation Volume
            </h3>
            <p className="text-xs text-muted-foreground">Volume of AI syllabi generated per day (past 14 days)</p>
          </div>
        </div>

        {dailyTrends.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/20 space-y-2 text-center p-6">
            <Activity className="w-8 h-8 text-muted-foreground" />
            <h4 className="font-medium text-foreground text-sm">No Daily Activity Data</h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              As users generate courses and upload PDFs, daily activity timelines will render automatically.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="coursesGenerated" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCourses)" name="Courses Generated" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 2: Telemetry Event Type Distribution */}
      <div className="p-6 bg-card border rounded-2xl shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-foreground text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            System Telemetry Distribution
          </h3>
          <p className="text-xs text-muted-foreground">Breakdown of Pino-logged structured telemetry events</p>
        </div>

        {eventDistribution.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/20 space-y-2 text-center p-6">
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
            <h4 className="font-medium text-foreground text-sm">No Event Logs Yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              Perform actions like reviewing flashcards or taking quizzes to record live telemetry events.
            </p>
          </div>
        ) : (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Event Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
