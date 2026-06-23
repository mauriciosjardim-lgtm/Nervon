import { LogoMakersHub } from "@/components/logo-makershub";
import { AuthBackground } from "@/components/auth-background";
import { MessageCircle, Clock } from "iconsax-react";

const WA_URL =
  "https://wa.me/5551995577072?text=Ol%C3%A1%21%20Meu%20per%C3%ADodo%20de%20teste%20do%20MakersHub%20expirou%20e%20quero%20continuar%20usando%20%F0%9F%8E%AC";

export function TrialExpirado() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <AuthBackground />

      {/* logo top-left */}
      <div className="absolute left-8 top-8 z-10 flex items-center gap-3">
        <LogoMakersHub className="h-9 w-9" />
        <span className="font-display text-lg font-semibold">
          <span className="text-foreground">Makers</span><span className="text-primary">Hub</span>
        </span>
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        {/* ícone */}
        <div className="mb-6 grid size-20 place-items-center rounded-2xl border border-primary/20 bg-primary/10 shadow-[0_0_50px_-8px_color-mix(in_oklch,var(--primary)_60%,transparent)]">
          <Clock size={36} color="currentColor" variant="Linear" className="text-primary" />
        </div>

        {/* texto */}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Seu teste encerrou
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Os 7 dias de acesso gratuito chegaram ao fim.<br />
          Fale com a gente pelo WhatsApp para continuar usando o MakersHub.
        </p>

        {/* CTA WhatsApp */}
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-4 text-base font-semibold text-white transition hover:brightness-110 active:scale-95"
        >
          <MessageCircle size={20} color="currentColor" variant="Linear" />
          Quero continuar usando
        </a>

        <p className="mt-5 text-xs text-muted-foreground/50">
          Você será redirecionado para o WhatsApp
        </p>
      </div>
    </div>
  );
}
