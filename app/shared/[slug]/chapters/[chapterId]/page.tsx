import { getPublicChapter, getCourseBySlug } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { SignUpButton } from "@clerk/nextjs";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import MermaidDiagram from "@/components/course/MermaidDiagram";

interface SharedChapterPageProps {
    params: Promise<{
        slug: string;
        chapterId: string;
    }>;
}

const SharedChapterPage = async ({ params }: SharedChapterPageProps) => {
    const { slug, chapterId } = await params;

    // Verify the course is public
    const course = await getCourseBySlug(slug);
    if (!course || !course.isPublic) notFound();

    const chapter = await getPublicChapter(chapterId);

    // Verify this chapter belongs to the shared course
    if (!chapter || chapter.courseId !== course.id) notFound();

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <Link
                href={`/shared/${slug}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
                ← Back to {course.topic}
            </Link>

            <div className="space-y-4 border-b pb-6">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                        Chapter {chapter.order}
                    </span>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        Public Preview
                    </span>
                </div>
                <h1 className="text-4xl font-bold">{chapter.title}</h1>
                <MarkdownRenderer content={chapter.content || ""} className="text-lg leading-relaxed" />
            </div>

            {/* Lesson Content (Read-Only) */}
            {chapter.lessonText && chapter.lessonText !== "GENERATING" ? (
                <MarkdownRenderer content={chapter.lessonText} />
            ) : (
                <div className="py-12 text-center text-muted-foreground bg-secondary/10 rounded-xl border border-dashed">
                    <p>Lesson content hasn&apos;t been generated for this chapter yet.</p>
                </div>
            )}

            {/* Mermaid Diagram (Read-Only) */}
            {chapter.mermaidDiagram && (
                <div className="pt-8 border-t">
                    <h2 className="text-2xl font-bold mb-4">Visual Concept</h2>
                    <div className="p-4 bg-card border rounded-xl overflow-auto">
                        <MermaidDiagram code={chapter.mermaidDiagram} />
                    </div>
                </div>
            )}

            {/* Sign Up CTA (replaces quizzes/flashcards) */}
            <div className="pt-8 border-t">
                <div className="p-8 rounded-2xl border-2 border-primary/20 bg-primary/5 text-center space-y-4">
                    <Lock className="w-8 h-8 mx-auto text-primary" />
                    <h3 className="text-xl font-bold">
                        Quizzes, Flashcards & AI Tutor
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Sign up to take interactive quizzes, review with spaced repetition flashcards, and chat with the AI Study Buddy.
                    </p>
                    <SignUpButton>
                        <Button size="lg" className="rounded-full px-8">
                            Sign Up to Unlock
                        </Button>
                    </SignUpButton>
                </div>
            </div>
        </div>
    );
};

export default SharedChapterPage;
