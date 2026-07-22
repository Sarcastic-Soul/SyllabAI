import { db } from "@/lib/db";
import { courses, chapters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import PrintTrigger from "@/components/course/PrintTrigger";
import MermaidDiagram from "@/components/course/MermaidDiagram";

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
        <div className="max-w-4xl mx-auto p-8 bg-white text-black min-h-screen">
            <PrintTrigger />
            <div className="mb-12 border-b pb-8 text-center">
                <h1 className="text-5xl font-extrabold mb-4 capitalize">
                    {course.topic}
                </h1>
                <p className="text-gray-600 text-xl">
                    Difficulty:{" "}
                    <span className="capitalize font-semibold">
                        {course.difficulty}
                    </span>{" "}
                    | Modules:{" "}
                    <span className="font-semibold">
                        {course.chapters.length}
                    </span>
                </p>
            </div>

            <div className="space-y-16">
                {course.chapters.map((chapter) => (
                    <div key={chapter.id} className="break-inside-avoid">
                        <h2 className="text-3xl font-bold border-b pb-4 mb-6">
                            Chapter {chapter.order}: {chapter.title}
                        </h2>
                        <div className="prose prose-slate prose-lg max-w-none text-black">
                            {chapter.lessonText &&
                            chapter.lessonText !== "GENERATING" ? (
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
                                            const codeStr = String(
                                                children,
                                            ).replace(/\n$/, "");

                                            // Intercept Mermaid blocks
                                            if (
                                                !inline &&
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
                                <p className="italic text-gray-500">
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
