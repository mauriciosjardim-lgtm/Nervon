import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { rateLimit } from "./rateLimit";

// E-mail de "esqueci minha senha" com a marca do MakersHub — o template
// nativo do Supabase (Authentication > Emails) exige plano Pro pra
// customizar. Contornamos gerando o link de recovery via Admin API e
// enviando nós mesmos pelo Resend (mesmo padrão já usado no fluxo Pix).

function supabaseUrl(): string {
  return (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? process.env.SUPABASE_URL ?? "";
}

function admin() {
  return createClient(supabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
}

const RESEND_FROM = "MakersHub <equipe@makershub.app.br>";

function templateResetSenha(link: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;background-color:#141c22;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:36px 32px 8px 32px;text-align:center;">
                <span style="font-size:20px;font-weight:700;letter-spacing:-0.02em;">
                  <span style="color:#f5f5f5;">Makers</span><span style="color:#90f826;">Hub</span>
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px;text-align:center;">
                <h1 style="margin:0;color:#f5f5f5;font-size:22px;font-weight:700;letter-spacing:-0.01em;">Criar nova senha</h1>
                <p style="margin:12px 0 0 0;color:#9ca3af;font-size:14px;line-height:1.6;">
                  Recebemos um pedido para redefinir a senha da sua conta MakersHub.
                  Clique no botão abaixo para escolher uma nova senha.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px 32px;text-align:center;">
                <a href="${link}" style="display:inline-block;background-color:#90f826;color:#0d0f0a;font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;text-decoration:none;">
                  Criar minha nova senha
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0 32px;text-align:center;">
                <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
                  Se você não pediu essa redefinição, pode ignorar este e-mail — sua senha continua a mesma.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 32px 32px;">
                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 20px 0;" />
                <p style="margin:0;color:#4b5563;font-size:11px;text-align:center;line-height:1.6;">
                  MakersHub — o hub completo para produtoras de audiovisual.<br />
                  Este é um e-mail automático, não é necessário responder.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const enviarResetSenha = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    // Anti-abuso: sem isso, um bot poderia disparar e-mails de reset em massa
    // (spam via nosso Resend + assédio a qualquer endereço).
    rateLimit("reset-senha", 5, 15 * 60_000);

    const email = data.email.trim().toLowerCase();
    const sb = admin();

    const { data: linkData, error } = await sb.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${process.env.SITE_URL ?? "https://makershub.app.br"}/auth/reset` },
    });
    const link = linkData?.properties?.action_link;

    // Não revela se o e-mail existe ou não (mesmo comportamento do Supabase
    // nativo) — sempre responde sucesso; se o e-mail não existir, generateLink
    // falha e simplesmente não enviamos nada.
    if (error || !link) {
      if (error) console.error("[auth] falha ao gerar link de reset:", error.message);
      return { ok: true };
    }

    const rKey = process.env.RESEND_API_KEY ?? "";
    if (!rKey) {
      console.error("[auth] RESEND_API_KEY não configurada; e-mail de reset não enviado");
      return { ok: true };
    }

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${rKey}`, "Content-Type": "application/json" },
      // NUNCA logar/retornar o link — só o status da resposta em caso de erro.
      body: JSON.stringify({
        from: RESEND_FROM,
        to: email,
        subject: "Redefinir senha — MakersHub",
        html: templateResetSenha(link),
      }),
    });
    if (!resp.ok) {
      console.error("[auth] Resend falhou ao enviar reset de senha, status:", resp.status);
    }

    return { ok: true };
  });
