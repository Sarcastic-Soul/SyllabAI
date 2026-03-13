"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SubmitButton({
  defaultText,
  loadingText,
}: {
  defaultText: string;
  loadingText: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <Spinner className="mr-2 h-4 w-4" />}
      {pending ? loadingText : defaultText}
    </Button>
  );
}
