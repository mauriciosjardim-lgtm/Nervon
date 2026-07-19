import { useState } from "react";
import { LogoMakersHub } from "@/components/logo-makershub";
import { AuthBackground } from "@/components/auth-background";
import { Clock, ShieldTick, ArrowLeft2 } from "iconsax-react";
import { useAuth } from "@/lib/auth";
import { PixBox } from "@/components/pix-box";
import { Input } from "@/components/ui/input";
import { criarPix, finalizarPix } from "@/lib/api/asaas.functions";
import { maskCPF } from "@/lib/format";

type Charge = { id: string; brCode: string; brCodeBase64: string; expiresAt: string };

export function TrialExpirado() {
  const { user, usuario, refreshEmpresa } = useAuth();
  const [charge, setCharge] = useState<Charge | null>(null);
  const [cpf, setCpf] = useState("");
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function gerar() {
    setErro(null);
    if (cpf.replace(/\D/g, "").length !== 11) {
      setErro("Informe um CPF válido.");
      return;
    }
    setGerando(true);
    try {
      // e-mail e identidade vêm da sessão autenticada, validada no servidor
      const c = await criarPix({
        data: {
          nome: usuario?.nome ?? user?.email ?? "Cliente",
          cpfCnpj: cpf,
        },
      });
      setCharge(c);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar o Pix.");
    } finally {
      setGerando(false);
    }
  }

  async function aoPagar() {
    if (!charge) return;
    try {
      await finalizarPix({ data: { chargeId: charge.id } });
      await refreshEmpresa();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao liberar o acesso.");
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 text-white">
      <AuthBackground />

      <div className="absolute left-8 top-8 z-10 flex items-center gap-3">
        <LogoMakersHub className="h-9 w-9" />
        <span className="font-display text-lg font-semibold">
          <span className="text-foreground">Makers</span>
          <span className="text-primary">Hub</span>
        </span>
      </div>

      {charge ? (
        <div className="relative z-10 w-full max-w-sm">
          <button
            onClick={() => setCharge(null)}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/55 transition hover:text-white"
          >
            <ArrowLeft2 size={15} color="currentColor" variant="Linear" /> Voltar
          </button>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <PixBox charge={charge} onPaid={aoPagar} />
            {erro && (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-center text-xs text-red-400">
                {erro}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
          <div className="mb-6 grid size-20 place-items-center rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_0_50px_-8px_color-mix(in_oklch,var(--primary)_60%,transparent)]">
            <Clock size={36} color="currentColor" variant="Linear" className="text-primary" />
          </div>

          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Seu teste encerrou
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Os 7 dias de acesso gratuito chegaram ao fim.
            <br />
            Assine por <strong className="text-foreground">R$ 97/ano</strong> e continue de onde
            parou.
          </p>

          <div className="mt-8 w-full text-left">
            <Input
              value={cpf}
              onChange={(event) => setCpf(maskCPF(event.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          <button
            onClick={gerar}
            disabled={gerando}
            className="mt-3 inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-[0_0_40px_-8px_color-mix(in_oklch,var(--primary)_60%,transparent)] transition hover:brightness-110 active:scale-95 disabled:opacity-60"
          >
            {gerando ? "Gerando Pix…" : "Assinar com Pix"}
          </button>

          {erro && <p className="mt-4 text-xs text-red-400">{erro}</p>}

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
            <ShieldTick size={13} color="currentColor" variant="Linear" />
            Garantia de 7 dias · menos de R$ 8/mês
          </div>
        </div>
      )}
    </div>
  );
}
