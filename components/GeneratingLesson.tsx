"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

/**
 * Renders the "generating" spinner while a lesson is being created by the AI.
 * Auto-refreshes the page every 4 seconds so the user doesn't have to manually reload.
 */
export default function GeneratingLesson() {
  const router = useRouter();

  useEffect(() => {
    // Poll every 4 seconds until the server re-renders with real content
    const interval = setInterval(() => {
      router.refresh();
    }, 4000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="py-12 flex flex-col items-center justify-center space-y-4 border rounded-2xl bg-muted/30">
      <Spinner className="w-8 h-8" />
      <h2 className="text-2xl font-semibold animate-pulse">
        Generating Lesson...
      </h2>
      <p className="text-muted-foreground text-center max-w-md">
        Please wait while our AI builds a comprehensive curriculum for this
        chapter. This may take a few moments.
      </p>
      <p className="text-xs text-muted-foreground">
        This page will update automatically.
      </p>
    </div>
  );
}
