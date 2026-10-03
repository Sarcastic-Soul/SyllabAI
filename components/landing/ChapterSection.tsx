import { Reveal, RevealItem } from "./Reveal";
import { container } from "./styles";

const ratings = ["Again", "Hard", "Good", "Easy"];

function FlashcardMock() {
  return (
    <figure
      role="img"
      aria-label="A flashcard showing its answer, with four rating buttons: Again, Hard, Good and Easy."
      className="mt-5 max-w-md"
    >
      <div aria-hidden="true">
        <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>Card 4 of 12</span>
          <span>5 due for review</span>
        </div>
        <div className="mt-2 rounded-lg border border-foreground/25 bg-card px-5 py-6 text-center">
          <span className="font-mono text-[11px] text-muted-foreground">
            Answer
          </span>
          <p className="mt-2 font-medium leading-snug">
            Saving the state of the running process and loading the saved state
            of the next one.
          </p>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs font-medium">
          {ratings.map((r) => (
            <span
              key={r}
              className={`rounded-md border py-2 ${
                r === "Good"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border"
              }`}
            >
              {r}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

const steps = [
  {
    title: "Read the lesson",
    body: "Each chapter is a written lesson with worked examples, code where the subject calls for it, and a diagram you can download. Bookmark the ones you want to come back to.",
  },
  {
    title: "Answer three questions",
    body: "A short quiz at the end of the chapter. You check each answer as you go, so you see what you got wrong while the lesson is still fresh.",
  },
  {
    title: "Rate the flashcards",
    body: "Flip a card, then say how well you knew it. That one tap decides when the card comes back.",
    mock: true,
  },
  {
    title: "Keep the cheat sheet",
    body: "When you are through the chapters, get a one-page summary of the course. Save it as Markdown or PDF, or share the whole course with a public link.",
  },
];

export default function ChapterSection() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-t border-border">
      <div
        className={`${container} grid gap-10 py-20 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16 lg:py-28`}
      >
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            What one chapter asks of you
          </h2>
          <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground">
            Every chapter runs the same way, so you always know what is left
            before you can close the laptop.
          </p>
        </div>

        <Reveal as="ol" stagger={0.06} className="border-t border-foreground/25">
          {steps.map((s, i) => (
            <RevealItem
              as="li"
              key={s.title}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 border-b border-border py-7 sm:grid-cols-[4rem_minmax(0,1fr)]"
            >
              <span
                aria-hidden="true"
                className="font-display text-3xl font-bold leading-none text-primary sm:text-4xl"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
                {s.mock && <FlashcardMock />}
              </div>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
