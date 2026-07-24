import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { processarPagamento, supabaseUrl, supabaseKey } from "./lib/api/asaas.functions";
import { isValidAsaasWebhookToken } from "./lib/asaas-webhook-auth";
import { createClient } from "@supabase/supabase-js";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type ExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
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

async function processAsaasPayment(paymentId: string): Promise<void> {
  const sb = createClient(supabaseUrl(), supabaseKey());

  const { data: order, error: orderErr } = await sb
    .from("pending_orders")
    .select("*")
    .eq("asaas_payment_id", paymentId)
    .single();

  if (orderErr || !order) {
    console.log("[webhook] pedido não encontrado para paymentId:", paymentId);
    return;
  }

  if (order.status === "completed") return;

  // Sem senha: o fluxo Pix nunca envia/persiste senha. processarPagamento
  // cria o usuário com senha temporária aleatória e envia link seguro de
  // definição de senha por e-mail. (Senhas antigas em pending_orders são
  // ignoradas de propósito — nunca mais são usadas.)
  await processarPagamento({
    paymentId: order.asaas_payment_id,
    nome: order.nome,
    email: order.email,
    empresa: order.empresa_nome,
  });
}

async function handleAsaasWebhook(request: Request, ctx: ExecutionContext): Promise<Response> {
  const json = <T>(body: T, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const token = request.headers.get("asaas-access-token");
  if (!isValidAsaasWebhookToken(expectedToken, token)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: {
    event?: string;
    payment?: { id?: string; status?: string };
  };
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

  const event = body?.event as string | undefined;
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

  // O Asaas precisa receber o 2xx rapidamente. Consultas ao banco, criação da
  // conta e envio de e-mail continuam após a resposta no runtime do Cloudflare.
  // processarPagamento é idempotente e o polling do checkout é a rede de
  // segurança caso esse processamento assíncrono falhe.
  ctx.waitUntil(
    processAsaasPayment(paymentId).catch((err) => {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error(`[webhook] erro ao processar ${paymentId}:`, msg);
    }),
  );

  return json({ ok: true, accepted: true });
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

const CONTENT_SECURITY_POLICY_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://challenges.cloudflare.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https://smsqhbbbyjacatxvihks.supabase.co wss://smsqhbbbyjacatxvihks.supabase.co https://connect.facebook.net https://www.facebook.com https://challenges.cloudflare.com https://api.stripe.com",
  "frame-src 'self' https://drive.google.com https://docs.google.com https://player.vimeo.com https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

// Headers de segurança aplicados a TODAS as respostas do Worker.
function withSecurityHeaders(response: Response, isHttps: boolean): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Primeiro em observação: permite inventariar violações reais sem interromper
  // login, fontes, previews do Drive/Vimeo/YouTube ou propostas existentes.
  headers.set("Content-Security-Policy-Report-Only", CONTENT_SECURITY_POLICY_REPORT_ONLY);
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
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
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

    // Links antigos podiam carregar o segredo do cofre no path. O portal já
    // resolve o acesso pela sessão autenticada, portanto removemos o token antes
    // de renderizar a aplicação ou disparar recursos externos.
    if (/^\/portal\/[a-f0-9]{24,64}$/i.test(url.pathname)) {
      return withSecurityHeaders(
        new Response(null, {
          status: 302,
          headers: { Location: `${url.origin}/portal/acesso${url.search}` },
        }),
        isHttps,
      );
    }

    if (url.pathname === "/api/asaas/webhook" && request.method === "POST") {
      return withSecurityHeaders(await handleAsaasWebhook(request, ctx), isHttps);
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
