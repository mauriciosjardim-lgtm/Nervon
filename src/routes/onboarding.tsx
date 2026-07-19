import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { COR_PRESETS, applyBrandColor } from "@/lib/brandColor";
import { LogoMakersHub } from "@/components/logo-makershub";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const CORES = COR_PRESETS;

function Onboarding() {
  const { user, usuario, refreshEmpresa } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES[0].value);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [verificandoConvite, setVerificandoConvite] = useState(true);

  useEffect(() => {
    if (!user) navigate({ to: "/login", replace: true });
  }, [user, navigate]);

  // REDE DE SEGURANÇA: antes de deixar criar uma empresa nova, tenta aceitar um
  // convite pendente para este e-mail. Assim um convidado NUNCA vira empresa nova
  // (mesmo que o redirect do e-mail não preserve /aceitar-convite?token=...).
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const nomePref = localStorage.getItem("mh_invite_nome") ?? undefined;
        const { data } = await (supabase as any).rpc("aceitar_convite_por_email", {
          p_nome: nomePref,
        });
        if (data?.ok) {
          localStorage.removeItem("mh_invite_nome");
          window.location.href = "/"; // recarrega já vinculado como membro
          return;
        }
      } catch {
        /* sem convite → onboarding normal */
      }
      if (alive) setVerificandoConvite(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  // Se já tem empresa (criada pelo trigger), vai direto pro dashboard
  useEffect(() => {
    if (usuario) navigate({ to: "/" });
  }, [usuario]);
  if (usuario) return null;

  if (verificandoConvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const finalizar = async () => {
    if (!user) return;
    if (!nome.trim()) {
      setErro("Informe o nome da sua produtora.");
      return;
    }
    setLoading(true);
    setErro(null);

    let logo_url: string | null = null;
    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${user.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("logos")
        .upload(path, logoFile, { upsert: true });
      if (!upErr) {
        const { data } = supabase.storage.from("logos").getPublicUrl(path);
        logo_url = data.publicUrl;
      }
    }

    // Cria empresa com trial de 7 dias
    const trialExpires = new Date();
    trialExpires.setDate(trialExpires.getDate() + 7);

    const { data: empresaData, error: empresaErr } = await supabase
      .from("empresas")
      .insert({
        nome: nome.trim(),
        accent_color: cor,
        logo_url,
        trial_expires_at: trialExpires.toISOString(),
      })
      .select("id")
      .single();
    if (empresaErr || !empresaData) {
      setErro(`Erro ao criar empresa: ${empresaErr?.message ?? "sem dados"}`);
      setLoading(false);
      return;
    }

    // Cria usuário vinculado
    const { error: usuarioErr } = await supabase.from("usuarios").insert({
      id: user.id,
      empresa_id: empresaData.id,
      nome: user.user_metadata?.nome ?? "Você",
      email: user.email ?? "",
      role: "admin",
    });
    if (usuarioErr) {
      setErro(`Erro ao criar usuário: ${usuarioErr.message}`);
      setLoading(false);
      return;
    }

    applyBrandColor(cor);
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <LogoMakersHub className="mx-auto mb-4 h-12 w-12 rounded-xl shadow-[0_0_32px_-4px_var(--primary)]" />
          <h1 className="font-display text-2xl font-semibold">Boas-vindas ao MakersHub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vamos configurar sua produtora em 2 passos
          </p>
        </div>

        {/* progress */}
        <div className="mb-6 flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                s <= step ? "bg-primary" : "bg-surface-2",
              )}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface-1/60 p-6 shadow-xl backdrop-blur-sm">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-base font-semibold">Sua produtora</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Como se chama a sua empresa?</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nome da produtora</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Aurora Filmes"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && nome.trim() && setStep(2)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Logo (opcional)</Label>
                <label
                  className={cn(
                    "flex h-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition",
                    logoPreview ? "border-primary/40" : "border-border/40 hover:border-primary/30",
                  )}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="logo" className="h-14 w-auto object-contain" />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Clique para enviar · PNG, SVG ou JPG
                    </span>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                </label>
                {logoPreview && (
                  <button
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                    className="text-[11px] text-muted-foreground hover:text-destructive"
                  >
                    Remover logo
                  </button>
                )}
              </div>

              {erro && <p className="text-xs text-destructive">{erro}</p>}

              <Button
                className="w-full"
                onClick={() => {
                  if (!nome.trim()) {
                    setErro("Informe o nome.");
                    return;
                  }
                  setErro(null);
                  setStep(2);
                }}
              >
                Próximo →
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-base font-semibold">Cor do seu hub</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Escolha a cor de destaque da interface
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {CORES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setCor(c.value);
                      applyBrandColor(c.value);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-3 transition",
                      cor === c.value
                        ? "border-white/30 bg-surface-2"
                        : "border-border/40 bg-surface-1/40 hover:border-border",
                    )}
                  >
                    <div className={cn("h-8 w-8 rounded-full shadow-lg", c.classe)} />
                    <span className="text-[10px] text-muted-foreground">{c.label}</span>
                  </button>
                ))}
              </div>

              {/* preview ao vivo */}
              <div className="rounded-xl border border-border/40 bg-surface-2/30 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Preview
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="grid h-7 w-7 place-items-center rounded-lg text-xs font-bold text-primary-foreground"
                    style={{ backgroundColor: cor, boxShadow: `0 0 16px -2px ${cor}` }}
                  >
                    M
                  </div>
                  <span className="text-sm font-medium">{nome || "Sua Produtora"}</span>
                  <div
                    className="ml-auto rounded-md px-2.5 py-1 text-xs font-medium text-primary-foreground"
                    style={{ backgroundColor: cor }}
                  >
                    + Nova tarefa
                  </div>
                </div>
              </div>

              {erro && <p className="text-xs text-destructive">{erro}</p>}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  ← Voltar
                </Button>
                <Button className="flex-1" onClick={finalizar} disabled={loading}>
                  {loading ? "Configurando…" : "Entrar no MakersHub →"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
