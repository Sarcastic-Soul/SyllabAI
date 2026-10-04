import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { getUserPlan } from "@/lib/billing/plan";
import { FREE_COURSE_LIMIT, PRO_DAYS, PRO_PRICE_LABEL } from "@/lib/billing/config";
import PlanCards from "@/components/billing/PlanCards";
import UpgradeButton from "@/components/billing/UpgradeButton";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

const Subscription = async () => {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const [plan, paid] = await Promise.all([
    getUserPlan(user.id),
    db.query.payments.findMany({
      where: eq(payments.userId, user.id),
      orderBy: [desc(payments.createdAt)],
      limit: 10,
    }),
  ]);
  const paidRows = paid.filter((p) => p.status === "paid");

  const proStatus = plan.proUntil
    ? `Pro until ${formatDate(plan.proUntil)}`
    : plan.isPro
      ? "Pro, with no end date"
      : "You are on Basic";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12">
      <header className="max-w-[60ch] space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">Plans</h1>
        <p className="leading-relaxed text-muted-foreground">
          The Basic plan lets you generate {FREE_COURSE_LIMIT} courses. Pro
          removes that limit for {PRO_DAYS} days per payment.
        </p>
      </header>

      <div className="mt-8">
        <PlanCards
          proStatus={proStatus}
          proAction={
            <UpgradeButton
              label={
                plan.proUntil
                  ? `Add ${PRO_DAYS} more days for ${PRO_PRICE_LABEL}`
                  : `Get Pro for ${PRO_PRICE_LABEL}`
              }
              description={`Pro for ${PRO_DAYS} days`}
              email={user.email}
              name={user.name}
            />
          }
        />
      </div>

      {paidRows.length > 0 && (
        <section aria-labelledby="payments-heading" className="mt-12">
          <h2 id="payments-heading" className="text-xl font-semibold">
            Payments
          </h2>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {paidRows.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm sm:px-5"
              >
                <span>{formatDate(p.paidAt ?? p.createdAt)}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {p.paymentId}
                </span>
                <span className="font-mono tabular-nums">₹{p.amount / 100}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
};

export default Subscription;
