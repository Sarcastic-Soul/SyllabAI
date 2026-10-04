import { createHmac, timingSafeEqual } from "node:crypto";
import { PRO_CURRENCY, RAZORPAY_PROJECT_TAG } from "./config";

const API_BASE = "https://api.razorpay.com/v1";

function getKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing");
  }
  return { keyId, keySecret };
}

export function getRazorpayKeyId(): string {
  return getKeys().keyId;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

export async function createOrder(params: {
  amount: number;
  receipt: string;
  userId: string;
}): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getKeys();

  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: PRO_CURRENCY,
      receipt: params.receipt,
      notes: { project: RAZORPAY_PROJECT_TAG, userId: params.userId },
    }),
  });

  if (!res.ok) {
    throw new Error(`Razorpay order failed with status ${res.status}`);
  }
  return (await res.json()) as RazorpayOrder;
}

function hmacMatches(payload: string, secret: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checks the signature Razorpay Checkout hands back to the browser. */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  return hmacMatches(
    `${params.orderId}|${params.paymentId}`,
    getKeys().keySecret,
    params.signature,
  );
}

/** Checks the X-Razorpay-Signature header against the raw webhook body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is missing");
  return hmacMatches(rawBody, secret, signature);
}
