"use client";

import { motion, useReducedMotion } from "motion/react";

export default function GradientMeshBackground() {
  const shouldReduceMotion = useReducedMotion();

  const blob1Animation = shouldReduceMotion
    ? {}
    : {
        x: [0, 60, -40, 0],
        y: [0, -50, 30, 0],
        scale: [1, 1.18, 0.92, 1],
      };

  const blob2Animation = shouldReduceMotion
    ? {}
    : {
        x: [0, -70, 50, 0],
        y: [0, 40, -50, 0],
        scale: [1, 0.88, 1.12, 1],
      };

  const blob3Animation = shouldReduceMotion
    ? {}
    : {
        x: [0, 45, -55, 0],
        y: [0, -35, 45, 0],
        scale: [1, 1.1, 0.94, 1],
      };

  const blob4Animation = shouldReduceMotion
    ? {}
    : {
        x: [0, -35, 40, 0],
        y: [0, 50, -30, 0],
        scale: [1, 0.95, 1.08, 1],
      };

  return (
    <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[900px] -z-15 overflow-hidden select-none">
      {/* Blob 1: Primary Accent (#fe5933) */}
      <motion.div
        animate={blob1Animation}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
        style={{ transform: "translateZ(0)" }}
        className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full bg-[#fe5933]/20 blur-3xl will-change-transform transform-gpu"
      />

      {/* Blob 2: CTA Gold (#fccc41) */}
      <motion.div
        animate={blob2Animation}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
        style={{ transform: "translateZ(0)" }}
        className="absolute top-32 right-1/4 w-[450px] h-[450px] rounded-full bg-[#fccc41]/20 blur-3xl will-change-transform transform-gpu"
      />

      {/* Blob 3: Warm Orange Glow */}
      <motion.div
        animate={blob3Animation}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
        style={{ transform: "translateZ(0)" }}
        className="absolute top-64 left-1/3 w-[550px] h-[550px] rounded-full bg-[#ff7a59]/15 blur-3xl will-change-transform transform-gpu"
      />

      {/* Blob 4: Deep Rose/Primary Accent */}
      <motion.div
        animate={blob4Animation}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
        style={{ transform: "translateZ(0)" }}
        className="absolute top-96 right-1/3 w-[400px] h-[400px] rounded-full bg-[#ea580c]/15 blur-3xl will-change-transform transform-gpu"
      />
    </div>
  );
}
