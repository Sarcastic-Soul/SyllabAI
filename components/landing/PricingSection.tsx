"use client";

import { PricingTable } from "@clerk/nextjs";
import { container } from "./styles";

export default function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-16 border-t border-border">
      <div className={`${container} py-20 lg:py-24`}>
        <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Pricing
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          Basic is free and holds 2 courses at a time; delete one to make room
          for another. Pro removes the course limit.
        </p>

        <div className="mt-10 max-w-4xl [&_.cl-pricingTableCard]:border [&_.cl-pricingTableCard]:border-solid [&_.cl-pricingTableCard]:border-foreground/15 [&_.cl-pricingTableCard]:shadow-none!">
          <PricingTable
            collapseFeatures={false}
            appearance={{
              variables: {
                colorPrimary: "#e8471f",
                borderRadius: "0.5rem",
                fontFamily: "var(--font-geist), ui-sans-serif, sans-serif",
              },
            }}
          />
        </div>
      </div>
    </section>
  );
}
