import { getSessionUser } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin";
import { redirect } from "next/navigation";
import { getAnalyticsTrends } from "@/lib/queries/analytics";
import { getGenerationLogStats } from "@/lib/queries/admin";
import AdminStatsClient from "@/components/admin/AdminStatsClient";
import GenerationLogSection from "@/components/admin/GenerationLogSection";
import { ShieldCheck, ChartBar, BookOpen } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default async function AdminStatsPage() {
  const user = await getSessionUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  const [trends, generationStats] = await Promise.all([
    getAnalyticsTrends(),
    // The generation_logs table may not exist yet (migration not applied); show an empty state then.
    getGenerationLogStats().catch((err) => {
      console.warn("Could not load generation log stats:", err);
      return null;
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Telemetry & Usage Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time event logging breakdown, daily course volume trends, and quiz performance metrics
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-xl border text-xs font-semibold">
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" /> Directory
          </Link>
          <Link
            href="/admin/stats"
            className="px-3 py-1.5 rounded-lg bg-card text-primary shadow-xs flex items-center gap-1.5 border border-border"
          >
            <ChartBar className="w-3.5 h-3.5" /> Analytics
          </Link>
        </div>
      </div>

      <AdminStatsClient data={trends} />

      <GenerationLogSection stats={generationStats} />
    </div>
  );
}
