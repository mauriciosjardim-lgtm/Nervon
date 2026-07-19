import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMakersHub } from "@/components/logo-makershub";
import { TickCircle, Eye, EyeSlash } from "iconsax-react";
import { consumeAuthSessionFromUrl } from "@/lib/auth-url-session";

// Destino do link "Esqueci minha senha". Esta rota é a única responsável por
// trocar o código PKCE (ou consumir um link implicit legado) pela sessão.
export const Route = createFileRoute("/auth/reset")({ component: AuthReset });

function AuthReset() {
  const navigate = useNavigate();
  const [checkingLink, setCheckingLink] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [trocada, setTrocada] = useState(false);

  useEffect(() => {
    let active = true;

    void consumeAuthSessionFromUrl(supabase).then(({ data, error }) => {
      if (!active) return;
      setHasSession(Boolean(data.session) && !error);
      setCheckingLink(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setTrocada(true);
    setTimeout(() => navigate({ to: "/" }), 1800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <LogoMakersHub className="h-14 w-14" />
          <div>
            <h2 className="font-display text-2xl font-bold">Criar nova senha</h2>
            <p className="mt-1 text-sm text-muted-foreground">Defina a nova senha da sua conta</p>
          </div>
        </div>

        {checkingLink ? (
          <div className="flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : trocada ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <TickCircle size={40} color="currentColor" variant="Linear" className="text-primary" />
            <p className="text-sm text-muted-foreground">
              Senha atualizada! Entrando no MakersHub…
            </p>
          </div>
        ) : !hasSession ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              Link inválido ou expirado. Peça um novo link em "Esqueci minha senha".
            </p>
            <a href="/login" className="text-xs font-medium text-primary hover:underline">
              Voltar ao login
            </a>
          </div>
        ) : (
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nova senha</Label>
              <div className="relative">
                <Input
                  type={mostrar ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrar((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                >
                  {mostrar ? (
                    <EyeSlash size={16} color="currentColor" variant="Linear" />
                  ) : (
                    <Eye size={16} color="currentColor" variant="Linear" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirmar nova senha</Label>
              <Input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {erro && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {erro}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
