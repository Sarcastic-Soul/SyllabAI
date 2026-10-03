import { container } from "./styles";

// Review days come from the app's own SM-2 code (lib/utils/sm2.ts), worked
// through by hand for three cards over the first 60 days.
const DAYS = 60;
const pos = (day: number) => `${Math.sqrt(day / DAYS) * 100}%`;

const cards = [
  {
    name: "Context switch",
    note: "Rated Good every time",
    reviews: [{ day: 1 }, { day: 7 }, { day: 22 }, { day: 60 }],
  },
  {
    name: "Time quantum",
    note: "Forgotten on day 7, so it starts over",
    reviews: [{ day: 1 }, { day: 7, missed: true }, { day: 8 }, { day: 14 }, { day: 24 }],
  },
  {
    name: "Starvation",
    note: "Rated Easy, so the gaps grow faster",
    reviews: [{ day: 1 }, { day: 7 }, { day: 24 }],
  },
];

const ticks = [1, 7, 14, 30, 60];

export default function ReviewSection() {
  return (
    <section className="border-t border-border bg-secondary">
      <div
        className={`${container} grid gap-12 py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-16 lg:py-24`}
      >
        <div>
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Cards come back on a schedule, not all at once the night before
          </h2>
          <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
            SyllabAI uses SM-2, the spaced repetition method behind Anki. A
            card you know well moves days, then weeks, away. A card you miss
            comes back tomorrow.
          </p>
          <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
            The same ratings feed a mastery panel on each course. It shows a
            retention score, lists the cards you keep missing, and the next
            quiz leans on those.
          </p>
        </div>

        <figure className="min-w-0">
          <div
            role="img"
            aria-label="Review schedule for three flashcards over 60 days. A card rated Good each time is reviewed on days 1, 7, 22 and 60. A card forgotten on day 7 restarts and is reviewed on days 8, 14 and 24. A card rated Easy is reviewed on days 1, 7 and 24."
            className="rounded-lg border border-foreground/15 bg-background p-5 sm:p-6"
          >
            <div aria-hidden="true" className="space-y-6">
              {cards.map((c) => (
                <div key={c.name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-semibold">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.note}
                    </span>
                  </div>
                  <div className="relative mx-1.5 mt-3 h-3">
                    <span className="absolute inset-x-0 top-1/2 h-px bg-foreground/20" />
                    <span className="absolute left-0 top-1/2 h-2.5 w-px -translate-y-1/2 bg-foreground/40" />
                    {c.reviews.map((r) => (
                      <span
                        key={r.day}
                        style={{ left: pos(r.day) }}
                        className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                          r.missed
                            ? "border-primary bg-background"
                            : "border-foreground bg-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="relative mx-1.5 h-5 border-t border-border font-mono text-[11px] tabular-nums text-muted-foreground">
                {ticks.map((t) => (
                  <span
                    key={t}
                    style={{ left: pos(t) }}
                    className={`absolute top-1.5 whitespace-nowrap ${
                      t === DAYS ? "-translate-x-full" : "-translate-x-1/2"
                    }`}
                  >
                    {t === DAYS ? "day 60" : t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-foreground" aria-hidden="true" />
              Review you remembered
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full border-2 border-primary"
                aria-hidden="true"
              />
              Review you missed
            </span>
            <span>Early days are stretched so they stay readable.</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
