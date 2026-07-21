"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

// Mermaid is lazy-imported inside the effect to avoid shipping its ~3MB
// bundle to pages that don't contain any diagrams.

export default function MermaidDiagram({ code, regenerateAction }: { code: string; regenerateAction?: () => Promise<void> }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRetrying, setIsRetrying] = useState(false);
  const id = useRef(`mermaid-${Math.random().toString(36).slice(2, 11)}`);

  useEffect(() => {
    if (!code) return;

    const renderDiagram = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          fontFamily: "var(--font-bricolage)",
        });
        const { svg: renderedSvg } = await mermaid.render(id.current, code);
        setSvg(renderedSvg);
        setError("");
      } catch (err: any) {
        console.error("Mermaid rendering failed:", err);
        setError("Failed to render diagram.");
      }
    };

    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-500/10 rounded-xl border border-red-500/20 text-sm font-mono flex items-center justify-between">
        <span>{error}</span>
        {regenerateAction && (
          <button
            onClick={async () => {
                setIsRetrying(true);
                try {
                    await regenerateAction();
                } finally {
                    setIsRetrying(false);
                }
            }}
            disabled={isRetrying}
            className="px-3 py-1 bg-white dark:bg-black rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
        )}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex justify-center items-center py-12 border rounded-xl bg-muted/20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className="flex justify-center my-8 p-6 bg-white border rounded-2xl shadow-sm overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
