"use client";

import { useEffect } from "react";
import ErrorState from "@/components/shared/ErrorState";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Your dashboard did not load"
      message="Something failed while loading your courses. Your data is safe. Try again."
      onRetry={() => reset()}
    />
  );
}
