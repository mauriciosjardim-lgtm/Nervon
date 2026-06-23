import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Sms, ArrowLeft2, TickCircle, Eye, EyeSlash } from "iconsax-react";
import { AuthBackground } from "@/components/auth-background";
import { LogoMakersHub } from "@/components/logo-makershub";
import { Turnstile } from "@marsidev/react-turnstile";
import { verifyTurnstile } from "@/lib/api/turnstile.functions";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<{ reset: () => void } | null>(null);

  const trocarModo = (m: "entrar" | "criar" | "esqueci") => {
    setModo(m); setErro(null); setAguardandoEmail(false); setResetEnviado(false);
    setNome(""); setWhatsapp(""); setTipo(""); setTermos(false);
    setSenha(""); setConfirmarSenha(""); setMostrarSenha(false);
    setTurnstileToken(null); turnstileRef.current?.reset();
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
    if (!turnstileToken) { setErro("Confirme que você é humano."); return; }
    if (modo === "criar") {
      if (!nome.trim()) { setErro("Informe seu nome completo."); return; }
      if (!tipo) { setErro("Selecione o tipo de operação."); return; }
      if (senha.length < 6) { setErro("A senha precisa ter pelo menos 6 caracteres."); return; }
      if (senha !== confirmarSenha) { setErro("As senhas não coincidem."); return; }
      if (!termos) { setErro("Aceite os termos para continuar."); return; }
    }
    setLoading(true);
    const verified = await verifyTurnstile({ data: { token: turnstileToken } });
    if (!verified.success) {
      setErro("Validação de segurança falhou. Tente novamente.");
      setTurnstileToken(null); turnstileRef.current?.reset();
      setLoading(false); return;
    }
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

                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  options={{ theme: "dark", language: "pt-BR", size: "flexible" }}
                  className="mt-1"
                />

                {erro && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{erro}</p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={loading || !turnstileToken}>
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

function traduzirErro(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (msg.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos.";
  return msg;
}
