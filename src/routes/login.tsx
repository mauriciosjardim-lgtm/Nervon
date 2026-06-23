import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Sms, ArrowLeft2, TickCircle, Eye, EyeSlash, Call } from "iconsax-react";
import { AuthBackground } from "@/components/auth-background";
import { LogoMakersHub } from "@/components/logo-makershub";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar" | "esqueci">("entrar");
  const [aguardandoEmail, setAguardandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState("");
  const [resetEnviado, setResetEnviado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tipo, setTipo] = useState("");
  const [termos, setTermos] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const trocarModo = (m: "entrar" | "criar" | "esqueci") => {
    setModo(m); setErro(null); setAguardandoEmail(false); setResetEnviado(false);
    setNome(""); setWhatsapp(""); setTipo(""); setTermos(false);
    setSenha(""); setConfirmarSenha(""); setMostrarSenha(false);
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
      if (!nome.trim()) { setErro("Informe seu nome completo."); return; }
      if (!tipo) { setErro("Selecione o tipo de operação."); return; }
      if (senha.length < 6) { setErro("A senha precisa ter pelo menos 6 caracteres."); return; }
      if (senha !== confirmarSenha) { setErro("As senhas não coincidem."); return; }
      if (!termos) { setErro("Aceite os termos para continuar."); return; }
    }
    setLoading(true);
    if (modo === "entrar") {
      const { error } = await signIn(email, senha);
      if (error) { setErro(traduzirErro(error)); setLoading(false); return; }
      navigate({ to: "/" });
    } else {
      const { error } = await signUp(email, senha, nome, { whatsapp, tipo });
      if (error) { setErro(traduzirErro(error)); setLoading(false); return; }
      setEmailEnviado(email);
      setAguardandoEmail(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Painel esquerdo — hero (só desktop) ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[52%] flex-col justify-between p-10">
        <AuthBackground />

        {/* Gradiente de borda direita para fundir com o painel do form */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-background/80" />

        {/* Logo wordmark */}
        <div className="relative flex items-center gap-3">
          <LogoMakersHub className="h-9 w-9" />
          <span className="font-display text-lg font-semibold">
            <span className="text-foreground">Makers</span><span className="text-primary">Hub</span>
          </span>
        </div>

        {/* Headline principal — flex-1 centraliza verticalmente entre logo e badge */}
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

        {/* Badge inferior */}
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
        {/* AuthBackground visível só no mobile (no desktop o esquerdo já tem) */}
        <div className="lg:hidden">
          <AuthBackground />
        </div>

        <div className="relative w-full max-w-sm">

          {/* Logo + título */}
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <LogoMakersHub className="h-[72px] w-[72px] drop-shadow-[0_0_28px_color-mix(in_oklch,var(--primary)_60%,transparent)]" />
            <div>
              <h2 className="font-display text-2xl font-bold">
                {aguardandoEmail
                  ? "Confirme seu e-mail"
                  : modo === "criar"
                  ? "Criar conta"
                  : modo === "esqueci"
                  ? "Redefinir senha"
                  : "Bem-vindo de volta!"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {aguardandoEmail
                  ? `Link enviado para ${emailEnviado}`
                  : modo === "criar"
                  ? "Preencha os dados para começar"
                  : modo === "esqueci"
                  ? "Enviaremos um link para seu e-mail"
                  : "Faça login para continuar"}
              </p>
            </div>
          </div>

          {/* ── Aguardando confirmação de e-mail ── */}
          {aguardandoEmail ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                <Sms size={28} color="currentColor" variant="Linear" />
              </div>
              <p className="text-sm text-muted-foreground">
                Clique no link do e-mail para ativar sua conta.<br />
                Verifique também a pasta de spam.
              </p>
              <button
                onClick={() => { setAguardandoEmail(false); trocarModo("entrar"); }}
                className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition">
                Usar outro e-mail
              </button>
            </div>

          ) : modo === "esqueci" ? (
            /* ── Esqueci minha senha ── */
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
            /* ── Entrar / Criar conta ── */
            <>
              {/* Botão Google — desabilitado */}
              <button type="button" disabled
                className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-border/30 bg-surface-2/20 py-2.5 text-sm font-medium cursor-not-allowed opacity-50">
                <GoogleIcon />
                Entrar com Google
                <span className="ml-auto rounded-full border border-border/40 px-2 py-0.5 text-[10px] font-normal text-muted-foreground">Em breve</span>
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex-1 border-t border-border/40" />
                <span className="text-[11px] text-muted-foreground">ou continue com e-mail</span>
                <div className="flex-1 border-t border-border/40" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                {modo === "criar" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nome completo</Label>
                      <Input value={nome} onChange={e => setNome(e.target.value)}
                        placeholder="João Silva" autoFocus />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">WhatsApp</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">🇧🇷</span>
                          <Input
                            value={whatsapp}
                            onChange={e => setWhatsapp(e.target.value)}
                            placeholder="(11) 99999-9999"
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tipo de operação <span className="text-destructive">*</span></Label>
                        <select
                          value={tipo}
                          onChange={e => setTipo(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-input px-3 text-sm text-foreground transition focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="" disabled>Selecione…</option>
                          <option value="produtora">Produtora</option>
                          <option value="videomaker">Videomaker</option>
                          <option value="estudio">Estúdio</option>
                          <option value="agencia">Agência</option>
                          <option value="freelancer">Freelancer</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" autoFocus={modo === "entrar"} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Senha</Label>
                    {modo === "entrar" && (
                      <button type="button" onClick={() => trocarModo("esqueci")}
                        className="text-[11px] text-primary transition hover:underline">
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setMostrarSenha(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground">
                      {mostrarSenha ? <EyeSlash size={16} color="currentColor" variant="Linear" /> : <Eye size={16} color="currentColor" variant="Linear" />}
                    </button>
                  </div>
                  {modo === "criar" && senha.length > 0 && (
                    <PasswordStrength senha={senha} />
                  )}
                </div>

                {modo === "criar" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Confirmar senha</Label>
                    <Input type="password" value={confirmarSenha}
                      onChange={e => setConfirmarSenha(e.target.value)}
                      placeholder="••••••••"
                      className={cn(confirmarSenha && confirmarSenha !== senha && "border-destructive/60 focus-visible:ring-destructive/30")} />
                    {confirmarSenha && confirmarSenha !== senha && (
                      <p className="text-[11px] text-destructive">As senhas não coincidem</p>
                    )}
                  </div>
                )}

                {modo === "criar" && (
                  <label className="flex cursor-pointer items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      checked={termos}
                      onChange={e => setTermos(e.target.checked)}
                      className="mt-0.5 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      Li e aceito os{" "}
                      <a href="#" className="text-primary hover:underline">Termos de Uso</a>
                      {" "}e a{" "}
                      <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
                    </span>
                  </label>
                )}

                {erro && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{erro}</p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                {modo === "entrar" ? (
                  <>Ainda não tem uma conta?{" "}
                    <button onClick={() => trocarModo("criar")} className="font-medium text-primary hover:underline">
                      Criar conta
                    </button>
                  </>
                ) : (
                  <>Já tem uma conta?{" "}
                    <button onClick={() => trocarModo("entrar")} className="font-medium text-primary hover:underline">
                      Entrar
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordStrength({ senha }: { senha: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(senha)).length;
  const labels = ["Fraca", "Razoável", "Boa", "Forte"];
  const colors = ["bg-destructive", "bg-warning", "bg-info", "bg-success"];
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i < score ? colors[score - 1] : "bg-border")} />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{labels[score - 1] ?? "Digite sua senha"}</p>
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
