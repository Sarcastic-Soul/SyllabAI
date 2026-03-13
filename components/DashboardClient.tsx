"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteCourse } from "@/lib/actions/course.actions";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

export default function DashboardClient({
  initialCourses,
}: {
  initialCourses: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters and Sort State
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const handleDelete = (courseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this course? This action cannot be undone.",
      )
    )
      return;

    setDeletingId(courseId);
    startTransition(async () => {
      await deleteCourse(courseId);
      setDeletingId(null);
      router.refresh();
    });
  };

  // Apply Filters & Sorting
  let displayedCourses = initialCourses.filter((course) => {
    const isCompleted =
      course.chapters.length > 0 &&
      course.chapters.every((c: any) => c.isCompleted);

    // Status Filter
    if (filterStatus === "completed" && !isCompleted) return false;
    if (filterStatus === "ongoing" && isCompleted) return false;

    // Difficulty Filter
    if (filterDifficulty !== "all" && course.difficulty !== filterDifficulty)
      return false;

    return true;
  });

  displayedCourses.sort((a, b) => {
    if (sortBy === "recent")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "modules_high") return b.chapters.length - a.chapters.length;
    if (sortBy === "modules_low") return a.chapters.length - b.chapters.length;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Sleek, subtle, right-aligned Filters Bar */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-transparent">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-transparent">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-transparent">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="modules_high">Most Modules</SelectItem>
            <SelectItem value="modules_low">Fewest Modules</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Grid */}
      {displayedCourses.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed rounded-xl bg-card">
          <p>No courses match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCourses.map((course) => {
            const completedChapters = course.chapters.filter(
              (c: any) => c.isCompleted,
            ).length;
            const totalChapters = course.chapters.length;
            const progress =
              totalChapters > 0
                ? Math.round((completedChapters / totalChapters) * 100)
                : 0;
            const isDeleting = deletingId === course.id;

            return (
              <div
                key={course.id}
                className="relative group p-6 border rounded-xl hover:border-primary transition-colors bg-card space-y-4 h-full flex flex-col justify-between"
              >
                {/* Delete Button (Hidden until hover) */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(course.id);
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Spinner className="w-4 h-4" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>

                <Link
                  href={`/courses/${course.id}`}
                  className="block flex-1 space-y-4"
                >
                  <div>
                    <span className="text-xs font-semibold bg-secondary px-2 py-1 rounded-full capitalize">
                      {course.difficulty}
                    </span>
                    <h2 className="text-xl font-semibold capitalize mt-3 line-clamp-2">
                      {course.topic}
                    </h2>
                  </div>

                  {/* Additional Course Details */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" /> {totalChapters} Modules
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />{" "}
                      {new Date(course.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
