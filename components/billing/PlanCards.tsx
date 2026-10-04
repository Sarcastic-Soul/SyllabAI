import type { ReactNode } from "react";
import { FREE_COURSE_LIMIT, PRO_DAYS, PRO_PRICE_LABEL } from "@/lib/billing/config";

type PlanCardsProps = {
  /** Button or link under the Basic plan. */
  basicAction?: ReactNode;
  /** Button or link under the Pro plan. */
  proAction: ReactNode;
  /** Short line above the Pro action, e.g. "Pro until 2 Nov 2026". */
  proStatus?: ReactNode;
};

const basicFeatures = [
  `${FREE_COURSE_LIMIT} courses at a time`,
  "Lessons, quizzes and flashcards for every chapter",
  "Study buddy that answers from your uploads",
];

const proFeatures = [
  "No course limit",
  "Everything in Basic",
  `Lasts ${PRO_DAYS} days, then drops back to Basic`,
  "One payment, nothing renews by itself",
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 border-t border-foreground/20">
      {items.map((item) => (
        <li key={item} className="border-b border-border py-3 text-[15px]">
          {item}
        </li>
      ))}
    </ul>
  );
}

/** The two plans, side by side. Used on the landing page and on /subscription. */
export default function PlanCards({ basicAction, proAction, proStatus }: PlanCardsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section
        aria-labelledby="plan-basic"
        className="flex flex-col rounded-xl border border-border bg-card p-6 sm:p-7"
      >
        <h3 id="plan-basic" className="text-xl font-semibold">
          Basic
        </h3>
        <p className="mt-3 font-mono text-4xl font-medium leading-none tabular-nums">
          ₹0
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Free, no card needed</p>
        <FeatureList items={basicFeatures} />
        {basicAction && <div className="mt-auto pt-6">{basicAction}</div>}
      </section>

      <section
        aria-labelledby="plan-pro"
        className="flex flex-col rounded-xl border border-foreground/40 bg-card p-6 sm:p-7"
      >
        <h3 id="plan-pro" className="text-xl font-semibold">
          Pro
        </h3>
        <p className="mt-3 font-mono text-4xl font-medium leading-none tabular-nums">
          {PRO_PRICE_LABEL}
          <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
            for {PRO_DAYS} days
          </span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Paid through Razorpay: UPI, cards or netbanking
        </p>
        <FeatureList items={proFeatures} />
        <div className="mt-auto pt-6">
          {proStatus && (
            <p className="mb-3 font-mono text-xs text-muted-foreground">{proStatus}</p>
          )}
          {proAction}
        </div>
      </section>
    </div>
  );
}
