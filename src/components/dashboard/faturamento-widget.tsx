import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFinanceiroSupa } from "@/lib/hooks/useFinanceiro";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function FaturamentoWidget() {
  // Consolidado da empresa — não segue a carteira ativa do módulo Financeiro.
  const { lancamentos } = useFinanceiroSupa({ somenteEmpresa: true });
  const hoje = new Date();
  const data = Array.from({ length: 6 }, (_, i) => {
    const mes = startOfMonth(subMonths(hoje, 5 - i));
    const chave = format(mes, "yyyy-MM");
    const receitas = lancamentos
      .filter((l) => l.tipo === "receita" && l.status === "recebido" && l.vencimento.slice(0, 7) === chave)
      .reduce((s, l) => s + l.valor, 0);
    const custos = lancamentos
      .filter((l) => l.tipo === "despesa" && l.status === "pago" && l.vencimento.slice(0, 7) === chave)
      .reduce((s, l) => s + l.valor, 0);
    return { semana: format(mes, "MMM", { locale: ptBR }), faturamento: receitas, custos };
  });

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Faturamento × Custos
        </div>
        <div className="text-[11px] text-muted-foreground/70">Últimos 6 meses</div>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="semana"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 12,
              }}
              formatter={(v: number) => brl(v)}
            />
            <Area
              type="monotone"
              dataKey="faturamento"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#gFat)"
            />
            <Area
              type="monotone"
              dataKey="custos"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              fill="transparent"
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
