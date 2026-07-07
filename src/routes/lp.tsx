import { createFileRoute } from "@tanstack/react-router";
import { Quote } from "lucide-react";
import { ArrowRight2, TickCircle, ShieldTick, Flash } from "iconsax-react";
import { LogoMakersHub } from "@/components/logo-makershub";
import { DashboardMock } from "@/components/landing/dashboard-mock";

export const Route = createFileRoute("/lp")({
  component: LpPage,
});

const FEATURES = [
  "CRM e pipeline de vendas completo",
  "Gestão financeira com carteiras e lançamentos",
  "Orçamentos e propostas profissionais",
  "Controle de projetos por fases",
  "Agenda e calendário integrados",
  "Biblioteca de assets e contratos",
  "Dashboard personalizável por função",
  "Atualizações gratuitas incluídas",
];

const MODULES = [
  "Comercial / CRM", "Orçamentos & Propostas", "Projetos por fases",
  "Agenda integrada", "Financeiro completo", "IA com ChatGPT",
];

const TESTIMONIALS = [
  {
    q: "Saí de 4 planilhas pra um sistema só. O financeiro pelo ChatGPT é mágico — lanço despesa na hora, sem abrir nada.",
    n: "Marina Castro",
    r: "Diretora · Praia Filmes",
  },
  {
    q: "Finalmente um software pensado pra quem produz vídeo. As fases do projeto batem com o nosso fluxo real.",
    n: "Rafael Tonin",
    r: "Sócio · Estúdio Norte",
  },
];

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMakersHub className="h-8 w-8" />
      <span className="font-display text-base font-semibold leading-none">
        <span className="text-white">Makers</span><span className="text-[#90F826]">Hub</span>
      </span>
    </span>
  );
}

function CtaBtn({ large }: { large?: boolean }) {
  const base = "inline-flex items-center justify-center gap-2 font-bold text-[#0d0f0a] bg-[#90F826] rounded-xl shadow-[0_0_48px_-8px_rgba(144,248,38,0.6)] transition hover:bg-[#a3ff45] active:scale-[0.98]";
  const size = large ? "w-full py-4 text-[15px]" : "h-9 px-4 text-sm";
  return (
    <a href="/checkout" className={`${base} ${size}`}>
      Comprar agora
      <ArrowRight2 size={16} color="currentColor" variant="Linear" />
    </a>
  );
}

// não exportar: componente referenciado só pelo Route permite o code-split automático (tsr-split)
function LpPage() {
  return (
    <div className="min-h-screen bg-[#18181f] text-white antialiased">

      {/* sticky header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#18181f]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Wordmark />
          <CtaBtn />
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative px-5 pt-12 pb-6 md:pt-16">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#90F826]/25 bg-[#90F826]/[0.06] px-3 py-1.5 text-xs font-medium text-[#c8ff8a]">
            <Flash size={12} color="currentColor" variant="Linear" />
            Condição de lançamento · R$ 97/ano
          </div>

          <h1 className="font-display text-[1.7rem] font-bold leading-[1.15] tracking-tight md:text-4xl">
            <span className="text-white">Pare de gerenciar sua<br />produtora em</span><br />
            <span className="text-[#90F826]">10 lugares diferentes.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/60">
            Chega de Trello, planilhas, WhatsApp e anotações espalhadas.
            Tenha controle da operação em um único lugar.
          </p>

          <div className="mt-8 flex flex-col items-center gap-2">
            <a
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#90F826] px-8 py-3.5 text-sm font-bold text-[#0d0f0a] shadow-[0_0_48px_-8px_rgba(144,248,38,0.7)] transition hover:bg-[#a3ff45] active:scale-[0.98]"
            >
              Comprar agora
              <ArrowRight2 size={16} color="currentColor" variant="Linear" />
            </a>
            <p className="text-xs text-white/35">
              Pagamento único · 7 dias de garantia · Acesso imediato
            </p>
          </div>

          {/* dashboard em destaque */}
          <div className="mt-12">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* ── MÓDULOS — pills abaixo do dashboard ── */}
      <section className="px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-5 text-center text-xs font-medium uppercase tracking-[0.18em] text-white/40">
            Tudo dentro do MakersHub
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {MODULES.map((m) => (
              <span
                key={m}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white/70"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-5">
        <div className="h-px bg-white/[0.06]" />

        {/* ── DEPOIMENTOS ── */}
        <section className="py-14">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#90F826]">Quem já usa</span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white">
            Produtoras que largaram a planilha.
          </h2>
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <div key={t.n} className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <Quote size={20} className="text-[#90F826]/60" />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-white/75">"{t.q}"</p>
                <div className="mt-5 border-t border-white/5 pt-4">
                  <div className="text-sm font-semibold text-white">{t.n}</div>
                  <div className="text-xs text-white/40">{t.r}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-white/[0.06]" />

        {/* ── PREÇO ── */}
        <section className="py-14">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#90F826]">Preços</span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white">
            Um preço justo,{" "}
            <span className="text-[#90F826]">sem cobrança mensal.</span>
          </h2>

          <div className="relative mt-7 overflow-hidden rounded-3xl border border-[#90F826]/35 bg-[#13150f] p-7">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[500px] -translate-x-1/2 rounded-full bg-[#90F826]/18 blur-[90px]" />

            <div className="relative mb-7 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#90F826]/40 bg-[#90F826]/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#c8ff8a]">
                <Flash size={11} color="currentColor" variant="Linear" />
                Condição de lançamento
              </span>
            </div>

            <div className="relative text-center">
              <p className="mb-1 text-sm text-white/40 line-through">De R$ 149/ano</p>
              <div className="flex items-end justify-center gap-1.5">
                <span className="mb-3 text-xl font-medium text-white/60">R$</span>
                <span className="font-display text-[80px] font-bold leading-none tracking-tight text-white">97</span>
                <span className="mb-3 text-xl font-medium text-white/60">/ano</span>
              </div>
              <p className="mt-2 text-sm text-white/40">menos de R$ 8 por mês</p>
            </div>

            <div className="relative my-7 border-t border-white/[0.07]" />

            <ul className="relative space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/75">
                  <TickCircle size={16} color="#90F826" variant="Bold" className="shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="relative mt-8">
              <a
                href="/checkout"
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#90F826] py-4 text-[15px] font-bold text-[#0d0f0a] shadow-[0_0_60px_-10px_rgba(144,248,38,0.55)] transition hover:bg-[#a3ff45] hover:shadow-[0_0_70px_-8px_rgba(144,248,38,0.7)] active:scale-[0.98]"
              >
                Comprar agora
                <ArrowRight2 size={17} color="currentColor" variant="Linear" />
              </a>
            </div>

            <div className="relative mt-4 flex items-center justify-center gap-1.5 text-xs text-white/35">
              <ShieldTick size={13} color="currentColor" variant="Linear" />
              Garantia de 7 dias · reembolso sem perguntas
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-white/30">
            IA integrada disponível como créditos opcionais dentro da plataforma.
          </p>
        </section>
      </div>

      <footer className="border-t border-white/[0.05] py-8 text-center">
        <div className="flex justify-center">
          <Wordmark />
        </div>
        <p className="mt-2 text-xs text-white/20">
          © {new Date().getFullYear()} MakersHub · Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
