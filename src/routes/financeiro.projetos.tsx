import { createFileRoute } from "@tanstack/react-router";
import { Kanban, TrendUp, TrendDown, PercentageSquare } from "iconsax-react";
import { porProjeto, fmtBRL } from "@/lib/mock/financeiro";
import { useFinanceiroSupa } from "@/lib/hooks/useFinanceiro";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financeiro/projetos")({
  component: PorProjetoPage,
});

function PorProjetoPage() {
  const { lancamentos } = useFinanceiroSupa();
  const linhas = porProjeto(lancamentos);

  const totalRec = linhas.reduce((s, l) => s + l.receita, 0);
  const totalDesp = linhas.reduce((s, l) => s + l.despesa, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-1/60 p-4">
        <div className="grid size-9 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
          <Kanban size={16} color="currentColor" variant="Linear" className="text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Rentabilidade</p>
          <p className="font-display text-base font-semibold">Resultado por projeto</p>
        </div>
        <div className="ml-auto flex gap-4 text-xs">
          <span className="flex items-center gap-1.5"><TrendUp size={12} color="currentColor" variant="Linear" className="text-primary" /> Receita: <strong className="tabular-nums text-foreground">{fmtBRL(totalRec)}</strong></span>
          <span className="flex items-center gap-1.5"><TrendDown size={12} color="currentColor" variant="Linear" className="text-primary" /> Despesa: <strong className="tabular-nums text-foreground">{fmtBRL(totalDesp)}</strong></span>
          <span>Saldo: <strong className={`tabular-nums ${totalRec - totalDesp >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(totalRec - totalDesp)}</strong></span>
        </div>
      </div>

      {linhas.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface-1/40 p-10 text-center text-sm text-muted-foreground">
          Nenhum projeto com lançamentos ainda.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {linhas.map(p => (
            <div key={p.nome} className="overflow-hidden rounded-xl border border-border bg-surface-1/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold">{p.nome}</p>
                  {p.cliente && <p className="truncate text-xs text-muted-foreground">{p.cliente}</p>}
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  p.margem >= 30 ? "border-success/30 bg-success/10 text-success" :
                  p.margem >= 0 ? "border-warning/30 bg-warning/10 text-warning" :
                  "border-destructive/30 bg-destructive/10 text-destructive",
                )}>
                  <PercentageSquare size={12} color="currentColor" variant="Linear" />
                  {p.margem.toFixed(1)}%
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg border border-border bg-surface-2/40 p-2.5">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <TrendUp size={12} color="currentColor" variant="Linear" className="text-primary" /> Receita
                  </p>
                  <p className="mt-1 font-display text-sm font-semibold tabular-nums">{fmtBRL(p.receita)}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2/40 p-2.5">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <TrendDown size={12} color="currentColor" variant="Linear" className="text-primary" /> Despesa
                  </p>
                  <p className="mt-1 font-display text-sm font-semibold tabular-nums">{fmtBRL(p.despesa)}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2/40 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Saldo</p>
                  <p className={cn("mt-1 font-display text-sm font-semibold tabular-nums",
                    p.saldo >= 0 ? "text-success" : "text-destructive")}>
                    {fmtBRL(p.saldo)}
                  </p>
                </div>
              </div>

              {/* Barra visual de margem */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    p.margem >= 30 ? "bg-success" : p.margem >= 0 ? "bg-warning" : "bg-destructive",
                  )}
                  style={{ width: `${Math.max(2, Math.min(100, p.margem))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
