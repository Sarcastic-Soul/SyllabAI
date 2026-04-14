import { db } from "@/lib/db";
import { chapters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    markChapterComplete,
    generateChapterLesson,
} from "@/lib/actions/chapter.actions";
import QuizComponent from "@/components/QuizComponent";
import { generateChapterQuiz } from "@/lib/actions/quiz.actions";
import { SubmitButton } from "@/components/SubmitButton";
import ReactMarkdown from "react-markdown";
import MermaidDiagram from "@/components/MermaidDiagram";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Spinner } from "@/components/ui/spinner";
import { BookOpen, HelpCircle, CheckCircle } from "lucide-react";

interface ChapterPageProps {
    params: Promise<{
        courseId: string;
        chapterId: string;
    }>;
}

const ChapterPage = async ({ params }: ChapterPageProps) => {
    const { courseId, chapterId } = await params;

    const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, chapterId),
        with: {
            course: true,
            quizzes: {
                with: {
                    questions: true,
                },
            },
        },
    });

    if (!chapter || chapter.courseId !== courseId) {
        notFound();
    }

    const completeAction = async () => {
        "use server";
        await markChapterComplete(chapter.id, chapter.courseId);
    };

    const generateLessonAction = async () => {
        "use server";
        await generateChapterLesson(
            chapter.id,
            chapter.course.topic,
            chapter.title,
        );
    };

    const generateQuizAction = async () => {
        "use server";
        if (chapter.lessonText) {
            await generateChapterQuiz(
                chapter.id,
                chapter.lessonText,
                chapter.courseId,
            );
        }
    };
    const quiz = chapter?.quizzes[0];

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <Link
                href={`/courses/${chapter.courseId}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
                ← Back to {chapter.course.topic}
            </Link>

            <div className="space-y-4 border-b pb-6">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                        Chapter {chapter.order}
                    </span>
                    {chapter.isCompleted && (
                        <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">
                            Completed
                        </span>
                    )}
                </div>
                <h1 className="text-4xl font-bold">{chapter.title}</h1>
                <div className="text-lg text-muted-foreground">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                    >
                        {chapter.content}
                    </ReactMarkdown>
                </div>
            </div>

            <div className="min-h-[300px]">
                {chapter.lessonText === "GENERATING" ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 border rounded-2xl bg-muted/30">
                        <Spinner className="w-8 h-8" />
                        <h2 className="text-2xl font-semibold animate-pulse">
                            Generating Lesson...
                        </h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            Please wait while our AI builds a comprehensive
                            curriculum for this chapter. This may take a few
                            moments.
                        </p>
                    </div>
                ) : chapter.lessonText ? (
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                code({
                                    node,
                                    inline,
                                    className,
                                    children,
                                    ...props
                                }: any) {
                                    const match = /language-(\w+)/.exec(
                                        className || "",
                                    );
                                    const codeStr = String(children).replace(
                                        /\n$/,
                                        "",
                                    );

                                    // Intercept Mermaid blocks
                                    if (
                                        !inline &&
                                        match &&
                                        match[1] === "mermaid"
                                    ) {
                                        return (
                                            <MermaidDiagram code={codeStr} />
                                        );
                                    }

                                    // Standard code blocks
                                    return (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                        >
                            {chapter.lessonText}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 border rounded-2xl bg-muted/30">
                        <h2 className="text-2xl font-semibold">
                            Ready to Learn?
                        </h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            Generate the comprehensive lesson content for "
                            {chapter.title}".
                        </p>
                        <form action={generateLessonAction}>
                            <SubmitButton
                                defaultText="Generate Lesson"
                                loadingText="Writing Content..."
                                icon={<BookOpen className="w-5 h-5 mr-2" />}
                            />
                        </form>
                    </div>
                )}
            </div>

            {chapter.lessonText && chapter.lessonText !== "GENERATING" && (
                <div className="pt-12 border-t">
                    <h2 className="text-2xl font-bold">Knowledge Check</h2>
                    {quiz ? (
                        <QuizComponent
                            quizId={quiz.id}
                            chapterId={chapter.id}
                            courseId={chapter.courseId}
                            questions={quiz.questions as any}
                            existingScore={quiz.score}
                        />
                    ) : (
                        <div className="mt-4 p-6 bg-secondary/20 border rounded-xl flex items-center justify-between">
                            <p className="text-muted-foreground">
                                Test your understanding of this lesson.
                            </p>
                            <form action={generateQuizAction}>
                                <SubmitButton
                                    defaultText="Generate Quiz"
                                    loadingText="Creating Questions..."
                                    icon={
                                        <HelpCircle className="w-5 h-5 mr-2" />
                                    }
                                />
                            </form>
                        </div>
                    )}
                </div>
            )}

            <div className="pt-6 border-t flex justify-end">
                {chapter.lessonText &&
                    chapter.lessonText !== "GENERATING" &&
                    (!chapter.isCompleted ? (
                        <form action={completeAction}>
                            <Button type="submit" size="lg">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Mark as Complete
                            </Button>
                        </form>
                    ) : (
                        <Button variant="outline" size="lg" disabled>
                            ✓ Chapter Completed
                        </Button>
                    ))}
            </div>
        </div>
    );
};

export default ChapterPage;
