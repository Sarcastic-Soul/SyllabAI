import { getCourseBySlug } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getUserId } from "@/lib/auth/session";
import { Metadata } from "next";

interface SharedCoursePageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: SharedCoursePageProps): Promise<Metadata> {
    const { slug } = await params;
    const course = await getCourseBySlug(slug);

    if (!course || !course.isPublic) {
        return {
            title: "Course not found | SyllabAI",
        };
    }

    const title = `${course.topic} (${course.difficulty}) | SyllabAI`;
    const description = `Read "${course.topic}" on SyllabAI: ${course.chapters.length} chapters at ${course.difficulty} level, with quizzes and flashcards when you sign up.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            siteName: "SyllabAI",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

const SharedCoursePage = async ({ params }: SharedCoursePageProps) => {
    const { slug } = await params;
    const course = await getCourseBySlug(slug);

    if (!course || !course.isPublic) notFound();

    const totalChapters = course.chapters.length;

    const signedOut = !(await getUserId());

    return (
        <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
            {signedOut && (
                <div className="mb-8 flex items-center justify-between gap-4 border-b border-border pb-4">
                    <Link
                        href="/"
                        aria-label="SyllabAI home"
                        className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                        <Image src="/logo.svg" alt="SyllabAI" width={80} height={50} style={{ width: "auto" }} />
                    </Link>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/auth/sign-up">Sign up free</Link>
                    </Button>
                </div>
            )}

            <header className="space-y-3">
                <p className="font-mono text-xs text-muted-foreground">
                    Shared course, read only
                </p>
                <h1 className="text-3xl font-bold capitalize text-balance break-words sm:text-4xl">
                    {course.topic}
                </h1>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
                    <span className="capitalize text-foreground">{course.difficulty}</span>
                    <span aria-hidden>/</span>
                    <span>
                        {totalChapters} {totalChapters === 1 ? "chapter" : "chapters"}
                    </span>
                    <span aria-hidden>/</span>
                    <span>
                        Created {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                </p>
            </header>

            <section aria-labelledby="shared-chapters" className="mt-10">
                <h2 id="shared-chapters" className="text-xl font-semibold">
                    Chapters
                </h2>
                {totalChapters === 0 ? (
                    <p className="mt-4 rounded-xl border border-dashed border-foreground/25 px-6 py-10 text-muted-foreground">
                        This course has no chapters yet.
                    </p>
                ) : (
                    <ol className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                        {course.chapters.map((chapter) => (
                            <li key={chapter.id}>
                                <Link
                                    href={`/shared/${slug}/chapters/${chapter.id}`}
                                    className="group flex items-start gap-4 p-4 transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:p-5"
                                >
                                    <span
                                        aria-hidden
                                        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-foreground/25 font-mono text-xs tabular-nums text-muted-foreground"
                                    >
                                        {chapter.order}
                                    </span>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <h3 className="text-base leading-snug font-semibold sm:text-lg">
                                            <span className="sr-only">Chapter {chapter.order}: </span>
                                            {chapter.title}
                                        </h3>
                                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                            {chapter.content}
                                        </p>
                                    </div>
                                    <ArrowRight
                                        className="mt-1.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
                                        aria-hidden
                                    />
                                </Link>
                            </li>
                        ))}
                    </ol>
                )}
            </section>

            {signedOut && (
                <section className="mt-12 flex flex-col gap-5 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-[50ch]">
                        <h2 className="text-xl font-semibold">
                            Study this course properly
                        </h2>
                        <p className="mt-1.5 leading-relaxed text-muted-foreground">
                            With a free account you can take the quizzes, review
                            flashcards, track your progress and make courses of
                            your own.
                        </p>
                    </div>
                    <Button asChild size="lg" className="shrink-0">
                        <Link href="/auth/sign-up">Sign up free</Link>
                    </Button>
                </section>
            )}
        </main>
    );
};

export default SharedCoursePage;
