"use client";

import { useInView } from "react-intersection-observer";
import { motion } from "motion/react";
import { GraduationCap, Compass, Briefcase, CheckCircle2 } from "lucide-react";
import TiltCard from "./TiltCard";

const personas = [
  {
    icon: <GraduationCap className="w-6 h-6 text-primary" />,
    role: "For Students",
    tagline: "Ace your exams & coursework",
    features: [
      "Generate revision guides from syllabus topics",
      "Test yourself with end-of-chapter quizzes",
      "Build study streaks to maintain daily focus",
    ],
  },
  {
    icon: <Compass className="w-6 h-6 text-amber-500" />,
    role: "For Self-Learners",
    tagline: "Master any hobby or tech stack",
    features: [
      "Turn complex documentation into lesson chapters",
      "Hands-free voice tutor for interactive QA",
      "Track completion across custom learning paths",
    ],
  },
  {
    icon: <Briefcase className="w-6 h-6 text-rose-500" />,
    role: "For Educators & Professionals",
    tagline: "Streamline curriculum creation",
    features: [
      "Quickly draft structured lesson outlines",
      "Generate code snippets and practical examples",
      "Export structured course materials effortlessly",
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function UseCasesSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <section className="w-full max-w-6xl px-6 py-24 border-t border-border/60">
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-3.5 py-1 text-xs font-semibold bg-primary/10 text-primary uppercase tracking-wider">
          Tailored Use Cases
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
          Designed for Every Type of Learner
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
          Whether preparing for exams, learning a new technology, or drafting course outlines.
        </p>
      </div>

      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {personas.map((persona, idx) => (
          <motion.div key={idx} variants={cardVariants} className="h-full">
            <TiltCard tiltMaxAngleX={6} tiltMaxAngleY={6} scale={1.02} className="h-full rounded-3xl">
              <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-md hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col justify-between h-full group relative">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-muted/60 rounded-2xl border border-border/60 group-hover:scale-110 transition-transform">
                      {persona.icon}
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Target Persona
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                      {persona.role}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium mt-1">
                      {persona.tagline}
                    </p>
                  </div>

                  <ul className="space-y-3 pt-2">
                    {persona.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-sm text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
