"use client";

import { useEffect } from "react";
import ErrorState from "@/components/shared/ErrorState";

export default function SubscriptionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Subscription Error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Plans did not load"
      message="We could not load the plan details. Try again."
      onRetry={() => reset()}
      backHref="/dashboard"
      backLabel="Dashboard"
    />
  );
}
