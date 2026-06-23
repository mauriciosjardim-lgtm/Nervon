import { useState } from "react";
import { LogoMakersHub } from "@/components/logo-makershub";
import { AuthBackground } from "@/components/auth-background";
import { Clock, ArrowRight2, ShieldTick } from "iconsax-react";
import { createCheckoutSession } from "@/lib/api/stripe.functions";

export function TrialExpirado() {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      const result = await createCheckoutSession({ data: { origin: window.location.origin } });
      if (result?.url) window.location.href = result.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <AuthBackground />

      <div className="absolute left-8 top-8 z-10 flex items-center gap-3">
        <LogoMakersHub className="h-9 w-9" />
        <span className="font-display text-lg font-semibold">
          <span className="text-foreground">Makers</span><span className="text-primary">Hub</span>
        </span>
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-6 grid size-20 place-items-center rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_0_50px_-8px_color-mix(in_oklch,var(--primary)_60%,transparent)]">
          <Clock size={36} color="currentColor" variant="Linear" className="text-primary" />
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Seu teste encerrou
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Os 7 dias de acesso gratuito chegaram ao fim.<br />
          Assine por <strong className="text-foreground">R$ 97/ano</strong> e continue de onde parou.
        </p>

        <button
          onClick={handleBuy}
          disabled={loading}
          className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-[0_0_40px_-8px_color-mix(in_oklch,var(--primary)_60%,transparent)] transition hover:brightness-110 active:scale-95 disabled:opacity-60"
        >
          {loading ? "Redirecionando…" : "Assinar agora"}
          {!loading && <ArrowRight2 size={18} color="currentColor" variant="Linear" />}
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <ShieldTick size={13} color="currentColor" variant="Linear" />
          Garantia de 7 dias · menos de R$ 8/mês
        </div>
      </div>
    </div>
  );
}
