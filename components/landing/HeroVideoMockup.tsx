"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import TiltCard from "./TiltCard";
import { motion } from "motion/react";

export default function HeroVideoMockup() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: containerRef, inView } = useInView({
    threshold: 0.15,
    triggerOnce: false,
  });

  // Autoplay video only when scrolled into view
  useEffect(() => {
    if (!videoRef.current) return;
    if (inView) {
      videoRef.current.play().catch(() => {
        // Fallback for autoplay restrictions
      });
    } else {
      videoRef.current.pause();
    }
  }, [inView]);

  return (
    <div ref={containerRef} className="w-full max-w-5xl mt-12 pt-4">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transform: "translateZ(0)" }}
        className="will-change-transform transform-gpu"
      >
        <TiltCard
          tiltMaxAngleX={5}
          tiltMaxAngleY={5}
          scale={1.01}
          className="w-full p-2 rounded-2xl bg-gradient-to-b from-primary/30 via-border/50 to-transparent shadow-2xl shadow-primary/10"
        >
          <div className="rounded-xl overflow-hidden border border-border/80 bg-background shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />

            {/* Platform Preview Image Mockup */}
            <div className="relative w-full overflow-hidden">
              <Image
                src="/images/banner.png"
                alt="SyllabAI Platform Preview"
                width={1200}
                height={800}
                className="w-full h-auto object-cover opacity-95 group-hover:opacity-100 group-hover:scale-[1.01] transition-all duration-500 rounded-xl"
                priority
              />
            </div>
          </div>
        </TiltCard>
      </motion.div>
    </div>
  );
}
