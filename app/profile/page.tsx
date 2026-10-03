import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { users } from "@/lib/db/schema";
import { ArrowRight, BookmarkSimple } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

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

  const stats = [
    {
      label: "Day streak",
      value: `${currentStreak}`,
      note: currentStreak > 0 ? "Study today to keep it" : "Finish a chapter to start one",
    },
    {
      label: "Quiz average",
      value: totalQuizzesTaken > 0 ? `${averageGrade}%` : "–",
      note: `${totalQuizzesTaken} ${totalQuizzesTaken === 1 ? "quiz" : "quizzes"} taken`,
    },
    {
      label: "Chapters done",
      value: `${overallProgress}%`,
      note: `${completedModules} of ${totalModules}`,
    },
    {
      label: "Courses",
      value: `${userCourses.length}`,
      note: userCourses.length === 1 ? "course made" : "courses made",
    },
    {
      label: "Questions answered",
      value: `${totalQuizzesTaken * 3}`,
      note: `${totalCorrectAnswers} correct`,
    },
  ];

  const rowLink =
    "flex flex-col gap-3 p-4 transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:flex-row sm:items-center sm:gap-6 sm:px-5";

  return (
    <main className="mx-auto w-full max-w-6xl space-y-12 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <header className="flex items-center gap-4 sm:gap-5">
        <img
          src={user.imageUrl}
          alt=""
          className="size-14 shrink-0 rounded-full border border-border object-cover sm:size-16"
        />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-balance sm:text-4xl">
            {user.firstName ? `${user.firstName}'s progress` : "Your progress"}
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {user.emailAddresses[0].emailAddress}
          </p>
        </div>
      </header>

      {/* Stats: one panel with hairline dividers */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-5">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col bg-card p-4 sm:p-5 ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`}
          >
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="mt-2 font-mono text-3xl leading-none font-medium tabular-nums">
              {stat.value}
            </dd>
            <dd className="mt-2 text-xs text-muted-foreground">{stat.note}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="profile-courses">
        <h2 id="profile-courses" className="text-xl font-semibold">
          Courses
        </h2>

        {userCourses.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-foreground/25 px-6 py-10">
            <p className="font-medium">No courses yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Make one from a topic or a PDF and your progress shows up here.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/courses/new">
                New course <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
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
                <li key={course.id}>
                  <Link href={`/courses/${course.id}`} className={rowLink}>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-sans text-base font-semibold tracking-normal capitalize">
                        {course.topic}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs capitalize text-muted-foreground">
                        {course.difficulty} / {courseCompletedModules} of{" "}
                        {course.chapters.length} chapters
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:w-56">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                        <div
                          className={`h-full rounded-full ${courseProgress === 100 ? "bg-success" : "bg-primary"}`}
                          style={{ width: `${courseProgress}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-xs tabular-nums">
                        {courseProgress}%
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="profile-bookmarks">
        <h2 id="profile-bookmarks" className="text-xl font-semibold">
          Bookmarked chapters
        </h2>

        {bookmarkedChapters.length === 0 ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-foreground/25 px-6 py-8">
            <BookmarkSimple className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-sm leading-relaxed text-muted-foreground">
              No bookmarks yet. On a course page, tap the bookmark next to a
              chapter to keep it here for later.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {bookmarkedChapters.map((bookmark) => (
              <li key={bookmark.chapterId}>
                <Link
                  href={`/courses/${bookmark.courseId}/chapters/${bookmark.chapterId}`}
                  className={rowLink}
                >
                  <BookmarkSimple weight="fill" className="hidden size-5 shrink-0 text-primary sm:block" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-sans text-base font-semibold tracking-normal">
                      {bookmark.chapterTitle}
                    </h3>
                    <p className="mt-0.5 truncate font-mono text-xs capitalize text-muted-foreground">
                      {bookmark.courseTitle}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {bookmark.content}
                    </p>
                  </div>
                  <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;
