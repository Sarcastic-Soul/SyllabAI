import { SiGithub } from "@icons-pack/react-simple-icons";
import { GITHUB_URL, container, textLink } from "./styles";

const stack = [
  {
    term: "Next.js 16",
    detail:
      "App Router and server actions on Vercel's free plan. No background workers: generation runs inside one serverless request.",
  },
  {
    term: "Neon Postgres + pgvector",
    detail:
      "Uploaded files are split into chunks and embedded. Search is hybrid: full-text and vector results are merged with reciprocal rank fusion.",
  },
  {
    term: "Gemini",
    detail:
      "Writes outlines, lessons, quizzes and flashcards. Every response is checked against a schema before it is saved, and a lighter model takes over when the daily quota runs low.",
  },
  {
    term: "Neon Auth",
    detail:
      "Sign-in with Google or email and password. Users and sessions live in the same Postgres database as the courses.",
  },
  {
    term: "Razorpay",
    detail:
      "Pro is a one-time payment. The server checks the payment signature and a webhook before it unlocks the plan.",
  },
];

export default function StackSection() {
  return (
    <section id="how-it-is-built" className="scroll-mt-16 border-t border-border">
      <div
        className={`${container} grid gap-10 py-20 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16 lg:py-24`}
      >
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            How it is built
          </h2>
          <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground">
            SyllabAI is a student portfolio project, and the code is public.
            This part is for the people who want to know what is under it.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-5 inline-flex min-h-11 items-center gap-2 font-medium ${textLink}`}
          >
            <SiGithub className="size-4" aria-hidden="true" />
            Read the source on GitHub
          </a>
        </div>

        <dl className="border-t border-foreground/25">
          {stack.map((s) => (
            <div
              key={s.term}
              className="grid gap-1 border-b border-border py-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6"
            >
              <dt className="font-mono text-sm font-medium">{s.term}</dt>
              <dd className="text-[15px] leading-relaxed text-muted-foreground">
                {s.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
