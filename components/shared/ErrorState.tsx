"use client";

import Link from "next/link";
import { ArrowClockwise, ArrowLeft, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function ErrorState({
  title,
  message,
  onRetry,
  backHref,
  backLabel,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-start justify-center px-4 py-16 sm:px-6">
      <WarningCircle className="size-8 text-destructive" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold text-balance">{title}</h1>
      <p className="mt-2 leading-relaxed text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={onRetry}>
          <ArrowClockwise /> Try again
        </Button>
        {backHref && (
          <Button asChild variant="outline" size="lg">
            <Link href={backHref}>
              <ArrowLeft /> {backLabel ?? "Back"}
            </Link>
          </Button>
        )}
      </div>
    </main>
  );
}
