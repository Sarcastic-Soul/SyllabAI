import { BookmarkSimpleIcon, CheckIcon } from "@phosphor-icons/react/ssr";

// A static copy of the course page and a chapter quiz, built from the same
// tokens as the app. The example data is made up; the layout is the real one.

const chapters = [
  { n: 1, title: "What a process is", done: true },
  { n: 2, title: "Process states and the PCB", done: true, saved: true },
  { n: 3, title: "Context switching", done: true },
  { n: 4, title: "CPU scheduling: FCFS, SJF, round robin", current: true },
  { n: 5, title: "Priority scheduling and starvation" },
  { n: 6, title: "Multilevel feedback queues" },
];

const options = [
  { text: "It is terminated" },
  { text: "It moves to the back of the ready queue", correct: true },
  { text: "It blocks until an I/O interrupt" },
  { text: "Its priority is raised" },
];

export default function HeroMock() {
  return (
    <figure
      role="img"
      aria-label="The SyllabAI course page for an operating systems course: a chapter list with three of eight chapters completed, next to a quiz question that has been answered correctly."
      className="overflow-hidden rounded-xl border border-foreground/15 bg-card"
    >
      <div aria-hidden="true">
        {/* Window bar */}
        <div className="flex items-center gap-3 border-b border-border bg-secondary px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </div>
          <div className="min-w-0 flex-1 truncate rounded-sm bg-background px-3 py-1 font-mono text-[11px] text-muted-foreground">
            syllabai / courses / operating-systems
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_15.5rem]">
          {/* Course outline */}
          <div className="min-w-0">
            <p className="font-display text-xl font-bold leading-tight sm:text-2xl">
              Operating Systems: Processes and Scheduling
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="rounded-sm bg-secondary px-2 py-0.5 font-medium text-foreground">
                Intermediate
              </span>
              <span>8 chapters</span>
              <span>3 quizzes taken, average 78%</span>
            </div>

            <div className="mt-4 flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">Course progress</span>
              <span className="font-mono font-medium tabular-nums">
                3 of 8
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary">
              <div className="h-full w-[38%] rounded-full bg-primary" />
            </div>

            <ol className="mt-5 divide-y divide-border border-y border-border">
              {chapters.map((c) => (
                <li
                  key={c.n}
                  className={`flex items-center gap-3 py-2.5 text-[13px] ${
                    c.n > 4 ? "max-sm:hidden" : ""
                  }`}
                >
                  <span className="w-5 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(c.n).padStart(2, "0")}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate ${
                      c.done ? "text-muted-foreground" : "font-medium"
                    }`}
                  >
                    {c.title}
                  </span>
                  {c.saved && (
                    <BookmarkSimpleIcon
                      weight="bold"
                      className="size-3.5 shrink-0 text-primary"
                    />
                  )}
                  {c.done && (
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                      <CheckIcon className="size-3.5 text-success" weight="bold" />
                      Done
                    </span>
                  )}
                  {c.current && (
                    <span className="shrink-0 rounded-sm bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">
                      Start
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Chapter quiz */}
          <div className="self-start rounded-lg border border-border bg-background p-4">
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
              <span>Question 2 of 3</span>
              <span>Score: 1</span>
            </div>
            <p className="mt-3 text-[13px] font-semibold leading-snug">
              In round robin scheduling, what happens when a process uses up
              its time quantum?
            </p>
            <ul className="mt-3 space-y-1.5">
              {options.map((o) => (
                <li
                  key={o.text}
                  className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs leading-snug ${
                    o.correct
                      ? "border-success bg-success/10 font-medium"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <span className="flex-1">{o.text}</span>
                  {o.correct && (
                    <CheckIcon
                      weight="bold"
                      className="mt-px size-3.5 shrink-0 text-success"
                    />
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end">
              <span className="rounded-sm bg-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground">
                Next question
              </span>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
