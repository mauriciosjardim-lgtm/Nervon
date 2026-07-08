import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rateLimit } from "./rateLimit";

// Integração Asaas (https://docs.asaas.com)
// Auth por header `access_token`. Aceita CPF (pessoa física).
//
// FLUXO CHECKOUT (novos usuários):
//   iniciarPix  → cria pending_order + cobrança Pix (QR Code)
//   checarPix   → polling status Asaas
//   checarPedido→ polling status pending_order (preenchido pelo webhook)
//   pagarCartao → cria pending_order + cobra cartão + cria conta imediatamente
//
// FLUXO UPGRADE (usuários com trial expirado):
//   criarPix    → cobrança Pix simples (sem pending_order)
//   checarPix   → compartilhado
//   finalizarPix→ verifica + libera empresa

function base(): string {
  return process.env.ASAAS_SANDBOX === "true"
    ? "https://api-sandbox.asaas.com/v3"
    : "https://api.asaas.com/v3";
}

function apiKey(): string {
  const k = process.env.ASAAS_API_KEY;
  if (!k) throw new Error("ASAAS_API_KEY not set");
  return k;
}

export function supabaseUrl(): string {
  return (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? process.env.SUPABASE_URL ?? "";
}

export function supabaseKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

function admin() {
  return createClient(supabaseUrl(), supabaseKey());
}

const onlyDigits = (s: string) => s.replace(/\D/g, "");

async function asaas(path: string, init: RequestInit) {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      access_token: apiKey(),
      "Content-Type": "application/json",
      "User-Agent": "MakersHub/1.0",
      ...(init.headers ?? {}),
    },
  });
  const json = (await res.json()) as any;
  if (!res.ok) {
    const msg = json?.errors?.[0]?.description ?? `Asaas ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

const PRECO = 97;
const PAGO = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);
const RESEND_FROM = "MakersHub <equipe@makershub.app.br>";

// Senha temporária criptograficamente aleatória (só existe em memória; o
// usuário define a senha real pelo link de recuperação enviado por e-mail).
function senhaAleatoria(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Gera link de definição de senha (Supabase Admin) e envia via Resend.
// NUNCA retorna o link ao chamador nem o registra em logs.
async function enviarLinkDefinicaoSenha(sb: ReturnType<typeof admin>, email: string, nome: string) {
  const { data, error } = await sb.auth.admin.generateLink({
    type: "recovery",
    email,
    // /auth/reset processa o link e mostra o formulário de nova senha
    // (redirecionar pro /login deixava o usuário sem forma de definir a senha).
    options: { redirectTo: `${process.env.SITE_URL ?? "https://makershub.app.br"}/auth/reset` },
  });
  const link = data?.properties?.action_link;
  if (error || !link) {
    console.error("[pagamento] falha ao gerar link de definição de senha:", error?.message ?? "sem link");
    return;
  }
  const rKey = process.env.RESEND_API_KEY ?? "";
  if (!rKey) {
    console.error("[pagamento] RESEND_API_KEY não configurada; e-mail de definição de senha não enviado");
    return;
  }
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${rKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: email,
      subject: "Sua conta MakersHub está pronta — crie sua senha",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#111">Pagamento confirmado 🎉</h2>
          <p>Olá${nome ? `, <strong>${nome.replace(/</g, "&lt;")}</strong>` : ""}! Sua conta no MakersHub foi criada.</p>
          <p>Para acessar, defina sua senha pelo botão abaixo:</p>
          <p style="margin:28px 0">
            <a href="${link}" style="background:#90F826;color:#0d0f0a;font-weight:bold;padding:12px 24px;border-radius:10px;text-decoration:none">Criar minha senha</a>
          </p>
          <p style="color:#666;font-size:13px">Se você não fez esta compra, ignore este e-mail.</p>
        </div>`,
    }),
  });
  if (!resp.ok) {
    // loga só o status — nunca o link
    console.error("[pagamento] Resend falhou ao enviar link de senha, status:", resp.status);
  }
}

// Cria auth user + empresa + usuario via SQL function SECURITY DEFINER.
// Chamada tanto pelo webhook (Pix) quanto direto no handler (Card).
// `senha` é opcional: cartão (síncrono) usa a senha da requisição, em memória;
// Pix usa senha temporária aleatória + link seguro de definição por e-mail.
export async function processarPagamento({
  paymentId,
  nome,
  email,
  empresa,
  senha,
}: {
  paymentId: string;
  nome: string;
  email: string;
  empresa: string;
  senha?: string;
}) {
  const sb = admin();

  // Idempotência: pedido já completado?
  const { data: existing } = await sb
    .from("pending_orders")
    .select("status")
    .eq("asaas_payment_id", paymentId)
    .single();
  if (existing?.status === "completed") return;

  // Cria auth user
  const { data: created, error: authErr } = await sb.auth.admin.createUser({
    email,
    password: senha ?? senhaAleatoria(),
    email_confirm: true,
    user_metadata: { nome },
  });

  if (authErr || !created.user) {
    const msg = authErr?.message ?? "Erro ao criar usuário.";
    await sb
      .from("pending_orders")
      .update({ status: "failed", error_msg: msg })
      .eq("asaas_payment_id", paymentId);
    throw new Error(msg);
  }

  // Cria empresa + usuario via função SECURITY DEFINER (bypasssa RLS)
  const { error: rpcErr } = await sb.rpc("criar_conta_paga", {
    p_auth_user_id: created.user.id,
    p_nome: nome,
    p_email: email,
    p_empresa_nome: empresa,
    p_payment_id: paymentId,
  });

  if (rpcErr) {
    await sb.auth.admin.deleteUser(created.user.id).catch(() => {});
    await sb
      .from("pending_orders")
      .update({ status: "failed", error_msg: rpcErr.message })
      .eq("asaas_payment_id", paymentId);
    throw new Error(rpcErr.message);
  }

  // Pix (sem senha da requisição): envia link seguro de definição de senha.
  // Falha no envio não desfaz a conta — o usuário ainda pode usar
  // "Esqueci minha senha" no login (mesmo fluxo de recuperação).
  if (!senha) {
    await enviarLinkDefinicaoSenha(sb, email, nome).catch((err) => {
      console.error("[pagamento] erro ao enviar e-mail de definição de senha:", err instanceof Error ? err.message : err);
    });
  }
}

// Libera empresa de usuário logado (upgrade trial → vitalício).
async function liberarEmpresa(sb: ReturnType<typeof admin>, userId: string) {
  const { data: usuario } = await sb
    .from("usuarios")
    .select("empresa_id")
    .eq("id", userId)
    .single();
  if (usuario?.empresa_id) {
    await sb.from("empresas").update({ trial_expires_at: null }).eq("id", usuario.empresa_id);
  }
}

// ─────────────────── CHECKOUT: PIX ───────────────────

export const iniciarPix = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      nome:     z.string().min(1),
      email:    z.string().email(),
      cpfCnpj: z.string().min(11),
      empresa:  z.string().min(1),
      // SEM senha: Pix é assíncrono e a senha nunca é enviada nem persistida.
      // Após a confirmação, o usuário define a senha por link seguro (e-mail).
    }),
  )
  .handler(async ({ data }) => {
    // Endpoint público: sem limite, um bot cria clientes/cobranças em massa no Asaas.
    rateLimit("checkout-pix", 10, 60 * 60_000);
    const sb = admin();
    const hoje = new Date().toISOString().slice(0, 10);

    const cliente = await asaas("/customers", {
      method: "POST",
      body: JSON.stringify({ name: data.nome, cpfCnpj: onlyDigits(data.cpfCnpj), email: data.email }),
    });

    const cobranca = await asaas("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: cliente.id,
        billingType: "PIX",
        value: PRECO,
        dueDate: hoje,
        description: "MakersHub — acesso anual",
      }),
    });

    // CRÍTICO: persiste o pedido ANTES de buscar o QR. Se o QR falhar (ex.: conta
    // Asaas sem chave Pix), a cobrança já existe e o cliente pode pagar pelo
    // invoiceUrl/e-mail — o webhook acha este pedido e provisiona a conta.
    await sb.from("pending_orders").insert({
      asaas_payment_id: cobranca.id,
      nome:             data.nome.trim(),
      email:            data.email.trim(),
      empresa_nome:     data.empresa.trim(),
      cpf:              onlyDigits(data.cpfCnpj),
      senha:            null, // NUNCA armazenar senha em pending_orders
      billing_type:     "PIX",
      status:           "pending",
    });

    // QR Code é best-effort — não pode derrubar o checkout
    let brCode = "", brCodeBase64 = "", expiresAt = "", qrErro: string | null = null;
    try {
      const qr = await asaas(`/payments/${cobranca.id}/pixQrCode`, { method: "GET" });
      brCode       = (qr.payload as string) ?? "";
      brCodeBase64 = qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : "";
      expiresAt    = (qr.expirationDate as string) ?? "";
    } catch (e) {
      qrErro = e instanceof Error ? e.message : "QR Code indisponível";
    }

    return {
      id:           cobranca.id as string,
      brCode,
      brCodeBase64,
      expiresAt,
      invoiceUrl:   (cobranca.invoiceUrl as string) ?? "",
      qrErro,
    };
  });

// ─────────────────── CHECKOUT: STATUS ───────────────────

export const checarPix = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const p = await asaas(`/payments/${data.id}`, { method: "GET" });
    return { status: p.status as string };
  });

// Rede de segurança: se o webhook da Asaas atrasar, falhar ou ficar
// "interrompido" (a Asaas pausa entrega após falhas repetidas), o cliente
// pagou mas nunca teria a conta criada — o polling do checkout ficaria
// preso em "pending" pra sempre. Aqui, a cada consulta de um pedido ainda
// pendente, confere o status direto na Asaas; se já estiver pago,
// processa na hora (processarPagamento é idempotente).
export const checarPedido = createServerFn({ method: "POST" })
  .inputValidator(z.object({ paymentId: z.string() }))
  .handler(async ({ data }) => {
    const sb = admin();
    const { data: order } = await sb
      .from("pending_orders")
      .select("*")
      .eq("asaas_payment_id", data.paymentId)
      .single();

    if (order && order.status === "pending") {
      try {
        const cobranca = await asaas(`/payments/${data.paymentId}`, { method: "GET" });
        if (PAGO.has(cobranca.status)) {
          await processarPagamento({
            paymentId: order.asaas_payment_id,
            nome:      order.nome,
            email:     order.email,
            empresa:   order.empresa_nome,
            senha:     order.senha ?? "",
          });
          return { status: "completed" as const, error: null };
        }
      } catch (err) {
        console.error("[checarPedido] falha ao reconferir na Asaas:", err instanceof Error ? err.message : err);
      }
    }

    return {
      status: (order?.status ?? "pending") as "pending" | "completed" | "failed",
      error:  order?.error_msg ?? null,
    };
  });

// ─────────────────── CHECKOUT: CARTÃO ───────────────────

// Cartão é síncrono: cria pending_order → cobra → cria conta imediatamente.
// Webhook chegará depois e criar_conta_paga é idempotente → no-op.
export const pagarCartao = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      nome:     z.string().min(1),
      email:    z.string().email(),
      cpfCnpj: z.string().min(11),
      empresa:  z.string().min(1),
      senha:    z.string().min(6), // cartão é síncrono: senha só em memória nesta requisição
      // SEM userId: pagarCartao é EXCLUSIVAMENTE checkout de conta nova.
      // Upgrade de conta existente é outro fluxo (finalizarPix, autenticado).
      card: z.object({
        holderName:  z.string().min(1),
        number:      z.string().min(12),
        expiryMonth: z.string().min(1),
        expiryYear:  z.string().min(2),
        ccv:         z.string().min(3),
      }),
      holder: z.object({
        postalCode:    z.string().min(8),
        addressNumber: z.string().min(1),
        phone:         z.string().min(8),
      }),
    }),
  )
  .handler(async ({ data }) => {
    // Endpoint público com dados de cartão: alvo clássico de "card testing".
    rateLimit("checkout-cartao", 5, 60 * 60_000);
    const remoteIp = getRequestIP({ xForwardedFor: true }) ?? "0.0.0.0";
    const sb = admin();

    const cliente = await asaas("/customers", {
      method: "POST",
      body: JSON.stringify({ name: data.nome, cpfCnpj: onlyDigits(data.cpfCnpj), email: data.email }),
    });

    const hoje = new Date().toISOString().slice(0, 10);
    const cobranca = await asaas("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer:    cliente.id,
        billingType: "CREDIT_CARD",
        value:       PRECO,
        dueDate:     hoje,
        description: "MakersHub — acesso anual",
        remoteIp,
        creditCard: {
          holderName:  data.card.holderName,
          number:      onlyDigits(data.card.number),
          expiryMonth: data.card.expiryMonth.padStart(2, "0"),
          expiryYear:  data.card.expiryYear.length === 2 ? `20${data.card.expiryYear}` : data.card.expiryYear,
          ccv:         data.card.ccv,
        },
        creditCardHolderInfo: {
          name:          data.card.holderName,
          email:         data.email,
          cpfCnpj:       onlyDigits(data.cpfCnpj),
          postalCode:    onlyDigits(data.holder.postalCode),
          addressNumber: data.holder.addressNumber,
          phone:         onlyDigits(data.holder.phone),
        },
      }),
    });

    if (!PAGO.has(cobranca.status)) {
      throw new Error("Cartão não aprovado. Tente outro cartão ou use Pix.");
    }

    // Registro do pedido (usado para auditoria; webhook será idempotente)
    await sb.from("pending_orders").upsert({
      asaas_payment_id: cobranca.id,
      nome:             data.nome.trim(),
      email:            data.email.trim(),
      empresa_nome:     data.empresa.trim(),
      cpf:              onlyDigits(data.cpfCnpj),
      senha:            null, // não precisa armazenar — criamos a conta agora
      billing_type:     "CREDIT_CARD",
      status:           "pending",
    });

    // Cria conta imediatamente (pagamento síncrono confirmado)
    await processarPagamento({
      paymentId: cobranca.id,
      nome:      data.nome.trim(),
      email:     data.email.trim(),
      empresa:   data.empresa.trim(),
      senha:     data.senha,
    });

    return { email: data.email };
  });

// ─────────────────── UPGRADE: PIX ───────────────────
// Fluxo AUTENTICADO (usuário logado com trial expirado). A identidade vem
// exclusivamente do Bearer token validado pelo requireSupabaseAuth — o
// attachSupabaseAuth (middleware global de client) já envia o header.

// E-mail do usuário autenticado, derivado só da sessão validada (claims do
// JWT; fallback: Admin API). NUNCA do payload do navegador.
async function emailDaSessao(context: { userId: string; claims: Record<string, unknown> }): Promise<string> {
  const fromClaims = typeof context.claims?.email === "string" ? context.claims.email : undefined;
  if (fromClaims) return fromClaims.toLowerCase();
  const { data: got } = await admin().auth.admin.getUserById(context.userId);
  const fromAdmin = got?.user?.email;
  if (!fromAdmin) throw new Error("Não foi possível confirmar o e-mail da sua conta.");
  return fromAdmin.toLowerCase();
}

export const criarPix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    // SEM e-mail do navegador: a cobrança é criada para o e-mail da sessão.
    z.object({ nome: z.string().min(1), cpfCnpj: z.string().min(11) }),
  )
  .handler(async ({ data, context }) => {
    // Autenticado, mas ainda cria cobranças no Asaas — limita abuso por conta.
    rateLimit("upgrade-pix", 10, 60 * 60_000);
    const email = await emailDaSessao(context);
    const cliente = await asaas("/customers", {
      method: "POST",
      body: JSON.stringify({ name: data.nome, cpfCnpj: onlyDigits(data.cpfCnpj), email }),
    });
    const hoje = new Date().toISOString().slice(0, 10);
    const cobranca = await asaas("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer:    cliente.id,
        billingType: "PIX",
        value:       PRECO,
        dueDate:     hoje,
        description: "MakersHub — acesso anual",
        // Vínculo forte cobrança↔usuário: finalizarPix confere este campo
        // antes de liberar (mais forte que o match por e-mail).
        externalReference: context.userId,
      }),
    });
    let brCode = "", brCodeBase64 = "", expiresAt = "", qrErro: string | null = null;
    try {
      const qr = await asaas(`/payments/${cobranca.id}/pixQrCode`, { method: "GET" });
      brCode       = (qr.payload as string) ?? "";
      brCodeBase64 = qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : "";
      expiresAt    = (qr.expirationDate as string) ?? "";
    } catch (e) {
      qrErro = e instanceof Error ? e.message : "QR Code indisponível";
    }
    return {
      id:           cobranca.id as string,
      brCode,
      brCodeBase64,
      expiresAt,
      invoiceUrl:   (cobranca.invoiceUrl as string) ?? "",
      qrErro,
    };
  });

export const finalizarPix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    // SEM userId: a conta liberada é SEMPRE a do usuário autenticado.
    z.object({ chargeId: z.string() }),
  )
  .handler(async ({ data, context }) => {
    // 1. Cobrança precisa existir e estar paga no Asaas
    const cobranca = await asaas(`/payments/${data.chargeId}`, { method: "GET" });
    if (!PAGO.has(cobranca.status)) throw new Error("Pagamento ainda não confirmado.");

    // 2a. Vínculo forte: cobranças criadas por criarPix carregam o userId no
    //     externalReference — se presente, precisa ser o usuário autenticado.
    const extRef = typeof cobranca.externalReference === "string" ? cobranca.externalReference : "";
    if (extRef && extRef !== context.userId) {
      throw new Error("Este pagamento não pertence à sua conta.");
    }

    // 2b. O cliente da cobrança precisa ser o usuário autenticado (por e-mail).
    //     Cobre cobranças antigas sem externalReference — uma cobrança de
    //     terceiro não pode liberar esta conta, nem o inverso.
    const email = await emailDaSessao(context);
    const cliente = await asaas(`/customers/${cobranca.customer}`, { method: "GET" });
    const emailCobranca = typeof cliente?.email === "string" ? cliente.email.toLowerCase() : "";
    if (!emailCobranca || emailCobranca !== email) {
      throw new Error("Este pagamento não pertence à sua conta.");
    }

    // 3. Libera somente a empresa vinculada ao usuário autenticado
    await liberarEmpresa(admin(), context.userId);
    return { ok: true };
  });
