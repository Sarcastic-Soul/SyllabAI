import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ReactMarkdown, { type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import PrintTrigger from "@/components/course/PrintTrigger";
import MermaidDiagram from "@/components/course/MermaidDiagram";

// react-markdown passes the AST node as a prop. It must not reach the DOM.
function withoutNode<T extends ExtraProps>(props: T): Omit<T, "node"> {
    const rest = { ...props };
    delete rest.node;
    return rest;
}

interface PrintPageProps {
    params: Promise<{
        courseId: string;
    }>;
}

const PrintCoursePage = async ({ params }: PrintPageProps) => {
    const { courseId } = await params;

    const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        with: {
            chapters: {
                orderBy: (chapters, { asc }) => [asc(chapters.order)],
            },
        },
    });

    if (!course) notFound();

    return (
        <div className="mx-auto min-h-screen max-w-4xl bg-background p-8 text-foreground print:max-w-none print:p-0">
            <PrintTrigger />
            <div className="mb-12 border-b border-foreground/30 pb-8">
                <h1 className="mb-4 text-4xl font-bold capitalize text-balance sm:text-5xl">
                    {course.topic}
                </h1>
                <p className="text-lg text-muted-foreground print:text-foreground">
                    Difficulty:{" "}
                    <span className="capitalize font-semibold">
                        {course.difficulty}
                    </span>{" "}
                    / Chapters:{" "}
                    <span className="font-semibold">
                        {course.chapters.length}
                    </span>
                </p>
            </div>

            <div className="space-y-16">
                {course.chapters.map((chapter) => (
                    <div key={chapter.id} className="break-inside-avoid">
                        <h2 className="mb-6 border-b border-foreground/30 pb-4 text-3xl font-bold">
                            Chapter {chapter.order}: {chapter.title}
                        </h2>
                        <div className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:font-mono prose-pre:border prose-pre:border-border prose-pre:bg-muted prose-pre:font-mono prose-pre:text-foreground">
                            {chapter.lessonText &&
                            chapter.lessonText !== "GENERATING" ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        code({
                                            className,
                                            children,
                                            ...rest
                                        }) {
                                            const props = withoutNode(rest);
                                            const match = /language-(\w+)/.exec(
                                                className || "",
                                            );
                                            const codeStr = String(
                                                children,
                                            ).replace(/\n$/, "");

                                            // Intercept Mermaid blocks
                                            if (
                                                match &&
                                                match[1] === "mermaid"
                                            ) {
                                                return (
                                                    <MermaidDiagram
                                                        code={codeStr}
                                                    />
                                                );
                                            }

                                            // Standard code blocks
                                            return (
                                                <code
                                                    className={className}
                                                    {...props}
                                                >
                                                    {children}
                                                </code>
                                            );
                                        },
                                    }}
                                >
                                    {chapter.lessonText}
                                </ReactMarkdown>
                            ) : (
                                <p className="italic text-muted-foreground">
                                    This chapter has not been generated yet.
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrintCoursePage;
