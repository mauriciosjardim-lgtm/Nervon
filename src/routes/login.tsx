import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthBackground } from "@/components/auth-background";
import { LogoMakersHub } from "@/components/logo-makershub";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar" | "esqueci">("entrar");
  const [aguardandoEmail, setAguardandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState("");
  const [resetEnviado, setResetEnviado] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const trocarModo = (m: "entrar" | "criar" | "esqueci") => {
    setModo(m); setErro(null); setAguardandoEmail(false); setResetEnviado(false);
    setNome(""); setSenha(""); setConfirmarSenha("");
  };

  const enviarReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!email.trim()) { setErro("Informe seu e-mail."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (error) { setErro(traduzirErro(error.message)); return; }
    setResetEnviado(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (modo === "criar") {
      if (!nome.trim()) { setErro("Informe seu nome."); return; }
      if (senha.length < 6) { setErro("A senha precisa ter pelo menos 6 caracteres."); return; }
      if (senha !== confirmarSenha) { setErro("As senhas não coincidem."); return; }
    }

    setLoading(true);

    if (modo === "entrar") {
      const { error } = await signIn(email, senha);
      if (error) { setErro(traduzirErro(error)); setLoading(false); return; }
      navigate({ to: "/" });
    } else {
      const { error } = await signUp(email, senha, nome);
      if (error) { setErro(traduzirErro(error)); setLoading(false); return; }
      navigate({ to: "/" });
    }
  };

  // Tela de aguardar confirmação de e-mail
  if (aguardandoEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <AuthBackground />
        <div className="relative w-full max-w-sm text-center">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <Mail className="size-8" />
          </div>
          <h1 className="font-display text-xl font-semibold">Confirme seu e-mail</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link de confirmação para
          </p>
          <p className="mt-1 font-medium text-foreground">{emailEnviado}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Clique no link do e-mail para ativar sua conta e entrar no MakersHub. Verifique também a pasta de spam.
          </p>
          <button
            onClick={() => setAguardandoEmail(false)}
            className="mt-6 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
            Usar outro e-mail
          </button>
        </div>
      </div>
    );
  }

  if (modo === "esqueci") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <AuthBackground />
        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3">
            <LogoMakersHub className="h-20 w-20 drop-shadow-[0_0_24px_color-mix(in_oklch,var(--primary)_70%,transparent)]" />
          </div>
          <div className="rounded-2xl border border-border/60 bg-surface-1/60 p-6 shadow-xl backdrop-blur-sm">
            {resetEnviado ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="size-10 text-primary" />
                <h2 className="font-display text-lg font-semibold">Link enviado!</h2>
                <p className="text-sm text-muted-foreground">
                  Verifique seu e-mail <strong className="text-foreground">{email}</strong> e clique no link para redefinir a senha. Confira também o spam.
                </p>
                <button onClick={() => trocarModo("entrar")} className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  Voltar ao login
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => trocarModo("entrar")} className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
                  <ArrowLeft className="size-3.5" /> Voltar
                </button>
                <h2 className="mb-1 font-display text-lg font-semibold">Redefinir senha</h2>
                <p className="mb-5 text-sm text-muted-foreground">Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
                <form onSubmit={enviarReset} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">E-mail</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="você@produtora.com" autoFocus />
                  </div>
                  {erro && (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{erro}</p>
                  )}
                  <Button type="submit" className="mt-1 w-full" disabled={loading}>
                    {loading ? "Enviando…" : "Enviar link de redefinição"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <AuthBackground />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <LogoMakersHub className="h-12 w-12 rounded-xl shadow-[0_0_32px_-4px_var(--primary)]" />
          <div className="text-center">
            <h1 className="font-display text-xl font-semibold">MakersHub</h1>
            <p className="text-xs text-muted-foreground">O Hub Completo para Produtoras de Audiovisual</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface-1/60 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-6 flex rounded-lg border border-border/40 bg-surface-2/40 p-1">
            {(["entrar", "criar"] as const).map(m => (
              <button key={m} onClick={() => trocarModo(m)}
                className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition",
                  modo === m ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground")}>
                {m === "entrar" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          {/* Google OAuth — desabilitado até integração estar pronta */}
          <button
            type="button"
            disabled
            className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-lg border border-border/30 bg-surface-2/20 py-2 text-sm font-medium cursor-not-allowed opacity-50"
          >
            <GoogleIcon />
            Entrar com Google
            <span className="ml-auto rounded-full border border-border/40 px-2 py-0.5 text-[10px] font-normal text-muted-foreground">Em breve</span>
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1 border-t border-border/40" />
            <span className="text-[11px] text-muted-foreground">ou continue com e-mail</span>
            <div className="flex-1 border-t border-border/40" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {modo === "criar" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Seu nome</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="João Silva" autoFocus />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="você@produtora.com" autoFocus={modo === "entrar"} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Senha</Label>
              <Input type="password" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="••••••••" minLength={6} />
            </div>

            {modo === "criar" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Confirmar senha</Label>
                <Input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  className={cn(confirmarSenha && confirmarSenha !== senha && "border-destructive/60 focus-visible:ring-destructive/30")} />
                {confirmarSenha && confirmarSenha !== senha && (
                  <p className="text-[11px] text-destructive">As senhas não coincidem</p>
                )}
              </div>
            )}

            {erro && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {erro}
              </p>
            )}

            <Button type="submit" className="mt-1 w-full" disabled={loading}>
              {loading ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
            </Button>
            {modo === "entrar" && (
              <button type="button" onClick={() => trocarModo("esqueci")} className="mt-3 w-full text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Esqueci minha senha
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function traduzirErro(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (msg.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos.";
  return msg;
}
