import Link from "next/link";
import PlanCards from "@/components/billing/PlanCards";
import { btnLg, btnOutline, btnPrimary, container } from "./styles";

export default function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-16 border-t border-border">
      <div className={`${container} py-20 lg:py-24`}>
        <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Pricing
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          Basic is free and holds 3 courses at a time; delete one to make room
          for another. Pro removes the course limit.
        </p>

        <div className="mt-10 max-w-4xl">
          <PlanCards
            basicAction={
              <Link href="/auth/sign-up" className={`${btnOutline} ${btnLg} w-full sm:w-auto`}>
                Start free
              </Link>
            }
            // /subscription sends signed-out visitors to sign-in first
            proAction={
              <Link href="/subscription" className={`${btnPrimary} ${btnLg} w-full sm:w-auto`}>
                Get Pro
              </Link>
            }
          />
        </div>
      </div>
    </section>
  );
}
