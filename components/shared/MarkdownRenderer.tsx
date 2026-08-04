"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import MermaidDiagram from "@/components/course/MermaidDiagram";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  id?: string;
}

export default function MarkdownRenderer({
  content,
  className,
  id,
}: MarkdownRendererProps) {
  if (!content) return null;

  // Sanitize literal escaped newlines
  const formattedContent = content.replace(/\\n/g, "\n");

  return (
    <div
      id={id}
      className={cn(
        "prose dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-h2:text-2xl prose-h2:font-bold prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mt-6 prose-h3:text-xl prose-h3:font-semibold prose-h3:text-primary prose-p:text-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-li:text-foreground prose-li:my-1 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-border prose-th:p-2.5 prose-th:bg-muted prose-th:text-foreground prose-td:border prose-td:border-border prose-td:p-2.5 prose-td:text-foreground",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          pre({ children }: any) {
            return <>{children}</>;
          },
          code({ node, className: codeClassName, children, ...props }: any) {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const codeStr = String(children).replace(/\n$/, "");

            if (match && match[1] === "mermaid") {
              return <MermaidDiagram code={codeStr} />;
            }

            // In react-markdown v10, true inline spans do not contain newlines nor language classes
            const isInline = !codeClassName && !codeStr.includes("\n");

            if (isInline) {
              return (
                <code
                  className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono border border-border before:content-none after:content-none"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre className="p-4 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto border border-zinc-800 my-4 shadow-sm">
                <code
                  className="bg-transparent p-0 text-zinc-100 font-mono text-xs before:content-none after:content-none"
                  {...props}
                >
                  {children}
                </code>
              </pre>
            );
          },
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
}
