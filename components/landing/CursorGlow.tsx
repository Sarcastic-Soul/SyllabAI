"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

export default function CursorGlow() {
  const shouldReduceMotion = useReducedMotion();
  const [isHoverDevice, setIsHoverDevice] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(-300);
  const mouseY = useMotionValue(-300);

  // Smooth trailing spring physics
  const springX = useSpring(mouseX, { stiffness: 120, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 18 });

  useEffect(() => {
    // Check touch vs hover capability
    const mediaQuery = window.matchMedia("(hover: hover)");
    setIsHoverDevice(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsHoverDevice(e.matches);
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  useEffect(() => {
    if (!isHoverDevice || shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 175; // center offset (350px width / 2)
      const y = e.clientY - rect.top - 175;
      mouseX.set(x);
      mouseY.set(y);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [isHoverDevice, shouldReduceMotion, mouseX, mouseY]);

  if (!isHoverDevice || shouldReduceMotion) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 -z-5 overflow-hidden select-none"
    >
      <motion.div
        style={{
          x: springX,
          y: springY,
        }}
        className="absolute top-0 left-0 w-[350px] h-[350px] rounded-full bg-gradient-to-r from-[#fe5933]/25 via-amber-500/20 to-transparent blur-3xl opacity-75 pointer-events-none"
      />
    </div>
  );
}
