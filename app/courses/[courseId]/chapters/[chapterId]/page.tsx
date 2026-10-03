import { getChapterWithDetails } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    markChapterComplete,
    generateChapterLesson,
    generateChapterMermaid,
    generateChapterFlashcards,
} from "@/lib/actions/chapter.actions";
import QuizComponent from "@/components/course/QuizComponent";
import { generateChapterQuiz } from "@/lib/actions/quiz.actions";
import GeneratingLesson from "@/components/course/GeneratingLesson";
import { ArrowLeft, Check, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import GenerateWrapper from "@/components/course/GenerateWrapper";
import FlashcardReview from "@/components/course/FlashcardReview";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import MermaidDiagram from "@/components/course/MermaidDiagram";

interface ChapterPageProps {
    params: Promise<{
        courseId: string;
        chapterId: string;
    }>;
}

const ChapterPage = async ({ params }: ChapterPageProps) => {
    const { courseId, chapterId } = await params;

    const chapter = await getChapterWithDetails(chapterId);

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

    const generateMermaidAction = async () => {
        "use server";
        await generateChapterMermaid(chapter.id, chapter.course.topic, chapter.title);
    };

    const generateFlashcardsAction = async () => {
        "use server";
        await generateChapterFlashcards(chapter.id);
    };
    const quiz = chapter?.quizzes[0];

    const hasLesson = !!chapter.lessonText && chapter.lessonText !== "GENERATING";
    const emptyRow =
        "mt-4 flex flex-col gap-4 rounded-xl border border-dashed border-foreground/25 p-5 sm:flex-row sm:items-center sm:justify-between";

    return (
        // Narrow column: about 70 characters per line for the lesson text
        <main className="mx-auto w-full max-w-[43rem] px-4 pt-6 pb-20 sm:px-6 sm:pt-8">
            <Link
                href={`/courses/${chapter.courseId}`}
                className="-ml-2 inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
                <ArrowLeft className="size-4 shrink-0" aria-hidden />
                <span className="truncate capitalize">{chapter.course.topic}</span>
            </Link>

            <header className="mt-4 border-b border-border pb-8">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                    <span>Chapter {chapter.order}</span>
                    {chapter.isCompleted && (
                        <span className="flex items-center gap-1 text-foreground">
                            <Check weight="bold" className="size-3.5 text-success" aria-hidden />
                            Completed
                        </span>
                    )}
                </p>
                <h1 className="mt-3 text-3xl leading-tight font-bold text-balance sm:text-4xl">
                    {chapter.title}
                </h1>
                <MarkdownRenderer
                    content={chapter.content || ""}
                    className="mt-4 prose-p:text-muted-foreground md:prose-lg"
                />
            </header>

            <article className="min-h-[300px] pt-8">
                {chapter.lessonText === "GENERATING" ? (
                    <GeneratingLesson />
                ) : chapter.lessonText ? (
                    <MarkdownRenderer content={chapter.lessonText} className="md:prose-lg" />
                ) : (
                    <div className="rounded-xl border border-dashed border-foreground/25 px-6 py-10">
                        <h2 className="text-xl font-semibold">
                            This lesson is not written yet
                        </h2>
                        <p className="mt-2 mb-5 max-w-[50ch] leading-relaxed text-muted-foreground">
                            Generate the full lesson for this chapter. It takes
                            under a minute, then you can add a quiz, a diagram
                            and flashcards.
                        </p>
                        <div className="flex">
                            <GenerateWrapper
                                action={generateLessonAction}
                                defaultText="Generate lesson"
                                loadingText="Writing lesson..."
                            />
                        </div>
                    </div>
                )}
            </article>

            {hasLesson && (
                <section className="mt-14 border-t border-border pt-8">
                    <h2 className="text-2xl font-bold">Quiz</h2>
                    {quiz ? (
                        <QuizComponent
                            quizId={quiz.id}
                            chapterId={chapter.id}
                            courseId={chapter.courseId}
                            questions={quiz.questions.map((q) => ({
                                ...q,
                                options: q.options as string[],
                            }))}
                            existingScore={quiz.score}
                        />
                    ) : (
                        <div className={emptyRow}>
                            <p className="text-muted-foreground">
                                No quiz yet. Get a few questions on this lesson
                                to check what stuck.
                            </p>
                            <GenerateWrapper
                                action={generateQuizAction}
                                defaultText="Generate quiz"
                                loadingText="Writing questions..."
                            />
                        </div>
                    )}
                </section>
            )}

            {hasLesson && (
                <section className="mt-12 border-t border-border pt-8">
                    <h2 className="text-2xl font-bold">Diagram</h2>
                    {chapter.mermaidDiagram ? (
                        <MermaidDiagram code={chapter.mermaidDiagram} regenerateAction={generateMermaidAction} />
                    ) : (
                        <div className={emptyRow}>
                            <p className="text-muted-foreground">
                                No diagram yet. Draw the main idea of this
                                lesson as a chart.
                            </p>
                            <GenerateWrapper
                                action={generateMermaidAction}
                                defaultText="Generate diagram"
                                loadingText="Drawing..."
                            />
                        </div>
                    )}
                </section>
            )}

            {hasLesson && (
                <section className="mt-12 border-t border-border pt-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <h2 className="text-2xl font-bold">Flashcards</h2>
                        {chapter.flashcards && chapter.flashcards.length > 0 && (
                            <GenerateWrapper
                                action={generateFlashcardsAction}
                                defaultText="Add more cards"
                                loadingText="Making cards..."
                            />
                        )}
                    </div>
                    {chapter.flashcards && chapter.flashcards.length > 0 ? (
                        <FlashcardReview
                            flashcards={chapter.flashcards}
                            chapterId={chapter.id}
                        />
                    ) : (
                        <div className={emptyRow}>
                            <p className="text-muted-foreground">
                                No flashcards yet. Make a set of key terms from
                                this lesson and review them over time.
                            </p>
                            <GenerateWrapper
                                action={generateFlashcardsAction}
                                defaultText="Generate flashcards"
                                loadingText="Making cards..."
                            />
                        </div>
                    )}
                </section>
            )}

            {hasLesson && (
                <div className="mt-12 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <Button asChild variant="ghost" size="lg">
                        <Link href={`/courses/${chapter.courseId}`}>
                            <ArrowLeft /> All chapters
                        </Link>
                    </Button>
                    {!chapter.isCompleted ? (
                        <form action={completeAction}>
                            <Button type="submit" size="lg" className="w-full sm:w-auto">
                                <CheckCircle />
                                Mark as complete
                            </Button>
                        </form>
                    ) : (
                        <Button variant="outline" size="lg" disabled>
                            <Check weight="bold" />
                            Chapter completed
                        </Button>
                    )}
                </div>
            )}
        </main>
    );
};

export default ChapterPage;
