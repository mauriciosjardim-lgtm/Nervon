import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Layers3,
  ListChecks,
  MapPin,
  MonitorPlay,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  Plus,
  Radio,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_EVENTO } from "@/lib/eventos/types";
import { useEventosProducao } from "@/lib/eventos/storage";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eventosProducaoActions } from "@/lib/eventos/storage";
import type {
  DiaEvento,
  EventoProducao,
  ItemRealtimeEvento,
  MomentoEvento,
} from "@/lib/eventos/types";
import { EventoTimeField } from "@/components/eventos/event-form-fields";
import { EventoDateField } from "@/components/eventos/event-form-fields";
import {
  ChecklistPanel,
  FinancePanel,
  ReferencesPanel,
  TeamPanel,
} from "@/components/eventos/event-workspace-panels";
import { eventosPublicamenteAtivo } from "@/lib/eventos/availability";

export const Route = createFileRoute("/operacao-evento/$id")({
  beforeLoad: () => { if (!eventosPublicamenteAtivo()) throw redirect({ to: "/eventos" }); },
  ssr: false,
  component: OperacaoEvento,
});
const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const tabs = [
  { id: "visao", nome: "Visão geral" },
  { id: "programacao", nome: "Programação" },
  { id: "equipe", nome: "Equipe" },
  { id: "realtime", nome: "Realtime" },
  { id: "checklist", nome: "Checklist" },
  { id: "financeiro", nome: "Financeiro" },
  { id: "arquivos", nome: "Arquivos" },
];

function OperacaoEvento() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const eventos = useEventosProducao();
  const evento = eventos.find((e) => e.id === id);
  const [diaAtivo, setDiaAtivo] = useState(0);
  const [tab, setTab] = useState("visao");
  const [momentoEditando, setMomentoEditando] = useState<MomentoEvento | null>(null);
  const [editandoEvento, setEditandoEvento] = useState(false);
  const [novoDia, setNovoDia] = useState(false);
  if (!evento)
    return (
      <div className="grid min-h-[70vh] place-items-center text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Evento não encontrado</h1>
          <Link to="/eventos" className="mt-3 inline-block text-sm text-primary">
            Voltar para a Central
          </Link>
        </div>
      </div>
    );
  const totalChecklist = evento.checklist?.length ?? evento.tarefasTotal;
  const concluidosChecklist = evento.checklist?.length
    ? evento.checklist.filter((item) => item.concluido).length
    : evento.tarefasConcluidas;
  const progresso = totalChecklist ? Math.round((concluidosChecklist / totalChecklist) * 100) : 0;
  const custosEvento = evento.lancamentos?.length
    ? evento.lancamentos.reduce((total, item) => total + item.valor, 0)
    : evento.custosPrevistos;
  const abrirMomento = (diaId: string, momento?: MomentoEvento) =>
    setMomentoEditando(
      momento ?? {
        id: crypto.randomUUID(),
        diaId,
        inicio: "09:00",
        fim: "10:00",
        titulo: "",
        responsavelIds: [],
        origem: "cronograma",
        natureza: "conteudo",
        status: "previsto",
        equipamentos: [],
      },
    );
  const salvarMomento = (momento: MomentoEvento) => {
    const atual = evento.programacao ?? [];
    const programacao = atual.some((p) => p.id === momento.id)
      ? atual.map((p) => (p.id === momento.id ? momento : p))
      : [...atual, momento];
    eventosProducaoActions.atualizar(evento.id, { programacao });
    setMomentoEditando(null);
  };
  const removerMomento = (momentoId: string) => {
    eventosProducaoActions.atualizar(evento.id, {
      programacao: (evento.programacao ?? []).filter((p) => p.id !== momentoId),
    });
    setMomentoEditando(null);
  };
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="border-b border-border/60 bg-card/25 px-5 py-5 lg:px-8">
        <div className="mx-auto max-w-[1720px]">
          <Link
            to="/eventos"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Central de eventos
          </Link>
          <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-wider"
                  style={{
                    color: evento.cor,
                    border: `1px solid ${evento.cor}50`,
                    backgroundColor: `${evento.cor}12`,
                  }}
                >
                  {STATUS_EVENTO[evento.status]}
                </span>
                <span className="text-xs text-muted-foreground">{evento.tipo}</span>
              </div>
              <h1 className="mt-2 truncate font-display text-3xl font-semibold tracking-tight">
                {evento.nome}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {evento.cliente} · {evento.local || "Local a definir"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setEditandoEvento(true)}>
                <MoreHorizontal className="size-4" /> Editar evento
              </Button>
              <Button
                className="gap-2"
                onClick={() => navigate({ to: "/evento-live/$id", params: { id: evento.id } })}
              >
                <Radio className="size-4" /> Abrir Modo Evento
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1720px] px-5 py-6 lg:px-8">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto">
            <TabsList className="h-11 min-w-max bg-surface-1/65 p-1">
              {tabs.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="px-4 text-xs">
                  {t.nome}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="visao" className="mt-6 space-y-5">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi
                icon={CalendarDays}
                label="Dias de operação"
                value={String(evento.dias.length)}
                hint={
                  evento.dias[0]?.data
                    ? new Date(`${evento.dias[0].data}T12:00:00`).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                      })
                    : "A definir"
                }
              />
              <Kpi
                icon={Users}
                label="Equipe prevista"
                value={String(evento.equipe)}
                hint="alocações iniciais"
              />
              <Kpi
                icon={ClipboardCheck}
                label="Preparação"
                value={`${progresso}%`}
                hint={`${concluidosChecklist}/${totalChecklist} concluídos`}
              />
              <Kpi
                icon={Wallet}
                label="Margem prevista"
                value={brl((evento.valorOrcado ?? evento.receitaPrevista) - custosEvento)}
                hint="antes dos custos reais"
              />
            </section>
            <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/45">
              <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">
                    Preparação da operação
                  </span>
                  <h2 className="mt-1 font-display text-xl font-semibold">
                    O que precisa ganhar forma agora?
                  </h2>
                </div>
                <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                  Comece pelos três pilares. O restante acompanha as decisões da produção.
                </p>
              </div>
              <div className="p-5">
                <div className="grid gap-3 lg:grid-cols-3">
                  <SetupPrimary
                    number="01"
                    icon={CalendarDays}
                    title="Programação"
                    desc="Construa o ritmo de cada dia, do primeiro acesso ao encerramento."
                    status={evento.programacao?.length ? "iniciado" : "vazio"}
                    meta={`${evento.programacao?.length ?? 0} momentos`}
                    onClick={() => setTab("programacao")}
                  />
                  <SetupPrimary
                    number="02"
                    icon={Users}
                    title="Equipe"
                    desc="Defina profissionais, funções e presença em cada data."
                    status={evento.equipeMembros?.length ? "iniciado" : "vazio"}
                    meta={`${evento.equipeMembros?.length ?? 0} pessoas`}
                    onClick={() => setTab("equipe")}
                  />
                  <SetupPrimary
                    number="03"
                    icon={ClipboardCheck}
                    title="Checklists"
                    desc="Transforme preparação e encerramento em ações verificáveis."
                    status={evento.checklist?.length ? "iniciado" : "vazio"}
                    meta={`${evento.checklist?.length ?? 0} itens`}
                    onClick={() => setTab("checklist")}
                  />
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <SetupCompact
                    icon={MapPin}
                    title="Locais"
                    detail={
                      evento.dias.some((d) => d.local) || !!evento.local ? "Informado" : "A definir"
                    }
                    active={evento.dias.some((d) => d.local) || !!evento.local}
                    onClick={() => setTab("programacao")}
                  />
                  <SetupCompact
                    icon={PackageCheck}
                    title="Equipamentos"
                    detail={
                      evento.equipeMembros?.some((m) => m.equipamentos.length)
                        ? "Em organização"
                        : "Nenhum item"
                    }
                    active={!!evento.equipeMembros?.some((m) => m.equipamentos.length)}
                    onClick={() => setTab("equipe")}
                  />
                  <SetupCompact
                    icon={BookOpen}
                    title="Referências"
                    detail={`${evento.referencias?.length ?? 0} links`}
                    active={!!evento.referencias?.length}
                    onClick={() => setTab("arquivos")}
                  />
                  <SetupCompact
                    icon={Wallet}
                    title="Financeiro"
                    detail={evento.valorOrcado ? "Valor informado" : "A iniciar"}
                    active={!!evento.valorOrcado}
                    onClick={() => setTab("financeiro")}
                  />
                </div>
                <button
                  onClick={() => navigate({ to: "/evento-live/$id", params: { id: evento.id } })}
                  className="mt-5 flex w-full items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[.07] via-primary/[.025] to-transparent p-4 text-left opacity-70"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                    <MonitorPlay className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold">Modo Live</h3>
                      <span className="rounded-full border border-primary/25 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-primary">
                        Destino da operação
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Quando a base estiver pronta, sua equipe acessa aqui somente o que importa
                      durante o evento.
                    </p>
                  </div>
                  <span className="hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:block">
                    Abrir prévia
                  </span>
                </button>
              </div>
            </section>
            <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
              <section className="rounded-2xl border border-border/70 bg-card/45 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold">Mapa da operação</h2>
                    <p className="text-xs text-muted-foreground">
                      Cada dia funciona como uma unidade independente.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setNovoDia(true)}>
                    <Plus className="size-4" /> Novo dia
                  </Button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {evento.dias.map((d, i) => (
                    <button
                      key={d.id}
                      onClick={() => setDiaAtivo(i)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:bg-surface-2/50",
                        diaAtivo === i
                          ? "border-primary/35 bg-primary/[.04]"
                          : "border-border/65 bg-surface-1/30",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-xs text-primary">
                          DIA {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {d.inicio}—{d.fim}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display font-semibold capitalize">
                        {new Date(`${d.data}T12:00:00`).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                        })}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {d.local || evento.local || "Local a definir"}
                      </p>
                      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-center">
                        <Tiny
                          label="Agenda"
                          value={String(
                            evento.programacao?.filter((p) => p.diaId === d.id).length ?? 0,
                          )}
                        />
                        <Tiny
                          label="Equipe"
                          value={String(
                            evento.equipeMembros?.filter((m) => m.dias.includes(d.id)).length ?? 0,
                          )}
                        />
                        <Tiny label="Pendências" value="0" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
              <aside className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-card/45 p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold">Preparação geral</h2>
                    <span className="font-display text-xl font-semibold">{progresso}%</span>
                  </div>
                  <Progress value={progresso} className="mt-4 h-1.5" />
                  <div className="mt-5 space-y-2">
                    <Status label="Briefing e escopo" ok />
                    <Status label="Equipe confirmada" ok={evento.equipe > 0} />
                    <Status
                      label="Equipamentos conferidos"
                      ok={!!evento.equipeMembros?.some((membro) => membro.equipamentos.length)}
                    />
                    <Status label="Programação validada" ok={!!evento.programacao?.length} />
                  </div>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/[.035] p-5">
                  <MonitorPlay className="size-5 text-primary" />
                  <h3 className="mt-3 font-display font-semibold">Modo Evento</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Interface limpa para celular e tablet, mostrando apenas o que a equipe precisa
                    durante a operação.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate({ to: "/evento-live/$id", params: { id: evento.id } })}
                  >
                    Visualizar modo de campo
                  </Button>
                </div>
              </aside>
            </div>
          </TabsContent>
          <TabsContent value="programacao" className="mt-6">
            <SchedulePanel evento={evento} onOpenMoment={abrirMomento} />
          </TabsContent>
          <TabsContent value="equipe" className="mt-6">
            <TeamPanel evento={evento} />
          </TabsContent>
          <TabsContent value="realtime" className="mt-6">
            <RealtimePanel evento={evento} />
          </TabsContent>
          <TabsContent value="checklist" className="mt-6">
            <ChecklistPanel evento={evento} />
          </TabsContent>
          <TabsContent value="financeiro" className="mt-6">
            <FinancePanel evento={evento} />
          </TabsContent>
          <TabsContent value="arquivos" className="mt-6">
            <ReferencesPanel evento={evento} />
          </TabsContent>
        </Tabs>
      </div>
      <MomentoModal
        momento={momentoEditando}
        membros={evento.equipeMembros ?? []}
        onChange={setMomentoEditando}
        onClose={() => setMomentoEditando(null)}
        onSave={salvarMomento}
        onRemove={removerMomento}
      />
      <EditarEventoModal evento={evento} open={editandoEvento} onOpenChange={setEditandoEvento} />
      <NovoDiaModal evento={evento} open={novoDia} onOpenChange={setNovoDia} />
    </main>
  );
}

function EditarEventoModal({
  evento,
  open,
  onOpenChange,
}: {
  evento: EventoProducao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState(evento);
  const set = (patch: Partial<EventoProducao>) => setDraft((current) => ({ ...current, ...patch }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldModal label="Nome do evento">
              <Input value={draft.nome} onChange={(e) => set({ nome: e.target.value })} />
            </FieldModal>
          </div>
          <FieldModal label="Cliente">
            <Input value={draft.cliente} onChange={(e) => set({ cliente: e.target.value })} />
          </FieldModal>
          <FieldModal label="Tipo">
            <Input value={draft.tipo} onChange={(e) => set({ tipo: e.target.value })} />
          </FieldModal>
          <div className="sm:col-span-2">
            <FieldModal label="Local principal">
              <Input value={draft.local} onChange={(e) => set({ local: e.target.value })} />
            </FieldModal>
          </div>
          <FieldModal label="Status">
            <Select
              value={draft.status}
              onValueChange={(value) => set({ status: value as EventoProducao["status"] })}
            >
              <SelectTrigger className="h-10 rounded-xl bg-background/35">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_EVENTO).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldModal>
          <FieldModal label="Cor da operação">
            <div className="flex h-10 items-center gap-3 rounded-md border border-input px-3">
              <input
                type="color"
                value={draft.cor}
                onChange={(e) => set({ cor: e.target.value })}
              />
              <span className="font-mono text-xs text-muted-foreground">{draft.cor}</span>
            </div>
          </FieldModal>
          <div className="sm:col-span-2">
            <FieldModal label="Descrição">
              <Textarea
                value={draft.descricao ?? ""}
                onChange={(e) => set({ descricao: e.target.value })}
              />
            </FieldModal>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!draft.nome.trim()}
            onClick={() => {
              eventosProducaoActions.atualizar(evento.id, draft);
              onOpenChange(false);
            }}
          >
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovoDiaModal({
  evento,
  open,
  onOpenChange,
}: {
  evento: EventoProducao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [dia, setDia] = useState<DiaEvento>({
    id: "",
    data: "",
    inicio: "08:00",
    fim: "18:00",
    local: evento.local,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo dia de operação</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldModal label="Data">
              <EventoDateField value={dia.data} onChange={(data) => setDia({ ...dia, data })} />
            </FieldModal>
          </div>
          <FieldModal label="Início">
            <EventoTimeField value={dia.inicio} onChange={(inicio) => setDia({ ...dia, inicio })} />
          </FieldModal>
          <FieldModal label="Fim">
            <EventoTimeField value={dia.fim} onChange={(fim) => setDia({ ...dia, fim })} />
          </FieldModal>
          <div className="sm:col-span-2">
            <FieldModal label="Local deste dia">
              <Input
                value={dia.local ?? ""}
                onChange={(e) => setDia({ ...dia, local: e.target.value })}
              />
            </FieldModal>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!dia.data}
            onClick={() => {
              eventosProducaoActions.atualizar(evento.id, {
                dias: [...evento.dias, { ...dia, id: crypto.randomUUID() }].sort((a, b) =>
                  a.data.localeCompare(b.data),
                ),
              });
              onOpenChange(false);
              setDia({ id: "", data: "", inicio: "08:00", fim: "18:00", local: evento.local });
            }}
          >
            Adicionar dia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const scheduleMinutes = (time: string) => {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const momentScheduleReadiness = (moment: MomentoEvento) => {
  const nature = moment.natureza ?? "conteudo";
  const checks =
    nature === "intervalo"
      ? [!!moment.local]
      : nature === "transicao" || nature === "montagem"
        ? [
            !!moment.local,
            moment.responsavelIds.length > 0,
            !!(moment.notasAoVivo || moment.cobertura),
          ]
        : [
            !!moment.local,
            !!moment.cobertura,
            moment.responsavelIds.length > 0,
            !!moment.captacaoItens?.length,
          ];
  const done = checks.filter(Boolean).length;
  return { done, total: checks.length, ready: done === checks.length };
};

function SchedulePanel({
  evento,
  onOpenMoment,
}: {
  evento: EventoProducao;
  onOpenMoment: (diaId: string, momento?: MomentoEvento) => void;
}) {
  const [dayId, setDayId] = useState(evento.dias[0]?.id ?? "");
  const [view, setView] = useState<"roteiro" | "ambientes" | "alertas">("roteiro");
  const activeDay = evento.dias.find((day) => day.id === dayId) ?? evento.dias[0];
  const moments = useMemo(
    () =>
      (evento.programacao ?? [])
        .filter((moment) => moment.diaId === activeDay?.id)
        .sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [evento.programacao, activeDay?.id],
  );
  const members = evento.equipeMembros ?? [];
  const environments = Array.from(
    new Set(moments.map((moment) => moment.local || activeDay?.local || evento.local)),
  ).filter(Boolean);
  const conflicts = useMemo(() => {
    const result: Array<{ memberId: string; first: MomentoEvento; second: MomentoEvento }> = [];
    moments.forEach((first, firstIndex) => {
      moments.slice(firstIndex + 1).forEach((second) => {
        const overlaps =
          scheduleMinutes(first.inicio) < scheduleMinutes(second.fim) &&
          scheduleMinutes(second.inicio) < scheduleMinutes(first.fim);
        if (!overlaps) return;
        first.responsavelIds
          .filter((memberId) => second.responsavelIds.includes(memberId))
          .forEach((memberId) => result.push({ memberId, first, second }));
      });
    });
    return result;
  }, [moments]);
  const pendingMoments = moments.filter((moment) => !momentScheduleReadiness(moment).ready);
  const readyMoments = moments.length - pendingMoments.length;
  const readiness = moments.length ? Math.round((readyMoments / moments.length) * 100) : 0;
  const realtimeCount = moments.reduce(
    (total, moment) => total + (moment.entregasRealtime?.length ?? 0),
    0,
  );
  const visibleMoments = view === "alertas" ? pendingMoments : moments;

  if (!activeDay) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/45">
      <header className="border-b border-border/60 p-5 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </span>
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-[.2em] text-primary">
                Run of show operacional
              </span>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Do cronograma recebido à cobertura ao vivo
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Preserve o que a organização planejou e conecte a camada da produtora: equipe,
                cobertura, captação, equipamentos, realtime e contingência.
              </p>
            </div>
          </div>
          <Button onClick={() => onOpenMoment(activeDay.id)}>
            <Plus className="size-4" /> Novo momento
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ScheduleMetric
            icon={Clock3}
            label="Momentos"
            value={String(moments.length)}
            detail={`${activeDay.inicio}—${activeDay.fim}`}
          />
          <ScheduleMetric
            icon={MapPin}
            label="Ambientes"
            value={String(environments.length)}
            detail="frentes de operação"
          />
          <ScheduleMetric
            icon={ShieldCheck}
            label="Pronto para o Live"
            value={`${readiness}%`}
            detail={`${readyMoments}/${moments.length} completos`}
            accent={readiness === 100}
          />
          <ScheduleMetric
            icon={AlertTriangle}
            label="Conflitos"
            value={String(conflicts.length)}
            detail={`${realtimeCount} entregas realtime`}
            warning={conflicts.length > 0}
          />
        </div>
      </header>

      <div className="border-b border-border/60 bg-surface-1/20 px-5 py-3 sm:px-7">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {evento.dias.map((day, index) => (
              <button
                key={day.id}
                onClick={() => setDayId(day.id)}
                className={cn(
                  "min-w-[150px] rounded-xl border px-3 py-2.5 text-left transition",
                  activeDay.id === day.id
                    ? "border-primary/35 bg-primary/[.07]"
                    : "border-border/60 bg-background/20 hover:bg-surface-2/50",
                )}
              >
                <span className="text-[9px] font-semibold uppercase tracking-wider text-primary">
                  Dia {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-1 text-[11px] font-medium capitalize">
                  {new Date(`${day.data}T12:00:00`).toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </button>
            ))}
          </div>
          <div className="flex shrink-0 rounded-xl border border-border/60 bg-background/25 p-1">
            {[
              ["roteiro", "Roteiro"],
              ["ambientes", "Ambientes"],
              ["alertas", `Pendências${pendingMoments.length ? ` ${pendingMoments.length}` : ""}`],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setView(id as typeof view)}
                className={cn(
                  "rounded-lg px-3 py-2 text-[10px] transition",
                  view === id ? "bg-surface-2 text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-3 flex items-center gap-4 rounded-xl border border-border/55 bg-background/20 px-4 py-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-foreground/30" /> Cronograma recebido
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" /> Camada audiovisual
            </span>
            <span className="ml-auto hidden sm:block">
              Previsto e realizado permanecem separados.
            </span>
          </div>

          {view === "ambientes" ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {environments.map((environment) => {
                const environmentMoments = moments.filter(
                  (moment) => (moment.local || activeDay.local || evento.local) === environment,
                );
                return (
                  <div key={environment} className="rounded-2xl border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-primary">
                          Ambiente
                        </span>
                        <h3 className="mt-1 font-display font-semibold">{environment}</h3>
                      </div>
                      <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[9px] text-muted-foreground">
                        {environmentMoments.length} momentos
                      </span>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      {environmentMoments.map((moment) => (
                        <button
                          key={moment.id}
                          onClick={() => onOpenMoment(activeDay.id, moment)}
                          className="flex w-full items-center gap-3 rounded-lg border border-border/45 bg-background/20 p-3 text-left transition hover:border-primary/25"
                        >
                          <span className="font-mono text-[10px] text-primary">
                            {moment.inicio}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium">
                            {moment.titulo}
                          </span>
                          <StatusMomento status={moment.status ?? "previsto"} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/60">
              <div className="hidden grid-cols-[92px_minmax(220px,1.2fr)_150px_minmax(220px,1fr)_90px] gap-3 border-b border-border/60 bg-surface-1/35 px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
                <span>Horário</span>
                <span>Cronograma</span>
                <span>Ambiente</span>
                <span>Operação audiovisual</span>
                <span>Live</span>
              </div>
              {visibleMoments.map((moment, index) => {
                const next = moments[moments.findIndex((item) => item.id === moment.id) + 1];
                const assigned = moment.responsavelIds
                  .map((memberId) => members.find((member) => member.id === memberId))
                  .filter(Boolean);
                const momentReadiness = momentScheduleReadiness(moment);
                return (
                  <button
                    key={moment.id}
                    onClick={() => onOpenMoment(activeDay.id, moment)}
                    className="group grid w-full gap-3 border-b border-border/45 px-4 py-4 text-left transition last:border-0 hover:bg-primary/[.025] lg:grid-cols-[92px_minmax(220px,1.2fr)_150px_minmax(220px,1fr)_90px]"
                  >
                    <div>
                      <strong className="block font-mono text-xs">{moment.inicio}</strong>
                      <span className="mt-1 block font-mono text-[9px] text-muted-foreground">
                        até {moment.fim}
                      </span>
                      {moment.chamada && (
                        <span className="mt-2 inline-flex rounded-md bg-primary/8 px-2 py-1 text-[8px] text-primary">
                          Chamada {moment.chamada}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {moment.critico && (
                          <span className="size-1.5 shrink-0 rounded-full bg-warning" />
                        )}
                        <p className="truncate text-xs font-semibold">{moment.titulo}</p>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
                        {moment.observacoes || "Sem observações do cronograma."}
                      </p>
                      {next && (
                        <p className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground/70">
                          Depois <ArrowRight className="size-3" /> {next.titulo}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="truncate text-[10px] font-medium">
                        {moment.local || "A definir"}
                      </p>
                      <p className="mt-1 text-[9px] capitalize text-muted-foreground">
                        {(moment.natureza || "conteudo").replace("_", " ")}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-[10px] text-foreground/85">
                        {moment.cobertura || "Cobertura ainda não planejada"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {assigned.slice(0, 2).map((member) => (
                          <span
                            key={member?.id}
                            className="rounded-md bg-surface-2 px-2 py-1 text-[8px] text-muted-foreground"
                          >
                            {member?.nome}
                          </span>
                        ))}
                        {!!moment.captacaoItens?.length && (
                          <span className="flex items-center gap-1 rounded-md bg-primary/8 px-2 py-1 text-[8px] text-primary">
                            <ListChecks className="size-3" /> {moment.captacaoItens.length} planos
                          </span>
                        )}
                        {!!moment.entregasRealtime?.length && (
                          <span className="flex items-center gap-1 rounded-md bg-warning/8 px-2 py-1 text-[8px] text-warning">
                            <Radio className="size-3" /> {moment.entregasRealtime.length} entregas
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2 lg:block">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-1 text-[9px] font-semibold",
                          momentReadiness.ready
                            ? "bg-primary/10 text-primary"
                            : momentReadiness.done >= Math.ceil(momentReadiness.total / 2)
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {momentReadiness.done}/{momentReadiness.total}
                      </span>
                      <Pencil className="mt-2 size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </div>
                  </button>
                );
              })}
              {!visibleMoments.length && (
                <button
                  onClick={() => onOpenMoment(activeDay.id)}
                  className="w-full py-16 text-center text-xs text-muted-foreground transition hover:text-primary"
                >
                  {moments.length
                    ? "Nenhuma pendência operacional neste dia."
                    : "+ Transcrever o primeiro momento do cronograma"}
                </button>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/[.035] p-5">
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <MonitorPlay className="size-4" />
              </span>
              <strong className="font-display text-2xl">{readiness}%</strong>
            </div>
            <h3 className="mt-4 font-display font-semibold">Prontidão para o Modo Evento</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Conteúdo exige plano de captação. Montagem e transições exigem comando claro. Pausas
              preservam apenas horário e ambiente.
            </p>
            <Progress value={readiness} className="mt-4 h-1.5" />
            <div className="mt-4 space-y-2">
              <ScheduleStatus label="Cronograma transcrito" ok={moments.length > 0} />
              <ScheduleStatus label="Ambientes definidos" ok={moments.every((m) => !!m.local)} />
              <ScheduleStatus
                label="Equipe distribuída"
                ok={moments.every((m) => m.responsavelIds.length > 0)}
              />
              <ScheduleStatus
                label="Planos de captação"
                ok={moments
                  .filter((m) => (m.natureza ?? "conteudo") === "conteudo")
                  .every((m) => !!m.captacaoItens?.length)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/65 bg-surface-1/25 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold">Conflitos de escala</h3>
                <p className="text-[10px] text-muted-foreground">Sobreposições no mesmo horário.</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[9px]",
                  conflicts.length
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary",
                )}
              >
                {conflicts.length}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {conflicts.slice(0, 4).map((conflict, index) => {
                const member = members.find((item) => item.id === conflict.memberId);
                return (
                  <div
                    key={`${conflict.memberId}-${index}`}
                    className="rounded-xl border border-destructive/15 bg-destructive/[.025] p-3"
                  >
                    <p className="text-[10px] font-semibold">{member?.nome || "Profissional"}</p>
                    <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">
                      {conflict.first.titulo} conflita com {conflict.second.titulo}.
                    </p>
                  </div>
                );
              })}
              {!conflicts.length && (
                <p className="rounded-xl border border-dashed border-border/50 py-6 text-center text-[10px] text-muted-foreground">
                  Nenhuma sobreposição detectada.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/65 p-5">
            <div className="flex items-center gap-2">
              <Layers3 className="size-4 text-primary" />
              <h3 className="font-display font-semibold">Ambientes do dia</h3>
            </div>
            <div className="mt-4 space-y-2">
              {environments.map((environment) => (
                <button
                  key={environment}
                  onClick={() => setView("ambientes")}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[10px] transition hover:bg-surface-2/50"
                >
                  <span className="truncate">{environment}</span>
                  <span className="text-muted-foreground">
                    {
                      moments.filter(
                        (moment) =>
                          (moment.local || activeDay.local || evento.local) === environment,
                      ).length
                    }
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ScheduleMetric({
  icon: Icon,
  label,
  value,
  detail,
  accent,
  warning,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface-1/25 p-4">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-8 place-items-center rounded-xl bg-surface-2 text-muted-foreground",
            accent && "bg-primary/10 text-primary",
            warning && "bg-destructive/10 text-destructive",
          )}
        >
          <Icon className="size-4" />
        </span>
        <strong
          className={cn(
            "font-display text-xl",
            accent && "text-primary",
            warning && "text-destructive",
          )}
        >
          {value}
        </strong>
      </div>
      <p className="mt-4 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground/70">{detail}</p>
    </div>
  );
}

function ScheduleStatus({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/45 bg-background/20 px-3 py-2.5">
      <span className="text-[10px]">{label}</span>
      {ok ? (
        <CheckCircle2 className="size-3.5 text-primary" />
      ) : (
        <AlertTriangle className="size-3.5 text-warning" />
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/45 p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/8 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-xl font-semibold">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
function Tiny({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}
function StatusMomento({ status }: { status: NonNullable<MomentoEvento["status"]> }) {
  const map = {
    previsto: ["Previsto", "text-muted-foreground bg-surface-2"],
    preparar: ["Preparar", "text-warning bg-warning/10"],
    em_andamento: ["Ao vivo", "text-primary bg-primary/10"],
    concluido: ["Concluído", "text-primary bg-primary/10"],
    atrasado: ["Atrasado", "text-destructive bg-destructive/10"],
    cancelado: ["Cancelado", "text-muted-foreground bg-surface-2"],
  } as const;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-wider",
        map[status][1],
      )}
    >
      {map[status][0]}
    </span>
  );
}
function MomentoModal({
  momento,
  membros,
  onChange,
  onClose,
  onSave,
  onRemove,
}: {
  momento: MomentoEvento | null;
  membros: NonNullable<ReturnType<typeof useEventosProducao>[number]["equipeMembros"]>;
  onChange: (m: MomentoEvento) => void;
  onClose: () => void;
  onSave: (m: MomentoEvento) => void;
  onRemove: (id: string) => void;
}) {
  const [novoPlano, setNovoPlano] = useState("");
  if (!momento) return null;
  const set = (p: Partial<MomentoEvento>) => onChange({ ...momento, ...p });
  const entregas = momento.entregasRealtime ?? [];
  const addEntrega = () =>
    set({
      entregasRealtime: [
        ...entregas,
        {
          id: crypto.randomUUID(),
          titulo: "",
          logInicio: momento.inicio,
          prazo: momento.fim,
          status: "aguardando",
        },
      ],
    });
  const updateEntrega = (id: string, p: Partial<(typeof entregas)[number]>) =>
    set({ entregasRealtime: entregas.map((e) => (e.id === id ? { ...e, ...p } : e)) });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Momento da programação</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-muted-foreground">
                <Clock3 className="size-3.5" />
              </span>
              <div>
                <h3 className="text-xs font-semibold">Cronograma recebido</h3>
                <p className="text-[10px] text-muted-foreground">
                  O que foi informado pela organização do evento.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FieldModal label="Origem">
                <Select
                  value={momento.origem ?? "cronograma"}
                  onValueChange={(value) => set({ origem: value as MomentoEvento["origem"] })}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background/35">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cronograma">Cronograma recebido</SelectItem>
                    <SelectItem value="operacao">Criado pela operação</SelectItem>
                  </SelectContent>
                </Select>
              </FieldModal>
              <FieldModal label="Natureza">
                <Select
                  value={momento.natureza ?? "conteudo"}
                  onValueChange={(value) => set({ natureza: value as MomentoEvento["natureza"] })}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background/35">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conteudo">Conteúdo do evento</SelectItem>
                    <SelectItem value="transicao">Transição / deslocamento</SelectItem>
                    <SelectItem value="montagem">Montagem / preparação</SelectItem>
                    <SelectItem value="intervalo">Intervalo</SelectItem>
                  </SelectContent>
                </Select>
              </FieldModal>
              <FieldModal label="Início previsto">
                <EventoTimeField
                  value={momento.inicio}
                  onChange={(value) => set({ inicio: value })}
                />
              </FieldModal>
              <FieldModal label="Fim previsto">
                <EventoTimeField value={momento.fim} onChange={(value) => set({ fim: value })} />
              </FieldModal>
              <div className="sm:col-span-2">
                <FieldModal label="Momento do evento">
                  <Input
                    value={momento.titulo}
                    onChange={(e) => set({ titulo: e.target.value })}
                    placeholder="Ex: Abertura oficial"
                  />
                </FieldModal>
              </div>
              <div className="sm:col-span-2">
                <label className="flex h-10 cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3">
                  <span className="text-[10px] text-muted-foreground">
                    Momento crítico para a operação
                  </span>
                  <input
                    type="checkbox"
                    checked={!!momento.critico}
                    onChange={(e) => set({ critico: e.target.checked })}
                    className="accent-primary"
                  />
                </label>
              </div>
              <div className="sm:col-span-2">
                <FieldModal label="Local / ambiente">
                  <Input
                    value={momento.local ?? ""}
                    onChange={(e) => set({ local: e.target.value })}
                    placeholder="Palco principal, sala 02…"
                  />
                </FieldModal>
              </div>
              <div className="sm:col-span-2">
                <FieldModal label="Observações do cronograma">
                  <Input
                    value={momento.observacoes ?? ""}
                    onChange={(e) => set({ observacoes: e.target.value })}
                    placeholder="Informações fornecidas pelo cliente"
                  />
                </FieldModal>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-primary/20 bg-primary/[.025] p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Radio className="size-4" />
              </span>
              <div>
                <h3 className="text-xs font-semibold">Plano audiovisual</h3>
                <p className="text-[10px] text-muted-foreground">
                  Como a produtora vai cobrir este momento.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldModal label="Chamada da equipe">
                <EventoTimeField
                  value={momento.chamada ?? ""}
                  onChange={(value) => set({ chamada: value })}
                />
              </FieldModal>
              <FieldModal label="Cobertura planejada">
                <Input
                  value={momento.cobertura ?? ""}
                  onChange={(e) => set({ cobertura: e.target.value })}
                  placeholder="Ex: Plano geral + reações + fala final"
                />
              </FieldModal>
              <div className="sm:col-span-2">
                <Label className="text-[10px]">Responsáveis</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {membros.map((m) => {
                    const ativo = momento.responsavelIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          set({
                            responsavelIds: ativo
                              ? momento.responsavelIds.filter((x) => x !== m.id)
                              : [...momento.responsavelIds, m.id],
                          })
                        }
                        className={cn(
                          "rounded-lg border px-3 py-2 text-[10px]",
                          ativo
                            ? "border-primary/35 bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground",
                        )}
                      >
                        {m.nome || "A definir"} · {m.funcao}
                      </button>
                    );
                  })}
                  {membros.length === 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Configure a equipe para distribuir responsáveis.
                    </p>
                  )}
                </div>
              </div>
              <FieldModal label="Equipamentos">
                <EquipmentField
                  value={momento.equipamentos ?? []}
                  onChange={(equipamentos) => set({ equipamentos })}
                />
              </FieldModal>
              <FieldModal label="Plano B">
                <Input
                  value={momento.planoB ?? ""}
                  onChange={(e) => set({ planoB: e.target.value })}
                  placeholder="Se houver atraso, troca de sala…"
                />
              </FieldModal>
              <div className="sm:col-span-2">
                <FieldModal label="Instrução curta para o Modo Evento">
                  <Textarea
                    rows={2}
                    value={momento.notasAoVivo ?? ""}
                    onChange={(e) => set({ notasAoVivo: e.target.value })}
                    placeholder="O que a equipe precisa enxergar durante a execução, sem abrir o briefing inteiro."
                  />
                </FieldModal>
              </div>
            </div>

            <div className="mt-5 border-t border-primary/15 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-xs font-semibold">Plano de captação no ao vivo</h4>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Estes itens aparecem como checklist clicável no card do ambiente.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={novoPlano}
                    onChange={(e) => setNovoPlano(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" || !novoPlano.trim()) return;
                      e.preventDefault();
                      set({
                        captacaoItens: [
                          ...(momento.captacaoItens ?? []),
                          { id: crypto.randomUUID(), titulo: novoPlano.trim(), concluido: false },
                        ],
                      });
                      setNovoPlano("");
                    }}
                    placeholder="Ex: Reação da plateia"
                    className="w-full sm:w-64"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!novoPlano.trim()}
                    onClick={() => {
                      set({
                        captacaoItens: [
                          ...(momento.captacaoItens ?? []),
                          { id: crypto.randomUUID(), titulo: novoPlano.trim(), concluido: false },
                        ],
                      });
                      setNovoPlano("");
                    }}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(momento.captacaoItens ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg border border-border/55 bg-background/25 px-3 py-2.5"
                  >
                    <ListChecks className="size-3.5 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-[10px]">{item.titulo}</span>
                    <button
                      type="button"
                      onClick={() =>
                        set({
                          captacaoItens: (momento.captacaoItens ?? []).filter(
                            (captureItem) => captureItem.id !== item.id,
                          ),
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                {!momento.captacaoItens?.length && (
                  <p className="sm:col-span-2 rounded-lg border border-dashed border-border/55 py-5 text-center text-[10px] text-muted-foreground">
                    Nenhum plano de captação definido para o Modo Evento.
                  </p>
                )}
              </div>
            </div>
          </section>
          <section className="hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold">Entregas realtime</h3>
                <p className="text-[10px] text-muted-foreground">
                  Log, edição, aprovação e publicação ainda durante o evento.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addEntrega}>
                <Plus className="size-3.5" /> Entrega
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {entregas.map((entrega) => (
                <div
                  key={entrega.id}
                  className="rounded-xl border border-border/60 bg-background/25 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_.65fr_.65fr_.8fr_auto]">
                    <FieldModal label="Entrega">
                      <Input
                        value={entrega.titulo}
                        onChange={(e) => updateEntrega(entrega.id, { titulo: e.target.value })}
                        placeholder="Ex: Reel da abertura"
                      />
                    </FieldModal>
                    <FieldModal label="Início do log">
                      <EventoTimeField
                        value={entrega.logInicio}
                        onChange={(value) => updateEntrega(entrega.id, { logInicio: value })}
                      />
                    </FieldModal>
                    <FieldModal label="Deadline">
                      <EventoTimeField
                        value={entrega.prazo}
                        onChange={(value) => updateEntrega(entrega.id, { prazo: value })}
                      />
                    </FieldModal>
                    <FieldModal label="Canal / destino">
                      <Input
                        value={entrega.canal ?? ""}
                        onChange={(e) => updateEntrega(entrega.id, { canal: e.target.value })}
                        placeholder="Instagram, telão…"
                      />
                    </FieldModal>
                    <button
                      type="button"
                      onClick={() =>
                        set({ entregasRealtime: entregas.filter((e) => e.id !== entrega.id) })
                      }
                      className="mt-5 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 border-t border-border/40 pt-3 sm:grid-cols-2">
                    <FieldModal label="Responsável">
                      <select
                        value={entrega.responsavelId ?? ""}
                        onChange={(e) =>
                          updateEntrega(entrega.id, { responsavelId: e.target.value || undefined })
                        }
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">A definir</option>
                        {membros.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nome || "Sem nome"} · {m.funcao}
                          </option>
                        ))}
                      </select>
                    </FieldModal>
                    <FieldModal label="Status">
                      <select
                        value={entrega.status}
                        onChange={(e) =>
                          updateEntrega(entrega.id, {
                            status: e.target.value as typeof entrega.status,
                          })
                        }
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="aguardando">Aguardando</option>
                        <option value="logando">Logando material</option>
                        <option value="editando">Em edição</option>
                        <option value="aprovacao">Em aprovação</option>
                        <option value="publicado">Publicado</option>
                      </select>
                    </FieldModal>
                  </div>
                </div>
              ))}
              {entregas.length === 0 && (
                <p className="rounded-xl border border-dashed border-border/60 py-5 text-center text-[10px] text-muted-foreground">
                  Sem entrega realtime neste momento.
                </p>
              )}
            </div>
          </section>
          <section>
            <div className="mb-3">
              <h3 className="text-xs font-semibold">Execução real</h3>
              <p className="text-[10px] text-muted-foreground">
                Será usado principalmente durante o Modo Live.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <FieldModal label="Status">
                <Select
                  value={momento.status ?? "previsto"}
                  onValueChange={(value) => set({ status: value as MomentoEvento["status"] })}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background/35">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previsto">Previsto</SelectItem>
                    <SelectItem value="preparar">Preparar</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </FieldModal>
              <FieldModal label="Início real">
                <EventoTimeField
                  value={momento.inicioReal ?? ""}
                  onChange={(value) => set({ inicioReal: value })}
                />
              </FieldModal>
              <FieldModal label="Fim real">
                <EventoTimeField
                  value={momento.fimReal ?? ""}
                  onChange={(value) => set({ fimReal: value })}
                />
              </FieldModal>
            </div>
          </section>
        </div>
        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onRemove(momento.id)}
          >
            Remover
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={!momento.titulo.trim()} onClick={() => onSave(momento)}>
              Salvar momento
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function FieldModal({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px]">{label}</Label>
      {children}
    </div>
  );
}

function EquipmentField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const equipment = draft.trim().replace(/,$/, "").trim();
    if (!equipment) return;
    if (!value.some((item) => item.toLocaleLowerCase() === equipment.toLocaleLowerCase())) {
      onChange([...value, equipment]);
    }
    setDraft("");
  };

  return (
    <div className="rounded-xl border border-input bg-background/35 p-2 transition focus-within:border-primary/45 focus-within:ring-1 focus-within:ring-primary/15">
      {!!value.length && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((equipment) => (
            <span
              key={equipment}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/[.07] px-2 py-1 text-[9px] text-foreground/85"
            >
              <PackageCheck className="size-3 text-primary" />
              {equipment}
              <button
                type="button"
                aria-label={`Remover ${equipment}`}
                onClick={() => onChange(value.filter((item) => item !== equipment))}
                className="ml-0.5 text-muted-foreground transition hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={add}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== ",") return;
          event.preventDefault();
          add();
        }}
        placeholder={value.length ? "Adicionar outro equipamento…" : "Ex: Sony FX3, gimbal, lapela"}
        className="h-6 w-full bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
      />
      <p className="px-1 pt-1 text-[8px] text-muted-foreground/60">
        Pressione Enter ou vírgula para adicionar. Espaços são preservados.
      </p>
    </div>
  );
}

function RealtimePanel({ evento }: { evento: ReturnType<typeof useEventosProducao>[number] }) {
  const [novo, setNovo] = useState(false);
  const [draft, setDraft] = useState<ItemRealtimeEvento>({
    id: "",
    titulo: "",
    status: "aguardando_material",
  });
  const itens = evento.realtimeItens ?? [];
  const salvarItens = (next: ItemRealtimeEvento[]) =>
    eventosProducaoActions.atualizar(evento.id, { realtimeItens: next });
  const abrir = () => {
    setDraft({
      id: crypto.randomUUID(),
      titulo: "",
      status: "aguardando_material",
      logPrevisto: "",
      prazo: "",
    });
    setNovo(true);
  };
  const salvar = () => {
    if (!draft.titulo.trim()) return;
    salvarItens([...itens, draft]);
    setNovo(false);
  };
  const mover = (id: string, status: ItemRealtimeEvento["status"]) =>
    salvarItens(itens.map((i) => (i.id === id ? { ...i, status } : i)));
  const grupos: { title: string; statuses: ItemRealtimeEvento["status"][] }[] = [
    { title: "Entrada de material", statuses: ["aguardando_material", "logando", "pronto_editar"] },
    { title: "Fila editorial", statuses: ["editando", "aprovacao"] },
    { title: "Entregues", statuses: ["pronto", "publicado"] },
  ];
  return (
    <section className="min-h-[500px] rounded-2xl border border-border/70 bg-card/45 p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="grid size-11 place-items-center rounded-2xl bg-warning/10 text-warning">
            <MonitorPlay className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">Central Realtime</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            O editor acompanha a chegada do material, a fila de edição e o que já foi entregue sem
            poluir o cronograma do evento.
          </p>
        </div>
        <Button onClick={abrir}>
          <Plus className="size-4" /> Nova demanda
        </Button>
      </div>
      <div className="mt-7 grid gap-4 xl:grid-cols-[.7fr_1.3fr]">
        <div className="rounded-2xl border border-border/60 bg-surface-1/25 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Material por equipe</h3>
              <p className="text-[10px] text-muted-foreground">
                Origem dos arquivos e situação do log.
              </p>
            </div>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-2">
            {(evento.equipeMembros ?? []).map((m) => {
              const ligados = itens.filter((i) => i.origemMembroId === m.id);
              const pendentes = ligados.filter((i) =>
                ["aguardando_material", "logando"].includes(i.status),
              ).length;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/20 p-3"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-surface-2 text-[10px] font-semibold">
                    {(m.nome || m.funcao).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {m.nome || "Profissional a definir"}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {m.funcao} · {ligados.length} pacotes
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-[8px]",
                      pendentes ? "bg-warning/10 text-warning" : "bg-primary/8 text-primary",
                    )}
                  >
                    {pendentes ? `${pendentes} aguardando` : "Em dia"}
                  </span>
                </div>
              );
            })}
            {!evento.equipeMembros?.length && (
              <p className="rounded-xl border border-dashed border-border/60 py-8 text-center text-[10px] text-muted-foreground">
                Configure a equipe para controlar a origem do material.
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {grupos.map((g) => (
            <div key={g.title} className="rounded-2xl border border-border/60 bg-surface-1/20 p-3">
              <div className="flex items-center justify-between px-1 py-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.title}
                </h3>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[9px]">
                  {itens.filter((i) => g.statuses.includes(i.status)).length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {itens
                  .filter((i) => g.statuses.includes(i.status))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border/55 bg-background/30 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold leading-snug">{item.titulo}</p>
                        <span className="size-2 shrink-0 rounded-full bg-warning" />
                      </div>
                      <p className="mt-2 text-[9px] text-muted-foreground">
                        {item.prazo ? `Deadline ${item.prazo}` : "Sem deadline"}
                        {item.destino ? ` · ${item.destino}` : ""}
                      </p>
                      <select
                        value={item.status}
                        onChange={(e) =>
                          mover(item.id, e.target.value as ItemRealtimeEvento["status"])
                        }
                        className="mt-3 h-8 w-full rounded-lg border border-border bg-surface-1 px-2 text-[10px]"
                      >
                        <option value="aguardando_material">Aguardando material</option>
                        <option value="logando">Logando</option>
                        <option value="pronto_editar">Pronto para editar</option>
                        <option value="editando">Editando</option>
                        <option value="aprovacao">Em aprovação</option>
                        <option value="pronto">Pronto</option>
                        <option value="publicado">Publicado</option>
                      </select>
                    </div>
                  ))}
                {!itens.some((i) => g.statuses.includes(i.status)) && (
                  <p className="rounded-xl border border-dashed border-border/50 py-7 text-center text-[9px] text-muted-foreground">
                    Nenhum item
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dialog open={novo} onOpenChange={setNovo}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display">Nova demanda realtime</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FieldModal label="Entregável">
              <Input
                value={draft.titulo}
                onChange={(e) => setDraft((d) => ({ ...d, titulo: e.target.value }))}
                placeholder="Ex: Reel da palestra de abertura"
              />
            </FieldModal>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldModal label="Origem do material">
                <select
                  value={draft.origemMembroId ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, origemMembroId: e.target.value || undefined }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">A definir</option>
                  {evento.equipeMembros?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome || "Sem nome"} · {m.funcao}
                    </option>
                  ))}
                </select>
              </FieldModal>
              <FieldModal label="Editor responsável">
                <select
                  value={draft.editorId ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, editorId: e.target.value || undefined }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">A definir</option>
                  {evento.equipeMembros?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome || "Sem nome"} · {m.funcao}
                    </option>
                  ))}
                </select>
              </FieldModal>
              <FieldModal label="Log previsto">
                <EventoTimeField
                  value={draft.logPrevisto ?? ""}
                  onChange={(value) => setDraft((d) => ({ ...d, logPrevisto: value }))}
                />
              </FieldModal>
              <FieldModal label="Deadline">
                <EventoTimeField
                  value={draft.prazo ?? ""}
                  onChange={(value) => setDraft((d) => ({ ...d, prazo: value }))}
                />
              </FieldModal>
            </div>
            <FieldModal label="Destino">
              <Input
                value={draft.destino ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, destino: e.target.value }))}
                placeholder="Instagram, telão, cliente, imprensa…"
              />
            </FieldModal>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovo(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={!draft.titulo.trim()}>
              Criar demanda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
function SetupPrimary({
  number,
  icon: Icon,
  title,
  desc,
  status,
  meta,
  onClick,
}: {
  number: string;
  icon: typeof MapPin;
  title: string;
  desc: string;
  status: "vazio" | "iniciado";
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative min-h-52 overflow-hidden rounded-2xl border border-border/65 bg-surface-1/30 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-surface-2/55 hover:shadow-[0_16px_45px_-32px_var(--primary)]"
    >
      <span className="absolute right-4 top-2 font-display text-5xl font-semibold text-foreground/[.025]">
        {number}
      </span>
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-12 place-items-center rounded-2xl border transition group-hover:scale-105",
            status === "iniciado"
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-border/60 bg-surface-2 text-muted-foreground group-hover:text-primary",
          )}
        >
          <Icon className="size-5" />
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-wider",
            status === "iniciado" ? "bg-warning/10 text-warning" : "bg-primary/8 text-primary",
          )}
        >
          {status === "iniciado" ? "Em construção" : "Começar"}
        </span>
      </div>
      <h3 className="mt-6 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
      <div className="absolute inset-x-5 bottom-4 flex items-center justify-between border-t border-border/50 pt-3">
        <span className="text-[10px] text-muted-foreground">{meta}</span>
        <span className="text-[10px] font-semibold text-primary transition group-hover:translate-x-1">
          Abrir →
        </span>
      </div>
    </button>
  );
}
function SetupCompact({
  icon: Icon,
  title,
  detail,
  active,
  onClick,
}: {
  icon: typeof MapPin;
  title: string;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background/20 px-3 py-3 text-left transition hover:border-primary/25 hover:bg-surface-2/50"
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          active ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold">{title}</span>
        <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">{detail}</span>
      </span>
      <span className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary">
        ›
      </span>
    </button>
  );
}
function Status({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2.5">
      <CheckCircle2 className={cn("size-4", ok ? "text-primary" : "text-muted-foreground/30")} />
      <span className="text-xs">{label}</span>
      <span className="ml-auto text-[9px] text-muted-foreground">{ok ? "Pronto" : "Pendente"}</span>
    </div>
  );
}
function Module({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof CalendarDays;
  title: string;
  desc: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="min-h-[440px] rounded-2xl border border-border/70 bg-card/45 p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="grid size-10 place-items-center rounded-xl bg-primary/8 text-primary">
            <Icon className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{desc}</p>
        </div>
        <Button>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>
      {children ? (
        <div className="mt-7">{children}</div>
      ) : (
        <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <Icon className="size-7 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium">Este espaço está pronto para ser estruturado</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vamos construir este módulo com profundidade na próxima etapa.
          </p>
        </div>
      )}
    </section>
  );
}
