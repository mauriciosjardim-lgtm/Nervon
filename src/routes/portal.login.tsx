import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoMakersHub } from "@/components/logo-makershub";
import { portalSupabase } from "@/lib/portal-supabase";

export const Route = createFileRoute("/portal/login")({
  ssr: false,
  component: PortalLogin,
});

function PortalLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await portalSupabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (signInError) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    const { data: token, error: tokenError } = await (portalSupabase as any).rpc(
      "meu_portal_token",
    );
    if (tokenError || !token) {
      await portalSupabase.auth.signOut({ scope: "local" });
      setError("Este usuário não possui acesso ativo ao portal.");
      setLoading(false);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    const safeNext =
      next?.startsWith("/portal/") && !next.startsWith("/portal/login") ? next : null;
    window.location.assign(safeNext || `/portal/${token}`);
  };

  const sendRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    setLoading(true);
    const { error: recoveryError } = await portalSupabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/portal/redefinir-senha` },
    );
    setLoading(false);
    if (recoveryError) {
      setError("Não foi possível enviar a recuperação agora. Tente novamente.");
      return;
    }
    setRecoverySent(true);
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#080a08] px-5 py-10 text-white">
      <div className="pointer-events-none absolute left-1/2 top-[-20rem] size-[46rem] -translate-x-1/2 rounded-full bg-lime-300/[0.08] blur-[120px]" />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <LogoMakersHub className="size-10" />
          <div>
            <p className="font-display text-lg font-semibold">
              Makers <span className="text-lime-300">Members</span>
            </p>
            <p className="text-[10px] uppercase tracking-[.2em] text-white/35">Portal do cliente</p>
          </div>
        </div>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.045] p-7 shadow-2xl backdrop-blur-xl">
          <span className="mx-auto grid size-11 place-items-center rounded-2xl border border-lime-300/20 bg-lime-300/10 text-lime-300">
            {recovering ? <MailCheck className="size-5" /> : <LockKeyhole className="size-5" />}
          </span>
          <h1 className="mt-5 text-center font-display text-2xl font-semibold">
            {recovering ? "Recupere seu acesso" : "Acesse seu espaço"}
          </h1>
          <p className="mt-2 text-center text-xs leading-5 text-white/45">
            {recovering
              ? "Enviaremos um link seguro para você criar uma nova senha."
              : "Acompanhe projetos, revise materiais e encontre todas as suas entregas."}
          </p>

          <form onSubmit={recovering ? sendRecovery : submit} className="mt-7 space-y-4">
            <label className="block space-y-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/45">
                E-mail
              </span>
              <span className="relative block">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@empresa.com"
                  className="h-11 border-white/10 bg-white/[0.04] pl-10 text-white placeholder:text-white/20"
                />
              </span>
            </label>
            {!recovering && (
              <label className="block space-y-2">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-white/45">
                    Senha
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRecovering(true);
                      setError("");
                    }}
                    className="text-[10px] text-lime-300/70 transition hover:text-lime-300"
                  >
                    Esqueci minha senha
                  </button>
                </span>
                <span className="relative block">
                  <LockKeyhole className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 border-white/10 bg-white/[0.04] px-10 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
              </label>
            )}
            {recoverySent && (
              <p className="rounded-lg border border-lime-300/20 bg-lime-300/10 px-3 py-3 text-xs leading-5 text-lime-200">
                Se este e-mail possui acesso ao portal, você receberá o link de recuperação.
              </p>
            )}
            {error && (
              <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading || recoverySent} className="h-11 w-full">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {recovering ? "Enviar link de recuperação" : "Entrar no portal"}
            </Button>
            {recovering && (
              <button
                type="button"
                onClick={() => {
                  setRecovering(false);
                  setRecoverySent(false);
                  setError("");
                }}
                className="mx-auto flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white"
              >
                <ArrowLeft className="size-3.5" />
                Voltar ao login
              </button>
            )}
          </form>
        </section>
        <p className="mt-5 text-center text-[10px] text-white/25">
          Seu acesso é individual e protegido.
        </p>
      </div>
    </main>
  );
}
