import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft2, TickCircle, Eye, EyeSlash, MagicStar } from "iconsax-react";
import { AuthBackground } from "@/components/auth-background";
import { LogoMakersHub } from "@/components/logo-makershub";

export function RedesignLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-white">
      {/* Left panel - Cinematic Hero */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[52%] flex-col justify-between p-10 bg-black/25">
        <AuthBackground />
        
        {/* Glow decoration */}
        <div className="absolute right-0 top-0 h-[400px] w-[300px] bg-gradient-to-l from-primary/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <LogoMakersHub className="h-9 w-9 drop-shadow-[0_0_12px_var(--primary)]" />
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-foreground">Makers</span><span className="text-primary">Hub</span>
          </span>
        </div>

        <div className="relative flex flex-1 items-center">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary mb-6">
              <MagicStar size={12} color="currentColor" variant="Linear" /> 
              Visual Experience V4
            </div>
            <h1 className="font-display text-[2.8rem] font-bold leading-[1.1] tracking-[-0.04em] text-foreground">
              A nova era da<br />
              <span className="text-gradient">gestão criativa</span><br />
              está aqui.
            </h1>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground max-w-sm">
              MakersHub simplifica seus processos para que você gaste energia na única coisa que importa: criar.
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
            <TickCircle size={16} color="currentColor" variant="Linear" className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground tracking-wide uppercase">Workspace Premium</p>
            <p className="text-[11px] text-muted-foreground">Ambiente de alta fidelidade visual</p>
          </div>
        </div>
      </div>

      {/* Right panel - Glassmorphic Form Card */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 lg:border-l lg:border-border/30 bg-[#080d11]/80 backdrop-blur-md">
        <div className="lg:hidden">
          <AuthBackground />
        </div>

        <div className="relative w-full max-w-sm">
          {/* Card wrapper */}
          <div className="glass-panel-premium p-6 sm:p-8 hover-redesign-card">
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <LogoMakersHub className="h-14 w-14 drop-shadow-[0_0_24px_oklch(0.88_0.22_130_/_0.5)]" />
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Bem-vindo ao cockpit</h2>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Faça login para gerenciar sua produtora
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail corporativo</Label>
                <Input
                  type="email"
                  placeholder="nome@produtora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl border-white/[0.08] bg-white/[0.03] px-3.5 text-xs transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Senha</Label>
                  <button
                    type="button"
                    className="text-[10px] text-muted-foreground hover:text-primary transition font-semibold"
                  >
                    Esqueci a senha
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-10 rounded-xl border-white/[0.08] bg-white/[0.03] pr-10 pl-3.5 text-xs transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {mostrarSenha ? (
                      <EyeSlash size={16} color="currentColor" variant="Linear" />
                    ) : (
                      <Eye size={16} color="currentColor" variant="Linear" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary-glow shadow-[0_0_20px_rgba(144,248,38,0.2)] hover:shadow-[0_0_25px_rgba(144,248,38,0.45)] transition duration-200"
              >
                {loading ? "Entrando..." : "Acessar Workspace"}
              </Button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-white/[0.05] text-center">
              <p className="text-[10px] text-muted-foreground">
                Ainda não tem conta?{" "}
                <button className="text-primary hover:underline font-semibold">
                  Cadastre sua produtora
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
