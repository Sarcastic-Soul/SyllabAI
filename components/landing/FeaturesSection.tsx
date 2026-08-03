"use client";

import { useInView } from "react-intersection-observer";
import { motion } from "motion/react";
import { BookOpen, Layers, Target, Bot } from "lucide-react";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: <BookOpen className="w-6 h-6 text-primary" />,
    title: "Instant Course Generation",
    description:
      "Simply tell us what you want to learn. Our AI builds a comprehensive, structured curriculum in seconds.",
  },
  {
    icon: <Layers className="w-6 h-6 text-primary" />,
    title: "Structured Learning Paths",
    description:
      "Dive into highly organized chapters complete with in-depth lesson texts, code snippets, and clear explanations.",
  },
  {
    icon: <Target className="w-6 h-6 text-primary" />,
    title: "Interactive Quizzes & Tracking",
    description:
      "Test your knowledge at the end of every chapter, track your completion progress, and build your daily study streak.",
  },
  {
    icon: <Bot className="w-6 h-6 text-primary" />,
    title: "Voice-Enabled AI Tutor",
    description:
      "Stuck on a tough concept? Talk to your personal AI study buddy at any time for hands-free, personalized help.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function FeaturesSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <section id="features" className="w-full max-w-6xl px-6 py-24 border-t border-border/60">
      {/* Section Header */}
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
          Everything you need to build your own curriculum
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
          Stop searching for the perfect tutorial. Generate a tailored learning
          path that adapts to your pace and tracks your progress.
        </p>
      </div>

      {/* Grid of features */}
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((feature, index) => (
          <motion.div key={index} variants={cardVariants} className="h-full">
            <FeatureCard
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
