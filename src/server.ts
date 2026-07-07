import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { processarPagamento, supabaseUrl, supabaseKey } from "./lib/api/asaas.functions";
import { createClient } from "@supabase/supabase-js";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

const PAGO = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED_IN_CASH"]);

async function handleAsaasWebhook(request: Request): Promise<Response> {
  const json = <T>(body: T, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (expectedToken) {
    const token = request.headers.get("asaas-access-token");
    if (token !== expectedToken) return json({ error: "Unauthorized" }, 401);
  }

  let body: any;
  try {
    const ct = request.headers.get("content-type") ?? "";
    if (ct.includes("application/x-www-form-urlencoded")) {
      // Asaas envia o payload como form-urlencoded com campo "data" contendo JSON
      const text = await request.text();
      const params = new URLSearchParams(text);
      const data = params.get("data");
      body = data ? JSON.parse(decodeURIComponent(data)) : JSON.parse(text);
    } else {
      body = await request.json();
    }
  } catch (e) {
    return json({ ok: true, warning: "parse failed" });
  }

  const event   = body?.event as string | undefined;
  const payment = body?.payment;

  // Aceita PAYMENT_RECEIVED ou payment.status RECEIVED/CONFIRMED
  const pagamentoConfirmado =
    (event && PAGO.has(event)) ||
    (payment?.status && ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(payment.status));

  if (!pagamentoConfirmado || !payment?.id) {
    console.log("[webhook] evento ignorado:", event, payment?.status);
    return json({ ok: true, ignored: true });
  }

  const paymentId = payment.id as string;
  const sb = createClient(supabaseUrl(), supabaseKey());

  const { data: order, error: orderErr } = await sb
    .from("pending_orders")
    .select("*")
    .eq("asaas_payment_id", paymentId)
    .single();

  if (orderErr || !order) {
    console.log("[webhook] pedido não encontrado para paymentId:", paymentId);
    return json({ ok: true, skipped: "no order" });
  }

  if (order.status === "completed") {
    return json({ ok: true, skipped: "already completed" });
  }

  try {
    // Sem senha: o fluxo Pix nunca envia/persiste senha. processarPagamento
    // cria o usuário com senha temporária aleatória e envia link seguro de
    // definição de senha por e-mail. (Senhas antigas em pending_orders são
    // ignoradas de propósito — nunca mais são usadas.)
    await processarPagamento({
      paymentId:  order.asaas_payment_id,
      nome:       order.nome,
      email:      order.email,
      empresa:    order.empresa_nome,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error(`[webhook] erro ao processar ${paymentId}:`, msg);
    // Retorna 500 para o Asaas retentar
    return json({ error: msg }, 500);
  }

  return json({ ok: true });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// Headers de segurança aplicados a TODAS as respostas do Worker.
// (Sem CSP nesta fase — scripts/estilos precisam ser inventariados antes.)
function withSecurityHeaders(response: Response, isHttps: boolean): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isHttps) {
    // só em produção HTTPS — HSTS em http local atrapalharia o dev
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    const isHttps = url.protocol === "https:";

    // Força HTTPS em produção: acesso via http:// (link antigo, digitação na
    // barra) recebe 301 pro equivalente https antes de qualquer conteúdo.
    // localhost fica de fora pra não quebrar dev/preview.
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (!isHttps && !isLocal) {
      url.protocol = "https:";
      return new Response(null, {
        status: 301,
        headers: { Location: url.toString() },
      });
    }

    if (url.pathname === "/api/asaas/webhook" && request.method === "POST") {
      return withSecurityHeaders(await handleAsaasWebhook(request), isHttps);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response), isHttps);
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        isHttps,
      );
    }
  },
};
