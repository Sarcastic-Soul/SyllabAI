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
    <div
      role="status"
      className="rounded-xl border border-dashed border-foreground/25 px-6 py-10"
    >
      <div className="flex items-center gap-3">
        <Spinner className="size-5 text-primary motion-reduce:animate-none" />
        <h2 className="text-xl font-semibold">Writing this lesson</h2>
      </div>
      <p className="mt-2 max-w-[55ch] leading-relaxed text-muted-foreground">
        This usually takes under a minute. The page updates by itself, so you
        can leave it open.
      </p>
    </div>
  );
}
