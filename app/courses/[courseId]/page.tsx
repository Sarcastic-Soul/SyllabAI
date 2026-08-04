import { getCourseWithChapters } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Bookmark,
    BookmarkCheck,
    Bot,
    Sparkles,
    PlayCircle,
    Eye,
} from "lucide-react";
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

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-10">
            {/* Course Header (Stays on Top) */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <h1 className="text-4xl font-bold capitalize">
                        {course.topic}
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap">
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
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="px-3 py-1 bg-secondary rounded-full capitalize text-foreground font-medium">
                        {course.difficulty}
                    </span>
                    <span>{totalChapters} Modules</span>
                    <span>•</span>
                    <span>
                        Created{" "}
                        {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                    {/* Show Quiz Stats if they've taken any */}
                    {totalQuizzesTaken > 0 && (
                        <>
                            <span>•</span>
                            <span className="text-primary font-medium">
                                {totalQuizzesTaken} Quizzes Taken (Avg:{" "}
                                {avgQuizScore}%)
                            </span>
                        </>
                    )}
                </div>
                <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-medium text-muted-foreground">
                        Course Progress
                    </span>
                    <span className="text-sm font-bold text-primary">
                        {progressPercentage}% Completed
                    </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5 mt-2">
                    <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>

                {/* NEW: Full-Width Study Buddy Banner Link */}
                <Link
                    href={`/courses/${course.id}/study-buddy`}
                    className="block"
                >
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
                                Have doubts about the curriculum? Start a live,
                                interactive voice session with your personalized
                                AI tutor.
                            </p>
                        </div>
                        <Button
                            size="lg"
                            className="shrink-0 z-10"
                            variant="default"
                        >
                            Start Voice Chat{" "}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </Link>
            </div>

            {/* Layout Split: Chapters on Left */}
            <div className="flex flex-col-reverse lg:flex-row gap-8 items-start">
                {/* Left Side: Chapters List */}
                <div className="flex-1 space-y-6 w-full">
                    <AdaptiveMasteryPanel courseId={course.id} />
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
                                        <h3 className="text-xl font-medium">
                                            {chapter.title}
                                        </h3>
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

                                        <Link
                                            href={`/courses/${course.id}/chapters/${chapter.id}`}
                                        >
                                            <Button
                                                variant={
                                                    chapter.isCompleted
                                                        ? "outline"
                                                        : "default"
                                                }
                                                className="w-[140px]"
                                            >
                                                {chapter.isCompleted ? (
                                                    <>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Review
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlayCircle className="w-4 h-4 mr-2" />
                                                        Start Learning
                                                    </>
                                                )}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Course Cheat Sheet Section */}
            <div className="bg-card border rounded-2xl p-6 md:p-8 space-y-6 mt-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        Course Cheat Sheet
                    </h2>
                    {!course.cheatSheet && (
                        <GenerateWrapper
                            action={generateCheatSheetAction}
                            defaultText="Generate Cheat Sheet"
                            loadingText="Summarizing..."
                            icon={<Sparkles className="w-4 h-4 mr-2" />}
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
                        className="bg-card p-6 md:p-8 rounded-xl border border-border"
                    />
                ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                        <p>No cheat sheet generated yet. Summarize the course content into a quick reference guide!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDashboard;
