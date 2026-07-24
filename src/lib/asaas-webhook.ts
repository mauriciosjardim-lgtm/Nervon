import { isValidAsaasWebhookToken } from "./asaas-webhook-auth";

const PAID_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED_IN_CASH"]);
const PAID_STATUSES = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

export type AsaasPendingOrder = {
  asaas_payment_id: string;
  nome: string;
  email: string;
  empresa_nome: string;
  status: string;
};

export type AsaasWebhookDependencies = {
  expectedToken: string | undefined;
  claimOrder: (paymentId: string) => Promise<AsaasOrderClaim>;
  processOrder: (order: AsaasPendingOrder) => Promise<void>;
  schedule?: (task: Promise<void>) => void;
};

export type AsaasOrderClaim =
  | { state: "claimed"; order: AsaasPendingOrder }
  | { state: "missing" }
  | { state: "completed" }
  | { state: "in_progress" };

type AsaasWebhookBody = {
  event?: string;
  payment?: {
    id?: string;
    status?: string;
  };
};

function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function parseBody(request: Request): Promise<AsaasWebhookBody> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return request.json() as Promise<AsaasWebhookBody>;
  }

  const text = await request.text();
  const params = new URLSearchParams(text);
  const data = params.get("data");
  return data ? JSON.parse(decodeURIComponent(data)) : JSON.parse(text);
}

export async function handleAsaasWebhook(
  request: Request,
  dependencies: AsaasWebhookDependencies,
): Promise<Response> {
  const token = request.headers.get("asaas-access-token");
  if (!isValidAsaasWebhookToken(dependencies.expectedToken, token)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: AsaasWebhookBody;
  try {
    body = await parseBody(request);
  } catch {
    return json({ ok: true, warning: "parse failed" });
  }

  const event = body.event;
  const payment = body.payment;
  const paid =
    (event !== undefined && PAID_EVENTS.has(event)) ||
    (payment?.status !== undefined && PAID_STATUSES.has(payment.status));

  if (!paid || !payment?.id) {
    return json({ ok: true, ignored: true });
  }
  const paymentId = payment.id;

  const processPayment = async (): Promise<Response> => {
    const claim = await dependencies.claimOrder(paymentId);
    if (claim.state === "missing") {
      return json({ ok: true, skipped: "no order" });
    }
    if (claim.state === "completed") {
      return json({ ok: true, skipped: "already completed" });
    }
    if (claim.state === "in_progress") {
      return json({ ok: true, skipped: "in progress" });
    }

    try {
      await dependencies.processOrder(claim.order);
    } catch {
      return json({ error: "Provisioning failed" }, 500);
    }

    return json({ ok: true });
  };

  if (dependencies.schedule) {
    dependencies.schedule(
      processPayment()
        .then((response) => {
          if (response.status >= 500) {
            console.error("Asaas webhook provisioning failed.");
          }
        })
        .catch(() => {
          console.error("Asaas webhook provisioning failed.");
        }),
    );
    return json({ ok: true, accepted: true }, 202);
  }

  return processPayment();
}
