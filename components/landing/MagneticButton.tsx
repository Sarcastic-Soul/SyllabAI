"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  maxDistance?: number;
}

export default function MagneticButton({
  children,
  className = "",
  maxDistance = 20,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isHoverDevice, setIsHoverDevice] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springX = useSpring(rawX, { stiffness: 220, damping: 16 });
  const springY = useSpring(rawY, { stiffness: 220, damping: 16 });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover)");
    setIsHoverDevice(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsHoverDevice(e.matches);
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !isHoverDevice || shouldReduceMotion) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Clamp displacement to maxDistance
    const deltaX = Math.max(-maxDistance, Math.min(maxDistance, distanceX * 0.35));
    const deltaY = Math.max(-maxDistance, Math.min(maxDistance, distanceY * 0.35));

    rawX.set(deltaX);
    rawY.set(deltaY);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  if (!isHoverDevice || shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: springX,
        y: springY,
        transform: "translateZ(0)",
      }}
      className={`will-change-transform transform-gpu ${className}`}
    >
      {children}
    </motion.div>
  );
}
