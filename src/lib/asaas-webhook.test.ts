import { describe, expect, test } from "bun:test";
import {
  handleAsaasWebhook,
  type AsaasPendingOrder,
  type AsaasWebhookDependencies,
} from "./asaas-webhook";

const order: AsaasPendingOrder = {
  asaas_payment_id: "pay_123",
  nome: "Cliente",
  email: "cliente@example.test",
  empresa_nome: "Produtora",
  status: "pending",
};

function request(body: unknown, token = "secret"): Request {
  return new Request("https://makershub.test/api/asaas/webhook", {
    method: "POST",
    headers: {
      "asaas-access-token": token,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function dependencies(overrides: Partial<AsaasWebhookDependencies> = {}): AsaasWebhookDependencies {
  return {
    expectedToken: "secret",
    findOrder: async () => order,
    processOrder: async () => {},
    ...overrides,
  };
}

describe("canonical Asaas webhook", () => {
  test("rejects an invalid token before reading the order", async () => {
    let queried = false;
    const response = await handleAsaasWebhook(
      request({ event: "PAYMENT_RECEIVED", payment: { id: "pay_123" } }, "invalid"),
      dependencies({
        findOrder: async () => {
          queried = true;
          return order;
        },
      }),
    );

    expect(response.status).toBe(401);
    expect(queried).toBeFalse();
  });

  test("ignores an irrelevant event", async () => {
    const response = await handleAsaasWebhook(
      request({ event: "PAYMENT_CREATED", payment: { id: "pay_123" } }),
      dependencies(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, ignored: true });
  });

  test("skips a payment without a pending order", async () => {
    const response = await handleAsaasWebhook(
      request({ event: "PAYMENT_RECEIVED", payment: { id: "pay_missing" } }),
      dependencies({ findOrder: async () => null }),
    );

    expect(await response.json()).toEqual({ ok: true, skipped: "no order" });
  });

  test("skips an order already completed", async () => {
    const response = await handleAsaasWebhook(
      request({ event: "PAYMENT_RECEIVED", payment: { id: "pay_123" } }),
      dependencies({ findOrder: async () => ({ ...order, status: "completed" }) }),
    );

    expect(await response.json()).toEqual({ ok: true, skipped: "already completed" });
  });

  test("processes a paid order once", async () => {
    let processed = 0;
    const response = await handleAsaasWebhook(
      request({ event: "PAYMENT_CONFIRMED", payment: { id: "pay_123" } }),
      dependencies({
        processOrder: async () => {
          processed += 1;
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(processed).toBe(1);
  });

  test("returns a generic 500 so Asaas retries provisioning failures", async () => {
    const response = await handleAsaasWebhook(
      request({ event: "PAYMENT_RECEIVED", payment: { id: "pay_123" } }),
      dependencies({
        processOrder: async () => {
          throw new Error("database password and internal details");
        },
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Provisioning failed" });
  });
});
