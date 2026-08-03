"use client";

import { motion, useReducedMotion } from "motion/react";

interface AnimatedHeadlineProps {
  text: string;
  highlightWord?: string;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const highlightVariants = {
  hidden: { opacity: 0, y: 25, scale: 0.85 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function AnimatedHeadline({
  text,
  highlightWord = "Instantly",
  className = "",
}: AnimatedHeadlineProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(" ");

  if (shouldReduceMotion) {
    return (
      <h1 className={className}>
        {words.map((word, index) => {
          const isHighlight = word.toLowerCase() === highlightWord.toLowerCase();
          return (
            <span key={index} className="inline-block mr-[0.25em]">
              {isHighlight ? (
                <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
                  {word}
                </span>
              ) : (
                word
              )}
            </span>
          );
        })}
      </h1>
    );
  }

  return (
    <motion.h1
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, index) => {
        const isHighlight = word.toLowerCase() === highlightWord.toLowerCase();
        return (
          <motion.span
            key={index}
            variants={isHighlight ? highlightVariants : wordVariants}
            className="inline-block mr-[0.25em]"
          >
            {isHighlight ? (
              <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent drop-shadow-xs">
                {word}
              </span>
            ) : (
              word
            )}
          </motion.span>
        );
      })}
    </motion.h1>
  );
}
