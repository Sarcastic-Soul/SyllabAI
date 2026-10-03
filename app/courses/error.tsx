"use client";

import { useEffect } from "react";
import ErrorState from "@/components/shared/ErrorState";

export default function CourseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Course Error:", error);
  }, [error]);

  return (
    <ErrorState
      title="This course did not load"
      message="It may be private, deleted, or the server had a problem. Try again or go back to your courses."
      onRetry={() => reset()}
      backHref="/dashboard"
      backLabel="Dashboard"
    />
  );
}
