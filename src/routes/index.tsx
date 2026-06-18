import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useFinanceiroSupa } from "@/lib/hooks/useFinanceiro";
import {
  DndContext, PointerSensor, KeyboardSensor, closestCenter,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Sparkles, Settings2, Check, ChevronDown, Plus, LayoutGrid, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { PersonalizeSheet } from "@/components/dashboard/personalize-sheet";
import { widgetRegistry } from "@/lib/dashboard/widgets";
import { loadState, saveState, type PersistedState } from "@/lib/dashboard/storage";
import type { WidgetSize } from "@/lib/dashboard/types";
import { loadMetas, progressoMes } from "@/lib/mock/metas";
import { useAuth } from "@/lib/auth";
import { SugestaoMakersHub } from "@/components/dashboard/sugestao-nervon";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

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

  const persist = (next: PersistedState) => {
    setState(next);
    saveState(next);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const active = useMemo(() => state?.layouts.find(l => l.id === state.activeId) ?? state?.layouts[0], [state]);

  if (!state) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando seu workspace…</div>;
  }

  if (!active) return null;

  const updateActive = (updater: (l: import("@/lib/dashboard/types").DashboardLayout) => import("@/lib/dashboard/types").DashboardLayout) => {
    const next = { ...state, layouts: state.layouts.map(l => l.id === active.id ? updater(l) : l) };
    persist(next);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    updateActive(l => {
      const oldIndex = l.widgets.findIndex(w => w.id === a.id);
      const newIndex = l.widgets.findIndex(w => w.id === over.id);
      return { ...l, widgets: arrayMove(l.widgets, oldIndex, newIndex) };
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

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-10">
      {/* Header */}
      <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {greet()}{usuario?.nome ? `, ${usuario.nome.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está seu Dashboard
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 rounded-lg border border-border/60 bg-surface-1/60 px-3 text-sm font-normal text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">{active.name}</span>
                <ChevronDown className="size-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {state.layouts.map(l => (
                <DropdownMenuItem key={l.id} onClick={() => persist({ ...state, activeId: l.id })} className="flex items-center justify-between">
                  <span>{l.name}</span>
                  {l.id === active.id && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                const name = window.prompt("Nome do novo dashboard:");
                if (!name) return;
                const id = name.toLowerCase().replace(/\s+/g, "-") + "-" + Math.random().toString(36).slice(2, 5);
                persist({ ...state, layouts: [...state.layouts, { id, name, widgets: [] }], activeId: id });
                setEditing(true);
                setPersonalizing(true);
              }}>
                <Plus className="mr-2 size-3.5" /> Novo layout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            onClick={() => setEditing(v => !v)}
            className={`h-9 gap-2 rounded-lg border px-3 text-sm font-normal transition ${editing ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15" : "border-border/60 bg-surface-1/60 text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`}
          >
            <Settings2 className="size-3.5" />
            <span className="hidden sm:inline">{editing ? "Concluir edição" : "Personalizar Dashboard"}</span>
          </Button>

          {editing && (
            <Button onClick={() => setPersonalizing(true)} className="h-9 gap-2 rounded-lg bg-primary px-3 text-sm text-primary-foreground hover:bg-primary-glow">
              <Plus className="size-3.5" /> <span className="hidden sm:inline">Widget</span>
            </Button>
          )}
        </div>
      </header>

      {/* Progresso do Mês — wide */}
      <ProgressoMesWide />

      {/* Sugestão do MakersHub — gerada a partir dos dados reais do comercial */}
      <SugestaoMakersHub />

      {/* Grid */}
      {active.widgets.length === 0 ? (
        <EmptyWorkspace onAdd={() => { setEditing(true); setPersonalizing(true); }} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={active.widgets.map(w => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-12 gap-4">
              {active.widgets.map(w => (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  editing={editing}
                  onRemove={() => removeWidget(w.id)}
                  onResize={s => resizeWidget(w.id, s)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <PersonalizeSheet
        open={personalizing}
        onOpenChange={setPersonalizing}
        widgets={active.widgets}
        onAdd={addWidget}
      />
    </div>
  );
}

function EmptyWorkspace({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 bg-surface-1/30 px-6 py-20 text-center">
      <Sparkles className="mb-3 size-6 text-primary" />
      <h3 className="font-display text-lg font-semibold tracking-tight">Seu workspace está vazio</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Adicione widgets para montar uma tela inicial do seu jeito. Comece pelos essenciais — você pode reorganizar a qualquer momento.
      </p>
      <Button onClick={onAdd} className="mt-5 h-9 gap-2 rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary-glow">
        <Plus className="size-3.5" /> Adicionar primeiro widget
      </Button>
    </div>
  );
}

function ProgressoMesWide() {
  const { lancamentos } = useFinanceiroSupa();
  const p = progressoMes(loadMetas(), lancamentos);

  const barPct = Math.min(100, p.atingiuMeta ? p.pctSuper : p.pctMeta);
  const labelPct = p.atingiuMeta ? p.pctSuper : p.pctMeta;
  const labelDe = p.atingiuMeta ? p.superMeta : p.meta;

  return (
    <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface-1/40 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-3 sm:w-64">
        <div className="grid size-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_20px_-4px_var(--primary)]">
          <TrendingUp className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Progresso do Mês</div>
          <div className="mt-0.5 font-display text-lg font-semibold tabular-nums text-foreground">
            {brl(p.realizado)}
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {brl(p.realizado)} <span className="opacity-60">de {brl(labelDe)}</span>
          </span>
          <span className="font-display text-sm font-semibold tabular-nums text-foreground">
            {labelPct.toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-3/80">
          <div
            className="h-full rounded-full bg-primary shadow-[0_0_14px_-2px_var(--primary)] transition-[width] duration-700 ease-out"
            style={{ width: `${barPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Dia {p.diaAtual} de {p.diasNoMes}</span>
          {p.atingiuSuper
            ? <span className="flex items-center gap-1 text-primary"><Trophy className="size-3" />Super Meta</span>
            : p.atingiuMeta
              ? <span className="text-primary">Rumo à Super Meta</span>
              : <span>Meta {brl(p.meta)}</span>}
        </div>
      </div>

    </section>
  );
}
