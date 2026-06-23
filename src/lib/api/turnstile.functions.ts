import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) throw new Error("TURNSTILE_SECRET_KEY not set");

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: data.token }),
    });
    const json = await res.json() as { success: boolean };
    return { success: json.success };
  });
