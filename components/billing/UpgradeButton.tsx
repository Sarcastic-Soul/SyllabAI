"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type CheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type CheckoutOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { email?: string; name?: string };
  theme?: { color: string };
  handler: (response: CheckoutResponse) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: CheckoutOptions) => { open: () => void };
  }
}

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

type UpgradeButtonProps = {
  label: string;
  description: string;
  email: string;
  name?: string | null;
};

export default function UpgradeButton({ label, description, email, name }: UpgradeButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPayment = async () => {
    setBusy(true);
    setError(null);

    try {
      const [orderRes] = await Promise.all([
        fetch("/api/razorpay/order", { method: "POST" }),
        loadCheckout(),
      ]);
      if (!orderRes.ok || !window.Razorpay) {
        throw new Error("Could not start the payment. Try again.");
      }
      const order: { orderId: string; amount: number; currency: string; keyId: string } =
        await orderRes.json();

      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "SyllabAI",
        description,
        prefill: { email, name: name ?? undefined },
        theme: { color: "#e8471f" },
        handler: async (response) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (!verifyRes.ok) {
            setError(
              "Payment went through but we could not confirm it yet. Reload in a minute; Pro unlocks once Razorpay confirms.",
            );
          }
          setBusy(false);
          router.refresh();
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the payment. Try again.");
      setBusy(false);
    }
  };

  return (
    <div>
      <Button size="lg" onClick={startPayment} disabled={busy} className="w-full sm:w-auto">
        {busy ? "Opening payment…" : label}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
