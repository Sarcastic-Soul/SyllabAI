import { StartCta } from "./AuthButtons";
import HeroMock from "./HeroMock";
import { Reveal, RevealItem } from "./Reveal";
import { container } from "./styles";

export default function Hero() {
  return (
    <section className={`${container} pb-20 pt-12 sm:pt-16 lg:pb-28 lg:pt-20`}>
      <Reveal
        onLoad
        stagger={0.08}
        className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10"
      >
        <div>
          <RevealItem hero>
            <h1 className="text-balance text-[2.75rem] font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              <span className="sm:block">One topic or one PDF in.</span>
              {" "}
              <span className="sm:block">A whole course out.</span>
            </h1>
          </RevealItem>
          <RevealItem hero>
            <p className="mt-6 max-w-[34rem] text-pretty text-lg leading-relaxed text-muted-foreground">
              Type what you want to learn, or drop in your lecture notes.
              SyllabAI lays out the chapters, writes each lesson when you open
              it, then quizzes you and brings the flashcards back just before
              you would forget them.
            </p>
          </RevealItem>
          <RevealItem hero className="mt-8">
            <StartCta withSignIn />
            <p className="mt-4 text-sm text-muted-foreground">
              The free plan holds 3 courses at a time.
            </p>
          </RevealItem>
        </div>

        <RevealItem hero className="min-w-0 lg:-mr-24 xl:-mr-32">
          <HeroMock />
        </RevealItem>
      </Reveal>
    </section>
  );
}
