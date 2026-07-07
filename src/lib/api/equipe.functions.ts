import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseKey } from "./asaas.functions";

const FROM_EMAIL = "MakersHub <equipe@makershub.app.br>";

function resendKey(): string {
  return process.env.RESEND_API_KEY ?? "";
}

export const convidarMembro = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string(),
      email:       z.string().email(),
      nome:        z.string().optional(),
      role:        z.enum(["admin", "membro"]).default("membro"),
      permissoes:  z.record(z.boolean()).default({}),
    }),
  )
  .handler(async ({ data }) => {
    const sb = createClient(supabaseUrl(), supabaseKey());

    // Verifica identidade via JWT do usuário
    const { data: { user }, error: authErr } = await sb.auth.getUser(data.accessToken);
    if (authErr || !user) throw new Error("Não autenticado");

    // Verifica se é admin
    const { data: eu } = await sb
      .from("usuarios")
      .select("empresa_id, role")
      .eq("id", user.id)
      .single();
    if (!eu)              throw new Error("Usuário não encontrado");
    if (eu.role !== "admin") throw new Error("Apenas admins podem convidar");

    const emailNorm = data.email.trim().toLowerCase();

    // Já é membro ativo desta empresa?
    const { data: jaMembro } = await sb
      .from("usuarios")
      .select("id")
      .eq("empresa_id", eu.empresa_id)
      .ilike("email", emailNorm)
      .maybeSingle();
    if (jaMembro) throw new Error("Esta pessoa já faz parte da sua equipe");

    // Já existe convite pendente para este email nesta empresa?
    const { data: convitePendente } = await sb
      .from("equipe_convites")
      .select("id, token")
      .eq("empresa_id", eu.empresa_id)
      .eq("email", emailNorm)
      .eq("status", "pendente")
      .gt("expira_em", new Date().toISOString())
      .maybeSingle();
    if (convitePendente) {
      throw new Error("Já existe um convite pendente para este e-mail. Cancele-o ou reenvie o link.");
    }

    // Cria o convite
    const { data: convite, error: conviteErr } = await sb
      .from("equipe_convites")
      .insert({
        empresa_id: eu.empresa_id,
        email:      emailNorm,
        nome:       data.nome?.trim() || null,
        role:       data.role,
        permissoes: data.permissoes,
      })
      .select("token")
      .single();

    if (conviteErr || !convite) {
      throw new Error(conviteErr?.message ?? "Erro ao criar convite");
    }

    // Pega nome da empresa para o email
    const { data: empresa } = await sb
      .from("empresas")
      .select("nome")
      .eq("id", eu.empresa_id)
      .single();

    const inviteUrl = `https://makershub.app.br/aceitar-convite?token=${convite.token}`;

    // Envia via Resend
    const rKey = resendKey();
    if (!rKey) {
      return { ok: true as const, token: convite.token as string, emailError: "RESEND_API_KEY não configurada" };
    }

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${rKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: data.email.trim(),
        subject: `${empresa?.nome ?? "MakersHub"} te convidou para o MakersHub`,
        html: buildEmailHtml({
          nome: data.nome?.trim(),
          empresa: empresa?.nome ?? "MakersHub",
          url: inviteUrl,
        }),
      }),
    });

    if (!resendResp.ok) {
      const errText = await resendResp.text();
      console.error("Resend error:", errText);
      return { ok: true as const, token: convite.token as string, emailError: errText };
    }

    return { ok: true as const, token: convite.token as string };
  });

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
