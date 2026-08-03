"use client";

import { useInView } from "react-intersection-observer";
import { motion } from "motion/react";
import { Sparkles, Cpu, Mic, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Enter Topic or Prompt",
    description:
      "Specify what you want to master or upload your study material. AI analyzes the scope in seconds.",
    icon: <Sparkles className="w-6 h-6 text-primary" />,
  },
  {
    step: "02",
    title: "AI Generates Curriculum",
    description:
      "SyllabAI builds a complete multi-chapter course with rich explanations, code snippets, and key takeaways.",
    icon: <Cpu className="w-6 h-6 text-primary" />,
  },
  {
    step: "03",
    title: "Study with Voice & Quizzes",
    description:
      "Take interactive chapter quizzes, track your study streaks, and chat with your voice-enabled AI tutor anytime.",
    icon: <Mic className="w-6 h-6 text-primary" />,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HowItWorksSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <section id="how-it-works" className="w-full max-w-6xl px-6 py-24 border-t border-border/60">
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-3.5 py-1 text-xs font-semibold bg-primary/10 text-primary uppercase tracking-wider">
          Simple 3-Step Process
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
          How SyllabAI Works
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
          From an idea to a fully structured, interactive course in less than a minute.
        </p>
      </div>

      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
      >
        {steps.map((s, idx) => (
          <motion.div key={idx} variants={itemVariants} className="relative flex flex-col h-full">
            {/* Step Card */}
            <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col items-start h-full group relative overflow-hidden">
              {/* Subtle Step Number Badge */}
              <div className="absolute top-6 right-6 text-4xl font-extrabold text-muted/30 group-hover:text-primary/20 transition-colors">
                {s.step}
              </div>

              {/* Icon Container */}
              <div className="p-3.5 bg-primary/10 rounded-2xl border border-primary/20 mb-6 group-hover:scale-110 transition-transform">
                {s.icon}
              </div>

              <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                {s.title}
              </h3>

              <p className="text-muted-foreground text-sm leading-relaxed">
                {s.description}
              </p>
            </div>

            {/* Connecting Arrow for larger screens */}
            {idx < steps.length - 1 && (
              <div className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 p-2 bg-background border border-border rounded-full shadow-sm text-muted-foreground">
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
