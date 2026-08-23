// Stripe adapter (Visa, Mastercard, bank transfer). Mocked by default so the
// app runs offline. Set USE_MOCKS=false and STRIPE_SECRET_KEY in .env to use
// the real Stripe SDK - swap the body of charge() for a real
// stripe.paymentIntents.create() call and the rest of the checkout flow is
// unaffected since it only depends on this function's return shape.

import { randomUUID } from "crypto";

export type CardMethod = "card" | "bank_transfer";

export const stripeGateway = {
  async charge(params: { method: CardMethod; amountMinor: number; currency: string; reference: string }) {
    await new Promise((r) => setTimeout(r, 300));
    return {
      status: "settled" as const,
      providerRef: `pi_mock_${randomUUID().slice(0, 12)}`,
    };
  },
};
