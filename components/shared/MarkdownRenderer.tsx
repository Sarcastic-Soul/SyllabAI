"use client";

import ReactMarkdown, { type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import MermaidDiagram from "@/components/course/MermaidDiagram";
import { cn } from "@/lib/utils";

// react-markdown passes the AST node as a prop. It must not reach the DOM.
function withoutNode<T extends ExtraProps>(props: T): Omit<T, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

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
        "prose max-w-none break-words text-foreground",
        // Headings: display font comes from the global h1-h4 rule
        "prose-headings:text-foreground prose-headings:text-balance prose-headings:scroll-mt-20",
        "prose-h1:text-3xl prose-h1:font-bold prose-h1:mt-0 prose-h1:mb-4",
        "prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-3",
        "prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-2",
        "prose-h4:text-base prose-h4:font-semibold prose-h4:mt-6 prose-h4:mb-1.5",
        // Body
        "prose-p:text-foreground prose-p:leading-[1.7] prose-p:text-pretty",
        "prose-strong:font-semibold prose-strong:text-foreground",
        "prose-a:font-medium prose-a:text-foreground prose-a:decoration-primary prose-a:decoration-2 prose-a:underline-offset-4",
        "prose-li:my-1 prose-li:text-foreground prose-li:marker:text-muted-foreground",
        "prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-foreground",
        "prose-hr:my-8 prose-hr:border-border",
        "prose-img:rounded-lg",
        // Tables: tabular numbers, hairline rules
        "prose-table:my-0 prose-table:w-full prose-table:text-sm prose-table:tabular-nums",
        "prose-th:border-b prose-th:border-foreground/25 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground",
        "prose-td:border-b prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:text-foreground",
        // Long formulas scroll inside themselves instead of widening the page
        "[&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          table({ children, ...rest }) {
            const props = withoutNode(rest);
            // Wide tables scroll inside this box so the page never scrolls sideways
            return (
              <div className="my-6 w-full overflow-x-auto rounded-lg border border-border">
                <table {...props}>{children}</table>
              </div>
            );
          },
          code({ className: codeClassName, children, ...rest }) {
            const props = withoutNode(rest);
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
                  className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.875em] font-normal text-foreground before:content-none after:content-none"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre className="my-6 overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-[0.8125rem] leading-relaxed text-foreground">
                <code
                  className="bg-transparent p-0 font-mono text-[0.8125rem] font-normal text-foreground before:content-none after:content-none"
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
