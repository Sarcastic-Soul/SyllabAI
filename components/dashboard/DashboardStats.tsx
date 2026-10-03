"use client";

import { useMemo } from "react";
import type { UserCourseWithChapters, UserDb } from "@/lib/db/drizzle.types";

export default function DashboardStats({
    userCourses,
    userDb,
}: {
    userCourses: UserCourseWithChapters[];
    userDb: UserDb | undefined;
}) {
    // 1. Calculate accuracy per topic
    const accuracyPerTopic = useMemo(() => {
        return userCourses.map((course) => {
            let totalQuizzes = 0;
            let totalScore = 0;

            course.chapters?.forEach((chapter) => {
                chapter.quizzes?.forEach((quiz) => {
                    if (quiz.isCompleted && quiz.score !== null) {
                        totalQuizzes++;
                        totalScore += quiz.score;
                    }
                });
            });

            const avgScore =
                totalQuizzes > 0
                    ? Math.round((totalScore / (totalQuizzes * 3)) * 100)
                    : 0;

            return {
                topic: course.topic,
                accuracy: avgScore,
                quizzesTaken: totalQuizzes,
            };
        });
    }, [userCourses]);

    // 2. Format Activity Map for Heatmap (last 30 days for simplicity)
    const activityMap = (userDb?.activityMap as Record<string, number>) || {};
    const heatmapDays = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateString = d.toISOString().split("T")[0];
            days.push({
                date: dateString,
                count: activityMap[dateString] || 0,
            });
        }
        return days;
    }, [activityMap]);

    const streak = userDb?.currentStreak || 0;
    const activeDays = heatmapDays.filter((d) => d.count > 0).length;

    return (
        <section
            aria-label="Your stats"
            className="grid grid-cols-1 divide-y divide-border rounded-xl border border-border bg-card md:grid-cols-3 md:divide-x md:divide-y-0"
        >
            {/* Streak and 30-day activity */}
            <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-sm font-semibold">Last 30 days</h2>
                    <p className="font-mono text-xs text-muted-foreground">
                        {activeDays} active {activeDays === 1 ? "day" : "days"}
                    </p>
                </div>
                <p className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-medium tabular-nums leading-none">
                        {streak}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        day streak
                    </span>
                </p>
                <div
                    className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1"
                    role="img"
                    aria-label={`Activity for the last 30 days: ${activeDays} active days`}
                >
                    {heatmapDays.map((day, i) => (
                        <div
                            key={i}
                            title={`${day.date}: ${day.count} ${day.count === 1 ? "activity" : "activities"}`}
                            className={`aspect-square rounded-[3px] ${
                                day.count === 0
                                    ? "bg-foreground/[0.07]"
                                    : day.count < 3
                                      ? "bg-primary/35"
                                      : day.count < 5
                                        ? "bg-primary/65"
                                        : "bg-primary"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Time spent per course */}
            <div className="space-y-4 p-5 sm:p-6">
                <h2 className="text-sm font-semibold">Time spent</h2>
                <ul className="max-h-36 space-y-2.5 overflow-y-auto pr-2">
                    {userCourses.length === 0 ? (
                        <li className="text-sm text-muted-foreground">
                            Time shows up here once you open a lesson.
                        </li>
                    ) : (
                        userCourses.map((course, i) => (
                            <li
                                key={i}
                                className="flex items-baseline justify-between gap-4 text-sm"
                            >
                                <span
                                    className="min-w-0 truncate capitalize"
                                    title={course.topic}
                                >
                                    {course.topic}
                                </span>
                                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                                    {course.timeSpent > 0
                                        ? `${Math.round(course.timeSpent / 60)} min`
                                        : `${(course.chapters?.filter((c) => c.isCompleted).length || 0) * 5} min (est)`}
                                </span>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Quiz accuracy per course */}
            <div className="space-y-4 p-5 sm:p-6">
                <h2 className="text-sm font-semibold">Quiz accuracy</h2>
                <ul className="max-h-36 space-y-2.5 overflow-y-auto pr-2">
                    {accuracyPerTopic.length === 0 ? (
                        <li className="text-sm text-muted-foreground">
                            Finish a chapter quiz to see your accuracy.
                        </li>
                    ) : (
                        accuracyPerTopic.map((topic, i) => (
                            <li
                                key={i}
                                className="flex items-baseline justify-between gap-4 text-sm"
                            >
                                <span
                                    className="min-w-0 truncate capitalize"
                                    title={topic.topic}
                                >
                                    {topic.topic}
                                </span>
                                {topic.quizzesTaken > 0 ? (
                                    <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs font-medium tabular-nums">
                                        <span
                                            aria-hidden
                                            className={`size-2 rounded-full ${topic.accuracy > 70 ? "bg-success" : topic.accuracy > 40 ? "bg-warning" : "bg-destructive"}`}
                                        />
                                        {topic.accuracy}%
                                    </span>
                                ) : (
                                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                                        No quiz yet
                                    </span>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </section>
    );
}
