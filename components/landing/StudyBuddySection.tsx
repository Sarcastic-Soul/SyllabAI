import { MicrophoneIcon } from "@phosphor-icons/react/ssr";
import { container } from "./styles";

export default function StudyBuddySection() {
  return (
    <section className="border-t border-border">
      <div
        className={`${container} grid gap-12 py-20 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center lg:gap-20 lg:py-28`}
      >
        <figure
          role="img"
          aria-label="A study buddy chat. The student asks why shortest-job-first is not used everywhere if it has the lowest average wait. The reply explains, from the uploaded notes, that it needs the next burst length in advance and can starve long jobs."
          className="order-2 lg:order-1"
        >
          <div aria-hidden="true" className="space-y-4">
            <p className="ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm bg-foreground px-4 py-3 text-sm leading-relaxed text-background">
              If SJF gives the lowest average wait, why don&apos;t we just use
              it everywhere?
            </p>
            <div className="max-w-[92%] border-l-2 border-primary pl-4">
              <p className="font-mono text-[11px] text-muted-foreground">
                Study buddy, from CS-301-lecture-notes.pdf
              </p>
              <p className="mt-1.5 text-sm leading-relaxed">
                Your notes give two reasons. SJF has to know the length of the
                next CPU burst before it runs, and real systems can only
                estimate that from past bursts. It can also starve long jobs:
                if short ones keep arriving, the long one never reaches the
                front.
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                Round robin gives up some average wait to guarantee every
                process a turn. Want a worked example with three processes?
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-foreground/25 bg-card px-4 py-2.5 text-sm text-muted-foreground">
              <span className="flex-1">Ask about this course</span>
              <MicrophoneIcon weight="bold" className="size-4" />
            </div>
          </div>
        </figure>

        <div className="order-1 lg:order-2">
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            A study buddy that has read your notes
          </h2>
          <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
            Ask a question in the middle of a course. If you uploaded a file,
            SyllabAI finds the passages that match your question and answers
            from those, so the explanation uses the terms your lecturer uses.
          </p>
          <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
            Type, or talk: in browsers that support it you can speak your
            question and have the answer read aloud.
          </p>
        </div>
      </div>
    </section>
  );
}
