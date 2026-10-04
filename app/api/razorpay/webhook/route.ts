import { NextResponse } from "next/server";
import { z } from "zod";
import { RAZORPAY_PROJECT_TAG } from "@/lib/billing/config";
import { markOrderFailed, markOrderPaid } from "@/lib/billing/plan";
import { verifyWebhookSignature } from "@/lib/billing/razorpay";

const eventSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string().nullish(),
        // Razorpay sends [] when there are no notes
        notes: z.unknown(),
      }),
    }),
  }),
});

/**
 * Backup path for payments: covers the case where the user pays but closes
 * the tab before the browser calls /api/razorpay/verify.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  try {
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const parsed = eventSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) {
      // An event type we did not ask for; acknowledge so Razorpay stops retrying
      return NextResponse.json({ ok: true, ignored: true });
    }

    const { event, payload } = parsed.data;
    const payment = payload.payment.entity;
    const notes = payment.notes as { project?: unknown } | null;

    // The Razorpay account is shared with another project; skip its payments
    const isOurs =
      typeof notes === "object" && notes !== null && notes.project === RAZORPAY_PROJECT_TAG;
    if (!isOurs || !payment.order_id) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Both helpers only touch orders that this app created and stored
    if (event === "payment.captured") {
      await markOrderPaid(payment.order_id, payment.id);
    } else if (event === "payment.failed") {
      await markOrderFailed(payment.order_id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error instanceof Error ? error.message : error);
    // A 500 makes Razorpay retry later
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
