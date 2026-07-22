import { getCourseBySlug } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, PlayCircle, Lock } from "lucide-react";
import { SignUpButton } from "@clerk/nextjs";

interface SharedCoursePageProps {
    params: Promise<{
        slug: string;
    }>;
}

const SharedCoursePage = async ({ params }: SharedCoursePageProps) => {
    const { slug } = await params;
    const course = await getCourseBySlug(slug);

    if (!course || !course.isPublic) notFound();

    const totalChapters = course.chapters.length;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-10">
            {/* Public Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <BookOpen className="w-4 h-4" />
                Shared Course
            </div>

            {/* Course Header */}
            <div className="space-y-4">
                <h1 className="text-4xl font-bold capitalize">{course.topic}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="px-3 py-1 bg-secondary rounded-full capitalize text-foreground font-medium">
                        {course.difficulty}
                    </span>
                    <span>{totalChapters} Modules</span>
                    <span>•</span>
                    <span>
                        Created {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {/* Sign Up CTA */}
            <div className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Lock className="w-5 h-5" /> Want the full experience?
                    </h3>
                    <p className="text-muted-foreground">
                        Sign up to take quizzes, generate flashcards, track your progress, and chat with the AI Study Buddy.
                    </p>
                </div>
                <SignUpButton>
                    <Button size="lg" className="shrink-0">
                        Sign Up Free
                    </Button>
                </SignUpButton>
            </div>

            {/* Course Content (Read-Only) */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Course Content</h2>
                <div className="grid gap-4">
                    {course.chapters.map((chapter) => (
                        <Link
                            key={chapter.id}
                            href={`/shared/${slug}/chapters/${chapter.id}`}
                        >
                            <div className="p-6 border rounded-xl bg-card hover:border-primary/50 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Chapter {chapter.order}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-medium">
                                        {chapter.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {chapter.content}
                                    </p>
                                </div>
                                <Button variant="outline" className="shrink-0 w-[140px]">
                                    <PlayCircle className="w-4 h-4 mr-2" /> Read
                                </Button>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center py-12 border-t space-y-4">
                <h3 className="text-2xl font-bold">Ready to learn interactively?</h3>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    Create your own AI-generated courses, take quizzes, and study with a voice-enabled AI tutor.
                </p>
                <SignUpButton>
                    <Button size="lg" className="rounded-full px-8">
                        Get Started — It&apos;s Free
                    </Button>
                </SignUpButton>
            </div>
        </div>
    );
};

export default SharedCoursePage;
