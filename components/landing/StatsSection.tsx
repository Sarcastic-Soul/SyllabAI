"use client";

import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { BookOpenCheck, Users, Award, Sparkles } from "lucide-react";

interface CounterProps {
  from?: any;
  to: any;
  suffix?: any;
  decimals?: any;
}

function AnimatedCounter({ from = 0, to, suffix = "", decimals = 0 }: CounterProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest: any) =>
    decimals > 0 ? latest.toFixed(decimals) : Math.floor(latest).toLocaleString()
  );
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (inView) {
      const controls = animate(count, to, {
        duration: 2.2,
        ease: [0.22, 1, 0.36, 1] as any,
      });
      return () => controls.stop();
    }
  }, [inView, count, to]);

  return (
    <span ref={ref}>
      <motion.span ref={nodeRef}>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

const stats: any[] = [
  {
    icon: <BookOpenCheck className="w-5 h-5 text-primary" />,
    value: 12500,
    suffix: "+",
    label: "Courses Generated",
  },
  {
    icon: <Users className="w-5 h-5 text-primary" />,
    value: 8400,
    suffix: "+",
    label: "Active Learners",
  },
  {
    icon: <Award className="w-5 h-5 text-primary" />,
    value: 98.6,
    suffix: "%",
    decimals: 1,
    label: "Avg. Quiz Accuracy",
  },
  {
    icon: <Sparkles className="w-5 h-5 text-primary" />,
    value: 45000,
    suffix: "+",
    label: "Lessons Created",
  },
];

export default function StatsSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <section className="w-full max-w-6xl px-6 py-12">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-3xl bg-card/70 border border-border/80 shadow-lg backdrop-blur-sm"
      >
        {stats.map((stat: any, idx: number) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center space-y-2 p-2 relative group"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 mb-1 group-hover:scale-110 transition-transform">
              {stat.icon}
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              <AnimatedCounter
                to={stat.value}
                suffix={stat.suffix}
                decimals={stat.decimals || 0}
              />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
