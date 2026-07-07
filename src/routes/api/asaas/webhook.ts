import { createAPIFileRoute } from "@tanstack/react-start/api";
import { processarPagamento, supabaseUrl, supabaseKey } from "@/lib/api/asaas.functions";
import { createClient } from "@supabase/supabase-js";

const PAGO = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED_IN_CASH"]);

export const APIRoute = createAPIFileRoute("/api/asaas/webhook")({
  POST: async ({ request }) => {
    // Verificação do token do webhook Asaas
    const token = request.headers.get("asaas-access-token");
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (expectedToken && token !== expectedToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const event   = body?.event as string | undefined;
    const payment = body?.payment;

    // Só processa eventos de pagamento confirmado
    if (!event || !PAGO.has(event) || !payment?.id) {
      return new Response(JSON.stringify({ ignored: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const paymentId = payment.id as string;
    const sb = createClient(supabaseUrl(), supabaseKey());

    // Busca o pedido pendente
    const { data: order } = await sb
      .from("pending_orders")
      .select("*")
      .eq("asaas_payment_id", paymentId)
      .single();

    // Pedido inexistente (não é do checkout, ex: upgrade manual) ou já processado
    if (!order) {
      return new Response(JSON.stringify({ ok: true, skipped: "no order" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (order.status === "completed") {
      return new Response(JSON.stringify({ ok: true, skipped: "already completed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      await processarPagamento({
        paymentId:  order.asaas_payment_id,
        nome:       order.nome,
        email:      order.email,
        empresa:    order.empresa_nome,
        senha:      order.senha ?? "",
      });
    } catch (err) {
      // Retorna 500 para Asaas retentar o webhook
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error(`[webhook] erro ao processar ${paymentId}:`, msg);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
