import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = () => (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? process.env.SUPABASE_URL ?? "";
const supabaseKey  = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const resendApiKey = () => process.env.RESEND_API_KEY ?? "";

// ─── Troque pelo seu domínio verificado no Resend ───────────────────────────
// Enquanto o domínio não estiver verificado, use "onboarding@resend.dev"
// (só envia para o seu próprio email cadastrado no Resend, útil pra testar)
const FROM_EMAIL = "MakersHub <equipe@makershub.app.br>";

export const APIRoute = createAPIFileRoute("/api/equipe/convidar")({
  POST: async ({ request }) => {
    try {
      // Verifica Authorization header
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return json({ error: "Não autenticado" }, 401);
      }

      const url = supabaseUrl();
      const key = supabaseKey();
      if (!url || !key) {
        console.error("Supabase env vars ausentes — url:", !!url, "key:", !!key);
        return json({ error: "Configuração do servidor incompleta" }, 500);
      }

      const sb = createClient(url, key);
      const { data: { user }, error: authErr } = await sb.auth.getUser(
        authHeader.replace("Bearer ", ""),
      );
      if (authErr || !user) return json({ error: "Não autenticado" }, 401);

      // Verifica se é admin
      const { data: eu } = await sb
        .from("usuarios")
        .select("empresa_id, role")
        .eq("id", user.id)
        .single();
      if (!eu) return json({ error: "Usuário não encontrado" }, 404);
      if (eu.role !== "admin") return json({ error: "Apenas admins podem convidar" }, 403);

      let body: any;
      try { body = await request.json(); } catch { return json({ error: "Body inválido" }, 400); }

      const { email, nome, role = "membro", permissoes = {} } = body;
      if (!email?.trim()) return json({ error: "Email obrigatório" }, 400);

      // Cria o convite
      const { data: convite, error: conviteErr } = await sb
        .from("equipe_convites")
        .insert({ empresa_id: eu.empresa_id, email: email.trim().toLowerCase(), nome: nome?.trim() || null, role, permissoes })
        .select("token")
        .single();
      if (conviteErr || !convite) {
        return json({ error: conviteErr?.message ?? "Erro ao criar convite" }, 500);
      }

      // Pega nome da empresa
      const { data: empresa } = await sb
        .from("empresas")
        .select("nome")
        .eq("id", eu.empresa_id)
        .single();

      const baseUrl = new URL(request.url).origin;
      const inviteUrl = `${baseUrl}/aceitar-convite?token=${convite.token}`;

      // Envia via Resend
      const rKey = resendApiKey();
      if (!rKey) {
        console.error("RESEND_API_KEY ausente");
        return json({ ok: true, token: convite.token, emailError: "RESEND_API_KEY não configurada" }, 200);
      }

      const resendResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${rKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email.trim(),
          subject: `${empresa?.nome ?? "MakersHub"} te convidou para o MakersHub`,
          html: buildEmailHtml({ nome: nome?.trim(), empresa: empresa?.nome ?? "MakersHub", url: inviteUrl }),
        }),
      });

      if (!resendResp.ok) {
        const errText = await resendResp.text();
        console.error("Resend error:", errText);
        return json({ ok: true, token: convite.token, emailError: errText }, 200);
      }

      return json({ ok: true, token: convite.token }, 200);
    } catch (err: any) {
      console.error("Erro inesperado no /api/equipe/convidar:", err);
      return json({ error: err?.message ?? "Erro interno" }, 500);
    }
  },
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildEmailHtml({ nome, empresa, url }: { nome?: string; empresa: string; url: string }) {
  const greeting = nome ? `Olá, ${nome}!` : "Olá!";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#1a1f12,#0f1409);padding:28px 32px;border-bottom:1px solid #27272a;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:#90F826;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle;">
              <span style="font-size:18px;font-weight:900;color:#0d0f0a;line-height:36px;">M</span>
            </td>
            <td style="padding-left:10px;">
              <span style="font-size:18px;font-weight:700;color:#fff;">Makers<span style="color:#90F826;">Hub</span></span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;">${greeting}</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#a1a1aa;line-height:1.6;">
            <strong style="color:#fff;">${empresa}</strong> te convidou para fazer parte do hub da produtora no MakersHub.
          </p>
          <p style="margin:0 0 28px;font-size:14px;color:#71717a;line-height:1.6;">
            O MakersHub centraliza CRM, projetos, financeiro e agenda da produtora em um só lugar.
            Clique no botão abaixo para criar sua senha e entrar.
          </p>
          <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
            <a href="${url}" style="display:inline-block;background:#90F826;color:#0d0f0a;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
              Aceitar convite &rarr;
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:12px;color:#52525b;text-align:center;">
            O link expira em 7 dias. Se você não esperava este convite, pode ignorar este email.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #27272a;text-align:center;">
          <p style="margin:0;font-size:11px;color:#3f3f46;">&copy; ${new Date().getFullYear()} MakersHub &middot; Todos os direitos reservados</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
