"use client";

import { useInView } from "react-intersection-observer";
import { motion } from "motion/react";
import { PricingTable } from "@clerk/nextjs";

export default function PricingSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <section
      id="pricing"
      className="w-full max-w-6xl px-6 py-24 border-t border-border/60 flex flex-col items-center"
    >
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className="w-full flex flex-col items-center"
      >
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
            Simple, transparent pricing
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Start learning with our free tier, or upgrade to Pro to unlock
            unlimited course generation and advanced features.
          </p>
        </div>

        {/* PricingTable Container with Clerk Appearance prop */}
        <div className="w-full max-w-4xl p-4 sm:p-8 border border-border/80 rounded-3xl bg-card/60 backdrop-blur-sm shadow-xl shadow-primary/5 flex justify-center hover:border-primary/30 transition-colors">
          <PricingTable
            collapseFeatures={false}
            appearance={{
              variables: {
                colorPrimary: "#fe5933",
                borderRadius: "0.625rem",
                fontFamily: '"Bricolage Grotesque", sans-serif',
              },
              elements: {
                card: "rounded-3xl border border-border/80 shadow-md bg-card transition-all",
                pricingTableCard: "rounded-3xl border border-border/80 shadow-md bg-card",
                pricingTableItem: "rounded-3xl border border-border/80 shadow-md bg-card",
                button: "bg-primary text-white hover:bg-primary/90 rounded-full font-semibold px-6 py-2.5 transition-all shadow-md",
                pricingTableButton: "bg-primary text-white hover:bg-primary/90 rounded-full font-semibold px-6 py-2.5 transition-all shadow-md",
                formButtonPrimary: "bg-primary text-white hover:bg-primary/90 rounded-full font-semibold transition-all shadow-md",
                badge: "bg-cta-gold text-black font-bold rounded-full px-3 py-1 text-xs shadow-xs",
                pricingTableBadge: "bg-cta-gold text-black font-bold rounded-full px-3 py-1 text-xs shadow-xs",
              },
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}
