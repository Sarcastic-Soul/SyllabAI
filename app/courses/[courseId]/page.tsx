import { getCourseWithChapters } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    ArrowRight,
    BookmarkSimple,
    ChatCircleDots,
    Check,
} from "@phosphor-icons/react/dist/ssr";
import { toggleChapterBookmark } from "@/lib/actions/chapter.actions";
import { generateCourseCheatSheet } from "@/lib/actions/course.actions";
import DeleteCourseButton from "@/components/course/DeleteCourseButton";
import ExportCourseButtons from "@/components/course/ExportCourseButtons";
import GenerateWrapper from "@/components/course/GenerateWrapper";
import CheatSheetExportButtons from "@/components/course/CheatSheetExportButtons";
import ShareCourseButton from "@/components/course/ShareCourseButton";
import AdaptiveMasteryPanel from "@/components/course/AdaptiveMasteryPanel";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

interface CoursePageProps {
    params: Promise<{
        courseId: string;
    }>;
}

const CourseDashboard = async ({ params }: CoursePageProps) => {
    const { courseId } = await params;

    const course = await getCourseWithChapters(courseId);

    if (!course) notFound();

    const totalChapters = course.chapters.length;
    const completedChapters = course.chapters.filter(
        (c) => c.isCompleted,
    ).length;
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

    const generateCheatSheetAction = async () => {
        "use server";
        await generateCourseCheatSheet(course.id);
    };

    const formattedCheatSheet = course.cheatSheet
        ? course.cheatSheet.replace(/\\n/g, "\n")
        : null;

    // Only the next chapter to study gets the accent button
    const nextChapterId = course.chapters.find((c) => !c.isCompleted)?.id;

    return (
        <main className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
            <header className="space-y-5">
                <Link
                    href="/dashboard"
                    className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                    <ArrowLeft className="size-4" aria-hidden />
                    Courses
                </Link>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                        <h1 className="text-3xl font-bold capitalize text-balance break-words sm:text-4xl">
                            {course.topic}
                        </h1>
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
                            <span className="capitalize text-foreground">
                                {course.difficulty}
                            </span>
                            <span aria-hidden>/</span>
                            <span>
                                {totalChapters} {totalChapters === 1 ? "chapter" : "chapters"}
                            </span>
                            <span aria-hidden>/</span>
                            <span>
                                Created{" "}
                                {new Date(course.createdAt).toLocaleDateString()}
                            </span>
                            {totalQuizzesTaken > 0 && (
                                <>
                                    <span aria-hidden>/</span>
                                    <span>
                                        {totalQuizzesTaken} {totalQuizzesTaken === 1 ? "quiz" : "quizzes"}, {avgQuizScore}% average
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ShareCourseButton
                            courseId={course.id}
                            isPublic={course.isPublic}
                            shareSlug={course.shareSlug}
                        />
                        <ExportCourseButtons
                            course={course}
                            chapters={course.chapters}
                        />
                        <DeleteCourseButton courseId={course.id} />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">
                            {completedChapters} of {totalChapters} chapters done
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                            {progressPercentage}%
                        </span>
                    </div>
                    <div
                        className="h-2 w-full overflow-hidden rounded-full bg-foreground/10"
                        role="progressbar"
                        aria-valuenow={progressPercentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Course progress"
                    >
                        <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </header>

            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
                {/* Chapters */}
                <section aria-labelledby="chapters-heading" className="min-w-0">
                    <h2 id="chapters-heading" className="text-xl font-semibold">
                        Chapters
                    </h2>

                    {totalChapters === 0 ? (
                        <p className="mt-4 rounded-xl border border-dashed border-foreground/25 px-6 py-10 text-muted-foreground">
                            This course has no chapters. Delete it and generate
                            it again from the new course page.
                        </p>
                    ) : (
                        <ol className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
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
                                    <li
                                        key={chapter.id}
                                        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
                                    >
                                        <div className="flex min-w-0 flex-1 gap-4">
                                            <span
                                                aria-hidden
                                                className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs tabular-nums ${
                                                    chapter.isCompleted
                                                        ? "border-success bg-success text-primary-foreground"
                                                        : "border-foreground/25 text-muted-foreground"
                                                }`}
                                            >
                                                {chapter.isCompleted ? (
                                                    <Check weight="bold" className="size-3.5" />
                                                ) : (
                                                    chapter.order
                                                )}
                                            </span>
                                            <div className="min-w-0 space-y-1">
                                                <h3 className="text-base leading-snug font-semibold sm:text-lg">
                                                    <span className="sr-only">
                                                        Chapter {chapter.order}
                                                        {chapter.isCompleted ? ", completed" : ""}:{" "}
                                                    </span>
                                                    {chapter.title}
                                                </h3>
                                                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                                    {chapter.content}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
                                            <form action={handleBookmark}>
                                                <Button
                                                    type="submit"
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={
                                                        chapter.isBookmarked
                                                            ? `Remove bookmark from ${chapter.title}`
                                                            : `Bookmark ${chapter.title}`
                                                    }
                                                    aria-pressed={chapter.isBookmarked}
                                                    className={
                                                        chapter.isBookmarked
                                                            ? "text-primary"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    }
                                                >
                                                    <BookmarkSimple
                                                        weight={chapter.isBookmarked ? "fill" : "regular"}
                                                        className="size-5"
                                                    />
                                                </Button>
                                            </form>

                                            <Button
                                                asChild
                                                variant={
                                                    chapter.id === nextChapterId
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className="w-28"
                                            >
                                                <Link
                                                    href={`/courses/${course.id}/chapters/${chapter.id}`}
                                                >
                                                    {chapter.isCompleted
                                                        ? "Review"
                                                        : chapter.id === nextChapterId
                                                          ? "Start"
                                                          : "Open"}
                                                </Link>
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </section>

                {/* Side column: mastery and study buddy */}
                <aside className="space-y-5">
                    <AdaptiveMasteryPanel courseId={course.id} />

                    <div className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-center gap-2">
                            <ChatCircleDots className="size-5 text-primary" aria-hidden />
                            <h3 className="text-sm font-semibold">Study buddy</h3>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Stuck on something? Ask about this course by typing
                            or by voice. Answers can be read aloud.
                        </p>
                        <Button asChild variant="outline" className="mt-4 w-full">
                            <Link href={`/courses/${course.id}/study-buddy`}>
                                Open study buddy <ArrowRight />
                            </Link>
                        </Button>
                    </div>
                </aside>
            </div>

            {/* Cheat sheet */}
            <section
                aria-labelledby="cheat-sheet-heading"
                className="space-y-5 border-t border-border pt-8"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 id="cheat-sheet-heading" className="text-xl font-semibold">
                            Cheat sheet
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            A short summary of the whole course to revise from.
                        </p>
                    </div>
                    {!course.cheatSheet && (
                        <GenerateWrapper
                            action={generateCheatSheetAction}
                            defaultText="Generate cheat sheet"
                            loadingText="Summarizing..."
                        />
                    )}
                    {course.cheatSheet && (
                        <CheatSheetExportButtons content={course.cheatSheet} courseTopic={course.topic} />
                    )}
                </div>

                {formattedCheatSheet ? (
                    <MarkdownRenderer
                        content={formattedCheatSheet}
                        id="cheat-sheet-content"
                        className="rounded-xl border border-border bg-card p-5 sm:p-8"
                    />
                ) : (
                    <p className="rounded-xl border border-dashed border-foreground/25 px-6 py-8 text-sm text-muted-foreground">
                        No cheat sheet yet. Generate one after you have read a
                        few chapters, then save it as Markdown or PDF.
                    </p>
                )}
            </section>
        </main>
    );
};

export default CourseDashboard;
