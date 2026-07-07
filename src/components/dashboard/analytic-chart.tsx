import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { useFinanceiroSupa } from "@/lib/hooks/useFinanceiro";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// Gráfico Faturamento × Custos — carregado sob demanda (recharts é pesado).
export default function AnalyticChart() {
  // Consolidado da empresa — não segue a carteira ativa do módulo Financeiro.
  const { lancamentos } = useFinanceiroSupa({ somenteEmpresa: true });
  const hoje = new Date();
  const [offset, setOffset] = useState(0);
  const refMes = subMonths(hoje, offset);

  const meses = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(refMes, 5 - i)));
  // Competência = vencimento (mesmo critério da página Financeiro), não data de pagamento —
  // senão um lançamento vencido em julho mas pago em junho aparece na curva do mês errado.
  const data = meses.map(mes => {
    const chave = format(mes, "yyyy-MM");
    return {
      mes: format(mes, "MMM", { locale: ptBR }),
      receita: lancamentos
        .filter(l => l.tipo === "receita" && l.status === "recebido" && l.vencimento.slice(0, 7) === chave)
        .reduce((s, l) => s + l.valor, 0),
      custo: lancamentos
        .filter(l => l.tipo === "despesa" && l.status === "pago" && l.vencimento.slice(0, 7) === chave)
        .reduce((s, l) => s + l.valor, 0),
    };
  });

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-1/70 p-4 sm:p-5">
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-sm font-semibold tracking-tight">Faturamento × Custos</p>
        <div className="flex w-full items-center justify-between gap-1 rounded-lg border border-border bg-surface-2/60 px-1 sm:w-auto">
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
      <div className="h-[170px] sm:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
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
      </div>
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
