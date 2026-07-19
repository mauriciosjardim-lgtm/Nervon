import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMakersHub } from "@/components/logo-makershub";
import { AuthBackground } from "@/components/auth-background";
import { TickCircle, Sms, Eye, EyeSlash } from "iconsax-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

export const Route = createFileRoute("/aceitar-convite")({
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) ?? "" }),
  component: AceitarConvitePage,
});

interface ConviteInfo {
  email: string;
  nome: string | null;
  role: string;
  empresa_nome: string;
}

function AceitarConvitePage() {
  const { token } = useSearch({ from: "/aceitar-convite" });
  const { session, usuario, refreshEmpresa } = useAuth();
  const navigate = useNavigate();

  const [info, setInfo] = useState<ConviteInfo | null | "invalido">(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  // Carrega info do convite
  useEffect(() => {
    if (!token) { setInfo("invalido"); setLoadingInfo(false); return; }
    supabase.rpc("info_convite", { p_token: token }).then(({ data }) => {
      if (!data) { setInfo("invalido"); }
      else {
        setInfo(data as ConviteInfo);
        if (data.nome) setNome(data.nome);
      }
      setLoadingInfo(false);
    });
  }, [token]);

  // Caso: usuário já autenticado mas sem registro (voltou após confirmar email)
  useEffect(() => {
    if (!session || usuario || !token || !info || info === "invalido") return;

    const nomeParaUsar = localStorage.getItem("mh_invite_nome") ?? (info as ConviteInfo).nome ?? "Membro";

    (async () => {
      setLoading(true);
      // 1) tenta pelo token
      let ok = false;
      const { error } = await supabase.rpc("aceitar_convite", {
        p_token: token,
        p_nome: nomeParaUsar,
      });
      ok = !error;
      // 2) fallback: aceitar pelo e-mail autenticado (caso o token tenha se perdido)
      if (!ok) {
        const { data } = await (supabase as any).rpc("aceitar_convite_por_email", { p_nome: nomeParaUsar });
        ok = !!data?.ok;
      }
      if (!ok) {
        setErro("Não foi possível ativar seu acesso. Peça um novo convite ao administrador.");
        setLoading(false);
        return;
      }
      localStorage.removeItem("mh_invite_nome");
      // Reload completo para garantir que o estado de auth recarrega com o usuario correto
      window.location.href = "/";
    })();
  }, [session, usuario, token, info]);

  // Caso: já tem conta completa
  useEffect(() => {
    if (session && usuario) navigate({ to: "/" });
  }, [session, usuario]);

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!nome.trim()) { setErro("Informe seu nome."); return; }
    if (senha.length < 6) { setErro("Senha deve ter pelo menos 6 caracteres."); return; }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErro("Confirme que você é humano.");
      return;
    }
    if (info === null || info === "invalido") return;

    setLoading(true);
    localStorage.setItem("mh_invite_nome", nome.trim());

    const { error } = await supabase.auth.signUp({
      email: (info as ConviteInfo).email,
      password: senha,
      options: {
        data: { nome: nome.trim() },
        emailRedirectTo: `${window.location.origin}/aceitar-convite?token=${token}`,
        captchaToken: turnstileToken ?? undefined,
      },
    });

    if (error) {
      setErro(error.message);
      setTurnstileToken(null);
      turnstileRef.current?.reset();
      setLoading(false);
      return;
    }
    setEmailEnviado(true);
    setLoading(false);
  };

  if (loadingInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (info === "invalido") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <LogoMakersHub className="mx-auto mb-4 h-12 w-12" />
          <h1 className="font-display text-xl font-semibold">Convite inválido ou expirado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Este link não é mais válido. Peça ao administrador um novo convite.</p>
          <Button className="mt-6" onClick={() => navigate({ to: "/" })}>Ir para o início</Button>
        </div>
      </div>
    );
  }

  // Processando aceitação automática (voltou após confirmar email)
  if (session && !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Ativando seu acesso…</p>
          {erro && <p className="text-xs text-destructive">{erro}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      <AuthBackground />

      <div className="absolute left-8 top-8 z-10 flex items-center gap-3">
        <LogoMakersHub className="h-9 w-9" />
        <span className="font-display text-lg font-semibold">
          <span className="text-foreground">Makers</span><span className="text-primary">Hub</span>
        </span>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {emailEnviado ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="grid size-14 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              <Sms size={28} color="currentColor" variant="Linear" />
            </div>
            <h2 className="font-display text-2xl font-bold">Confirme seu e-mail</h2>
            <p className="text-sm text-muted-foreground">
              Link enviado para <strong className="text-foreground">{(info as ConviteInfo).email}</strong>.<br />
              Clique no link para ativar seu acesso.<br />
              Verifique também a pasta de spam.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <TickCircle size={13} color="currentColor" variant="Bold" />
                Convite de {(info as ConviteInfo).empresa_nome}
              </div>
              <h1 className="font-display text-2xl font-bold">Criar sua conta</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Você foi convidado como <strong className="text-foreground">{(info as ConviteInfo).role === "admin" ? "Admin" : "Membro"}</strong>
              </p>
            </div>

            <form onSubmit={cadastrar} className="space-y-4 rounded-2xl border border-border/60 bg-surface-1/60 p-6 shadow-xl backdrop-blur-sm">
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail</Label>
                <Input value={(info as ConviteInfo).email} disabled className="opacity-60" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Seu nome</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Como quer ser chamado?" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Criar senha</Label>
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
                    {mostrarSenha
                      ? <EyeSlash size={16} color="currentColor" variant="Linear" />
                      : <Eye size={16} color="currentColor" variant="Linear" />}
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
              >
                {loading ? "Aguarde…" : "Entrar no MakersHub →"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
