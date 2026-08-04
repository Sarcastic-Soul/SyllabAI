import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAnalyticsTrends } from "@/lib/queries/analytics";
import AdminStatsClient from "@/components/admin/AdminStatsClient";
import { ShieldCheck, BarChart2, BookOpen } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAIL = "anishisbusy@gmail.com";

export default async function AdminStatsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  const primaryEmail =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress || user?.emailAddresses[0]?.emailAddress;

  if (!userId || !primaryEmail || primaryEmail.toLowerCase() !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const trends = await getAnalyticsTrends();

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
            <BarChart2 className="w-3.5 h-3.5" /> Analytics
          </Link>
        </div>
      </div>

      <AdminStatsClient data={trends} />
    </div>
  );
}
