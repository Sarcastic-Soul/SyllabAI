"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash, CalendarBlank, BookOpen, Check } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
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
import type { UserCourseWithChapters } from "@/lib/db/drizzle.types";

export default function DashboardClient({
  initialCourses,
}: {
  initialCourses: UserCourseWithChapters[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();
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
  const displayedCourses = initialCourses.filter((course) => {
    const isCompleted =
      course.chapters.length > 0 &&
      course.chapters.every((c) => c.isCompleted);

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

  const hasFilters = filterStatus !== "all" || filterDifficulty !== "all";

  return (
    <section aria-label="Course list" className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger aria-label="Filter by status" className="min-w-36 flex-1 sm:w-40 sm:flex-none">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            <SelectItem value="ongoing">In progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger aria-label="Filter by difficulty" className="min-w-36 flex-1 sm:w-40 sm:flex-none">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any difficulty</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger aria-label="Sort courses" className="min-w-36 flex-1 sm:w-44 sm:flex-none">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Newest first</SelectItem>
            <SelectItem value="modules_high">Most chapters</SelectItem>
            <SelectItem value="modules_low">Fewest chapters</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {displayedCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-foreground/25 px-6 py-12">
          <p className="font-medium">No courses match these filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different status or difficulty.
          </p>
          {hasFilters && (
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => {
                setFilterStatus("all");
                setFilterDifficulty("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedCourses.map((course, index) => {
            const completedChapters = course.chapters.filter(
              (c) => c.isCompleted,
            ).length;
            const totalChapters = course.chapters.length;
            const progress =
              totalChapters > 0
                ? Math.round((completedChapters / totalChapters) * 100)
                : 0;
            const isDeleting = deletingId === course.id;
            const isDone = totalChapters > 0 && completedChapters === totalChapters;

            return (
              <motion.li
                key={course.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  ease: "easeOut",
                  delay: reduceMotion ? 0 : Math.min(index, 8) * 0.04,
                }}
                className={`group relative flex h-full flex-col rounded-xl border border-border bg-card transition-colors duration-150 hover:border-foreground/35 focus-within:border-foreground/35 ${isDeleting ? "opacity-60" : ""}`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete course: ${course.topic}`}
                  className="absolute top-2 right-2 z-10 size-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(course.id);
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Spinner /> : <Trash />}
                </Button>

                <Link
                  href={`/courses/${course.id}`}
                  className="flex flex-1 flex-col rounded-xl p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <p className="pr-10 font-mono text-xs capitalize text-muted-foreground">
                    {course.difficulty}
                  </p>
                  <h2 className="mt-2 line-clamp-2 pr-6 text-lg leading-snug font-semibold capitalize text-balance">
                    {course.topic}
                  </h2>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="size-4" aria-hidden />
                      {totalChapters} {totalChapters === 1 ? "chapter" : "chapters"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarBlank className="size-4" aria-hidden />
                      {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-auto space-y-2 pt-6">
                    <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                      <span>
                        {completedChapters}/{totalChapters} done
                      </span>
                      {isDone ? (
                        <span className="flex items-center gap-1 text-foreground">
                          <Check weight="bold" className="size-3.5 text-success" aria-hidden />
                          Completed
                        </span>
                      ) : (
                        <span className="tabular-nums">{progress}%</span>
                      )}
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Course progress"
                    >
                      <div
                        className={`h-full rounded-full ${isDone ? "bg-success" : "bg-primary"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
