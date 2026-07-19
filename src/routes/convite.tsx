import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Sms, Eye, EyeSlash, Gift } from "iconsax-react";
import { AuthBackground } from "@/components/auth-background";
import { LogoMakersHub } from "@/components/logo-makershub";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

// Rota oculta de cadastro com teste grátis de 7 dias, para campanhas e convites.
// Não há link para cá no produto — o acesso é distribuído manualmente.
export const Route = createFileRoute("/convite")({ component: Convite });

function Convite() {
  const { signUp } = useAuth();
  const [aguardandoEmail, setAguardandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState("");
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
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErro("Confirme que você é humano.");
      return;
    }
    if (!nome.trim()) {
      setErro("Informe seu nome completo.");
      return;
    }
    if (!tipo) {
      setErro("Selecione o tipo de operação.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (!termos) {
      setErro("Aceite os termos para continuar.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(
      email,
      senha,
      nome,
      { whatsapp, tipo },
      turnstileToken ?? undefined,
    );
    if (error) {
      setErro(traduzirErro(error));
      setTurnstileToken(null);
      turnstileRef.current?.reset();
      setLoading(false);
      return;
    }
    setEmailEnviado(email);
    setAguardandoEmail(true);
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      <AuthBackground />

      <div className="absolute left-8 top-8 z-10 flex items-center gap-3">
        <LogoMakersHub className="h-9 w-9" />
        <span className="font-display text-lg font-semibold">
          <span className="text-foreground">Makers</span>
          <span className="text-primary">Hub</span>
        </span>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {aguardandoEmail ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              <Sms size={28} color="currentColor" variant="Linear" />
            </div>
            <h2 className="font-display text-2xl font-bold">Confirme seu e-mail</h2>
            <p className="text-sm text-muted-foreground">
              Link enviado para <strong className="text-foreground">{emailEnviado}</strong>.<br />
              Clique no link para ativar seu teste grátis.
              <br />
              Verifique também a pasta de spam.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col items-center gap-4 text-center">
              <LogoMakersHub className="h-[72px] w-[72px] drop-shadow-[0_0_28px_color-mix(in_oklch,var(--primary)_60%,transparent)]" />
              <div>
                <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Gift size={13} color="currentColor" variant="Bold" /> Teste grátis de 7 dias
                </div>
                <h2 className="font-display text-2xl font-bold">Criar conta</h2>
                <p className="mt-1 text-sm text-muted-foreground">Preencha os dados para começar</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome completo</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="João Silva"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">WhatsApp</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      🇧🇷
                    </span>
                    <PhoneInput
                      value={whatsapp}
                      onValueChange={setWhatsapp}
                      placeholder="(11) 99999-9999"
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Tipo de operação <span className="text-destructive">*</span>
                  </Label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-input px-3 text-sm text-foreground transition focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="" disabled>
                      Selecione…
                    </option>
                    <option value="produtora">Produtora</option>
                    <option value="videomaker">Videomaker</option>
                    <option value="estudio">Estúdio</option>
                    <option value="agencia">Agência</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Senha</Label>
                <div className="relative">
                  <Input
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  >
                    {mostrarSenha ? (
                      <EyeSlash size={16} color="currentColor" variant="Linear" />
                    ) : (
                      <Eye size={16} color="currentColor" variant="Linear" />
                    )}
                  </button>
                </div>
                {senha.length > 0 && <PasswordStrength senha={senha} />}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Confirmar senha</Label>
                <Input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    confirmarSenha &&
                      confirmarSenha !== senha &&
                      "border-destructive/60 focus-visible:ring-destructive/30",
                  )}
                />
                {confirmarSenha && confirmarSenha !== senha && (
                  <p className="text-[11px] text-destructive">As senhas não coincidem</p>
                )}
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  checked={termos}
                  onChange={(e) => setTermos(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Li e aceito os{" "}
                  <a
                    href="/termos"
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a
                    href="/privacidade"
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    Política de Privacidade
                  </a>
                  .
                </span>
              </label>

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
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {erro}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
              >
                {loading ? "Aguarde…" : "Começar teste grátis"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function PasswordStrength({ senha }: { senha: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(senha)).length;
  const labels = ["Fraca", "Razoável", "Boa", "Forte"];
  const colors = ["bg-destructive", "bg-warning", "bg-info", "bg-success"];
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all",
              i < score ? colors[score - 1] : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{labels[score - 1] ?? "Digite sua senha"}</p>
    </div>
  );
}

function traduzirErro(msg: string): string {
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be at least"))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (msg.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos.";
  return msg;
}
