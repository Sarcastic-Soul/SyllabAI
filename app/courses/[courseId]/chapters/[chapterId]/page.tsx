import { db } from "@/lib/db";
import { chapters, courses } from "@/lib/db/schema";
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
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

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
        <p className="text-lg text-muted-foreground">{chapter.content}</p>
      </div>

      <div className="min-h-[300px]">
        {chapter.lessonText ? (
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {chapter.lessonText}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="mt-8 p-12 bg-secondary/30 border border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="text-xl font-semibold">Ready to learn?</h3>
            <p className="text-muted-foreground max-w-md">
              Click below to let our AI generate a comprehensive, personalized
              lesson for this topic.
            </p>
            <form action={generateLessonAction} className="mt-4">
              <SubmitButton
                defaultText="Generate AI Lesson"
                loadingText="Writing Lesson..."
              />
            </form>
          </div>
        )}
      </div>
      
      {chapter.lessonText && (
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
                />
              </form>
            </div>
          )}
        </div>
      )}

      <div className="pt-6 border-t flex justify-end">
        {chapter.lessonText &&
          (!chapter.isCompleted ? (
            <form action={completeAction}>
              <Button type="submit" size="lg">
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
