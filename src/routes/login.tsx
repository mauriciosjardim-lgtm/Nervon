import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { enviarResetSenha } from "@/lib/api/auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft2, TickCircle, Eye, EyeSlash } from "iconsax-react";
import { AuthBackground } from "@/components/auth-background";
import { LogoMakersHub } from "@/components/logo-makershub";
import { Turnstile } from "@marsidev/react-turnstile";
import { verifyTurnstile } from "@/lib/api/turnstile.functions";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "esqueci">("entrar");
  const [resetEnviado, setResetEnviado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<{ reset: () => void } | null>(null);

  const trocarModo = (m: "entrar" | "esqueci") => {
    setModo(m); setErro(null); setResetEnviado(false);
    setSenha(""); setMostrarSenha(false);
    setTurnstileToken(null); turnstileRef.current?.reset();
  };

  const enviarReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!email.trim()) { setErro("Informe seu e-mail."); return; }
    setLoading(true);
    // Envio próprio (Admin generateLink + Resend) em vez do e-mail nativo do
    // Supabase — customizar o template deles exige plano Pro. /auth/reset
    // processa o link e mostra o formulário de nova senha.
    try {
      await enviarResetSenha({ data: { email: email.trim() } });
    } catch (err) {
      setLoading(false);
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }
    setLoading(false);
    setResetEnviado(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (TURNSTILE_SITE_KEY && !turnstileToken) { setErro("Confirme que você é humano."); return; }
    setLoading(true);
    if (TURNSTILE_SITE_KEY && turnstileToken) {
      const verified = await verifyTurnstile({ data: { token: turnstileToken } });
      if (!verified.success) {
        setErro("Validação de segurança falhou. Tente novamente.");
        setTurnstileToken(null); turnstileRef.current?.reset();
        setLoading(false); return;
      }
    }
    const { error } = await signIn(email, senha);
    if (error) { setErro(traduzirErro(error)); setLoading(false); return; }
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Painel esquerdo — hero (só desktop) ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[52%] flex-col justify-between p-10">
        <AuthBackground />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-background/80" />

        <div className="relative flex items-center gap-3">
          <LogoMakersHub className="h-9 w-9" />
          <span className="font-display text-lg font-semibold">
            <span className="text-foreground">Makers</span><span className="text-primary">Hub</span>
          </span>
        </div>

        <div className="relative flex flex-1 items-center">
          <div className="max-w-md">
            <h1 className="font-display text-[2.6rem] font-bold leading-tight tracking-tight text-foreground">
              Organize ideias.<br />
              <span className="text-primary">Colabore</span> com seu time.<br />
              Crie <span className="text-primary">sem limites.</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              MakersHub é o espaço onde produtoras ganham forma e produções acontecem de verdade.
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/15">
            <TickCircle size={16} color="currentColor" variant="Linear" className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Feito para criativos.</p>
            <p className="text-xs text-muted-foreground">Pensado para produtoras.</p>
          </div>
        </div>
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 lg:border-l lg:border-border/30 lg:bg-surface-1/30">
        <div className="lg:hidden">
          <AuthBackground />
        </div>

        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <LogoMakersHub className="h-[72px] w-[72px] drop-shadow-[0_0_28px_color-mix(in_oklch,var(--primary)_60%,transparent)]" />
            <div>
              <h2 className="font-display text-2xl font-bold">
                {modo === "esqueci" ? "Redefinir senha" : "Bem-vindo de volta!"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {modo === "esqueci" ? "Enviaremos um link para seu e-mail" : "Faça login para continuar"}
              </p>
            </div>
          </div>

          {modo === "esqueci" ? (
            <div>
              {resetEnviado ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <TickCircle size={40} color="currentColor" variant="Linear" className="text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Verifique seu e-mail <strong className="text-foreground">{email}</strong> e clique no link para redefinir a senha.
                  </p>
                  <button onClick={() => trocarModo("entrar")} className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition">
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <form onSubmit={enviarReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">E-mail</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com" autoFocus />
                  </div>
                  {erro && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{erro}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando…" : "Enviar link de redefinição"}
                  </Button>
                  <button type="button" onClick={() => trocarModo("entrar")}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
                    <ArrowLeft2 size={14} color="currentColor" variant="Linear" /> Voltar ao login
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" autoFocus />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Senha</Label>
                  <button type="button" onClick={() => trocarModo("esqueci")}
                    className="text-[11px] text-primary transition hover:underline">
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setMostrarSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground">
                    {mostrarSenha ? <EyeSlash size={16} color="currentColor" variant="Linear" /> : <Eye size={16} color="currentColor" variant="Linear" />}
                  </button>
                </div>
              </div>

              {TURNSTILE_SITE_KEY && (
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  options={{ theme: "dark", language: "pt-BR", size: "flexible" }}
                  className="mt-1"
                />
              )}

              {erro && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{erro}</p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading || (!!TURNSTILE_SITE_KEY && !turnstileToken)}>
                {loading ? "Aguarde…" : "Entrar"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Ainda não é cliente?{" "}
                <a href="/home#precos" className="font-medium text-primary hover:underline">
                  Assine o MakersHub
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function traduzirErro(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("Password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (msg.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos.";
  return msg;
}
