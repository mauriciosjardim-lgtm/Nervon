import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Add, ArrowRight2, CalendarTick, Camera, ClipboardTick, DocumentText1, Flash, Location, MonitorRecorder, More, People, TaskSquare, Video, Wallet2 } from "iconsax-react";
import type { Icon } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STATUS_EVENTO } from "@/lib/eventos/types";
import { useEventosProducao } from "@/lib/eventos/storage";
import { eventosPublicamenteAtivo } from "@/lib/eventos/availability";

export const Route = createFileRoute("/eventos")({ ssr: false, component: EventosPage });

function EventosPage() {
  return eventosPublicamenteAtivo() ? <EventosLaboratorio /> : <EventosEmBreve />;
}

const dataBR = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

function EventosLaboratorio() {
  const eventos = useEventosProducao();
  const navigate = useNavigate();
  const proximos = useMemo(() => [...eventos].sort((a, b) => (a.dias[0]?.data ?? "").localeCompare(b.dias[0]?.data ?? "")), [eventos]);
  const tarefas = eventos.reduce((n, e) => n + (e.tarefasTotal - e.tarefasConcluidas), 0);
  return <main className="min-h-[calc(100vh-4rem)] bg-background px-5 py-7 lg:px-8"><div className="mx-auto max-w-[1680px] space-y-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Laboratório local</span><h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Central de eventos</h1><p className="mt-1 text-sm text-muted-foreground">Planejamento, equipe e controle de cada operação em um só lugar.</p></div><Button onClick={() => navigate({ to: "/novo-evento" })} className="gap-2 shadow-[0_0_24px_-6px_var(--primary)]"><Add size={17} color="currentColor" />Novo evento</Button></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><LabMetric label="Eventos ativos" value={String(eventos.filter(e => e.status !== "finalizado").length)} hint="operações em andamento" icon={CalendarTick} /><LabMetric label="Próximas operações" value={String(eventos.length)} hint="eventos em preparação" icon={TaskSquare} /><LabMetric label="Pendências abertas" value={String(tarefas)} hint="entre todos os eventos" icon={More} /><LabMetric label="Equipe mobilizada" value={String(eventos.reduce((n, e) => n + e.equipe, 0))} hint="alocações previstas" icon={People} /></section>
    <section className="rounded-2xl border border-border/70 bg-card/45 p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Próximas operações</h2><p className="text-xs text-muted-foreground">Abra um evento para entrar no centro de comando.</p></div><span className="rounded-full border border-border bg-surface-1 px-2.5 py-1 text-[10px] text-muted-foreground">{eventos.length} eventos</span></div>
      <div className="grid gap-3 xl:grid-cols-2">{proximos.map(evento => { const progresso = evento.tarefasTotal ? evento.tarefasConcluidas / evento.tarefasTotal * 100 : 0; return <button key={evento.id} onClick={() => navigate({ to: "/operacao-evento/$id", params: { id: evento.id } })} className="group w-full overflow-hidden rounded-2xl border border-border/65 bg-surface-1/35 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-2/55 hover:shadow-xl"><div className="flex"><div className="w-1 shrink-0" style={{ backgroundColor: evento.cor }} /><div className="min-w-0 flex-1 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-display text-[15px] font-semibold">{evento.nome}</h3><span className="rounded-full border border-border/80 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{STATUS_EVENTO[evento.status]}</span></div><p className="mt-1 text-xs text-muted-foreground">{evento.cliente} · {evento.tipo}</p></div><div className="flex shrink-0 items-center gap-2 text-xs"><span className="font-medium">{evento.dias.length > 1 ? `${dataBR(evento.dias[0].data)} — ${dataBR(evento.dias.at(-1)!.data)}` : dataBR(evento.dias[0].data)}</span><ArrowRight2 size={15} color="currentColor" className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></div></div><div className="mt-4 grid gap-3 text-[11px] text-muted-foreground sm:grid-cols-[1fr_auto_auto]"><span className="flex min-w-0 items-center gap-1.5 truncate"><Location size={14} color="currentColor" />{evento.local || "Local a definir"}</span><span className="flex items-center gap-1.5"><People size={14} color="currentColor" />{evento.equipe} pessoas</span><span>{evento.tarefasConcluidas}/{evento.tarefasTotal} concluídas</span></div><Progress value={progresso} className="mt-3 h-1" /></div></div></button>; })}</div>
    </section>
  </div></main>;
}

function LabMetric({ label, value, hint, icon: Icone }: { label: string; value: string; hint: string; icon: Icon }) { return <div className="rounded-2xl border border-border/70 bg-card/45 p-4"><div className="flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{label}</p><p className="mt-2 font-display text-2xl font-semibold">{value}</p></div><div className="grid size-9 place-items-center rounded-xl bg-primary/8 text-primary"><Icone size={18} color="currentColor" variant="TwoTone" /></div></div><p className="mt-1 text-[11px] text-muted-foreground">{hint}</p></div>; }

const recursos: Array<{ icon: Icon; titulo: string; texto: string }> = [
  { icon: CalendarTick, titulo: "Cronograma operacional", texto: "Organize cada dia, ambiente, horário e mudança da programação." },
  { icon: People, titulo: "Equipe por função e dia", texto: "Escale videomakers, fotógrafos, produção, áudio, FPV e realtime." },
  { icon: Camera, titulo: "Equipamentos e responsáveis", texto: "Saiba o que vai para o evento, com quem está e o que ainda falta." },
  { icon: ClipboardTick, titulo: "Checklists inteligentes", texto: "Preparação, montagem, operação e encerramento sem depender da memória." },
  { icon: Video, titulo: "Central de realtime", texto: "Controle logs, materiais recebidos, edições e entregas durante o evento." },
  { icon: MonitorRecorder, titulo: "Modo Evento ao vivo", texto: "Acompanhe equipe, ambientes, alertas e próximos passos em tempo real." },
  { icon: Wallet2, titulo: "Custos da operação", texto: "Acompanhe cachês, adicionais e margem antes de levar o resultado ao financeiro." },
  { icon: DocumentText1, titulo: "Referências em um só lugar", texto: "Briefings, mapas, roteiros, links e arquivos disponíveis para toda a operação." },
];

function EventosEmBreve() {
  return <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background px-5 py-8 lg:px-10 lg:py-12">
    <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:48px_48px]" />
    <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]" />
    <div className="relative mx-auto max-w-[1320px]">
      <section className="overflow-hidden rounded-[28px] border border-border/70 bg-card/55 shadow-2xl shadow-black/10 backdrop-blur-xl">
        <div className="grid lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col justify-center px-7 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-20">
            <div className="mb-7 flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_28px_-10px_var(--primary)]"><Flash size={23} color="currentColor" variant="Bulk" /></div><span className="rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Em desenvolvimento</span></div>
            <p className="text-xs font-semibold uppercase tracking-[.24em] text-primary">MakersHub Eventos</p>
            <h1 className="mt-4 max-w-[720px] font-display text-4xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-5xl lg:text-[58px]">A operação inteira do evento, <span className="text-primary">viva e conectada.</span></h1>
            <p className="mt-6 max-w-[620px] text-base leading-relaxed text-muted-foreground sm:text-lg">Em breve, você vai planejar a equipe, preparar cada detalhe e comandar o evento em tempo real sem espalhar a operação entre planilhas, grupos e anotações.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><Pill icon={Location} text="Vários ambientes" /><Pill icon={People} text="Equipes flexíveis" /><Pill icon={MonitorRecorder} text="Operação ao vivo" /></div>
          </div>
          <div className="relative min-h-[390px] overflow-hidden border-t border-border/60 bg-surface-1/30 p-7 lg:min-h-full lg:border-l lg:border-t-0 lg:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[.08] via-transparent to-transparent" />
            <div className="relative flex h-full flex-col justify-center gap-3"><PreviewLane label="PALCO PRINCIPAL" active title="Painel de abertura" time="09:00 — 10:10" /><PreviewLane label="LOUNGE REALTIME" title="Entrevistas e cortes" time="09:30 — 12:00" /><PreviewLane label="BASTIDORES" title="Captação de convidados" time="10:00 — 11:40" /><div className="mt-3 grid grid-cols-3 gap-2.5"><PreviewMetric value="12" label="Equipe" /><PreviewMetric value="04" label="Ambientes" /><PreviewMetric value="87%" label="Preparação" /></div></div>
          </div>
        </div>
      </section>
      <section className="py-12 lg:py-16">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary">Em breve, aqui você vai conseguir</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Do planejamento ao último arquivo entregue.</h2></div><p className="max-w-md text-sm leading-relaxed text-muted-foreground">Estamos construindo cada módulo com foco no fluxo real de produtoras e equipes audiovisuais.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{recursos.map(({ icon: Icone, titulo, texto }, index) => <article key={titulo} className="group relative overflow-hidden rounded-2xl border border-border/65 bg-card/40 p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:bg-card/70 hover:shadow-xl"><span className="absolute right-4 top-4 font-mono text-[9px] text-muted-foreground/40">{String(index + 1).padStart(2, "0")}</span><div className="grid size-10 place-items-center rounded-xl border border-border/60 bg-surface-2/70 text-muted-foreground transition group-hover:border-primary/25 group-hover:bg-primary/10 group-hover:text-primary"><Icone size={20} color="currentColor" variant="TwoTone" /></div><h3 className="mt-5 font-display text-[15px] font-semibold">{titulo}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{texto}</p><div className="mt-5 h-px w-full bg-border/50"><div className="h-px w-0 bg-primary transition-all duration-500 group-hover:w-full" /></div></article>)}</div>
      </section>
      <TimelinePreview />
      <div className="mb-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground"><span className="size-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />Esta área ainda não está disponível para uso.</div>
    </div>
  </main>;
}

function Pill({ icon: Icone, text }: { icon: Icon; text: string }) { return <span className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface-1/60 px-3.5 py-2.5"><Icone size={15} color="currentColor" className="text-primary" />{text}</span>; }
function PreviewLane({ label, title, time, active = false }: { label: string; title: string; time: string; active?: boolean }) { return <div className="rounded-2xl border border-border/65 bg-background/70 p-4 shadow-lg backdrop-blur-sm"><div className="flex items-center justify-between gap-3"><span className="text-[9px] font-semibold tracking-[.16em] text-muted-foreground">{label}</span>{active && <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-primary"><span className="size-1.5 animate-pulse rounded-full bg-primary" />Agora</span>}</div><div className="mt-3 flex items-center gap-3"><div className="h-9 w-1 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{title}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{time}</p></div><div className="flex -space-x-1.5"><span className="grid size-6 place-items-center rounded-full border-2 border-background bg-primary/20 text-[8px] font-bold text-primary">MJ</span><span className="grid size-6 place-items-center rounded-full border-2 border-background bg-surface-3 text-[8px] font-bold">PR</span></div></div></div>; }
function PreviewMetric({ value, label }: { value: string; label: string }) { return <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-3 text-center backdrop-blur-sm"><p className="font-display text-lg font-semibold text-primary">{value}</p><p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p></div>; }

function TimelinePreview() {
  const ticks = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
  const tracks = [
    { nome: "Palco principal", cor: "var(--primary)", blocos: [{ left: 3, width: 19, texto: "Abertura" }, { left: 25, width: 34, texto: "Painel de liderança" }, { left: 63, width: 25, texto: "Premiação" }] },
    { nome: "Lounge", cor: "#48a9ff", blocos: [{ left: 19, width: 35, texto: "Entrevistas" }, { left: 58, width: 28, texto: "Conteúdo patrocinado" }] },
    { nome: "Realtime", cor: "#b469ff", blocos: [{ left: 31, width: 25, texto: "Corte 01" }, { left: 59, width: 20, texto: "Corte 02" }, { left: 82, width: 14, texto: "Entrega" }] },
    { nome: "Bastidores", cor: "#ffb84d", blocos: [{ left: 10, width: 24, texto: "Preparação" }, { left: 45, width: 36, texto: "Captação de convidados" }] },
  ];
  return <section className="mb-12 overflow-hidden rounded-[26px] border border-border/70 bg-card/55 shadow-2xl shadow-black/10">
    <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><CalendarTick size={19} color="currentColor" className="text-primary" variant="Bulk" /><h2 className="font-display text-xl font-semibold">Timeline operacional</h2><span className="rounded-md border border-primary/20 bg-primary/8 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-primary">Prévia</span></div><p className="mt-1 text-xs text-muted-foreground">Uma visão de edição para enxergar ambientes e operações simultâneas.</p></div><span className="font-mono text-[10px] text-muted-foreground">09:00 — 17:00</span></div>
    <div className="overflow-x-auto px-4 pb-6 pt-4 sm:px-6"><div className="min-w-[900px]"><div className="ml-32 grid grid-cols-8 border-b border-border/50 pb-3">{ticks.map(t => <span key={t} className="text-[9px] text-muted-foreground">{t}</span>)}</div><div className="relative mt-3 space-y-2.5"><div className="pointer-events-none absolute bottom-0 left-[59%] top-0 z-20 w-px bg-primary shadow-[0_0_10px_var(--primary)]"><span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase tracking-wider text-primary">Agora</span></div>{tracks.map(track => <div key={track.nome} className="grid grid-cols-[120px_1fr] items-center gap-3"><div className="flex items-center gap-2 text-[10px] text-muted-foreground"><span className="size-1.5 rounded-full" style={{ backgroundColor: track.cor }} />{track.nome}</div><div className="relative h-9 overflow-hidden rounded-lg border border-border/50 bg-background/50 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px)] [background-size:12.5%_100%]">{track.blocos.map(bloco => <div key={bloco.texto} className="absolute top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded-[5px] border px-2 text-[8px] font-medium leading-[18px]" style={{ left: `${bloco.left}%`, width: `${bloco.width}%`, color: track.cor, borderColor: `color-mix(in srgb, ${track.cor} 45%, transparent)`, backgroundColor: `color-mix(in srgb, ${track.cor} 13%, transparent)` }}>{bloco.texto}</div>)}</div></div>)}</div></div></div>
  </section>;
}
