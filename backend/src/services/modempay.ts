// ModemPay adapter (Wave / AfriMoney / QMoney). Document 07 flags that ModemPay
// and Wachitt do not publish integration or transaction fees publicly, so this
// ships mocked. Set USE_MOCKS=false and MODEMPAY_API_KEY in .env once you have
// real merchant credentials - the charge() signature is written to match a
// typical hosted-checkout mobile money gateway so the swap stays contained.

import { randomUUID } from "crypto";

export type Wallet = "wave" | "afrimoney" | "qmoney";

export const modempay = {
  async charge(params: { wallet: Wallet; amountMinor: number; currency: string; reference: string }) {
    // Real integration: POST to ModemPay's hosted checkout / charge endpoint and
    // return their transaction reference. Mocked here as an instant success so
    // the booking flow completes end to end without live credentials.
    await new Promise((r) => setTimeout(r, 300));
    return {
      status: "settled" as const,
      providerRef: `modempay_${randomUUID().slice(0, 10)}`,
    };
  },
};
