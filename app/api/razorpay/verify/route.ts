import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { markOrderPaid } from "@/lib/billing/plan";
import { verifyPaymentSignature } from "@/lib/billing/razorpay";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/** Called by the browser right after Razorpay Checkout reports success. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    const valid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      return NextResponse.json({ error: "Payment signature did not match" }, { status: 400 });
    }

    const payment = await db.query.payments.findFirst({
      where: and(eq(payments.orderId, razorpay_order_id), eq(payments.userId, user.id)),
      columns: { id: true },
    });
    if (!payment) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await markOrderPaid(razorpay_order_id, razorpay_payment_id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not confirm the payment" }, { status: 500 });
  }
}
