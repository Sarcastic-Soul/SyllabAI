import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthView } from "@neondatabase/auth-ui";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import AuthShell from "@/components/landing/AuthShell";

const viewPaths: string[] = Object.values(authViewPaths);

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  if (!viewPaths.includes(path)) notFound();

  if (path === "sign-in") {
    return (
      <AuthShell
        title="Pick up where you left off."
        intro="Your courses, quiz scores and the flashcards due today are waiting."
        points={[
          "Chapters you finished stay marked as done",
          "Flashcards come back on the day they are due",
          "The study buddy still has your uploaded notes",
        ]}
        switchText="No account yet?"
        switchLabel="Sign up"
        switchHref="/auth/sign-up"
      >
        <AuthView path={path} />
      </AuthShell>
    );
  }

  if (path === "sign-up") {
    return (
      <AuthShell
        title="Make your first course."
        intro="Sign up, then type a topic or upload your notes. The free plan holds 3 courses at a time."
        points={[
          "A chapter outline from a topic or a file",
          "Lessons, three-question quizzes and flashcards per chapter",
          "A study buddy that answers from what you uploaded",
        ]}
        switchText="Already have an account?"
        switchLabel="Sign in"
        switchHref="/auth/sign-in"
      >
        <AuthView path={path} />
      </AuthShell>
    );
  }

  // Password reset, email code, sign-out and the rest: one plain centered card
  return (
    <main className="flex min-h-dvh flex-col items-center gap-8 bg-background px-5 py-10 sm:justify-center">
      <Link
        href="/"
        aria-label="SyllabAI home"
        className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <Image src="/logo.svg" alt="SyllabAI" width={80} height={50} style={{ width: "auto" }} />
      </Link>
      <AuthView path={path} />
    </main>
  );
}
