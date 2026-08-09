"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function AnimatedBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine: any) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  return (
    <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1200px] -z-10 overflow-hidden select-none">
      {/* Ambient gradient meshes */}
      <div
        style={{ transform: "translateZ(0)" }}
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-tr from-primary/25 via-orange-400/20 to-amber-300/10 blur-[130px] rounded-full opacity-80 will-change-transform transform-gpu"
      />
      <div
        style={{ transform: "translateZ(0)" }}
        className="absolute top-[500px] -left-40 w-[700px] h-[500px] bg-gradient-to-br from-amber-500/15 via-primary/15 to-transparent blur-[110px] rounded-full opacity-60 will-change-transform transform-gpu"
      />

      {/* Grid Pattern overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#000_1.5px,transparent_1.5px)]"
        style={{ backgroundSize: "28px 28px" }}
      />

      {/* tsParticles lightweight ambient background */}
      {init && (
        <Particles
          id="tsparticles-landing"
          className="absolute inset-0 h-full w-full opacity-75"
          options={{
            fpsLimit: 60,
            fullScreen: { enable: false },
            interactivity: {
              events: {
                onHover: {
                  enable: false,
                },
              },
            },
            particles: {
              color: {
                value: ["#fe5933", "#fccc41", "#ff7a59", "#ea580c"],
              },
              links: {
                color: "#fe5933",
                distance: 120,
                enable: true,
                opacity: 0.18,
                width: 1,
              },
              move: {
                enable: true,
                speed: 0.8,
                direction: "none",
                random: true,
                straight: false,
                outModes: {
                  default: "out",
                },
              },
              number: {
                value: 30,
              },
              opacity: {
                value: { min: 0.2, max: 0.5 },
              },
              size: {
                value: { min: 2, max: 4 },
              },
            },
            detectRetina: false,
          }}
        />
      )}
    </div>
  );
}

