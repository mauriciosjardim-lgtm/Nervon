import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  FolderOpen,
  LayoutDashboard,
  MapPin,
  Radio,
  Rows3,
  Settings,
  ShieldAlert,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { eventosProducaoActions, useEventosProducao } from "@/lib/eventos/storage";
import type {
  ChecklistEvento,
  DiaEvento,
  EventoProducao,
  ItemRealtimeEvento,
  MomentoEvento,
} from "@/lib/eventos/types";
import { cn } from "@/lib/utils";
import { eventosPublicamenteAtivo } from "@/lib/eventos/availability";

export const Route = createFileRoute("/evento-live/$id")({
  beforeLoad: () => { if (!eventosPublicamenteAtivo()) throw redirect({ to: "/eventos" }); },
  ssr: false,
  component: EventoLive,
});

const nowTime = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

type LiveScenario = "normal" | "pico" | "atrasos" | "encerramento";

const LIVE_SCENARIOS: Array<{ id: LiveScenario; label: string }> = [
  { id: "normal", label: "Operação atual" },
  { id: "pico", label: "Pico simultâneo" },
  { id: "atrasos", label: "Atrasos em cascata" },
  { id: "encerramento", label: "Encerramento" },
];

const scenarioMinutes = (time: string) => {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const scenarioTime = (value: number) => {
  const safe = Math.max(0, Math.min(23 * 60 + 59, value));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

function buildScenarioAgenda(agenda: MomentoEvento[], scenario: LiveScenario): MomentoEvento[] {
  if (scenario === "normal") return agenda;

  const now = scenarioMinutes(nowTime());
  const environments = [
    "Palco principal",
    "Lounge conteúdo",
    "Bastidores",
    "Patrocinadores",
    "Ilha realtime",
  ];
  const settings: Record<
    Exclude<LiveScenario, "normal">,
    Array<[number, number, MomentoEvento["status"]]>
  > = {
    pico: [
      [-70, 115, "em_andamento"],
      [-55, 100, "em_andamento"],
      [-35, 90, "atrasado"],
      [-15, 75, "em_andamento"],
      [5, 55, "preparar"],
      [15, 65, "preparar"],
      [30, 80, "previsto"],
      [50, 60, "previsto"],
      [70, 75, "previsto"],
      [95, 50, "previsto"],
      [115, 70, "previsto"],
    ],
    atrasos: [
      [-150, 55, "concluido"],
      [-105, 80, "atrasado"],
      [-75, 95, "atrasado"],
      [-50, 100, "em_andamento"],
      [-25, 75, "atrasado"],
      [10, 70, "preparar"],
      [25, 85, "preparar"],
      [55, 65, "previsto"],
      [80, 60, "previsto"],
      [105, 70, "previsto"],
      [130, 45, "previsto"],
    ],
    encerramento: [
      [-240, 55, "concluido"],
      [-205, 75, "concluido"],
      [-170, 65, "concluido"],
      [-135, 90, "concluido"],
      [-100, 70, "concluido"],
      [-70, 80, "concluido"],
      [-45, 65, "concluido"],
      [-20, 55, "em_andamento"],
      [15, 45, "preparar"],
      [40, 50, "previsto"],
      [65, 60, "previsto"],
    ],
  };

  return agenda
    .map((moment, index) => {
      const [offset, duration, status] = settings[scenario][index % settings[scenario].length];
      const captureItems = (moment.captacaoItens ?? []).map((item, itemIndex) => ({
        ...item,
        concluido: status === "concluido" || (status === "em_andamento" && itemIndex === 0),
      }));
      return {
        ...moment,
        inicio: scenarioTime(now + offset),
        fim: scenarioTime(now + offset + duration),
        local: environments[index % environments.length],
        status,
        captacaoItens: captureItems,
      };
    })
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

function EventoLive() {
  const { id } = Route.useParams();
  const evento = useEventosProducao().find((item) => item.id === id);
  const [diaId, setDiaId] = useState<string>();
  const [view, setView] = useState<"painel" | "timeline">("painel");
  const [scenario, setScenario] = useState<LiveScenario>("normal");
  const [selectedMomentId, setSelectedMomentId] = useState<string>();
  const activeDay = evento?.dias.find((dia) => dia.id === diaId) ?? evento?.dias[0];
  const agenda = useMemo(
    () =>
      (evento?.programacao ?? [])
        .filter((item) => item.diaId === activeDay?.id)
        .sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [evento, activeDay?.id],
  );
  const displayAgenda = useMemo(() => buildScenarioAgenda(agenda, scenario), [agenda, scenario]);

  if (!evento || !activeDay) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-center">
        <div>
          <p>Evento não encontrado.</p>
          <Link to="/eventos" className="mt-3 block text-primary">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  // Callbacks dentro de blocos condicionais não preservam o narrowing do React/TS.
  // Estas referências garantem que o Modo Evento nunca acesse uma operação ausente.
  const liveEvento = evento;
  const liveDay = activeDay;
  const showLegacyTimelineCards = false;

  const updateMoment = (moment: MomentoEvento, patch: Partial<MomentoEvento>) =>
    eventosProducaoActions.atualizar(evento.id, {
      programacao: (evento.programacao ?? []).map((item) =>
        item.id === moment.id ? { ...item, ...patch } : item,
      ),
    });
  const checklist = (evento.checklist ?? []).filter(
    (item) => !item.diaId || item.diaId === activeDay.id,
  );
  const realtime = (evento.realtimeItens ?? []).filter((item) => item.status !== "publicado");

  return (
    <main className="min-h-screen bg-[#050706] text-foreground">
      <div className="min-h-screen">
        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#0c0e0f]/90 px-4 py-3 backdrop-blur-xl lg:px-8">
            <div className="mx-auto flex max-w-none items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  to="/operacao-evento/$id"
                  params={{ id }}
                  className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10"
                >
                  <ArrowLeft className="size-4" />
                </Link>
                <div className="min-w-0">
                  <h1 className="truncate font-display text-base font-semibold sm:text-lg">
                    {evento.nome}
                  </h1>
                  <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                    Modo Evento · {evento.local} ·{" "}
                    {new Date(`${activeDay.data}T12:00:00`).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                    })}
                  </p>
                </div>
                <span className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-[8px] font-bold uppercase tracking-[.14em] text-primary sm:flex">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                  Em campo
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden text-right sm:block">
                  <div className="font-mono text-base font-semibold tracking-wider">
                    {nowTime()}
                  </div>
                  <p className="mt-0.5 text-[8px] text-muted-foreground">
                    Sincronizado <span className="text-primary">agora</span>
                  </p>
                </div>
                <div className="flex shrink-0 rounded-xl border border-white/[.08] bg-white/[.025] p-1">
                  <button
                    onClick={() => setView("painel")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-[9px] transition",
                      view === "painel"
                        ? "bg-white/[.08] text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Radio className="size-3.5" /> Painel
                  </button>
                  <button
                    onClick={() => setView("timeline")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-[9px] transition",
                      view === "timeline"
                        ? "bg-white/[.08] text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Rows3 className="size-3.5" /> Timeline
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-none space-y-3 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className={cn(
                  "gap-2 overflow-x-auto pb-1",
                  evento.dias.length > 1 ? "flex" : "hidden",
                )}
              >
                {evento.dias.map((dia, index) => (
                  <button
                    key={dia.id}
                    onClick={() => {
                      setDiaId(dia.id);
                      setSelectedMomentId(undefined);
                    }}
                    className={cn(
                      "min-w-[145px] rounded-xl border px-4 py-3 text-left transition",
                      dia.id === activeDay.id
                        ? "border-primary/40 bg-primary/10"
                        : "border-white/[.08] bg-white/[.025]",
                    )}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Dia {index + 1}
                    </span>
                    <p className="mt-1 text-xs font-semibold">
                      {new Date(`${dia.data}T12:00:00`).toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </button>
                ))}
              </div>
              <p className="hidden text-[9px] uppercase tracking-[.15em] text-muted-foreground sm:block">
                Operação do dia · {activeDay.inicio}—{activeDay.fim}
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-white/[.06] bg-white/[.018] p-1.5">
              <span className="shrink-0 px-2 text-[8px] font-semibold uppercase tracking-[.16em] text-muted-foreground">
                Simular
              </span>
              {LIVE_SCENARIOS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setScenario(item.id);
                    setSelectedMomentId(undefined);
                  }}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-2 text-[8px] font-medium transition",
                    scenario === item.id
                      ? "bg-primary text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/.15)]"
                      : "text-muted-foreground hover:bg-white/[.04] hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
              {scenario !== "normal" && (
                <span className="ml-auto shrink-0 px-2 text-[8px] text-amber-300/80">
                  Prévia local · não altera o evento
                </span>
              )}
            </div>

            {view === "painel" && (
              <PainelOperacional
                agenda={displayAgenda}
                evento={evento}
                activeDay={activeDay}
                checklist={checklist}
                realtime={realtime}
                selectedId={selectedMomentId}
                onSelect={setSelectedMomentId}
                onUpdate={updateMoment}
                onOpenTimeline={() => setView("timeline")}
              />
            )}

            {view === "timeline" && (
              <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h2 className="font-display text-xl font-semibold">
                        Timeline completa do evento
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Operações simultâneas, deslocamentos e conflitos.
                      </p>
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {activeDay.inicio}—{activeDay.fim}
                    </span>
                  </div>
                  <TimelineOperacional
                    agenda={displayAgenda}
                    evento={evento}
                    activeDay={activeDay}
                    selectedId={selectedMomentId}
                    onSelect={setSelectedMomentId}
                    onUpdate={updateMoment}
                  />
                  {showLegacyTimelineCards &&
                    displayAgenda.map((moment) => {
                      const people = moment.responsavelIds
                        .map((memberId) =>
                          liveEvento.equipeMembros?.find((member) => member.id === memberId),
                        )
                        .filter(Boolean);
                      const live = moment.status === "em_andamento";
                      const done = moment.status === "concluido";
                      return (
                        <article
                          key={moment.id}
                          className={cn(
                            "overflow-hidden rounded-2xl border bg-[#121516] transition",
                            live
                              ? "border-primary/50 shadow-[0_0_35px_hsl(var(--primary)/.08)]"
                              : "border-white/[.08]",
                            done && "opacity-65",
                          )}
                        >
                          <div className="flex gap-4 p-4 sm:p-5">
                            <div className="w-14 shrink-0 font-mono">
                              <strong className="text-sm">{moment.inicio}</strong>
                              <p className="mt-1 text-[10px] text-muted-foreground">{moment.fim}</p>
                              {moment.inicioReal && (
                                <p className="mt-2 text-[9px] text-primary">
                                  Real {moment.inicioReal}
                                </p>
                              )}
                            </div>
                            <div
                              className="min-w-0 flex-1 border-l-2 pl-4"
                              style={{ borderColor: live ? liveEvento.cor : `${liveEvento.cor}55` }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3
                                    className={cn(
                                      "font-display text-base font-semibold",
                                      done && "line-through",
                                    )}
                                  >
                                    {moment.titulo}
                                  </h3>
                                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <MapPin className="size-3" />
                                    {moment.local || liveDay.local || liveEvento.local}
                                  </p>
                                </div>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-wider",
                                    live
                                      ? "bg-primary/15 text-primary"
                                      : "bg-white/5 text-muted-foreground",
                                  )}
                                >
                                  {live
                                    ? "Ao vivo"
                                    : done
                                      ? "Concluído"
                                      : moment.status === "preparar"
                                        ? "Preparar"
                                        : "Previsto"}
                                </span>
                              </div>
                              {(moment.cobertura || people.length > 0) && (
                                <div className="mt-4 rounded-xl bg-white/[.035] p-3">
                                  <p className="text-[9px] uppercase tracking-wider text-primary">
                                    Plano audiovisual
                                  </p>
                                  <p className="mt-1 text-xs">
                                    {moment.cobertura || "Cobertura a confirmar"}
                                  </p>
                                  <p className="mt-2 text-[10px] text-muted-foreground">
                                    {people.map((person) => person?.nome).join(" · ") ||
                                      "Equipe não alocada"}
                                  </p>
                                </div>
                              )}
                              <div className="mt-4 flex flex-wrap gap-2">
                                {!done && !live && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateMoment(moment, { status: "preparar" })}
                                  >
                                    Preparar
                                  </Button>
                                )}
                                {!done && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      updateMoment(
                                        moment,
                                        live
                                          ? { status: "concluido", fimReal: nowTime() }
                                          : { status: "em_andamento", inicioReal: nowTime() },
                                      )
                                    }
                                  >
                                    {live ? "Finalizar" : "Começou"}
                                  </Button>
                                )}
                                {!done && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateMoment(moment, { status: "atrasado" })}
                                  >
                                    Sinalizar atraso
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                </div>

                <aside className="space-y-4">
                  <Side
                    title="Checklist do dia"
                    icon={CheckCircle2}
                    count={`${checklist.filter((item) => item.concluido).length}/${checklist.length}`}
                  >
                    {checklist.slice(0, 8).map((item) => (
                      <button
                        key={item.id}
                        onClick={() =>
                          eventosProducaoActions.atualizar(evento.id, {
                            checklist: (evento.checklist ?? []).map((current) =>
                              current.id === item.id
                                ? { ...current, concluido: !current.concluido }
                                : current,
                            ),
                          })
                        }
                        className="flex w-full items-start gap-2 rounded-xl p-2 text-left hover:bg-white/[.035]"
                      >
                        {item.concluido ? (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        ) : (
                          <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span
                          className={cn(
                            "text-xs",
                            item.concluido && "text-muted-foreground line-through",
                          )}
                        >
                          {item.titulo}
                        </span>
                      </button>
                    ))}
                    {!checklist.length && (
                      <p className="py-5 text-center text-xs text-muted-foreground">
                        Sem itens para este dia.
                      </p>
                    )}
                  </Side>
                  <Side title="Realtime" icon={Video} count={String(realtime.length)}>
                    {realtime.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-xl border border-white/[.06] p-3"
                      >
                        <span className="size-2 rounded-full bg-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{item.titulo}</p>
                          <p className="mt-1 text-[9px] capitalize text-muted-foreground">
                            {item.status.replaceAll("_", " ")}
                          </p>
                        </div>
                        <ChevronRight className="size-3 text-muted-foreground" />
                      </div>
                    ))}
                    {!realtime.length && (
                      <p className="py-5 text-center text-xs text-muted-foreground">Fila limpa.</p>
                    )}
                  </Side>
                  <Side
                    title="Referências rápidas"
                    icon={BookOpen}
                    count={String(evento.referencias?.length ?? 0)}
                  >
                    {evento.referencias?.slice(0, 5).map((ref) => (
                      <a
                        key={ref.id}
                        href={ref.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-xl border border-white/[.06] p-3 text-xs hover:border-primary/30"
                      >
                        <span className="truncate">{ref.titulo}</span>
                        <ChevronRight className="size-3" />
                      </a>
                    ))}
                    {evento.orientacoesGerais && (
                      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/[.03] p-3 text-[10px] leading-relaxed text-muted-foreground">
                        {evento.orientacoesGerais}
                      </p>
                    )}
                  </Side>
                </aside>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function LiveSidebar({
  evento,
  activeView,
  onView,
}: {
  evento: EventoProducao;
  activeView: "painel" | "timeline";
  onView: (view: "painel" | "timeline") => void;
}) {
  const items = [
    {
      label: "Visão geral",
      icon: LayoutDashboard,
      active: activeView === "painel",
      action: () => onView("painel"),
    },
    {
      label: "Timeline",
      icon: Rows3,
      active: activeView === "timeline",
      action: () => onView("timeline"),
    },
    { label: "Equipe em campo", icon: Users },
    {
      label: "Realtime",
      icon: Video,
      badge: String(
        evento.realtimeItens?.filter((item) => item.status !== "publicado").length ?? 0,
      ),
    },
    {
      label: "Checklists",
      icon: CheckCircle2,
      badge: String(evento.checklist?.filter((item) => !item.concluido).length ?? 0),
    },
    { label: "Referências", icon: FolderOpen },
  ];
  return (
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/[.07] bg-[#070a08]/95 px-3 py-4 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3 px-2 py-1">
        <span className="grid size-8 place-items-center rounded-xl border border-primary/20 bg-primary/10 font-display text-lg font-black italic text-primary">
          M
        </span>
        <div>
          <strong className="block text-xs">MakersHub</strong>
          <span className="text-[7px] font-semibold uppercase tracking-[.15em] text-primary">
            Modo evento
          </span>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-[9px] font-bold text-primary">
            {evento.cliente
              .split(" ")
              .map((word) => word[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-[10px]">{evento.nome}</strong>
            <span className="mt-1 block truncate text-[8px] text-muted-foreground">
              {evento.cliente}
            </span>
          </div>
        </div>
      </div>
      <p className="mb-2 mt-7 px-3 text-[7px] font-semibold uppercase tracking-[.18em] text-muted-foreground/60">
        Operação
      </p>
      <nav className="space-y-1">
        {items.map(({ label, icon: Icon, active, action, badge }) => (
          <button
            key={label}
            onClick={action}
            className={cn(
              "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[10px] transition",
              active
                ? "border border-primary/15 bg-gradient-to-r from-primary/10 to-primary/[.025] text-primary"
                : "border border-transparent text-muted-foreground hover:bg-white/[.03] hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="rounded-full border border-white/[.08] px-1.5 py-0.5 text-[7px]">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[.08] to-white/[.015] p-3">
          <div className="flex items-center justify-between text-[7px] uppercase tracking-[.12em] text-muted-foreground">
            <span>Operação ativa</span>
            <span className="flex items-center gap-1 text-primary">
              <span className="size-1 rounded-full bg-primary" />
              Live
            </span>
          </div>
          <strong className="mt-3 block text-[10px]">{evento.nome}</strong>
          <span className="mt-1 block text-[8px] text-muted-foreground">
            {evento.equipeMembros?.length ?? evento.equipe} pessoas em campo
          </span>
        </div>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[9px] text-muted-foreground hover:bg-white/[.03]">
          <Settings className="size-4" /> Configurações de campo
        </button>
        <div className="flex items-center gap-3 border-t border-white/[.06] px-2 pt-3">
          <span className="grid size-8 place-items-center rounded-xl bg-primary text-[8px] font-black text-primary-foreground">
            MJ
          </span>
          <div>
            <strong className="block text-[9px]">Mauricio</strong>
            <span className="text-[7px] text-muted-foreground">Produtor responsável</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PainelOperacional({
  agenda,
  evento,
  activeDay,
  checklist,
  realtime,
  selectedId,
  onSelect,
  onUpdate,
  onOpenTimeline,
}: {
  agenda: MomentoEvento[];
  evento: EventoProducao;
  activeDay: DiaEvento;
  checklist: ChecklistEvento[];
  realtime: ItemRealtimeEvento[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onUpdate: (moment: MomentoEvento, patch: Partial<MomentoEvento>) => void;
  onOpenTimeline: () => void;
}) {
  const now = minutes(nowTime());
  const live = agenda.filter((item) => item.status === "em_andamento");
  const current = live.length
    ? live
    : agenda.filter((item) => minutes(item.inicio) <= now && minutes(item.fim) >= now);
  const zoneSource = [
    ...current,
    ...agenda.filter((item) => item.status !== "concluido"),
    ...agenda,
  ];
  const zones = Array.from(
    new Set(zoneSource.map((item) => item.local || activeDay.local || evento.local)),
  ).slice(0, 3);
  const upcoming = agenda
    .filter((item) => minutes(item.inicio) > now && item.status !== "concluido")
    .slice(0, 3);
  const pendingChecklist = checklist.filter((item) => !item.concluido);
  const confirmed =
    evento.equipeMembros?.filter((member) => member.status === "confirmado").length ?? 0;
  const activeRealtime = realtime.filter((item) =>
    ["logando", "editando", "aprovacao"].includes(item.status),
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.45fr_repeat(4,minmax(130px,.75fr))]">
        <div className="relative overflow-hidden rounded-2xl border border-white/[.08] bg-gradient-to-b from-[#121813] to-[#090c0a] p-4">
          <span className="text-[8px] font-semibold uppercase tracking-[.18em] text-muted-foreground">
            Estado da operação
          </span>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Evento em andamento</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">{evento.local}</p>
            </div>
            <strong className="font-mono text-xl text-primary">68%</strong>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
            <span className="block h-full w-[68%] rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/.35)]" />
          </div>
        </div>
        <LiveMetric
          label="Ambientes ativos"
          value={String(Math.max(current.length, zones.length))}
          detail={`${agenda.length} momentos no dia`}
        />
        <LiveMetric
          label="Equipe em campo"
          value={String(confirmed)}
          detail={`${evento.equipeMembros?.length ?? 0} escalados`}
        />
        <LiveMetric
          label="Realtime"
          value={String(activeRealtime)}
          detail={`${realtime.length} entregas abertas`}
        />
        <LiveMetric
          label="Atenção"
          value={String(pendingChecklist.length)}
          detail="pendências do dia"
          warning={pendingChecklist.length > 0}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_270px]">
        <section className="min-h-[520px] overflow-hidden rounded-2xl border border-white/[.08] bg-gradient-to-b from-[#121713] to-[#090c0a]">
          <LivePanelHeader
            icon={Radio}
            title="Acontecendo agora"
            detail="Ambientes e equipes em operação"
            badge={`${zones.length} frentes`}
          />
          <div className="grid gap-2 p-2 lg:grid-cols-3">
            {zones.map((zone, zoneIndex) => {
              const moments = zoneSource.filter(
                (item) => (item.local || activeDay.local || evento.local) === zone,
              );
              const moment = moments[0];
              const people =
                moment?.responsavelIds
                  .map((memberId) => evento.equipeMembros?.find((member) => member.id === memberId))
                  .filter(Boolean) ?? [];
              const captureItems = moment?.captacaoItens ?? [];
              const captureDone = captureItems.filter((item) => item.concluido).length;
              const nextMoment =
                agenda.find(
                  (item) =>
                    (item.local || activeDay.local || evento.local) === zone &&
                    minutes(item.inicio) >= minutes(moment?.fim ?? "23:59") &&
                    item.id !== moment?.id,
                ) ??
                agenda.find(
                  (item) =>
                    minutes(item.inicio) >= minutes(moment?.fim ?? "23:59") &&
                    item.id !== moment?.id,
                );
              if (!moment) return null;
              return (
                <article
                  key={zone}
                  onClick={() => onSelect(moment.id)}
                  className="group relative flex min-h-[455px] flex-col overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.018] p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/[.025]"
                >
                  <span className="absolute bottom-4 left-0 top-4 w-0.5 bg-primary shadow-[0_0_10px_hsl(var(--primary)/.4)]" />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[8px] font-semibold uppercase tracking-[.14em] text-muted-foreground">
                        {zone}
                      </span>
                      <span className="rounded bg-white/[.045] px-1.5 py-0.5 text-[7px] capitalize text-muted-foreground/70">
                        {moment.natureza ?? "conteúdo"}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[7px] uppercase text-primary">
                      <span className="size-1 rounded-full bg-primary" />
                      {moment.status === "em_andamento"
                        ? "Ao vivo"
                        : moment.status === "atrasado"
                          ? "Atenção"
                          : "Próximo"}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-base font-semibold leading-tight">
                    {moment.titulo}
                  </h3>
                  <p className="mt-2 font-mono text-[9px] text-muted-foreground">
                    {moment.inicio} — {moment.fim}
                  </p>
                  {(moment.notasAoVivo || moment.critico) && (
                    <div
                      className={cn(
                        "mt-4 rounded-lg border border-white/[.07] bg-white/[.025] p-3",
                        moment.critico && "border-warning/25 bg-warning/[.035]",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[7px] font-semibold uppercase tracking-[.14em] text-muted-foreground",
                          moment.critico && "text-warning",
                        )}
                      >
                        {moment.critico ? "Momento crítico · comando ao vivo" : "Comando ao vivo"}
                      </span>
                      <p className="mt-1.5 text-[9px] leading-relaxed text-foreground/80">
                        {moment.notasAoVivo || moment.cobertura}
                      </p>
                    </div>
                  )}
                  <div className="mt-5 space-y-2">
                    {people.slice(0, 3).map((person) => (
                      <div key={person?.id} className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-lg bg-white/[.06] text-[8px] font-semibold text-primary">
                          {person?.nome
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[9px] font-medium">{person?.nome}</p>
                          <p className="truncate text-[8px] text-muted-foreground">
                            {person?.funcao}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto border-t border-white/[.06] pt-4">
                    <div className="mb-3 flex items-center justify-between text-[8px] text-muted-foreground">
                      <span>Plano de captação</span>
                      <span>
                        {captureDone} de {captureItems.length}
                      </span>
                    </div>
                    <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/[.06]">
                      <span
                        className="block h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${captureItems.length ? (captureDone / captureItems.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    {captureItems.length ? (
                      <div className="space-y-1.5">
                        {captureItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onUpdate(moment, {
                                captacaoItens: captureItems.map((captureItem) =>
                                  captureItem.id === item.id
                                    ? { ...captureItem, concluido: !captureItem.concluido }
                                    : captureItem,
                                ),
                              });
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition hover:bg-white/[.035]"
                          >
                            <span
                              className={cn(
                                "grid size-3.5 shrink-0 place-items-center rounded border text-[8px]",
                                item.concluido
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-white/15 text-transparent",
                              )}
                            >
                              ✓
                            </span>
                            <span
                              className={cn(
                                "truncate text-[8px] text-muted-foreground",
                                item.concluido && "text-muted-foreground/45 line-through",
                              )}
                            >
                              {item.titulo}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="line-clamp-2 text-[9px] leading-relaxed text-muted-foreground">
                        {moment.cobertura || "Plano de cobertura a confirmar."}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between border-t border-white/[.05] pt-3 text-[8px]">
                      <span className="text-muted-foreground/60">Atualizado agora</span>
                      <span className="max-w-[60%] truncate text-right text-muted-foreground">
                        Próximo:{" "}
                        <strong className="font-medium text-foreground/80">
                          {nextMoment?.titulo ?? "Encerramento"}
                        </strong>{" "}
                        →
                      </span>
                    </div>
                  </div>
                  {selectedId === moment.id && (
                    <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/50" />
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <section className="overflow-hidden rounded-2xl border border-white/[.08] bg-gradient-to-b from-[#121713] to-[#090c0a]">
            <LivePanelHeader
              icon={Clock3}
              title="Próximos movimentos"
              detail="Transições da equipe"
              badge="30 min"
            />
            <div className="p-2">
              {upcoming.map((moment) => (
                <button
                  key={moment.id}
                  onClick={() => onSelect(moment.id)}
                  className="flex w-full gap-3 border-b border-white/[.05] p-3 text-left last:border-0 hover:bg-white/[.025]"
                >
                  <div className="w-12 shrink-0 text-[8px] uppercase text-muted-foreground">
                    <span className="block text-primary">ÀS</span>
                    <strong className="mt-1 block font-mono text-[10px] text-foreground">
                      {moment.inicio}
                    </strong>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-semibold">{moment.titulo}</p>
                    <p className="mt-1 truncate text-[8px] text-muted-foreground">{moment.local}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="overflow-hidden rounded-2xl border border-white/[.08] bg-gradient-to-b from-[#121713] to-[#090c0a]">
            <LivePanelHeader
              icon={ShieldAlert}
              title="Central de alertas"
              detail="O que pede atenção"
              badge={`${pendingChecklist.length}`}
            />
            <div className="p-2">
              {pendingChecklist.slice(0, 3).map((item, index) => (
                <div
                  key={item.id}
                  className="flex gap-3 border-b border-white/[.05] p-3 last:border-0"
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-lg",
                      index === 0 ? "bg-red-400/10 text-red-300" : "bg-amber-400/10 text-amber-300",
                    )}
                  >
                    <AlertTriangle className="size-3.5" />
                  </span>
                  <div>
                    <p className="text-[9px] font-semibold">{item.titulo}</p>
                    <p className="mt-1 text-[8px] text-muted-foreground">
                      Prazo {item.prazo || "durante a operação"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="relative">
        <TimelineOperacional
          agenda={agenda}
          evento={evento}
          activeDay={activeDay}
          selectedId={selectedId}
          onSelect={onSelect}
          onUpdate={onUpdate}
          compact
        />
        <button
          onClick={onOpenTimeline}
          className="absolute right-4 top-4 rounded-lg border border-white/[.08] bg-[#111513] px-3 py-2 text-[8px] text-muted-foreground transition hover:text-foreground"
        >
          Expandir timeline
        </button>
      </div>
    </div>
  );
}

function LiveMetric({
  label,
  value,
  detail,
  warning = false,
}: {
  label: string;
  value: string;
  detail: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[.08] bg-gradient-to-b from-[#121713] to-[#090c0a] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground">{label}</span>
        <span className={cn("size-1.5 rounded-full bg-primary", warning && "bg-amber-400")} />
      </div>
      <strong className={cn("mt-4 block font-display text-2xl", warning && "text-amber-300")}>
        {value}
      </strong>
      <p className="mt-2 text-[8px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function LivePanelHeader({
  icon: Icon,
  title,
  detail,
  badge,
}: {
  icon: typeof Radio;
  title: string;
  detail: string;
  badge: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[.07] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-3.5" />
        </span>
        <div>
          <h2 className="text-xs font-semibold">{title}</h2>
          <p className="mt-0.5 text-[8px] text-muted-foreground">{detail}</p>
        </div>
      </div>
      <span className="rounded-full border border-white/[.08] px-2 py-1 text-[8px] text-muted-foreground">
        {badge}
      </span>
    </div>
  );
}

const minutes = (time: string) => {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
};

function TimelineOperacional({
  agenda,
  evento,
  activeDay,
  selectedId,
  onSelect,
  onUpdate,
  compact = false,
}: {
  agenda: MomentoEvento[];
  evento: EventoProducao;
  activeDay: DiaEvento;
  selectedId?: string;
  onSelect: (id: string) => void;
  onUpdate: (moment: MomentoEvento, patch: Partial<MomentoEvento>) => void;
  compact?: boolean;
}) {
  const demonstracaoColorida = evento.id === "evento-convencao-2026";
  const dayStart = Math.min(
    minutes(activeDay.inicio),
    ...agenda.map((item) => minutes(item.inicio)),
  );
  const dayEnd = Math.max(minutes(activeDay.fim), ...agenda.map((item) => minutes(item.fim)));
  const now = minutes(nowTime());
  const currentDate = new Date().toISOString().slice(0, 10);
  const today = currentDate === activeDay.data;
  const start = compact && today ? Math.max(dayStart, Math.floor((now - 90) / 30) * 30) : dayStart;
  const end = compact && today ? Math.min(dayEnd, start + 210) : dayEnd;
  const duration = Math.max(end - start, 60);
  const visibleAgenda = compact
    ? agenda.filter((item) => minutes(item.fim) >= start && minutes(item.inicio) <= end)
    : agenda;
  const locations = Array.from(
    new Set(
      visibleAgenda.map(
        (item) => item.local || activeDay.local || evento.local || "Operação geral",
      ),
    ),
  );
  const selected = agenda.find((item) => item.id === selectedId);
  const showNow = today && now >= start && now <= end;
  const tickCount = Math.min(7, Math.max(3, Math.ceil(duration / 60) + 1));
  const ticks = Array.from({ length: tickCount }, (_, index) =>
    Math.round(start + (duration * index) / (tickCount - 1)),
  );
  const statusStyle: Record<NonNullable<MomentoEvento["status"]>, string> = {
    previsto: "border-sky-400/20 bg-sky-400/10 text-sky-100",
    preparar: "border-amber-400/25 bg-amber-400/10 text-amber-100",
    em_andamento:
      "border-primary/45 bg-primary/15 text-primary shadow-[0_0_22px_hsl(var(--primary)/.12)]",
    concluido: "border-white/10 bg-white/[.045] text-muted-foreground",
    atrasado: "border-red-400/30 bg-red-400/10 text-red-100",
    cancelado: "border-white/10 bg-white/[.025] text-muted-foreground line-through",
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#101314]">
      <div className="flex items-center justify-between gap-4 border-b border-white/[.07] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Rows3 className="size-4" />
          </span>
          <div>
            <h3 className="text-xs font-semibold">Régua do evento</h3>
            <p className="mt-0.5 text-[9px] text-muted-foreground">
              Cada trilha representa um ambiente ou frente de operação.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/[.08] px-2.5 py-1 text-[8px] text-muted-foreground">
          {activeDay.inicio} — {activeDay.fim}
        </span>
      </div>

      {agenda.length ? (
        <div className={cn("overflow-x-auto", compact ? "p-3" : "p-4 sm:p-5")}>
          <div className={cn(compact ? "min-w-[900px]" : "min-w-[1200px]")}>
            <div
              className={cn(
                "grid gap-3",
                compact ? "grid-cols-[105px_1fr]" : "grid-cols-[130px_1fr]",
              )}
            >
              <div />
              <div className="relative flex justify-between border-b border-white/[.07] pb-3">
                {ticks.map((tick) => (
                  <span key={tick} className="font-mono text-[8px] text-muted-foreground">
                    {String(Math.floor(tick / 60)).padStart(2, "0")}:
                    {String(tick % 60).padStart(2, "0")}
                  </span>
                ))}
              </div>
            </div>
            <div className={cn("relative mt-2", compact ? "space-y-1" : "space-y-2")}>
              {showNow && (
                <div
                  className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-primary shadow-[0_0_12px_hsl(var(--primary)/.65)]"
                  style={{
                    left: compact
                      ? `calc(117px + (100% - 117px) * ${(now - start) / duration})`
                      : `calc(142px + (100% - 142px) * ${(now - start) / duration})`,
                  }}
                >
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full rounded bg-primary px-1.5 py-0.5 text-[7px] font-bold text-primary-foreground">
                    AGORA
                  </span>
                  <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-primary" />
                </div>
              )}
              {locations.map((location, laneIndex) => {
                const laneMoments = visibleAgenda.filter(
                  (item) =>
                    (item.local || activeDay.local || evento.local || "Operação geral") ===
                    location,
                );
                return (
                  <div
                    key={location}
                    className={cn(
                      "grid items-center gap-3",
                      compact ? "grid-cols-[105px_1fr]" : "grid-cols-[130px_1fr]",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2 pr-2">
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            laneIndex === 0
                              ? evento.cor
                              : `hsl(${(laneIndex * 67 + 190) % 360} 70% 62%)`,
                        }}
                      />
                      <span className="truncate text-[9px] font-medium text-muted-foreground">
                        {location}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "relative h-8 overflow-hidden rounded-[5px] border border-white/[.045] bg-white/[.018]",
                      )}
                    >
                      {ticks.map((tick) => (
                        <span
                          key={tick}
                          className="absolute inset-y-0 w-px bg-white/[.035]"
                          style={{ left: `${((tick - start) / duration) * 100}%` }}
                        />
                      ))}
                      {laneMoments.map((moment) => {
                        const blockStart = Math.max(minutes(moment.inicio), start);
                        const blockEnd = Math.min(minutes(moment.fim), end);
                        const left = ((blockStart - start) / duration) * 100;
                        const width = Math.max(((blockEnd - blockStart) / duration) * 100, 4);
                        const hasPassed = !demonstracaoColorida && (
                          activeDay.data < currentDate ||
                          (today && minutes(moment.fim) < now) ||
                          moment.status === "concluido"
                        );
                        const demoStyle = moment.status === "concluido"
                          ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-100"
                          : statusStyle[moment.status ?? "previsto"];
                        return (
                          <button
                            key={moment.id}
                            onClick={() => onSelect(moment.id)}
                            className={cn(
                              "absolute bottom-0.5 top-0.5 z-10 overflow-hidden rounded-[3px] border px-3 text-left transition hover:-translate-y-0.5 hover:brightness-125",
                              hasPassed
                                ? "border-white/[.07] bg-[#252827] text-[#777c79] saturate-0"
                                : demonstracaoColorida
                                  ? demoStyle
                                  : statusStyle[moment.status ?? "previsto"],
                              selectedId === moment.id &&
                                "ring-1 ring-primary ring-offset-2 ring-offset-[#101314]",
                            )}
                            style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                            title={`${moment.inicio}—${moment.fim} · ${moment.titulo}`}
                          >
                            <span className="block truncate text-[8px] font-semibold">
                              {moment.titulo}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <Empty icon={Clock3} text="Nenhum momento programado para este dia." />
      )}

      {selected && (
        <div className="border-t border-white/[.07] bg-white/[.018] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] text-primary">
                  {selected.inicio}—{selected.fim}
                </span>
                <span className="rounded-full bg-white/5 px-2 py-1 text-[8px] capitalize text-muted-foreground">
                  {(selected.status ?? "previsto").replaceAll("_", " ")}
                </span>
              </div>
              <h3 className="mt-2 font-display text-base font-semibold">{selected.titulo}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <MapPin className="size-3" /> {selected.local || activeDay.local || evento.local}
              </p>
              {selected.cobertura && (
                <p className="mt-3 text-xs text-muted-foreground">{selected.cobertura}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {selected.status !== "concluido" && selected.status !== "em_andamento" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdate(selected, { status: "preparar" })}
                >
                  Preparar
                </Button>
              )}
              {selected.status !== "concluido" && (
                <Button
                  size="sm"
                  onClick={() =>
                    onUpdate(
                      selected,
                      selected.status === "em_andamento"
                        ? { status: "concluido", fimReal: nowTime() }
                        : { status: "em_andamento", inicioReal: nowTime() },
                    )
                  }
                >
                  {selected.status === "em_andamento" ? "Finalizar" : "Começou"}
                </Button>
              )}
              {selected.status !== "concluido" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onUpdate(selected, { status: "atrasado" })}
                >
                  <AlertTriangle className="size-3.5" /> Atraso
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Side({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: typeof Users;
  count: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[.08] bg-[#121516] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h2 className="flex-1 text-sm font-semibold">{title}</h2>
        <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Radio; text: string }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-white/10 text-center">
      <div>
        <Icon className="mx-auto size-6 text-muted-foreground/40" />
        <p className="mt-3 text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
