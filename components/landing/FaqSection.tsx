import { PlusIcon } from "@phosphor-icons/react/ssr";
import { container, focusRing } from "./styles";

const faqs = [
  {
    q: "Is it free?",
    a: "Yes. The Basic plan is free and holds 2 courses at a time. Lessons, quizzes, flashcards and the study buddy are all included. Pro removes the course limit.",
  },
  {
    q: "What can I upload?",
    a: "PDF, .txt, .md, .csv and .json files up to 4 MB. Scanned PDFs that are only images will not work, because there is no text to read.",
  },
  {
    q: "Can I trust what the lessons say?",
    a: "Treat them like a classmate's good notes. The lessons are written by a language model and can be wrong. If you upload a file, the course is built from that file, which helps, but check anything important against your own source.",
  },
  {
    q: "Are there limits on how much I can generate?",
    a: "Yes. The project runs on free tiers, so there is an hourly limit per user and a daily limit for the whole site. If the daily limit is used up, generation is paused until the next day. Courses you already have keep working.",
  },
  {
    q: "How does the voice part of the study buddy work?",
    a: "It uses your browser's built-in speech recognition and text to speech, so it works best in Chrome and Edge. Typing always works.",
  },
  {
    q: "Can I export or share a course?",
    a: "You can download a course or its cheat sheet as Markdown, or print either to PDF. You can also turn on a public link; people who open it can read the course without an account.",
  },
  {
    q: "Is my progress saved?",
    a: "Completed chapters, quiz scores, bookmarks and flashcard review dates are saved to your account.",
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-16 border-t border-border">
      <div
        className={`${container} grid gap-10 py-20 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16 lg:py-24`}
      >
        <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Questions
        </h2>

        <div className="border-t border-foreground/25">
          {faqs.map((f) => (
            <details key={f.q} className="group border-b border-border">
              <summary
                className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-3 text-lg font-medium [&::-webkit-details-marker]:hidden ${focusRing}`}
              >
                {f.q}
                <PlusIcon
                  weight="bold"
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                />
              </summary>
              <p className="max-w-2xl pb-5 leading-relaxed text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
