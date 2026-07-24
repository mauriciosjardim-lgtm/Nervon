import { createFileRoute } from "@tanstack/react-router";
import { handleCanonicalAsaasWebhook } from "@/lib/asaas-webhook-handler.server";

export const Route = createFileRoute("/api/asaas/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => handleCanonicalAsaasWebhook(request),
    },
  },
});
