import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { Lancamento } from "@/lib/mock/financeiro";
import { serieMensal } from "@/lib/mock/financeiro";

const brl = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export function RevenueChartV3({ lancamentos }: { lancamentos: Lancamento[] }) {
  const data = serieMensal(lancamentos);

  return (
    <div className="h-[240px] min-w-0 sm:h-[270px] xl:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="dashboard-v3-receita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.48} />
              <stop offset="48%" stopColor="var(--primary)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="color-mix(in oklch, var(--foreground) 7%, transparent)"
            strokeDasharray="3 7"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            dy={7}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
            contentStyle={{
              background: "color-mix(in oklch, var(--surface-2) 92%, transparent)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 18px 45px rgba(0,0,0,.32)",
              fontSize: 11,
              backdropFilter: "blur(18px)",
            }}
            labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
            formatter={(valor: number, nome: string) => [
              brl(valor),
              nome === "receita" ? "Receita" : "Custos",
            ]}
          />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="var(--primary)"
            strokeWidth={3}
            fill="url(#dashboard-v3-receita)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "var(--background)",
              stroke: "var(--primary)",
              strokeWidth: 3,
            }}
          />
          <Area
            type="monotone"
            dataKey="despesa"
            stroke="var(--muted-foreground)"
            strokeWidth={1.5}
            strokeOpacity={0.55}
            strokeDasharray="5 6"
            fill="transparent"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
