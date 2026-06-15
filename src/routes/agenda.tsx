import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgendaSupa } from "@/lib/hooks/useAgenda";
import { TIPOS, type Evento } from "@/lib/mock/agenda";
import { EventoModal } from "@/components/agenda/evento-modal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agenda")({ component: AgendaPage });

type Visao = "mes" | "semana" | "dia";

function AgendaPage() {
  const { eventos } = useAgendaSupa();
  const [visao, setVisao] = useState<Visao>("semana");
  const [cursor, setCursor] = useState(new Date());
  const [editando, setEditando] = useState<Evento | null>(null);
  const [criandoEm, setCriandoEm] = useState<Date | null>(null);
  const [modal, setModal] = useState(false);

  const abrirNovo = (data?: Date) => { setEditando(null); setCriandoEm(data ?? new Date()); setModal(true); };
  const abrirEdicao = (ev: Evento) => { setEditando(ev); setCriandoEm(null); setModal(true); };

  const tituloPeriodo = useMemo(() => {
    if (visao === "mes") return format(cursor, "MMMM yyyy", { locale: ptBR });
    if (visao === "dia") return format(cursor, "dd 'de' MMMM, yyyy", { locale: ptBR });
    const ini = startOfWeek(cursor, { weekStartsOn: 1 });
    const fim = endOfWeek(cursor, { weekStartsOn: 1 });
    return `${format(ini, "dd MMM", { locale: ptBR })} — ${format(fim, "dd MMM", { locale: ptBR })}`;
  }, [cursor, visao]);

  const navegar = (dir: 1 | -1) => {
    if (visao === "mes") setCursor(dir > 0 ? addMonths(cursor, 1) : subMonths(cursor, 1));
    else if (visao === "semana") setCursor(addDays(cursor, dir * 7));
    else setCursor(addDays(cursor, dir));
  };

  return (
    <div className="space-y-4 px-4 py-5 md:px-8 md:py-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold capitalize">{tituloPeriodo}</h1>
          <p className="text-xs text-muted-foreground">{eventos.length} eventos no total</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={visao} onValueChange={v => setVisao(v as Visao)}>
            <TabsList className="h-8">
              <TabsTrigger value="mes" className="text-xs">Mês</TabsTrigger>
              <TabsTrigger value="semana" className="text-xs">Semana</TabsTrigger>
              <TabsTrigger value="dia" className="text-xs">Dia</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface-1/50 p-0.5">
            <Button variant="ghost" size="icon" className="size-7" onClick={() => navegar(-1)}><ChevronLeft className="size-4" /></Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setCursor(new Date())}>Hoje</Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => navegar(1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      </header>

      <Legenda onNovo={() => abrirNovo()} />

      {visao === "mes" && <VisaoMes cursor={cursor} eventos={eventos} onDia={abrirNovo} onEvento={abrirEdicao} />}
      {visao === "semana" && <VisaoSemana cursor={cursor} eventos={eventos} onDia={abrirNovo} onEvento={abrirEdicao} />}
      {visao === "dia" && <VisaoDia cursor={cursor} eventos={eventos} onNovo={() => abrirNovo(cursor)} onEvento={abrirEdicao} />}

      <EventoModal open={modal} onClose={() => setModal(false)} evento={editando} dataInicial={criandoEm} />
    </div>
  );
}

function Legenda({ onNovo }: { onNovo: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-surface-1/40 px-2 py-2">
      <Button size="sm" onClick={onNovo} className="shrink-0"><Plus className="size-4" /> Novo evento</Button>
      <span className="mx-0.5 h-5 w-px shrink-0 bg-border/60" aria-hidden />
      {Object.entries(TIPOS).map(([id, t]) => (
        <span key={id} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn("size-2 rounded-full", t.dot)} /> {t.label}
        </span>
      ))}
    </div>
  );
}

/* ===================== MÊS ===================== */
function VisaoMes({ cursor, eventos, onDia, onEvento }: {
  cursor: Date; eventos: Evento[];
  onDia: (d: Date) => void; onEvento: (e: Evento) => void;
}) {
  const ini = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const fim = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const dias = eachDayOfInterval({ start: ini, end: fim });
  const semanas = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-1/30">
      <div className="grid grid-cols-7 border-b border-border bg-surface-2/40">
        {semanas.map(s => (
          <div key={s} className="px-2 py-1.5 text-center text-[10px] uppercase tracking-wider text-muted-foreground">{s}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((d) => {
          const doDia = eventos.filter(e => isSameDay(new Date(e.inicio), d));
          const foraMes = !isSameMonth(d, cursor);
          const hoje = isToday(d);
          return (
            <div key={d.toISOString()} className={cn(
              "group min-h-[110px] cursor-pointer border-b border-r border-border/50 p-1.5 transition hover:bg-surface-2/40",
              foraMes && "bg-surface-1/10 opacity-50",
            )} onClick={() => onDia(d)}>
              <div className="mb-1 flex items-center justify-between">
                <span className={cn(
                  "grid size-6 place-items-center rounded-md text-[11px] tabular-nums",
                  hoje ? "bg-primary text-primary-foreground font-bold" : "text-foreground/70",
                )}>{format(d, "dd")}</span>
                {doDia.length > 0 && <span className="text-[9px] text-muted-foreground">{doDia.length}</span>}
              </div>
              <div className="space-y-1">
                {doDia.slice(0, 3).map(e => (
                  <button key={e.id} onClick={(ev) => { ev.stopPropagation(); onEvento(e); }}
                    className={cn("flex w-full items-center gap-1 truncate rounded border px-1 py-0.5 text-left text-[10px]", TIPOS[e.tipo].classe)}>
                    <span className="tabular-nums opacity-70">{format(new Date(e.inicio), "HH:mm")}</span>
                    <span className="truncate">{e.titulo}</span>
                  </button>
                ))}
                {doDia.length > 3 && <p className="text-[9px] text-muted-foreground">+ {doDia.length - 3} mais</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== SEMANA ===================== */
function VisaoSemana({ cursor, eventos, onDia, onEvento }: {
  cursor: Date; eventos: Evento[];
  onDia: (d: Date) => void; onEvento: (e: Evento) => void;
}) {
  const ini = startOfWeek(cursor, { weekStartsOn: 1 });
  const dias = Array.from({ length: 7 }, (_, i) => addDays(ini, i));
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {dias.map(d => {
        const doDia = eventos
          .filter(e => isSameDay(new Date(e.inicio), d))
          .sort((a, b) => +new Date(a.inicio) - +new Date(b.inicio));
        const hoje = isToday(d);
        return (
          <div key={d.toISOString()} className={cn(
            "min-h-[280px] rounded-xl border bg-surface-1/40 p-3",
            hoje ? "border-primary/40 ring-1 ring-primary/30" : "border-border",
          )}>
            <button onClick={() => onDia(d)} className="mb-3 flex w-full items-center justify-between text-left group">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{format(d, "EEE", { locale: ptBR })}</p>
                <p className={cn("font-display text-xl font-semibold", hoje && "text-primary")}>{format(d, "dd")}</p>
              </div>
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary">
                {doDia.length || "+"}
              </span>
            </button>
            <div className="space-y-1.5">
              {doDia.length === 0 && <p className="rounded-md border border-dashed border-border/60 p-3 text-center text-[10px] text-muted-foreground">Sem eventos</p>}
              {doDia.map(e => (
                <button key={e.id} onClick={() => onEvento(e)} className={cn(
                  "w-full rounded-lg border p-2 text-left transition hover:scale-[1.01]", TIPOS[e.tipo].classe,
                )}>
                  <p className="text-[10px] tabular-nums opacity-80">
                    {format(new Date(e.inicio), "HH:mm")} – {format(new Date(e.fim), "HH:mm")}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-medium text-foreground">{e.titulo}</p>
                  {e.local && <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] opacity-70"><MapPin className="size-2.5" /> {e.local}</p>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================== DIA ===================== */
function VisaoDia({ cursor, eventos, onNovo, onEvento }: {
  cursor: Date; eventos: Evento[];
  onNovo: () => void; onEvento: (e: Evento) => void;
}) {
  const doDia = eventos
    .filter(e => isSameDay(new Date(e.inicio), cursor))
    .sort((a, b) => +new Date(a.inicio) - +new Date(b.inicio));
  const horas = Array.from({ length: 14 }, (_, i) => i + 7); // 7h até 20h

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-border bg-surface-1/30 p-4">
        <div className="space-y-1">
          {horas.map(h => {
            const eventosHora = doDia.filter(e => new Date(e.inicio).getHours() === h);
            return (
              <div key={h} className="flex gap-3 border-t border-border/30 py-2 first:border-t-0">
                <div className="w-12 shrink-0 text-[10px] tabular-nums text-muted-foreground">{String(h).padStart(2, "0")}:00</div>
                <div className="flex-1 space-y-1.5">
                  {eventosHora.length === 0 && <div className="h-6" />}
                  {eventosHora.map(e => (
                    <button key={e.id} onClick={() => onEvento(e)} className={cn(
                      "w-full rounded-lg border p-2 text-left transition hover:scale-[1.005]", TIPOS[e.tipo].classe,
                    )}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{e.titulo}</p>
                        <span className="shrink-0 text-[10px] tabular-nums opacity-70">
                          {format(new Date(e.inicio), "HH:mm")}–{format(new Date(e.fim), "HH:mm")}
                        </span>
                      </div>
                      {e.local && <p className="mt-1 flex items-center gap-1 text-[11px] opacity-80"><MapPin className="size-3" /> {e.local}</p>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl border border-border bg-surface-1/40 p-4">
          <h3 className="mb-2 font-display text-sm font-semibold">Resumo do dia</h3>
          <div className="space-y-2">
            <Stat icon={Clock} label="Eventos" valor={String(doDia.length)} />
            <Stat icon={Users} label="Reuniões" valor={String(doDia.filter(e => e.tipo === "reuniao").length)} />
          </div>
          <Button size="sm" className="mt-3 w-full" onClick={onNovo}><Plus className="size-4" /> Novo evento</Button>
        </div>
        <div className="rounded-xl border border-border bg-surface-1/40 p-4">
          <h3 className="mb-2 font-display text-sm font-semibold">Próximos</h3>
          <div className="space-y-1.5">
            {eventos
              .filter(e => new Date(e.inicio) > new Date())
              .sort((a, b) => +new Date(a.inicio) - +new Date(b.inicio))
              .slice(0, 5)
              .map(e => (
                <button key={e.id} onClick={() => onEvento(e)} className="flex w-full items-center gap-2 rounded-md border border-border/40 bg-surface-2/30 p-2 text-left transition hover:border-primary/30">
                  <span className={cn("size-2 rounded-full", TIPOS[e.tipo].dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{e.titulo}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(e.inicio), "dd MMM 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                </button>
              ))}
            {eventos.filter(e => new Date(e.inicio) > new Date()).length === 0 && (
              <p className="text-center text-[11px] text-muted-foreground">Nada agendado</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Stat({ icon: Icon, label, valor }: { icon: typeof Clock; label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-surface-2/40 px-2.5 py-1.5">
      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon className="size-3.5 text-primary" /> {label}</span>
      <span className="font-display text-sm font-semibold tabular-nums">{valor}</span>
    </div>
  );
}
