import Link from "next/link";
import { btnLg, btnPrimary } from "@/components/landing/styles";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col justify-center bg-background px-5 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-xl">
        <p className="font-mono text-sm text-muted-foreground">Error 404</p>
        <h1 className="mt-3 text-balance text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
          This page is not on the syllabus.
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
          The link may be old, or the course it pointed to was deleted or is no
          longer shared.
        </p>
        <Link href="/" className={`mt-8 ${btnPrimary} ${btnLg}`}>
          Back to the home page
        </Link>
      </div>
    </main>
  );
}
