"use client";

import { motion } from "motion/react";
import { ShieldCheck, Cpu, Database, Zap } from "lucide-react";

const trustItems = [
  {
    icon: <Cpu className="w-4 h-4 text-primary" />,
    label: "Google Gemini AI",
    subtext: "Intelligent Course Engine",
  },
  {
    icon: <Zap className="w-4 h-4 text-amber-500" />,
    label: "Next.js 16 App Router",
    subtext: "Lightning Fast Performance",
  },
  {
    icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
    label: "Clerk Authentication",
    subtext: "Enterprise-Grade Security",
  },
  {
    icon: <Database className="w-4 h-4 text-cyan-500" />,
    label: "Neon Serverless Postgres",
    subtext: "Reliable Data Storage",
  },
];

export default function TrustBadges() {
  return (
    <section className="w-full max-w-6xl px-6 py-8">
      <div className="p-6 rounded-3xl bg-card/40 border border-border/50 backdrop-blur-sm shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col space-y-1 max-w-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Built with Modern Tech
          </span>
          <p className="text-sm font-semibold text-foreground">
            Production-grade stack & performance
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
          {trustItems.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -2 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-background/60 border border-border/60 shadow-2xs hover:border-primary/30 transition-all"
            >
              <div className="p-2 rounded-xl bg-muted/60">{item.icon}</div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-foreground">
                  {item.label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {item.subtext}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
