import { FilePdfIcon } from "@phosphor-icons/react/ssr";
import { container } from "./styles";

export default function InputsSection() {
  return (
    <section className="border-t border-border">
      <div className={`${container} py-20 lg:py-28`}>
        <h2 className="max-w-2xl text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Start with a topic you picked, or with the notes you were handed.
        </h2>

        <div className="mt-12 grid gap-12 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-10">
          {/* Topic */}
          <div>
            <div
              aria-hidden="true"
              className="rounded-md border border-foreground/25 bg-card px-4 py-3"
            >
              <span className="block font-mono text-[11px] text-muted-foreground">
                What do you want to learn?
              </span>
              <span className="mt-1 flex items-center text-base font-medium">
                Thermodynamics for first-year physics
                <span className="ml-0.5 inline-block h-5 w-px bg-primary" />
              </span>
            </div>
            <div
              aria-hidden="true"
              className="mt-3 flex gap-2 font-mono text-xs"
            >
              <span className="rounded-sm border border-foreground bg-foreground px-2.5 py-1 text-background">
                Beginner
              </span>
              <span className="rounded-sm border border-border px-2.5 py-1 text-muted-foreground">
                Intermediate
              </span>
              <span className="rounded-sm border border-border px-2.5 py-1 text-muted-foreground">
                Advanced
              </span>
            </div>
            <h3 className="mt-7 text-xl font-semibold">From a topic</h3>
            <p className="mt-2 max-w-md leading-relaxed text-muted-foreground">
              Name the subject and pick a level. You get the chapter outline first,
              and each lesson is written the first time you
              open it, so you are not waiting on chapters you have not reached.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="flex items-center gap-4 md:flex-col"
          >
            <span className="h-px flex-1 bg-border md:h-auto md:w-px" />
            <span className="font-display text-lg italic text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border md:h-auto md:w-px" />
          </div>

          {/* Document */}
          <div>
            <div
              aria-hidden="true"
              className="rounded-md border border-dashed border-foreground/35 px-4 py-3"
            >
              <span className="block font-mono text-[11px] text-muted-foreground">
                Drop a file here
              </span>
              <span className="mt-1 flex items-center gap-2 text-base font-medium">
                <FilePdfIcon weight="bold" className="size-5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">
                  CS-301-lecture-notes.pdf
                </span>
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  2.4 MB
                </span>
              </span>
            </div>
            <p
              aria-hidden="true"
              className="mt-3 py-1 font-mono text-xs text-muted-foreground"
            >
              .pdf .txt .md .csv .json, up to 4 MB
            </p>
            <h3 className="mt-7 text-xl font-semibold">From your own file</h3>
            <p className="mt-2 max-w-md leading-relaxed text-muted-foreground">
              Upload lecture notes, a textbook chapter or a paper. The course
              follows what is in the file, not a general take on the subject,
              and the study buddy answers from the same pages.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
