import { useEffect, useState } from "react";
import {
  Users, FileText, Clapperboard, Calendar, Wallet, LayoutDashboard,
  MessageSquareText, Quote, Instagram, Linkedin, Youtube,
} from "lucide-react";
import { ArrowRight2, MagicStar, Microphone, Cpu, TickCircle, ShieldTick, Flash } from "iconsax-react";
import { LogoMakersHub } from "@/components/logo-makershub";
import { DashboardMock } from "./dashboard-mock";
const irParaPrecos = () => document.getElementById("precos")?.scrollIntoView({ behavior: "smooth" });

function Wordmark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMakersHub className={className} />
      <span className="font-display text-lg font-semibold leading-none">
        <span className="text-foreground">Makers</span><span className="text-[#90F826]">Hub</span>
      </span>
    </span>
  );
}

export function LandingPage() {
  return (
    <div className="sales-landing min-h-screen overflow-x-hidden bg-[#18181f] text-foreground antialiased">
      <BackgroundFX />
      <Header />
      <main className="relative">
        <Hero />
        <FeaturesGrid />
        <AISection />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ---------- background ---------- */
function BackgroundFX() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[1100px] overflow-hidden" aria-hidden="true">
      <div
        className="landing-grid absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%)",
        }}
      />
      <div className="landing-glow absolute -top-32 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full" />
      <div className="landing-glow absolute top-[420px] -left-40 h-[460px] w-[460px] rounded-full" />
    </div>
  );
}

/* ---------- header ---------- */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled
          ? "border-b border-white/5 bg-[#18181f]/85 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-5 md:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <Wordmark />
        </a>

        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a className="transition hover:text-white" href="#features">Recursos</a>
          <a className="transition hover:text-white" href="#ia">IA</a>
          <a className="transition hover:text-white" href="#como">Como funciona</a>
          <a className="transition hover:text-white" href="#depoimentos">Depoimentos</a>
          <a className="transition hover:text-white" href="#precos">Preços</a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-medium text-white/80 transition hover:text-white sm:px-4"
          >
            Entrar
          </a>
          <a
            href="#precos"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 text-sm font-medium text-white/85 transition hover:bg-white/[0.09] sm:px-4"
          >
            Ver planos
          </a>
        </div>
      </div>
    </header>
  );
}

/* ---------- hero ---------- */
function Hero() {
  return (
    <section id="top" className="relative px-5 pt-16 md:px-8 md:pt-24">
      <div className="mx-auto max-w-6xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#90F826]/25 bg-[#90F826]/[0.06] px-3 py-1 text-xs font-medium text-[#c8ff8a]">
          <MagicStar size={14} color="currentColor" variant="Linear" /> Novo · Integração com ChatGPT
        </div>

        <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          A sua produtora<br className="hidden sm:block" />{" "}
          <span className="text-[#90F826]">organizada</span> num só lugar.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-white/65 sm:text-lg">
          MakersHub é o hub de gestão para produtoras de audiovisual, videomakers e criadores
          de conteúdo. CRM, orçamentos, contratos, projetos, agenda e financeiro —
          tudo conectado, do briefing à entrega.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#features"
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-[#90F826] px-6 text-sm font-semibold text-[#0a0a0a] shadow-[0_0_40px_-8px_rgba(144,248,38,0.7)] transition hover:bg-[#a3ff45]"
          >
            Explorar recursos
            <ArrowRight2 size={16} color="currentColor" variant="Linear" className="transition group-hover:translate-x-0.5" />
          </a>
          <a
            href="#como"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-white/85 transition hover:bg-white/[0.06]"
          >
            Ver como funciona
          </a>
        </div>
      </div>

      <DashboardMock />
    </section>
  );
}

/* ---------- problem ---------- */
function ProblemSection() {
  const items = [
    "Planilha de orçamento que ninguém acha",
    "Briefing perdido no meio de 4 grupos de WhatsApp",
    "Caderninho com o financeiro do mês",
    "Cliente cobrando entrega que você esqueceu",
    "Equipe sem saber em que fase tá o projeto",
    "Final do mês sem ideia do que sobrou no caixa",
  ];
  return (
    <section className="relative px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-5xl text-center">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#90F826]">O problema</span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          Gerir produtora no caos<br/> não é arte. É <span className="text-white/40 line-through">cansaço</span> retrabalho.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-white/55">
          Você abriu sua produtora pra criar, não pra virar gerente de planilha.
          Se algum desses te lembra alguma coisa, a gente precisa conversar:
        </p>
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
          {items.map(t => (
            <div key={t} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-white/[0.05] text-white/60">×</div>
              <span className="text-sm text-white/75">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- features ---------- */
function FeaturesGrid() {
  const features = [
    { icon: Users, title: "Comercial / CRM", desc: "Funil visual, follow-ups, contatos e empresas. Nenhum lead esquecido." },
    { icon: FileText, title: "Orçamentos & Propostas", desc: "Crie orçamentos profissionais em minutos e envie pro cliente aprovar online." },
    { icon: Clapperboard, title: "Projetos audiovisuais", desc: "Briefing, pré-produção, captação, edição, revisão e entrega — uma fase por vez." },
    { icon: Calendar, title: "Agenda integrada", desc: "Diárias, captações, reuniões e prazos no mesmo calendário do time." },
    { icon: Wallet, title: "Financeiro completo", desc: "Receitas, despesas, contas a pagar/receber e DRE por projeto." },
    { icon: LayoutDashboard, title: "Dashboard personalizável", desc: "Monte sua tela inicial com os indicadores que importam pra você." },
  ];
  return (
    <section id="features" className="relative px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#90F826]">Tudo num só lugar</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Seu estúdio inteiro, conectado.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/55">
            Substitua 6 ferramentas dispersas por um sistema feito pra produtora audiovisual de verdade.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 transition hover:border-[#90F826]/30 hover:from-[#90F826]/[0.06]">
              <div className="mb-5 inline-grid size-11 place-items-center rounded-xl border border-[#90F826]/25 bg-[#90F826]/[0.08] text-[#90F826] shadow-[0_0_24px_-8px_rgba(144,248,38,0.6)]">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- AI section (hero feature) ---------- */
function AISection() {
  return (
    <section id="ia" className="relative px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-[#90F826]/20 bg-gradient-to-br from-[#90F826]/[0.08] via-[#18181f] to-[#18181f] p-8 md:p-16">
          <div className="absolute -top-32 -right-20 h-96 w-96 rounded-full bg-[#90F826]/30 blur-[120px]" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#90F826]/15 blur-[120px]" />

          <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#90F826]/30 bg-[#90F826]/10 px-3 py-1 text-xs font-semibold text-[#c8ff8a]">
                <Cpu size={14} color="currentColor" variant="Linear" /> Exclusivo MakersHub
              </div>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                Conecte seu <span className="text-[#90F826]">ChatGPT</span> e <span className="text-[#90F826]">Claude</span> ao MakersHub.
              </h2>
              <p className="mt-5 text-base text-white/65 md:text-lg">
                Lance gastos e ganhos, consulte a agenda, liste tarefas e pergunte qualquer
                dado do financeiro direto pelo chat que você já usa todo dia — em linguagem natural,
                por texto ou voz.
              </p>

              <ul className="mt-8 space-y-3 text-sm text-white/80">
                {[
                  "Lance receitas e despesas falando ou digitando",
                  "Crie e envie orçamentos com um comando",
                  "Pergunte qualquer dado do financeiro em linguagem natural",
                  "Marque tarefas, follow-ups e reuniões pelo chat",
                ].map(t => (
                  <li key={t} className="flex items-start gap-3">
                    <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-[#90F826]/20 text-[#90F826]">
                      <TickCircle size={12} color="currentColor" variant="Linear" />
                    </div>
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/55">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <Microphone size={12} color="currentColor" variant="Linear" /> Comando por voz
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <MessageSquareText className="size-3" /> Texto natural
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <MagicStar size={12} color="currentColor" variant="Linear" /> ChatGPT nativo
                </span>
              </div>
            </div>

            {/* chat mock */}
            <ChatMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatMock() {
  return (
    <div className="relative flex items-center justify-center gap-6">
      <div className="absolute -inset-4 rounded-3xl bg-[#90F826]/20 blur-3xl" />
      <PhoneMock
        brand="ChatGPT"
        brandColor="#10A37F"
        time="14:32"
        messages={[
          { role: "user", text: "lança uma despesa: cadeira de escritório, 1500 reais, paguei hoje" },
          {
            role: "ai",
            text: (
              <>
                Feito! Registrei o lançamento no financeiro do <b className="text-white">MakersHub</b>:
                <div className="my-2 space-y-1 rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-[10px] text-white/80">
                  <Row k="Tipo" v="Despesa" />
                  <Row k="Categoria" v="Gastos com Escritório" />
                  <Row k="Descrição" v="Cadeira de escritório" />
                  <Row k="Valor" v="R$ 1.500,00" accent />
                  <Row k="Data" v="19/06/2026" />
                  <Row k="Status" v="Pago" />
                </div>
                Quer que eu marque como ativo imobilizado também?
              </>
            ),
          },
        ]}
      />
      <PhoneMock
        brand="Claude"
        brandColor="#D97757"
        time="09:14"
        offset
        messages={[
          { role: "user", text: "o que tenho na agenda amanhã e quanto entrou essa semana?" },
          {
            role: "ai",
            text: (
              <>
                <div className="mb-1 font-semibold text-white">Agenda · 23/06</div>
                <ul className="mb-2 space-y-0.5 text-[10px] text-white/75">
                  <li>· 09:00 — Captação Banco X</li>
                  <li>· 14:30 — Reunião Nova Marca</li>
                  <li>· 17:00 — Revisão Doc Praia</li>
                </ul>
                <div className="font-semibold text-white">Financeiro · semana</div>
                <div className="text-[10px] text-white/75">
                  Entraram <b className="text-[#90F826]">R$ 42.800</b> em 3 projetos. Saída de R$ 8.200.
                </div>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-white/45">{k}</span>
      <span className={accent ? "font-semibold text-[#90F826]" : "text-white/90"}>{v}</span>
    </div>
  );
}

type PhoneMsg = { role: "user" | "ai"; text: React.ReactNode };
function PhoneMock({
  brand, brandColor, time, messages, offset,
}: { brand: string; brandColor: string; time: string; messages: PhoneMsg[]; offset?: boolean }) {
  return (
    <div className={`relative ${offset ? "hidden translate-y-10 lg:block" : ""}`}>
      <div
        className="relative w-[270px] rounded-[2.5rem] border border-white/10 bg-[#0b0b10] p-2"
        style={{ boxShadow: `0 0 60px -16px ${brandColor}55, 0 30px 80px -20px rgba(0,0,0,0.9)` }}
      >
        <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="overflow-hidden rounded-[2rem] bg-[#101015]">
          <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[10px] font-medium text-white/70">
            <span>{time}</span>
            <span className="flex gap-1">
              <span className="size-1 rounded-full bg-white/60" />
              <span className="size-1 rounded-full bg-white/60" />
              <span className="size-1 rounded-full bg-white/60" />
            </span>
          </div>
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
            <div
              className="grid size-7 place-items-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: brandColor }}
            >
              {brand[0]}
            </div>
            <div>
              <div className="text-xs font-semibold text-white">{brand}</div>
              <div className="text-[9px] text-white/45">conectado · MakersHub</div>
            </div>
          </div>
          <div className="space-y-2 px-3 py-4">
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role}>{m.text}</ChatBubble>
            ))}
            <div className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              <Microphone size={14} color="currentColor" variant="Linear" className="text-[#90F826]" />
              <span className="text-[10px] text-white/40">Mensagem</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ role, children }: { role: "user" | "ai"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
          isUser
            ? "rounded-br-md bg-[#90F826] text-[#0a0a0a]"
            : "rounded-bl-md border border-white/10 bg-white/[0.04] text-white/85"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- how it works ---------- */
function HowItWorks() {
  const steps = [
    { n: "01", t: "Assine o MakersHub", d: "Pagamento único anual. Em 30 segundos sua produtora está pronta pra operar." },
    { n: "02", t: "Conecte seu fluxo", d: "Importe contatos, abra o primeiro projeto e ative a integração com ChatGPT." },
    { n: "03", t: "Trabalhe no piloto automático", d: "Lance financeiro, mande orçamentos e acompanhe projetos pelo chat ou pelo dashboard." },
  ];
  return (
    <section id="como" className="relative px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#90F826]">Como funciona</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Em pé em 5 minutos. Sério.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map(s => (
            <div key={s.n} className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] p-7">
              <div className="font-display text-5xl font-bold text-[#90F826]/25">{s.n}</div>
              <h3 className="mt-4 font-display text-xl font-semibold text-white">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- testimonials ---------- */
function Testimonials() {
  const items = [
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
    {
      q: "Pipeline organizado, orçamentos em minutos, time alinhado. Em 30 dias o caos virou rotina.",
      n: "Carla Beltrão",
      r: "Videomaker independente",
    },
  ];
  return (
    <section id="depoimentos" className="relative px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#90F826]">Quem já usa</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Produtoras que largaram a planilha.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map(t => (
            <div key={t.n} className="flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] p-7">
              <Quote className="size-6 text-[#90F826]/60" />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-white/80">"{t.q}"</p>
              <div className="mt-6 border-t border-white/5 pt-4">
                <div className="text-sm font-semibold text-white">{t.n}</div>
                <div className="text-xs text-white/45">{t.r}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- pricing ---------- */
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

function Pricing() {
  const [loading, setLoading] = useState(false);
  const [erro] = useState<string | null>(null);

  function handleBuy() {
    setLoading(true);
    window.location.assign("/checkout");
  }

  return (
    <section id="precos" className="relative px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-5xl">

        {/* cabeçalho */}
        <div className="mb-14 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#90F826]">Preços</span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Um preço justo,<br />
            <span className="text-[#90F826]">sem cobrança mensal.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/55">
            Acesso completo por menos de um café por semana.
          </p>
        </div>

        {/* card */}
        <div className="mx-auto max-w-[420px]">
          <div className="relative overflow-hidden rounded-3xl border border-[#90F826]/35 bg-[#13150f] p-8 md:p-10">

            {/* glow atrás do card */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[500px] -translate-x-1/2 rounded-full bg-[#90F826]/18 blur-[90px]" />

            {/* badge de lançamento */}
            <div className="relative mb-8 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#90F826]/40 bg-[#90F826]/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#c8ff8a]">
                <Flash size={11} color="currentColor" variant="Linear" />
                Condição de lançamento
              </span>
            </div>

            {/* bloco de preço */}
            <div className="relative text-center">
              <p className="text-sm text-white/40 line-through mb-1">De R$ 149/ano</p>
              <div className="flex items-end justify-center gap-1.5">
                <span className="text-xl font-medium text-white/60 mb-3">R$</span>
                <span className="font-display text-[88px] font-bold leading-none tracking-tight text-white">97</span>
                <span className="text-xl font-medium text-white/60 mb-3">/ano</span>
              </div>
              <p className="mt-2 text-sm text-white/40">menos de R$ 8 por mês</p>
            </div>

            {/* divider */}
            <div className="relative my-8 border-t border-white/[0.07]" />

            {/* lista de features */}
            <ul className="relative space-y-3.5">
              {FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/75">
                  <TickCircle size={17} color="#90F826" variant="Bold" className="shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* erro */}
            {erro && (
              <p className="relative mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400 text-center">{erro}</p>
            )}

            {/* botão */}
            <button
              onClick={handleBuy}
              disabled={loading}
              className="relative mt-8 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#90F826] py-4 text-[15px] font-bold text-[#0d0f0a] shadow-[0_0_60px_-10px_rgba(144,248,38,0.55)] transition-all hover:bg-[#a3ff45] hover:shadow-[0_0_70px_-8px_rgba(144,248,38,0.7)] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Redirecionando…" : "Comprar agora"}
              {!loading && <ArrowRight2 size={17} color="currentColor" variant="Linear" />}
            </button>

            {/* garantia */}
            <div className="relative mt-4 flex items-center justify-center gap-1.5 text-xs text-white/35">
              <ShieldTick size={13} color="currentColor" variant="Linear" />
              Garantia de 7 dias · reembolso sem perguntas
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-white/30">
            IA integrada disponível como créditos opcionais dentro da plataforma.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- final cta ---------- */
function FinalCTA() {
  return (
    <section id="cta" className="relative px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-[#90F826]/30 bg-gradient-to-br from-[#90F826]/[0.10] via-[#1a1a22] to-[#18181f] px-6 py-16 text-center md:px-16 md:py-24">
          <div className="absolute -top-24 left-1/2 h-72 w-[800px] -translate-x-1/2 rounded-full bg-[#90F826]/25 blur-[120px]" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Comece hoje.<br />
              <span className="text-[#90F826]">Sem mensalidade. Sem enrolação.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/65">
              Suba sua produtora pro MakersHub hoje e sinta a diferença de operar tudo
              num lugar só — com IA do seu lado.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={irParaPrecos}
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-[#90F826] px-7 text-sm font-semibold text-[#0a0a0a] shadow-[0_0_40px_-8px_rgba(144,248,38,0.7)] transition hover:bg-[#a3ff45]"
              >
                Comprar agora <ArrowRight2 size={16} color="currentColor" variant="Linear" className="transition group-hover:translate-x-0.5" />
              </button>
              <a
                href="#features"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-white/85 transition hover:bg-white/[0.06]"
              >
                Ver recursos novamente
              </a>
            </div>
            <p className="mt-5 text-xs text-white/40">7 dias de garantia · Suporte humano em português</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- footer ---------- */
function Footer() {
  const cols = [
    { t: "Produto", links: [{ l: "Recursos", h: "#features" }, { l: "IA / ChatGPT", h: "#ia" }, { l: "Como funciona", h: "#como" }, { l: "Preços", h: "#precos" }] },
    { t: "Empresa", links: [{ l: "Contato", h: "mailto:equipe@makershub.app.br" }] },
    { t: "Legal", links: [{ l: "Termos de Uso", h: "/termos" }, { l: "Privacidade", h: "/privacidade" }] },
  ];
  return (
    <footer className="relative border-t border-white/5 px-5 py-14 md:px-8">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 md:grid-cols-5">
        <div className="col-span-2">
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm text-white/50">
            O hub completo de gestão para produtoras de audiovisual e criadores de conteúdo.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a className="grid size-9 place-items-center rounded-lg border border-white/8 text-white/60 transition hover:border-[#90F826]/40 hover:text-[#90F826]" href="#"><Instagram className="size-4" /></a>
            <a className="grid size-9 place-items-center rounded-lg border border-white/8 text-white/60 transition hover:border-[#90F826]/40 hover:text-[#90F826]" href="#"><Linkedin className="size-4" /></a>
            <a className="grid size-9 place-items-center rounded-lg border border-white/8 text-white/60 transition hover:border-[#90F826]/40 hover:text-[#90F826]" href="#"><Youtube className="size-4" /></a>
          </div>
        </div>
        {cols.map(c => (
          <div key={c.t}>
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">{c.t}</div>
            <ul className="space-y-2.5 text-sm text-white/65">
              {c.links.map(l => <li key={l.l}><a href={l.h} className="transition hover:text-white">{l.l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-start justify-between gap-3 border-t border-white/5 pt-6 text-xs text-white/40 sm:flex-row sm:items-center">
        <span>© {new Date().getFullYear()} MakersHub. Todos os direitos reservados.</span>
        <span>Feito no Brasil para criativos do audiovisual.</span>
      </div>
    </footer>
  );
}
