"use client";

import type { ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Animate on page load instead of on first scroll into view. */
  onLoad?: boolean;
  /** Seconds between children. */
  stagger?: number;
  as?: "div" | "ol" | "ul" | "dl";
};

/**
 * Staggers its RevealItem children once. `reducedMotion="user"` drops the
 * movement and keeps a plain fade for people who ask for less motion.
 */
export function Reveal({
  children,
  className,
  onLoad = false,
  stagger = 0.05,
  as = "div",
}: RevealProps) {
  const Tag = motion[as];
  const variants = {
    hidden: {},
    shown: { transition: { staggerChildren: stagger } },
  };

  return (
    <MotionConfig reducedMotion="user">
      <Tag
        className={className}
        variants={variants}
        initial="hidden"
        {...(onLoad
          ? { animate: "shown" }
          : { whileInView: "shown", viewport: { once: true, amount: 0.2 } })}
      >
        {children}
      </Tag>
    </MotionConfig>
  );
}

type RevealItemProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "figure";
  /** Slower, longer travel. Used once, for the hero. */
  hero?: boolean;
};

export function RevealItem({
  children,
  className,
  as = "div",
  hero = false,
}: RevealItemProps) {
  const Tag = motion[as];
  const variants = {
    hidden: { opacity: 0, y: hero ? 16 : 8 },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: hero ? 0.6 : 0.35, ease: EASE_OUT },
    },
  };

  return (
    <Tag className={className} variants={variants}>
      {children}
    </Tag>
  );
}
