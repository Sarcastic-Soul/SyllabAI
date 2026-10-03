"use client";

import React, { useEffect, useId, useState } from "react";
import { SpinnerGap, DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Mermaid is lazy-imported inside the effect to avoid shipping its ~3MB
// bundle to pages that don't contain any diagrams.

export default function MermaidDiagram({ code, regenerateAction }: { code: string; regenerateAction?: () => Promise<void> }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRetrying, setIsRetrying] = useState(false);
  // useId can contain characters that are not valid in a CSS selector, and
  // mermaid looks the element up by selector, so keep only safe ones.
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    if (!code) return;

    const renderDiagram = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          // "base" is the only mermaid theme that takes custom colors.
          // Mermaid needs hex values here, so these mirror the tokens in globals.css.
          theme: "base",
          themeVariables: {
            background: "#fdfbf8",
            primaryColor: "#f3eee8",
            primaryTextColor: "#2a2420",
            primaryBorderColor: "#2a2420",
            secondaryColor: "#fbe4da",
            secondaryTextColor: "#2a2420",
            secondaryBorderColor: "#e8471f",
            tertiaryColor: "#f8f5f0",
            tertiaryTextColor: "#2a2420",
            tertiaryBorderColor: "#cfc8bf",
            lineColor: "#625a52",
            textColor: "#2a2420",
            mainBkg: "#f3eee8",
            nodeBorder: "#2a2420",
            clusterBkg: "#f8f5f0",
            clusterBorder: "#cfc8bf",
            edgeLabelBackground: "#fdfbf8",
            noteBkgColor: "#fbe4da",
            noteTextColor: "#2a2420",
            noteBorderColor: "#e8471f",
            fontSize: "15px",
          },
          securityLevel: "loose",
          fontFamily: "var(--font-geist), ui-sans-serif, system-ui, sans-serif",
        });
        const { svg: renderedSvg } = await mermaid.render(id, code);
        setSvg(renderedSvg);
        setError("");
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
        setError("This diagram could not be drawn.");
      }
    };

    renderDiagram();
  }, [code, id]);

  if (error) {
    return (
      <div
        role="alert"
        className="not-prose my-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm"
      >
        <span>{error}</span>
        {regenerateAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
                setIsRetrying(true);
                try {
                    await regenerateAction();
                } finally {
                    setIsRetrying(false);
                }
            }}
            disabled={isRetrying}
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </Button>
        )}
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        role="status"
        aria-label="Drawing diagram"
        className="not-prose my-6 flex items-center justify-center rounded-lg border border-border bg-card py-14"
      >
        <SpinnerGap className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const downloadPNG = () => {
    if (!svg) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    // We must encode the SVG to base64 or create an object URL to draw it to canvas
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Scale up for higher resolution
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      if (ctx) {
        ctx.fillStyle = "#fdfbf8"; // Paper background instead of transparent
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const pngData = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngData;
        a.download = "mermaid-diagram.png";
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <figure className="not-prose my-6 w-full overflow-hidden rounded-lg border border-border bg-card">
      <div
        className="flex w-full justify-center overflow-x-auto p-4 sm:p-6"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption className="flex items-center justify-between gap-3 border-t border-border py-1.5 pr-1.5 pl-4 print:hidden">
        <span className="font-mono text-xs text-muted-foreground">Diagram</span>
        <Button variant="ghost" size="sm" onClick={downloadPNG}>
          <DownloadSimple />
          Download PNG
        </Button>
      </figcaption>
    </figure>
  );
}
