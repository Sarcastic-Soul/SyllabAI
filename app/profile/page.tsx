import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { users } from "@/lib/db/schema";
import {
  BookOpen,
  GraduationCap,
  Target,
  Trophy,
  Bookmark,
  Flame,
} from "lucide-react";

const ProfilePage = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Run all independent data fetches in parallel
  const [user, userDb, userCourses] = await Promise.all([
    currentUser(),
    db.query.users.findFirst({
      where: eq(users.id, userId),
    }),
    db.query.courses.findMany({
      where: eq(courses.author, userId),
      orderBy: [desc(courses.createdAt)],
      with: {
        chapters: {
          with: {
            quizzes: true,
          },
        },
      },
    }),
  ]);

  if (!user) {
    redirect("/sign-in");
  }

  const currentStreak = userDb?.currentStreak || 0;

  // Analytics Calculations
  let totalQuizzesTaken = 0;
  let totalCorrectAnswers = 0;
  let completedModules = 0;
  let totalModules = 0;

  userCourses.forEach((course) => {
    course.chapters.forEach((chapter) => {
      totalModules++;
      if (chapter.isCompleted) completedModules++;

      chapter.quizzes.forEach((quiz) => {
        if (quiz.isCompleted && quiz.score !== null) {
          totalQuizzesTaken++;
          totalCorrectAnswers += quiz.score;
        }
      });
    });
  });

  // We know every generated quiz has exactly 3 questions based on our prompt
  const maxPossibleScore = totalQuizzesTaken * 3;
  const averageGrade =
    totalQuizzesTaken > 0
      ? Math.round((totalCorrectAnswers / maxPossibleScore) * 100)
      : 0;

  const overallProgress =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Extract Bookmarked Chapters
  const bookmarkedChapters: {
    courseId: string;
    chapterId: string;
    courseTitle: string;
    chapterTitle: string;
    content: string;
  }[] = [];

  userCourses.forEach((course) => {
    course.chapters.forEach((chapter) => {
      if (chapter.isBookmarked) {
        bookmarkedChapters.push({
          courseId: course.id,
          chapterId: chapter.id,
          courseTitle: course.topic,
          chapterTitle: chapter.title,
          content: chapter.content || "",
        });
      }
    });
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 mt-4">
      {/* Header Profile Section */}
      <div className="flex items-center gap-6 pb-8 border-b">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20">
          <img
            src={user.imageUrl}
            alt={user.firstName || "User"}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-4xl font-bold">
            {user.firstName}'s Learning Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            {user.emailAddresses[0].emailAddress}
          </p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 border rounded-2xl bg-card space-y-2">
          <div className="flex items-center gap-2 text-orange-500">
            <Flame className="w-5 h-5" />
            <h3 className="font-semibold">Learning Streak</h3>
          </div>
          <p className="text-4xl font-bold">
            {currentStreak}{" "}
            <span className="text-xl text-muted-foreground">Days</span>
          </p>
          <p className="text-sm text-muted-foreground">Keep it up!</p>
        </div>

        <div className="p-6 border rounded-2xl bg-card space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="w-5 h-5" />
            <h3 className="font-semibold">Average Grade</h3>
          </div>
          <p className="text-4xl font-bold">{averageGrade}%</p>
          <p className="text-sm text-muted-foreground">
            Across {totalQuizzesTaken} quizzes
          </p>
        </div>

        <div className="p-6 border rounded-2xl bg-card space-y-2">
          <div className="flex items-center gap-2 text-blue-500">
            <Target className="w-5 h-5" />
            <h3 className="font-semibold">Overall Progress</h3>
          </div>
          <p className="text-4xl font-bold">{overallProgress}%</p>
          <p className="text-sm text-muted-foreground">
            {completedModules} of {totalModules} modules
          </p>
        </div>

        <div className="p-6 border rounded-2xl bg-card space-y-2">
          <div className="flex items-center gap-2 text-green-500">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-semibold">Courses Enrolled</h3>
          </div>
          <p className="text-4xl font-bold">{userCourses.length}</p>
          <p className="text-sm text-muted-foreground">Active learning paths</p>
        </div>

        <div className="p-6 border rounded-2xl bg-card space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap className="w-5 h-5" />
            <h3 className="font-semibold">Questions Answered</h3>
          </div>
          <p className="text-4xl font-bold">{totalQuizzesTaken * 3}</p>
          <p className="text-sm text-muted-foreground">
            {totalCorrectAnswers} correct answers
          </p>
        </div>
      </div>

      {/* Course List */}
      <div className="pt-8">
        <h2 className="text-2xl font-bold mb-6">Your Courses</h2>

        {userCourses.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-2xl bg-secondary/20">
            <p className="text-muted-foreground">
              You haven't started any courses yet.
            </p>
            <Link
              href="/courses/new"
              className="text-primary hover:underline mt-2 inline-block"
            >
              Generate your first course →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCourses.map((course) => {
              const courseCompletedModules = course.chapters.filter(
                (c) => c.isCompleted,
              ).length;
              const courseProgress =
                course.chapters.length > 0
                  ? Math.round(
                      (courseCompletedModules / course.chapters.length) * 100,
                    )
                  : 0;

              return (
                <Link href={`/courses/${course.id}`} key={course.id}>
                  <div className="p-6 border rounded-xl hover:border-primary transition-colors cursor-pointer bg-card space-y-4 h-full flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold bg-secondary px-2 py-1 rounded-full capitalize">
                        {course.difficulty}
                      </span>
                      <h3 className="text-xl font-semibold capitalize mt-3 line-clamp-2">
                        {course.topic}
                      </h3>
                    </div>

                    <div className="space-y-2 pt-4">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>{courseProgress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${courseProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* NEW: Bookmarked Chapters List */}
      <div className="pt-12 border-t mt-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Bookmark className="w-6 h-6 text-primary" />
          Saved for Later
        </h2>

        {bookmarkedChapters.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-2xl bg-secondary/20">
            <p className="text-muted-foreground">
              You haven't bookmarked any chapters yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedChapters.map((bookmark) => (
              <Link
                href={`/courses/${bookmark.courseId}/chapters/${bookmark.chapterId}`}
                key={bookmark.chapterId}
              >
                <div className="p-6 border rounded-xl hover:border-primary transition-colors cursor-pointer bg-card space-y-3 h-full flex flex-col">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider line-clamp-1">
                    From: {bookmark.courseTitle}
                  </span>
                  <h3 className="text-lg font-bold line-clamp-2">
                    {bookmark.chapterTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                    {bookmark.content}
                  </p>
                  <div className="pt-4 text-sm font-medium text-primary flex items-center gap-2">
                    Review Chapter →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
