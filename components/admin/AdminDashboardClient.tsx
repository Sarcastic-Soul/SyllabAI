"use client";

import { useState } from "react";
import { PlatformStats, AdminCourseItem, PopularTopic } from "@/lib/queries/admin";
import { Users, BookOpen, Layers, Award, Search, Eye, Lock, Globe, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import GeminiQuotaCard from "./GeminiQuotaCard";

interface AdminDashboardClientProps {
  stats: PlatformStats;
  courses: AdminCourseItem[];
  popularTopics: PopularTopic[];
}

export default function AdminDashboardClient({
  stats,
  courses,
  popularTopics,
}: AdminDashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublic, setFilterPublic] = useState<"all" | "public" | "private">("all");

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.author.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterPublic === "all" ||
      (filterPublic === "public" && course.isPublic) ||
      (filterPublic === "private" && !course.isPublic);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Live Gemini Quota Meter & Smart Router Card */}
      <GeminiQuotaCard />

      {/* Metrics Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-card border rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{stats.totalUsers}</p>
          <p className="text-xs text-muted-foreground">Registered learner accounts</p>
        </div>

        <div className="p-5 bg-card border rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Courses Built</span>
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{stats.totalCourses}</p>
          <p className="text-xs text-muted-foreground">AI syllabi generated</p>
        </div>

        <div className="p-5 bg-card border rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Modules Created</span>
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{stats.totalChapters}</p>
          <p className="text-xs text-muted-foreground">Structured lesson chapters</p>
        </div>

        <div className="p-5 bg-card border rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Quiz Mastery</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-foreground">{stats.averageQuizScore}%</p>
          <p className="text-xs text-muted-foreground">{stats.totalQuizzesTaken} quizzes evaluated</p>
        </div>
      </div>

      {/* Popular Topics Pill Tags */}
      {popularTopics.length > 0 && (
        <div className="p-6 bg-card border rounded-2xl shadow-xs space-y-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Popular Course Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularTopics.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border"
              >
                <span className="font-bold mr-1.5 capitalize">{item.topic}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
                  {item.count} {item.count === 1 ? "course" : "courses"}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Course Analytics Data Table */}
      <div className="p-6 bg-card border rounded-2xl shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground text-lg">Platform Course Directory</h3>
            <p className="text-xs text-muted-foreground">
              Overview of all generated courses, authors, and accessibility status
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search topic or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Filter */}
            <select
              value={filterPublic}
              onChange={(e) => setFilterPublic(e.target.value as any)}
              className="text-xs border rounded-lg px-3 py-2 bg-background text-foreground border-border focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-xl bg-muted/20 space-y-3">
            <BookOpen className="w-8 h-8 mx-auto text-muted-foreground" />
            <h4 className="font-medium text-foreground text-sm">No Courses Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No course records match your current search query or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/60 border-b text-muted-foreground font-semibold">
                  <th className="p-3.5">Course Topic</th>
                  <th className="p-3.5">Author</th>
                  <th className="p-3.5">Difficulty</th>
                  <th className="p-3.5">Modules</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border text-foreground">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3.5 font-semibold capitalize max-w-[220px] truncate">
                      {course.topic}
                    </td>
                    <td className="p-3.5 text-muted-foreground font-mono max-w-[140px] truncate">
                      {course.author.slice(0, 12)}...
                    </td>
                    <td className="p-3.5 capitalize">
                      <span className="px-2 py-0.5 rounded-full bg-secondary border border-border text-[11px] font-medium">
                        {course.difficulty}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium">{course.chapterCount} chapters</td>
                    <td className="p-3.5">
                      {course.isPublic ? (
                        <span className="inline-flex items-center text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px] font-medium border border-emerald-500/20">
                          <Globe className="w-3 h-3 mr-1" /> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-[11px] font-medium border border-border">
                          <Lock className="w-3 h-3 mr-1" /> Private
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link href={`/courses/${course.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
