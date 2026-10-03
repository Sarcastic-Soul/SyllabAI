import Image from "next/image";
import { SiGithub } from "@icons-pack/react-simple-icons";
import SiteHeader from "@/components/landing/SiteHeader";
import Hero from "@/components/landing/Hero";
import InputsSection from "@/components/landing/InputsSection";
import ChapterSection from "@/components/landing/ChapterSection";
import ReviewSection from "@/components/landing/ReviewSection";
import StudyBuddySection from "@/components/landing/StudyBuddySection";
import StackSection from "@/components/landing/StackSection";
import PricingSection from "@/components/landing/PricingSection";
import FaqSection from "@/components/landing/FaqSection";
import { StartCta } from "@/components/landing/AuthButtons";
import {
  GITHUB_URL,
  container,
  focusRing,
} from "@/components/landing/styles";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <a
        href="#main"
        className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-background ${focusRing}`}
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main" className="overflow-x-clip">
        <Hero />
        <InputsSection />
        <ChapterSection />
        <ReviewSection />
        <StudyBuddySection />
        <StackSection />
        <PricingSection />
        <FaqSection />

        <section className="border-t border-foreground/25">
          <div className={`${container} py-24 lg:py-32`}>
            <h2 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
              Bring the notes for your next exam and see the course it makes.
            </h2>
            <div className="mt-9">
              <StartCta />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div
          className={`${container} flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-6 text-sm text-muted-foreground`}
        >
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt=""
              width={28}
              height={28}
              className="size-7"
            />
            <span>SyllabAI, a student portfolio project</span>
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex min-h-11 items-center gap-2 rounded-sm transition-colors duration-150 hover:text-foreground ${focusRing}`}
          >
            <SiGithub className="size-4" aria-hidden="true" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
