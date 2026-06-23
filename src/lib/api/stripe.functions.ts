import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStripe } from "../stripe.server";

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ origin: z.string().url() }))
  .handler(async ({ data }) => {
    const stripe = getStripe();
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) throw new Error("STRIPE_PRICE_ID not set");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${data.origin}/onboarding?pago=true`,
      cancel_url: `${data.origin}/home#precos`,
    });

    return { url: session.url };
  });
