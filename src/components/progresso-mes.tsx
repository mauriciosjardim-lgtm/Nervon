import { useState } from "react";
import { TrendingUp, Target, Rocket, Trophy, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { loadMetas, progressoMes } from "@/lib/mock/metas";
import { useFinanceiroSupa } from "@/lib/hooks/useFinanceiro";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function ProgressoMes() {
  const [open, setOpen] = useState(false);
  const { lancamentos } = useFinanceiroSupa();
  const p = progressoMes(loadMetas(), lancamentos);

  // Barra: enquanto não atinge meta, mostra pctMeta; depois mostra pctSuper.
  const barPct = Math.min(100, p.atingiuMeta ? p.pctSuper : p.pctMeta);
  const labelPct = p.atingiuMeta ? p.pctSuper : p.pctMeta;
  const labelDe = p.atingiuMeta ? p.superMeta : p.meta;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Progresso do mês"
        className="group hidden h-9 w-[260px] items-center gap-3 rounded-lg border border-border/60 bg-surface-1/60 px-3 backdrop-blur-sm transition hover:border-primary/40 hover:bg-surface-2 lg:flex"
      >
        <TrendingUp className="size-3.5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Progresso do Mês</span>
            <span className="font-display text-[11px] font-semibold tabular-nums text-foreground">
              {labelPct.toFixed(0)}%
            </span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3/80">
            <div
              className="h-full rounded-full bg-primary shadow-[0_0_10px_-1px_var(--primary)] transition-[width] duration-700 ease-out"
              style={{ width: `${barPct}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="tabular-nums">{brl(p.realizado)} <span className="opacity-60">de {brl(labelDe)}</span></span>
            {p.atingiuSuper
              ? <span className="flex items-center gap-1 text-primary"><Trophy className="size-2.5" />Super Meta</span>
              : p.atingiuMeta
                ? <span className="text-primary">Rumo à Super Meta</span>
                : <span className="opacity-60">Meta {brl(p.meta)}</span>}
          </div>
        </div>
      </button>

      <ProgressoDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}

function ProgressoDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const { lancamentos } = useFinanceiroSupa();
  const p = progressoMes(loadMetas(), lancamentos);
  const barPct = Math.min(100, p.atingiuMeta ? p.pctSuper : p.pctMeta);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-border/60 bg-background/95 backdrop-blur-xl sm:max-w-md">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="size-3.5 text-primary" /> Progresso do Mês
          </div>
          <SheetTitle className="font-display text-3xl font-semibold tracking-tight">
            {brl(p.realizado)}
          </SheetTitle>
          <SheetDescription>
            {p.atingiuSuper
              ? "Super Meta alcançada neste mês."
              : p.atingiuMeta
                ? `Meta alcançada. Avançando em direção à Super Meta.`
                : `${(p.pctMeta).toFixed(1)}% da meta mensal.`}
          </SheetDescription>
        </SheetHeader>

        {/* Barra principal */}
        <div className="mt-6 space-y-3">
          <div className="relative h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary shadow-[0_0_14px_-2px_var(--primary)] transition-[width] duration-700 ease-out"
              style={{ width: `${barPct}%` }}
            />
            {/* Marcador da meta quando estamos avançando para a Super Meta */}
            {p.atingiuMeta && !p.atingiuSuper && p.superMeta > 0 && (
              <div
                className="absolute top-0 h-full w-px bg-foreground/30"
                style={{ left: `${(p.meta / p.superMeta) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Dia {p.diaAtual} de {p.diasNoMes}</span>
            <span className="tabular-nums">{(p.atingiuMeta ? p.pctSuper : p.pctMeta).toFixed(1)}%</span>
          </div>
        </div>

        {p.atingiuSuper && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.06] px-3 py-2 text-xs text-primary">
            <Trophy className="size-3.5" /> Super Meta alcançada neste mês.
          </div>
        )}

        {/* Grid de métricas */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Metric icon={Target}  label="Meta mensal"      value={brl(p.meta)} />
          <Metric icon={Rocket}  label="Super Meta"       value={brl(p.superMeta)} />
          <Metric             label="Valor realizado"  value={brl(p.realizado)} tone="positive" />
          <Metric             label="Valor restante"   value={brl(p.atingiuMeta ? p.restanteSuper : p.restanteMeta)} />
          <Metric             label="Projeção do mês"  value={brl(Math.round(p.projecao))} hint={p.projecao >= p.meta ? "Acima da meta" : "Abaixo da meta"} />
          <Metric             label="Mês anterior"     value={brl(p.mesAnterior)} />
        </div>

        {/* Crescimento */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-surface-1/60 px-4 py-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Crescimento vs. mês anterior</div>
            <div className="mt-0.5 font-display text-lg font-semibold tabular-nums">
              {p.crescimento >= 0 ? "+" : ""}{p.crescimento.toFixed(1)}%
            </div>
          </div>
          <div className={`grid size-9 place-items-center rounded-lg ${p.crescimento >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
            {p.crescimento >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
          </div>
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground/70">
          Os valores são alimentados pelo módulo Financeiro. Ajuste a Meta e a Super Meta em{" "}
          <span className="text-foreground">Configurações → Minha Produtora</span>.
        </p>
      </SheetContent>
    </Sheet>
  );
}

function Metric({
  icon: Icon, label, value, hint, tone,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string; value: string; hint?: string;
  tone?: "positive";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface-1/60 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="size-3" />} {label}
      </div>
      <div className={`mt-1 font-display text-base font-semibold tabular-nums ${tone === "positive" ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
