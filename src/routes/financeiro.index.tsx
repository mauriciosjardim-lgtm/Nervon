import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Percent, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Plus, Calendar,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/financeiro/kpi-card";
import { NovoLancamentoModal } from "@/components/financeiro/novo-lancamento-modal";
import { StatusBadge } from "@/components/financeiro/status-badge";
import {
  calcularMetricas, serieMensal, porCategoria, fmtBRL, fmtData,
} from "@/lib/mock/financeiro";
import { useFinanceiroSupa } from "@/lib/hooks/useFinanceiro";

export const Route = createFileRoute("/financeiro/")({
  component: FinanceiroDashboard,
});

function FinanceiroDashboard() {
  const { lancamentos } = useFinanceiroSupa();
  const m = calcularMetricas(lancamentos);
  const serie = serieMensal(lancamentos);
  const catDespesa = porCategoria(lancamentos, "despesa").slice(0, 6);
  const [novoOpen, setNovoOpen] = useState(false);
  const [tipoInicial, setTipoInicial] = useState<"receita" | "despesa">("receita");

  // Próximos vencimentos (7 dias) e atrasados
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const proximos = lancamentos
    .filter(l => l.status === "previsto" || l.status === "atrasado")
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
    .slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Ações */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="lg"
          onClick={() => { setTipoInicial("receita"); setNovoOpen(true); }}
          className="h-11 gap-2 px-5 shadow-[0_10px_30px_-12px_var(--primary)] hover:shadow-[0_14px_36px_-12px_var(--primary)]"
        >
          <Plus className="size-5 text-primary-foreground" />
          Nova receita
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => { setTipoInicial("despesa"); setNovoOpen(true); }}
          className="h-11 gap-2 px-5"
        >
          <Plus className="size-5 text-primary" />
          Nova despesa
        </Button>
        <p className="text-xs text-muted-foreground">
          Registre o quanto antes — o caixa só responde ao que está no sistema.
        </p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={ArrowUpRight} label="Recebido" value={fmtBRL(m.recebido)}
          hint={`${fmtBRL(m.aReceber)} a receber`} tone="positive"
        />
        <KpiCard
          icon={ArrowDownRight} label="Pago" value={fmtBRL(m.pago)}
          hint={`${fmtBRL(m.aPagar)} a pagar`} tone="negative"
        />
        <KpiCard
          icon={Wallet} label="Saldo realizado" value={fmtBRL(m.saldoRealizado)}
          hint={`Previsto: ${fmtBRL(m.saldoPrevisto)}`}
          tone={m.saldoRealizado >= 0 ? "positive" : "negative"}
        />
        <KpiCard
          icon={Percent} label="Margem realizada" value={`${m.margemRealizada.toFixed(1)}%`}
          hint={m.recebido ? "sobre o recebido" : "sem receita ainda"}
        />
      </div>

      {/* Alertas de atraso */}
      {(m.atrasadoReceber > 0 || m.atrasadoPagar > 0) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
          <span className="grid size-8 place-items-center rounded-lg bg-destructive/15 ring-1 ring-destructive/30">
            <AlertTriangle className="size-4 text-destructive" />
          </span>
          <div className="text-sm">
            <p className="font-medium text-foreground">Você tem atrasos para resolver.</p>
            <p className="text-xs text-muted-foreground">
              {m.atrasadoReceber > 0 && <>A receber em atraso: <strong className="text-destructive">{fmtBRL(m.atrasadoReceber)}</strong>. </>}
              {m.atrasadoPagar > 0 && <>A pagar em atraso: <strong className="text-destructive">{fmtBRL(m.atrasadoPagar)}</strong>.</>}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Receita vs Despesa 6m */}
        <div className="rounded-xl border border-border bg-surface-1/60 p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Últimos 6 meses</p>
              <h3 className="font-display text-base font-semibold">Receita vs Despesa</h3>
            </div>
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <TrendingUp className="size-3.5 text-primary" />
            </span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="recColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="despColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => fmtBRL(v)}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" name="Receita" dataKey="receita" stroke="var(--primary)" strokeWidth={2} fill="url(#recColor)" />
                <Area type="monotone" name="Despesa" dataKey="despesa" stroke="var(--destructive)" strokeWidth={2} fill="url(#despColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categoria de despesa */}
        <div className="rounded-xl border border-border bg-surface-1/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Onde sai o dinheiro</p>
              <h3 className="font-display text-base font-semibold">Despesa por categoria</h3>
            </div>
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <TrendingDown className="size-3.5 text-primary" />
            </span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catDespesa} layout="vertical" margin={{ top: 6, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="categoria" type="category" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => fmtBRL(v)}
                />
                <Bar dataKey="valor" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Próximos vencimentos */}
      <div className="rounded-xl border border-border bg-surface-1/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Calendar className="size-3.5 text-primary" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Próximos dias</p>
              <h3 className="font-display text-base font-semibold">Vencimentos pendentes</h3>
            </div>
          </div>
        </div>
        {proximos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nada pendente. Caixa em dia.</p>
        ) : (
          <ul className="divide-y divide-border">
            {proximos.map(l => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`grid size-8 place-items-center rounded-lg ring-1 ${l.tipo === "receita" ? "bg-success/10 ring-success/30" : "bg-destructive/10 ring-destructive/30"}`}>
                    {l.tipo === "receita"
                      ? <TrendingUp className="size-3.5 text-success" />
                      : <TrendingDown className="size-3.5 text-destructive" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.descricao}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.categoria}{l.cliente ? ` · ${l.cliente}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted-foreground">{fmtData(l.vencimento)}</span>
                  <span className="font-display text-sm font-semibold tabular-nums">{fmtBRL(l.valor)}</span>
                  <StatusBadge status={l.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <NovoLancamentoModal open={novoOpen} onOpenChange={setNovoOpen} tipoInicial={tipoInicial} />
    </div>
  );
}
