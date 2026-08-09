"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { motion } from "motion/react";
import CursorGlow from "./CursorGlow";
import MagneticButton from "./MagneticButton";
import AnimatedHeadline from "./AnimatedHeadline";
import HeroVideoMockup from "./HeroVideoMockup";

interface HeroSectionProps {
  loadingSignIn: boolean;
  loadingSignUp: boolean;
  loadingDashboard: boolean;
  setLoadingSignIn: (val: boolean) => void;
  setLoadingSignUp: (val: boolean) => void;
  setLoadingDashboard: (val: boolean) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HeroSection({
  loadingSignIn,
  loadingSignUp,
  loadingDashboard,
  setLoadingSignIn,
  setLoadingSignUp,
  setLoadingDashboard,
}: HeroSectionProps) {
  return (
    <section className="w-full max-w-6xl px-6 pt-8 pb-16 flex flex-col items-center text-center relative overflow-hidden">
      {/* Cursor-Following Hero Spotlight Glow */}
      <CursorGlow />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center space-y-8 w-full z-10"
      >
        {/* Top Badges */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-4 py-1.5 text-sm font-medium bg-primary/5 text-primary backdrop-blur-sm shadow-sm hover:border-primary/40 transition-colors cursor-default">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span>The Ultimate AI-Powered LMS</span>
          </div>

          <MagneticButton maxDistance={15}>
            <a
              href="https://github.com/Sarcastic-Soul/SyllabAI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 px-3.5 py-1.5 text-xs font-semibold bg-card/80 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all backdrop-blur-sm shadow-xs group"
            >
              <SiGithub className="w-3.5 h-3.5 text-foreground group-hover:text-primary transition-colors" />
              <span>⭐ Star on GitHub</span>
            </a>
          </MagneticButton>
        </motion.div>

        {/* Logo */}
        <motion.div variants={itemVariants}>
          <Image
            src="/logo.svg"
            alt="SyllabAI Logo"
            width={220}
            height={110}
            className="mb-2 h-14 w-auto object-contain drop-shadow-sm"
            priority
            loading="eager"
          />
        </motion.div>

        {/* Staggered Word-Level Animated Headline */}
        <motion.div variants={itemVariants} className="w-full flex justify-center">
          <AnimatedHeadline
            text="Master Any Subject Instantly"
            highlightWord="Instantly"
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.1] tracking-tight max-w-4xl text-balance"
          />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl text-balance font-normal leading-relaxed"
        >
          Turn any topic into a fully structured course. Generate chapters,
          take quizzes, track your progress, and study with a voice-enabled AI
          tutor.
        </motion.p>

        {/* CTA Buttons wrapped in MagneticButton */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto"
        >
          <Show when="signed-out">
            <SignUpButton>
              <div className="w-full sm:w-auto">
                <MagneticButton maxDistance={20}>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      size="lg"
                      className="text-lg px-8 py-6 rounded-full w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/35 transition-all bg-primary text-primary-foreground font-semibold cursor-pointer"
                      onClick={() => setLoadingSignUp(true)}
                      disabled={loadingSignUp}
                    >
                      {loadingSignUp ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Start Learning{" "}
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </MagneticButton>
              </div>
            </SignUpButton>

            <SignInButton>
              <div className="w-full sm:w-auto">
                <MagneticButton maxDistance={18}>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-lg px-8 py-6 rounded-full w-full sm:w-auto border-2 hover:bg-muted/80 font-medium cursor-pointer"
                      onClick={() => setLoadingSignIn(true)}
                      disabled={loadingSignIn}
                    >
                      {loadingSignIn ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </motion.div>
                </MagneticButton>
              </div>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <MagneticButton maxDistance={20}>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 rounded-full w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/35 transition-all bg-primary text-primary-foreground font-semibold cursor-pointer"
                    onClick={() => setLoadingDashboard(true)}
                    disabled={loadingDashboard}
                  >
                    {loadingDashboard ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Go to Dashboard{" "}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </MagneticButton>
            </Link>
          </Show>
        </motion.div>

        {/* Hero Product Video / Mockup */}
        <motion.div variants={itemVariants} className="w-full flex justify-center">
          <HeroVideoMockup />
        </motion.div>
      </motion.div>
    </section>
  );
}
