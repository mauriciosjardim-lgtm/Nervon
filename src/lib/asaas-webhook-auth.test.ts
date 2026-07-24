import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidAsaasWebhookToken } from "./asaas-webhook-auth.ts";

describe("Asaas webhook authentication", () => {
  it("fails closed when ASAAS_WEBHOOK_TOKEN is absent", () => {
    assert.equal(isValidAsaasWebhookToken(undefined, null), false);
    assert.equal(isValidAsaasWebhookToken("", null), false);
    assert.equal(isValidAsaasWebhookToken(undefined, "attacker-controlled"), false);
  });

  it("rejects an absent or invalid request token", () => {
    assert.equal(isValidAsaasWebhookToken("configured-secret", null), false);
    assert.equal(isValidAsaasWebhookToken("configured-secret", "invalid-secret"), false);
  });

  it("accepts the configured request token", () => {
    assert.equal(isValidAsaasWebhookToken("configured-secret", "configured-secret"), true);
  });
});
