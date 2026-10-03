"use client";

import { useEffect } from "react";
import ErrorState from "@/components/shared/ErrorState";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Profile Error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Your progress did not load"
      message="We could not load your stats. Your data is safe. Try again."
      onRetry={() => reset()}
      backHref="/dashboard"
      backLabel="Dashboard"
    />
  );
}
