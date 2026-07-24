import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("all Asaas webhook routes delegate to one canonical server handler", () => {
  const server = readFileSync("src/server.ts", "utf8");
  const fileRoute = readFileSync("src/routes/api/asaas/webhook.ts", "utf8");

  expect(server).toContain('from "./lib/asaas-webhook-handler.server"');
  expect(fileRoute).toContain('from "@/lib/asaas-webhook-handler.server"');
  expect(server).toContain("handleCanonicalAsaasWebhook(request)");
  expect(fileRoute).toContain("handleCanonicalAsaasWebhook(request)");
  expect(fileRoute).not.toContain("ASAAS_WEBHOOK_TOKEN");
  expect(fileRoute).not.toContain("processarPagamento");
});
