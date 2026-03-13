import { db } from "@/lib/db";
import { courses, chapters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bookmark, BookmarkCheck, Bot, Sparkles } from "lucide-react";
import { toggleChapterBookmark } from "@/lib/actions/chapter.actions";
import StudyBuddy from "@/components/StudyBuddy";
import DeleteCourseButton from "@/components/DeleteCourseButton";

interface CoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

const CourseDashboard = async ({ params }: CoursePageProps) => {
  const { courseId } = await params;

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.order)],
        with: {
          quizzes: true,
        },
      },
    },
  });

  if (!course) notFound();

  const totalChapters = course.chapters.length;
  const completedChapters = course.chapters.filter((c) => c.isCompleted).length;
  const progressPercentage =
    totalChapters === 0
      ? 0
      : Math.round((completedChapters / totalChapters) * 100);

  let totalQuizzesTaken = 0;
  let totalCorrectAnswers = 0;
  course.chapters.forEach((ch) => {
    ch.quizzes.forEach((q) => {
      if (q.isCompleted && q.score !== null) {
        totalQuizzesTaken++;
        totalCorrectAnswers += q.score;
      }
    });
  });
  const avgQuizScore =
    totalQuizzesTaken > 0
      ? Math.round((totalCorrectAnswers / (totalQuizzesTaken * 3)) * 100)
      : 0;

  const courseStructureString = course.chapters
    .map((c) => `Chapter ${c.order}: ${c.title} - ${c.content}`)
    .join(" | ");

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      {/* Course Header (Stays on Top) */}
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-4xl font-bold capitalize">{course.topic}</h1>
          <DeleteCourseButton courseId={course.id} />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="px-3 py-1 bg-secondary rounded-full capitalize text-foreground font-medium">
            {course.difficulty}
          </span>
          <span>{totalChapters} Modules</span>
          <span>•</span>
          <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
          {/* Show Quiz Stats if they've taken any */}
          {totalQuizzesTaken > 0 && (
            <>
              <span>•</span>
              <span className="text-primary font-medium">
                {totalQuizzesTaken} Quizzes Taken (Avg: {avgQuizScore}%)
              </span>
            </>
          )}
        </div>
        <div className="w-full bg-secondary rounded-full h-2.5 mt-4">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* NEW: Full-Width Study Buddy Banner Link */}
        <Link href={`/courses/${course.id}/study-buddy`} className="block">
          <div className="relative overflow-hidden p-8 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group cursor-pointer flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-48 h-48" />
            </div>
            <div className="p-5 bg-primary rounded-full shadow-lg shadow-primary/30 shrink-0">
              <Bot className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="flex-1 text-center md:text-left z-10">
              <h3 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
                Enter Study Buddy Mode
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full uppercase tracking-wider font-bold">
                  New
                </span>
              </h3>
              <p className="text-muted-foreground mt-2">
                Have doubts about the curriculum? Start a live, interactive
                voice session with your personalized AI tutor.
              </p>
            </div>
            <Button size="lg" className="shrink-0 z-10" variant="default">
              Start Voice Chat <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Link>
      </div>

      {/* Layout Split: Chapters on Left, Buddy on Right (or Bottom on Mobile) */}
      <div className="flex flex-col-reverse lg:flex-row gap-8 items-start">
        {/* Left Side: Chapters List */}
        <div className="flex-1 space-y-6 w-full">
          <h2 className="text-2xl font-semibold">Course Content</h2>

          <div className="grid gap-4">
            {course.chapters.map((chapter) => {
              const handleBookmark = async () => {
                "use server";
                await toggleChapterBookmark(
                  chapter.id,
                  course.id,
                  chapter.isBookmarked,
                );
              };

              return (
                <div
                  key={chapter.id}
                  className={`p-6 border rounded-xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 transition-colors ${
                    chapter.isCompleted
                      ? "bg-secondary/20"
                      : "bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Chapter {chapter.order}
                      </span>
                      {chapter.isCompleted && (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-medium">{chapter.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {chapter.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <form action={handleBookmark}>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className={
                          chapter.isBookmarked
                            ? "text-primary hover:text-primary/80"
                            : "text-muted-foreground hover:text-primary"
                        }
                      >
                        {chapter.isBookmarked ? (
                          <BookmarkCheck className="w-6 h-6" />
                        ) : (
                          <Bookmark className="w-6 h-6" />
                        )}
                      </Button>
                    </form>

                    <Link href={`/courses/${course.id}/chapters/${chapter.id}`}>
                      <Button
                        variant={chapter.isCompleted ? "outline" : "default"}
                        className="w-[140px]"
                      >
                        {chapter.isCompleted ? "Review" : "Start Learning"}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDashboard;
