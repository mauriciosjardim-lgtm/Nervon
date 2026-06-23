import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getStripe } from "@/lib/stripe.server";
import { createClient } from "@supabase/supabase-js";

export const APIRoute = createAPIFileRoute("/api/stripe/webhook")({
  POST: async ({ request }) => {
    const sig = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return new Response("Webhook secret not configured", { status: 400 });
    }

    const rawBody = await request.text();
    const stripe = getStripe();

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      return new Response(`Webhook signature invalid: ${(err as Error).message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_details?.email;
      if (!email) return new Response("No email in session", { status: 400 });

      const supabase = createClient(
        process.env.SUPABASE_URL ?? "",
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      );

      // Encontra o usuário pelo email
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users.find(u => u.email === email);
      if (!authUser) return new Response("User not found", { status: 404 });

      // Busca o usuario para pegar empresa_id
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", authUser.id)
        .single();

      if (usuario?.empresa_id) {
        await supabase
          .from("empresas")
          .update({ plano: "pro", plano_ativo: true })
          .eq("id", usuario.empresa_id);
      }
    }

    return new Response("OK", { status: 200 });
  },
});
