"use client";

import { useEffect } from "react";

// Replaces the root layout when it fails, so globals.css and fonts are not
// loaded here. Styles are inline on purpose and mirror the app tokens.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("Global error occurred:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#f8f5f0",
          color: "#2a2420",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 26, lineHeight: 1.2, margin: 0 }}>
            SyllabAI hit an error
          </h1>
          <p style={{ margin: "12px 0 24px", lineHeight: 1.6, color: "#625a52" }}>
            The page could not load. Your courses are safe. Try again, and if it
            keeps failing, come back in a few minutes.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => (reset ? reset() : window.location.reload())}
              style={{
                height: 44,
                padding: "0 24px",
                border: 0,
                borderRadius: 6,
                background: "#e8471f",
                color: "#fdfaf6",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the root layout crashed, so a full page reload is wanted */}
            <a
              href="/"
              style={{
                height: 44,
                padding: "0 24px",
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 6,
                border: "1px solid #cfc8bf",
                color: "#2a2420",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Go to home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
