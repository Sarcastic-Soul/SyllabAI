import { getPublicChapter, getCourseBySlug } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { getUserId } from "@/lib/auth/session";
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

    const signedOut = !(await getUserId());

    return (
        <main className="mx-auto w-full max-w-[43rem] px-4 pt-6 pb-20 sm:px-6 sm:pt-8">
            {signedOut && (
                <div className="mb-8 flex items-center justify-between gap-4 border-b border-border pb-4">
                    <Link
                        href="/"
                        aria-label="SyllabAI home"
                        className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                        <Image src="/logo.svg" alt="SyllabAI" width={40} height={40} className="size-10" />
                    </Link>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/auth/sign-up">Sign up free</Link>
                    </Button>
                </div>
            )}

            <Link
                href={`/shared/${slug}`}
                className="-ml-2 inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
                <ArrowLeft className="size-4 shrink-0" aria-hidden />
                <span className="truncate capitalize">{course.topic}</span>
            </Link>

            <header className="mt-4 border-b border-border pb-8">
                <p className="font-mono text-xs text-muted-foreground">
                    Chapter {chapter.order} / shared, read only
                </p>
                <h1 className="mt-3 text-3xl leading-tight font-bold text-balance sm:text-4xl">
                    {chapter.title}
                </h1>
                <MarkdownRenderer
                    content={chapter.content || ""}
                    className="mt-4 prose-p:text-muted-foreground md:prose-lg"
                />
            </header>

            <article className="pt-8">
                {chapter.lessonText && chapter.lessonText !== "GENERATING" ? (
                    <MarkdownRenderer content={chapter.lessonText} className="md:prose-lg" />
                ) : (
                    <div className="rounded-xl border border-dashed border-foreground/25 px-6 py-10">
                        <p className="font-medium">This lesson is not written yet.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            The course owner has not generated it. Try another
                            chapter.
                        </p>
                        <Button asChild variant="outline" className="mt-5">
                            <Link href={`/shared/${slug}`}>
                                <ArrowLeft /> All chapters
                            </Link>
                        </Button>
                    </div>
                )}
            </article>

            {chapter.mermaidDiagram && (
                <section className="mt-12 border-t border-border pt-8">
                    <h2 className="text-2xl font-bold">Diagram</h2>
                    <MermaidDiagram code={chapter.mermaidDiagram} />
                </section>
            )}

            {/* Sign-up prompt stands in for the quiz and flashcards */}
            {signedOut && (
                <section className="mt-12 border-t border-border pt-8">
                    <h2 className="text-xl font-semibold">
                        Test yourself on this chapter
                    </h2>
                    <p className="mt-1.5 max-w-[50ch] leading-relaxed text-muted-foreground">
                        Sign up to take the quiz, review flashcards on a spaced
                        schedule and ask the study buddy questions.
                    </p>
                    <Button asChild size="lg" className="mt-5">
                        <Link href="/auth/sign-up">Sign up free</Link>
                    </Button>
                </section>
            )}
        </main>
    );
};

export default SharedChapterPage;
