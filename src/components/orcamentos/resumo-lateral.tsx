import { useMemo } from "react";
import { Activity, TrendingUp, Coins, Wallet } from "lucide-react";
import { calcular, fmtBRL, type OrcamentoPayload } from "@/lib/mock/orcamentos";
import { useCustos } from "@/lib/mock/custos";

export function ResumoLateral({
  payload, onMargemChange,
}: { payload: OrcamentoPayload; onMargemChange: (v: number) => void }) {
  const custos = useCustos();
  const calc = useMemo(() => calcular(payload, custos), [payload, custos]);

  return (
    <aside className="sticky top-5 flex flex-col gap-3 rounded-2xl border border-border/60 bg-gradient-to-b from-surface-1/80 to-surface-1/30 p-5 shadow-[var(--shadow-card)] backdrop-blur-sm">
      <header className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
          <Activity className="size-3.5 text-primary" />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Em tempo real</p>
      </header>

      <Bloco icon={Coins}     label="Custo operacional" value={fmtBRL(calc.custoOperacional)} tone="muted" />
      <BlocoMargem value={calc.margem} onChange={onMargemChange} />
      <Bloco icon={Wallet}     label="Preço sugerido"     value={fmtBRL(calc.precoSugerido)}    tone="primary" big />
      <Bloco icon={TrendingUp} label="Lucro estimado"    value={fmtBRL(calc.lucroEstimado)}   tone="success" />

      <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border/40 bg-background/30 p-3 text-[11px]">
        <p className="mb-2 font-semibold uppercase tracking-wider text-muted-foreground">Itens ({calc.itens.length})</p>
        {calc.itens.length === 0 && <p className="text-muted-foreground">Preencha o orçamento para ver os itens.</p>}
        <ul className="space-y-1.5">
          {calc.itens.map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-foreground/80">
              <span className="truncate"><span className="text-muted-foreground">{it.qtd}× </span>{it.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{fmtBRL(it.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function Bloco({ icon: Icon, label, value, tone, big = false }: { icon: any; label: string; value: string; tone: "muted" | "primary" | "success"; big?: boolean }) {
  const color = tone === "primary" ? "text-primary" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={`font-display ${big ? "text-xl" : "text-base"} font-semibold tabular-nums tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function BlocoMargem({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Margem</p>
        <p className="font-display text-base font-semibold tabular-nums text-primary">{value}%</p>
      </div>
      <input
        type="range" min={0} max={80} step={5}
        value={value} onChange={e => onChange(Number(e.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-primary"
      />
    </div>
  );
}
