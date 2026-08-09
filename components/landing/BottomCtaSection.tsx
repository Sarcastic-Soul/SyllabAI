"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";
import { Show, SignUpButton } from "@clerk/nextjs";
import { motion } from "motion/react";

export default function BottomCtaSection() {
  return (
    <section className="w-full max-w-5xl px-6 pb-24 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className="p-10 md:p-16 rounded-3xl bg-gradient-to-br from-primary via-[#ff6a47] to-amber-500 text-primary-foreground space-y-8 flex flex-col items-center relative overflow-hidden shadow-2xl shadow-primary/25 border border-primary/30"
      >
        {/* Continuous Slow Rotating Decorative Zap Icon */}
        <div className="absolute -right-16 -top-16 w-80 h-80 opacity-15 pointer-events-none select-none animate-[spin_40s_linear_infinite] will-change-transform transform-gpu">
          <Zap className="w-full h-full text-white" />
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold z-10 text-balance tracking-tight">
          Ready to design your learning path?
        </h2>

        <p className="text-lg md:text-xl opacity-95 max-w-xl z-10 font-normal leading-relaxed text-balance">
          Join thousands of students and professionals who are learning faster
          and retaining more with AI-generated courses.
        </p>

        <div className="z-10 pt-2">
          <Show when="signed-out">
            <SignUpButton>
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-6 rounded-full font-bold shadow-lg bg-background text-foreground hover:bg-background/95 transition-all cursor-pointer"
                >
                  Generate Your First Course
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/dashboard">
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-6 rounded-full font-bold shadow-lg bg-background text-foreground hover:bg-background/95 transition-all cursor-pointer"
                >
                  Return to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
          </Show>
        </div>
      </motion.div>
    </section>
  );
}
