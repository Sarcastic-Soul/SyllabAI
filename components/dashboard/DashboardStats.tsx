"use client";

import { useMemo } from "react";
import { Activity, Clock, Target } from "lucide-react";
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Daily Streak Heatmap */}
            <div className="p-6 border rounded-xl bg-card space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                    <Activity className="w-5 h-5 text-primary" />
                    <span>Activity (Last 30 Days)</span>
                </div>
                <div className="flex flex-wrap gap-1">
                    {heatmapDays.map((day, i) => (
                        <div
                            key={i}
                            title={`${day.date}: ${day.count} activities`}
                            className={`w-4 h-4 rounded-sm ${
                                day.count === 0
                                    ? "bg-secondary"
                                    : day.count < 3
                                      ? "bg-primary/40"
                                      : day.count < 5
                                        ? "bg-primary/70"
                                        : "bg-primary"
                            }`}
                        />
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    Current Streak: {userDb?.currentStreak || 0} days
                </p>
            </div>

            {/* Time Spent Per Course */}
            <div className="p-6 border rounded-xl bg-card space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>Time Spent</span>
                </div>
                <div className="space-y-3 max-h-[120px] overflow-y-auto pr-2">
                    {userCourses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No courses yet.
                        </p>
                    ) : (
                        userCourses.map((course, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-center text-sm"
                            >
                                <span
                                    className="truncate w-3/4 capitalize"
                                    title={course.topic}
                                >
                                    {course.topic}
                                </span>
                                <span className="font-medium text-muted-foreground shrink-0">
                                    {course.timeSpent > 0
                                        ? `${Math.round(course.timeSpent / 60)} min`
                                        : `${(course.chapters?.filter((c) => c.isCompleted).length || 0) * 5} min (est)`}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Accuracy Per Topic */}
            <div className="p-6 border rounded-xl bg-card space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                    <Target className="w-5 h-5 text-primary" />
                    <span>Accuracy per Topic</span>
                </div>
                <div className="space-y-3 max-h-[120px] overflow-y-auto pr-2">
                    {accuracyPerTopic.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No quizzes taken.
                        </p>
                    ) : (
                        accuracyPerTopic.map((topic, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-center text-sm"
                            >
                                <span
                                    className="truncate w-3/4 capitalize"
                                    title={topic.topic}
                                >
                                    {topic.topic}
                                </span>
                                <span
                                    className={`font-bold ${topic.accuracy > 70 ? "text-green-500" : topic.accuracy > 40 ? "text-yellow-500" : "text-red-500"}`}
                                >
                                    {topic.quizzesTaken > 0
                                        ? `${topic.accuracy}%`
                                        : "-"}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
