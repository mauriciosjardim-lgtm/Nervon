import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useFinanceiroSupa } from "@/lib/hooks/useFinanceiro";
import { useProjetos } from "@/lib/hooks/useProjetos";
import { useComercial } from "@/lib/hooks/useComercial";
import { useAgendaSupa } from "@/lib/hooks/useAgenda";
import {
  DndContext, PointerSensor, KeyboardSensor, closestCenter,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  EmptyWallet, MoneyRecive, Kanban, TrendUp,
  Calendar, TickCircle, Notification, Setting2,
  ArrowLeft2, ArrowRight2, MagicStar, Add,
} from "iconsax-react";
import type { Icon as IcIcon } from "iconsax-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  format, startOfMonth, endOfMonth, subMonths, addMonths,
  isSameMonth, eachDayOfInterval, isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { PersonalizeSheet } from "@/components/dashboard/personalize-sheet";
import { widgetRegistry } from "@/lib/dashboard/widgets";
import { loadState, saveState, type PersistedState } from "@/lib/dashboard/storage";
import type { WidgetSize } from "@/lib/dashboard/types";
import { loadMetas, progressoMes } from "@/lib/mock/metas";
import { useAuth } from "@/lib/auth";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — MakersHub" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { usuario } = useAuth();
  const [state, setState] = useState<PersistedState | null>(null);
  const [editing, setEditing] = useState(false);
  const [personalizing, setPersonalizing] = useState(false);

  useEffect(() => { setState(loadState()); }, []);
  const persist = (next: PersistedState) => { setState(next); saveState(next); };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const active = useMemo(
    () => state?.layouts.find(l => l.id === state.activeId) ?? state?.layouts[0],
    [state],
  );

  if (!state) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  if (!active) return null;

  const updateActive = (
    fn: (l: import("@/lib/dashboard/types").DashboardLayout) => import("@/lib/dashboard/types").DashboardLayout,
  ) => persist({ ...state, layouts: state.layouts.map(l => l.id === active.id ? fn(l) : l) });

  const handleDragEnd = (e: DragEndEvent) => {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    updateActive(l => {
      const oi = l.widgets.findIndex(w => w.id === a.id);
      const ni = l.widgets.findIndex(w => w.id === over.id);
      return { ...l, widgets: arrayMove(l.widgets, oi, ni) };
    });
  };

  const addWidget = (type: string) => {
    const meta = widgetRegistry[type];
    if (!meta) return;
    updateActive(l => ({
      ...l,
      widgets: [...l.widgets, { id: `${type}-${Math.random().toString(36).slice(2, 8)}`, type, size: meta.defaultSize }],
    }));
  };

  const removeWidget = (id: string) => updateActive(l => ({ ...l, widgets: l.widgets.filter(w => w.id !== id) }));
  const resizeWidget = (id: string, size: WidgetSize) =>
    updateActive(l => ({ ...l, widgets: l.widgets.map(w => w.id === id ? { ...w, size } : w) }));

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const nome = usuario?.nome ? `, ${usuario.nome.split(" ")[0]}` : "";

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-7 md:px-8 md:py-9">
      {/* Greeting */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1 font-display text-[2rem] font-bold tracking-tight text-foreground">
            {greet()}{nome}.
          </h1>
        </div>
        <button
          onClick={() => setEditing(v => !v)}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface-1/60 px-3.5 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/30 hover:text-foreground data-[active=true]:border-primary/30 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
          data-active={editing}
        >
          <Setting2 size={14} color="currentColor" variant="Linear" />
          {editing ? "Concluir" : "Personalizar"}
        </button>
      </div>

      {/* KPI Strip */}
      <KpiStrip />

      {/* Hero: chart + agenda */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <AnalyticChart />
        <CalendarPanel />
      </div>

      {/* Widget grid */}
      {active.widgets.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Widgets</span>
            {editing && (
              <Button
                onClick={() => setPersonalizing(true)}
                size="sm"
                className="h-7 gap-1.5 rounded-lg bg-primary px-3 text-xs text-primary-foreground hover:bg-primary-glow"
              >
                <Add size={12} color="currentColor" variant="Linear" /> Widget
              </Button>
            )}
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={active.widgets.map(w => w.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-12 gap-4">
                {active.widgets.map(w => (
                  <WidgetCard key={w.id} widget={w} editing={editing}
                    onRemove={() => removeWidget(w.id)} onResize={s => resizeWidget(w.id, s)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}

      {active.widgets.length === 0 && editing && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <MagicStar size={20} color="currentColor" variant="Linear" className="mb-3 text-primary" />
          <p className="text-sm font-semibold">Adicione widgets ao cockpit</p>
          <p className="mt-1 text-xs text-muted-foreground">Personalize o que aparece aqui embaixo</p>
          <Button onClick={() => setPersonalizing(true)}
            className="mt-4 h-9 gap-2 rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary-glow">
            <Add size={14} color="currentColor" variant="Linear" /> Adicionar widget
          </Button>
        </div>
      )}

      <PersonalizeSheet open={personalizing} onOpenChange={setPersonalizing} widgets={active.widgets} onAdd={addWidget} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Strip
// ---------------------------------------------------------------------------

function KpiCard({
  icon: Icon, label, value, sub, trend, href,
}: {
  icon: IcIcon;
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  href?: string;
}) {
  const inner = (
    <div className="group flex h-full items-center gap-4 rounded-2xl border border-white/[0.06] bg-surface-1/70 p-4 transition hover:border-primary/20 hover:bg-surface-2/70">
      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.05]">
        <Icon size={20} color="var(--color-primary)" variant="Linear" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link to={href as any} className="block h-full">{inner}</Link> : <div className="h-full">{inner}</div>;
}

function KpiStrip() {
  const { lancamentos } = useFinanceiroSupa({ somenteEmpresa: true });
  const leads = useComercial(s => s.leads);
  const { projetos } = useProjetos();
  const hoje = new Date();

  const receita = lancamentos
    .filter(l => l.tipo === "receita" && l.pagamentoEm && isSameMonth(new Date(l.pagamentoEm), hoje))
    .reduce((s, l) => s + l.valor, 0);

  const leadsAtivos = leads.filter(l => !["fechado", "perdido"].includes(l.etapa));
  const pipeline = leadsAtivos.reduce((s, l) => s + l.valor, 0);
  const projetosAtivos = projetos.filter(p => !["entrega", "concluido"].includes(p.fase)).length;
  const p = progressoMes(loadMetas(), lancamentos);
  const metaPct = p.atingiuMeta ? p.pctSuper : p.pctMeta;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <KpiCard icon={EmptyWallet} label="Receita do mês" value={brl(receita)} href="/financeiro" />
      <KpiCard icon={Kanban} label="Projetos ativos" value={String(projetosAtivos)} href="/projetos" />
      <div className="rounded-2xl border border-white/[0.06] bg-surface-1/70 p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.05]">
            <TrendUp size={20} color="var(--color-primary)" variant="Linear" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Meta do mês</p>
            <p className="mt-0.5 font-display text-2xl font-bold tabular-nums tracking-tight">{metaPct.toFixed(0)}%</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700"
            style={{ width: `${Math.min(100, metaPct)}%`, boxShadow: "0 0 8px var(--primary)" }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {brl(p.realizado)} · meta {brl(p.atingiuMeta ? p.superMeta : p.meta)}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytic Chart
// ---------------------------------------------------------------------------

function AnalyticChart() {
  const { lancamentos } = useFinanceiroSupa();
  const hoje = new Date();
  const [offset, setOffset] = useState(0);
  const refMes = subMonths(hoje, offset);

  const meses = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(refMes, 5 - i)));
  const data = meses.map(mes => ({
    mes: format(mes, "MMM", { locale: ptBR }),
    receita: lancamentos
      .filter(l => l.tipo === "receita" && l.pagamentoEm && isSameMonth(new Date(l.pagamentoEm), mes))
      .reduce((s, l) => s + l.valor, 0),
    custo: lancamentos
      .filter(l => l.tipo === "despesa" && l.pagamentoEm && isSameMonth(new Date(l.pagamentoEm), mes))
      .reduce((s, l) => s + l.valor, 0),
  }));

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-1/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-sm font-semibold tracking-tight">Faturamento × Custos</p>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2/60 px-1">
          <button onClick={() => setOffset(v => v + 1)} className="rounded p-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft2 size={14} color="currentColor" variant="Linear" />
          </button>
          <span className="min-w-[80px] text-center text-xs text-muted-foreground">
            {format(refMes, "MMM yyyy", { locale: ptBR })}
          </span>
          <button onClick={() => setOffset(v => Math.max(0, v - 1))} className="rounded p-1 text-muted-foreground hover:text-foreground">
            <ArrowRight2 size={14} color="currentColor" variant="Linear" />
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="mes" axisLine={false} tickLine={false}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 8, fontSize: 12,
            }}
            formatter={(v: number) => [brl(v)]}
          />
          <Area type="monotone" dataKey="receita" stroke="var(--color-primary)"
            strokeWidth={2} fill="url(#gradReceita)" dot={false}
            activeDot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }} />
          <Area type="monotone" dataKey="custo" stroke="var(--color-muted-foreground)"
            strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" dot={false} strokeOpacity={0.5} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-3 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-0.5 w-3 rounded-full bg-primary" /> Receita
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-0.5 w-3 rounded-full bg-muted-foreground opacity-50" /> Custos
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar Panel
// ---------------------------------------------------------------------------

function CalendarPanel() {
  const hoje = new Date();
  const { eventos } = useAgendaSupa();
  const [mesRef, setMesRef] = useState(hoje);

  const inicio = startOfMonth(mesRef);
  const fim = endOfMonth(mesRef);
  const dias = eachDayOfInterval({ start: inicio, end: fim });

  const diasComEvento = new Set(
    eventos
      .filter(e => isSameMonth(new Date(e.inicio), mesRef))
      .map(e => new Date(e.inicio).getDate()),
  );

  // Monday-first offset: Mon=0 … Sun=6
  const offset = (inicio.getDay() + 6) % 7;

  const proximosEventos = eventos
    .filter(e => new Date(e.inicio) >= hoje)
    .sort((a, b) => +new Date(a.inicio) - +new Date(b.inicio))
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-1/70 p-5">
      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-sm font-semibold capitalize tracking-tight">
          {format(mesRef, "MMMM yyyy", { locale: ptBR })}
        </p>
        <div className="flex gap-0.5">
          <button onClick={() => setMesRef(m => addMonths(m, -1))}
            className="rounded p-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft2 size={14} color="currentColor" variant="Linear" />
          </button>
          <button onClick={() => setMesRef(m => addMonths(m, 1))}
            className="rounded p-1 text-muted-foreground hover:text-foreground">
            <ArrowRight2 size={14} color="currentColor" variant="Linear" />
          </button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {["S","T","Q","Q","S","S","D"].map((d, i) => (
          <span key={i} className="text-[10px] font-medium text-muted-foreground/50">{d}</span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: offset }, (_, i) => <div key={`pre-${i}`} />)}
        {dias.map(dia => {
          const n = dia.getDate();
          const ehHoje = isToday(dia);
          const temEvento = diasComEvento.has(n);
          return (
            <div key={n} className={cn(
              "relative flex aspect-square items-center justify-center rounded-lg text-[11px] leading-none",
              ehHoje
                ? "bg-primary font-bold text-primary-foreground"
                : "cursor-pointer text-foreground/70 hover:bg-white/[0.05] hover:text-foreground",
            )}>
              {n}
              {temEvento && !ehHoje && (
                <span className="absolute bottom-0.5 left-1/2 size-0.5 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming events */}
      {proximosEventos.length > 0 && (
        <div className="mt-4 space-y-2.5 border-t border-border/40 pt-3">
          {proximosEventos.map(e => (
            <div key={e.id} className="flex items-start gap-2">
              <Calendar size={12} color="currentColor" variant="Linear" className="mt-0.5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-[11px] text-foreground/80">{e.titulo}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(e.inicio), "d MMM, HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/agenda" className="mt-3 block text-center text-[11px] text-muted-foreground hover:text-primary">
        Ver agenda →
      </Link>
    </div>
  );
}
