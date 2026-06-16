import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";
import { AuthBackground } from "@/components/auth-background";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [aguardandoEmail, setAguardandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const trocarModo = (m: "entrar" | "criar") => {
    setModo(m); setErro(null); setAguardandoEmail(false);
    setNome(""); setSenha(""); setConfirmarSenha("");
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
            Clique no link do e-mail para ativar sua conta e entrar no Nervon. Verifique também a pasta de spam.
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <AuthBackground />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_32px_-4px_var(--primary)]">
            <span className="font-display text-xl font-bold">M</span>
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-xl font-semibold">Nervon</h1>
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
          </form>
        </div>
      </div>
    </div>
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
