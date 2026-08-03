import { auth } from "@clerk/nextjs/server";
import { getAdminPlatformStats, getAdminCourseAnalytics, getPopularTopics } from "@/lib/queries/admin";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { ShieldCheck, BookOpen, BarChart2 } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <h2 className="text-2xl font-bold">Access Restricted</h2>
        <p className="text-muted-foreground text-sm">Please sign in to access the Teacher & Admin Analytics Dashboard.</p>
      </div>
    );
  }

  const [stats, courses, popularTopics] = await Promise.all([
    getAdminPlatformStats(),
    getAdminCourseAnalytics(),
    getPopularTopics(),
  ]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            Teacher & Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            System-wide platform analytics, course generation metrics, and learning performance
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border text-xs font-semibold">
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-lg bg-white text-indigo-600 shadow-xs flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" /> Directory
          </Link>
          <Link
            href="/admin/stats"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            <BarChart2 className="w-3.5 h-3.5" /> Analytics
          </Link>
        </div>
      </div>

      <AdminDashboardClient
        stats={stats}
        courses={courses}
        popularTopics={popularTopics}
      />
    </div>
  );
}
