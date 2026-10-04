import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { verifyPaymentSignature, verifyWebhookSignature } from "./razorpay";

const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("hex");

beforeAll(() => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_unit";
  process.env.RAZORPAY_KEY_SECRET = "unit_key_secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = "unit_webhook_secret";
});

describe("verifyPaymentSignature", () => {
  it("accepts a signature made with the key secret", () => {
    const signature = sign("order_1|pay_1", "unit_key_secret");
    expect(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature })).toBe(true);
  });

  it("rejects a signature for a different order", () => {
    const signature = sign("order_2|pay_1", "unit_key_secret");
    expect(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature })).toBe(false);
  });

  it("rejects junk", () => {
    expect(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature: "nope" })).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  it("accepts a body signed with the webhook secret", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyWebhookSignature(body, sign(body, "unit_webhook_secret"))).toBe(true);
  });

  it("rejects a body that was changed after signing", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyWebhookSignature(body + " ", sign(body, "unit_webhook_secret"))).toBe(false);
  });
});
