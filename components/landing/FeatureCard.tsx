"use client";

import React from "react";
import { motion } from "motion/react";
import TiltCard from "./TiltCard";

interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="h-full">
      <TiltCard tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.03} className="h-full rounded-3xl">
        <div className="p-7 rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 space-y-5 flex flex-col items-start text-left h-full group relative overflow-hidden cursor-pointer">
          {/* Ambient card background highlight */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-colors pointer-events-none will-change-transform transform-gpu" />

          {/* Lucide Icon Box */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="p-3.5 bg-primary/10 rounded-2xl border border-primary/20 group-hover:bg-primary/20 transition-colors shrink-0"
          >
            <div className="transition-transform group-hover:scale-105">
              {icon}
            </div>
          </motion.div>

          <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>

          <p className="text-muted-foreground leading-relaxed text-sm">
            {description}
          </p>
        </div>
      </TiltCard>
    </div>
  );
}
