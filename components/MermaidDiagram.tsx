"use client";

import React, { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";
import { Loader2 } from "lucide-react";

// Initialize mermaid with your platform's theme
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "var(--font-bricolage)",
});

export default function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const id = useRef(`mermaid-${Math.random().toString(36).slice(2, 11)}`);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const { svg: renderedSvg } = await mermaid.render(id.current, code);
        setSvg(renderedSvg);
        setError("");
      } catch (err: any) {
        console.error("Mermaid rendering failed:", err);
        setError("Failed to render diagram.");
      }
    };

    if (code) {
      renderDiagram();
    }
  }, [code]);

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-500/10 rounded-xl border border-red-500/20 text-sm font-mono">
        {error}
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
