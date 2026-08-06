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
import { SubmitButton } from "@/components/shared/SubmitButton";
import GeneratingLesson from "@/components/course/GeneratingLesson";
import { BookOpen, HelpCircle, CheckCircle, Sparkles } from "lucide-react";
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
                <MarkdownRenderer content={chapter.content || ""} className="text-lg leading-relaxed" />
            </div>

            <div className="min-h-[300px]">
                {chapter.lessonText === "GENERATING" ? (
                    <GeneratingLesson />
                ) : chapter.lessonText ? (
                    <MarkdownRenderer content={chapter.lessonText} />
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 border rounded-2xl bg-muted/30">
                        <h2 className="text-2xl font-semibold">
                            Ready to Learn?
                        </h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            Generate the comprehensive lesson content for "
                            {chapter.title}".
                        </p>
                        <GenerateWrapper
                            action={generateLessonAction}
                            defaultText="Generate Lesson"
                            loadingText="Writing Content..."
                            icon={<BookOpen className="w-5 h-5 mr-2" />}
                        />
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
                            <GenerateWrapper
                                action={generateQuizAction}
                                defaultText="Generate Quiz"
                                loadingText="Creating Questions..."
                                icon={<HelpCircle className="w-5 h-5 mr-2" />}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Mermaid Diagram Section */}
            {chapter.lessonText && chapter.lessonText !== "GENERATING" && (
                <div className="pt-12 border-t">
                    <h2 className="text-2xl font-bold mb-4">Visual Concept</h2>
                    {chapter.mermaidDiagram ? (
                        <MermaidDiagram code={chapter.mermaidDiagram} regenerateAction={generateMermaidAction} />
                    ) : (
                        <div className="mt-4 p-6 bg-secondary/20 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <p className="text-muted-foreground">
                                Generate a visual diagram for this lesson.
                            </p>
                            <GenerateWrapper
                                action={generateMermaidAction}
                                defaultText="Generate Diagram"
                                loadingText="Drawing..."
                                icon={<Sparkles className="w-5 h-5 mr-2" />}
                            />
                        </div>
                    )}
                </div>
            )}

            {chapter.lessonText && chapter.lessonText !== "GENERATING" && (
                <div className="pt-12 border-t">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Flashcards</h2>
                        {chapter.flashcards && chapter.flashcards.length > 0 && (
                            <GenerateWrapper
                                action={generateFlashcardsAction}
                                defaultText="Generate More"
                                loadingText="Creating Cards..."
                                icon={<BookOpen className="w-4 h-4 mr-2" />}
                            />
                        )}
                    </div>
                    {chapter.flashcards && chapter.flashcards.length > 0 ? (
                        <FlashcardReview
                            flashcards={chapter.flashcards}
                            chapterId={chapter.id}
                        />
                    ) : (
                        <div className="mt-4 p-6 bg-secondary/20 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <p className="text-muted-foreground">
                                Generate flashcards to study key terms.
                            </p>
                            <GenerateWrapper
                                action={generateFlashcardsAction}
                                defaultText="Generate Flashcards"
                                loadingText="Creating Cards..."
                                icon={<BookOpen className="w-5 h-5 mr-2" />}
                            />
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
