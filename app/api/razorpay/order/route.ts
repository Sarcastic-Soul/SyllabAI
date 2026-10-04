import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { PRO_PRICE_PAISE } from "@/lib/billing/config";
import { createOrder, getRazorpayKeyId } from "@/lib/billing/razorpay";

/** Creates a Razorpay order for one Pro pass and records it as "created". */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDb = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { id: true },
    });
    if (!userDb) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const order = await createOrder({
      amount: PRO_PRICE_PAISE,
      // Razorpay caps receipts at 40 characters
      receipt: `pro_${Date.now()}_${user.id}`.slice(0, 40),
      userId: user.id,
    });

    await db.insert(payments).values({
      userId: user.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not start the payment" }, { status: 500 });
  }
}
