import { cache } from "react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { PRO_DAYS } from "./config";

export type UserPlan = {
  isPro: boolean;
  /** End of the paid Pro period, if there is one. */
  proUntil: Date | null;
};

export function resolvePlan(
  row: { subscriptionPlan: string; proUntil: Date | null } | undefined,
  now: Date = new Date(),
): UserPlan {
  if (!row) return { isPro: false, proUntil: null };

  const paid = row.proUntil !== null && row.proUntil > now;
  return {
    // subscriptionPlan "pro" is a manual grant with no end date
    isPro: paid || row.subscriptionPlan === "pro",
    proUntil: paid ? row.proUntil : null,
  };
}

export const getUserPlan = cache(async (userId: string): Promise<UserPlan> => {
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { subscriptionPlan: true, proUntil: true },
  });
  return resolvePlan(row);
});

/**
 * Marks the order as paid and adds PRO_DAYS to the user's Pro time, in one
 * statement. Safe to call twice for the same order (browser callback and
 * webhook both call it): only the first call changes anything.
 */
export async function markOrderPaid(orderId: string, paymentId: string): Promise<boolean> {
  const result = await db.execute(sql`
    WITH paid AS (
      UPDATE payments
      SET status = 'paid', payment_id = ${paymentId}, paid_at = now()
      WHERE order_id = ${orderId} AND status <> 'paid'
      RETURNING user_id
    )
    UPDATE users
    SET pro_until = GREATEST(COALESCE(users.pro_until, now()), now()) + make_interval(days => ${PRO_DAYS}::int)
    FROM paid
    WHERE users.id = paid.user_id
    RETURNING users.id
  `);
  return result.rows.length > 0;
}

export async function markOrderFailed(orderId: string): Promise<void> {
  await db.execute(sql`
    UPDATE payments SET status = 'failed'
    WHERE order_id = ${orderId} AND status = 'created'
  `);
}
