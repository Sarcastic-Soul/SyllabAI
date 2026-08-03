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
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
      {/* Ambient gradient meshes */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-tr from-primary/25 via-orange-400/20 to-amber-300/10 blur-[130px] rounded-full opacity-80" />
      <div className="absolute top-[700px] -left-40 w-[700px] h-[500px] bg-gradient-to-br from-amber-500/15 via-primary/15 to-transparent blur-[110px] rounded-full opacity-60" />
      <div className="absolute top-[1400px] -right-40 w-[700px] h-[600px] bg-gradient-to-bl from-primary/20 via-rose-500/15 to-transparent blur-[120px] rounded-full opacity-70" />

      {/* Grid Pattern overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] bg-[radial-gradient(#000_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#fff_1.5px,transparent_1.5px)]"
        style={{ backgroundSize: "28px 28px" }}
      />

      {/* tsParticles vibrant ambient background */}
      {init && (
        <Particles
          id="tsparticles-landing"
          className="absolute inset-0 h-full w-full opacity-85"
          options={{
            fpsLimit: 60,
            fullScreen: { enable: false },
            interactivity: {
              events: {
                onHover: {
                  enable: true,
                  mode: "grab",
                },
              },
              modes: {
                grab: {
                  distance: 160,
                  links: {
                    opacity: 0.45,
                    color: "#fe5933",
                  },
                },
              },
            },
            particles: {
              color: {
                value: ["#fe5933", "#fccc41", "#ff7a59", "#ea580c"],
              },
              links: {
                color: "#fe5933",
                distance: 140,
                enable: true,
                opacity: 0.22,
                width: 1.2,
              },
              move: {
                enable: true,
                speed: 1.2,
                direction: "none",
                random: true,
                straight: false,
                outModes: {
                  default: "out",
                },
              },
              number: {
                density: {
                  enable: true,
                  width: 1200,
                  height: 800,
                },
                value: 70,
              },
              opacity: {
                value: { min: 0.25, max: 0.65 },
                animation: {
                  enable: true,
                  speed: 1.2,
                  sync: false,
                },
              },
              size: {
                value: { min: 2, max: 5 },
              },
            },
            detectRetina: true,
          }}
        />
      )}
    </div>
  );
}
