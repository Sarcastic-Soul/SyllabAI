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
      >
        <TiltCard
          tiltMaxAngleX={5}
          tiltMaxAngleY={5}
          scale={1.01}
          className="w-full p-2 rounded-2xl bg-gradient-to-b from-primary/30 via-border/50 to-transparent shadow-2xl shadow-primary/10"
        >
          <div className="rounded-xl overflow-hidden border border-border/80 bg-background shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />

            {/*
              Product Demo Video Player:
              Place demo.webm and demo.mp4 inside /public/videos/
              Poster serves as static preview fallback while video loads.
            */}
            <video
              ref={videoRef}
              poster="/images/voice-lms.png"
              loop
              muted
              playsInline
              className="w-full h-auto object-cover opacity-95 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
            >
              <source src="/videos/demo.webm" type="video/webm" />
              <source src="/videos/demo.mp4" type="video/mp4" />
              <Image
                src="/images/voice-lms.png"
                alt="SyllabAI Platform Preview"
                width={1200}
                height={800}
                className="w-full h-auto object-cover opacity-95 group-hover:opacity-100 transition-opacity duration-300"
                priority
              />
            </video>
          </div>
        </TiltCard>
      </motion.div>
    </div>
  );
}
