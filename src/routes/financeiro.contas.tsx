import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { TickCircle, Danger, Clock, TrendUp, TrendDown } from "iconsax-react";
import type { Icon as IconsaxIcon } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/financeiro/status-badge";
import { fmtBRL, fmtData, type Lancamento, type LancTipo } from "@/lib/mock/financeiro";
import { useFinanceiroSupa, financeiroActions } from "@/lib/hooks/useFinanceiro";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financeiro/contas")({
  component: ContasPage,
});

function ContasPage() {
  const [aba, setAba] = useState<LancTipo>("receita");
  const { lancamentos } = useFinanceiroSupa();

  return (
    <Tabs value={aba} onValueChange={(v) => setAba(v as LancTipo)} className="space-y-4">
      <TabsList className="bg-surface-1">
        <TabsTrigger value="receita" className="gap-1.5">
          <ArrowDownToLine className="size-3.5 text-primary" /> A receber
        </TabsTrigger>
        <TabsTrigger value="despesa" className="gap-1.5">
          <ArrowUpFromLine className="size-3.5 text-primary" /> A pagar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="receita" className="mt-0">
        <ListaContas tipo="receita" lancamentos={lancamentos} />
      </TabsContent>
      <TabsContent value="despesa" className="mt-0">
        <ListaContas tipo="despesa" lancamentos={lancamentos} />
      </TabsContent>
    </Tabs>
  );
}

function ListaContas({ tipo, lancamentos }: { tipo: LancTipo; lancamentos: Lancamento[] }) {
  const grupos = useMemo(() => agrupar(lancamentos.filter(l => l.tipo === tipo)), [lancamentos, tipo]);

  const totalAbertos = grupos.atrasados.reduce((s, l) => s + l.valor, 0)
    + grupos.hoje.reduce((s, l) => s + l.valor, 0)
    + grupos.semana.reduce((s, l) => s + l.valor, 0)
    + grupos.depois.reduce((s, l) => s + l.valor, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-1/60 p-4">
        <div className="grid size-9 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
          {tipo === "receita" ? <TrendUp size={16} color="currentColor" variant="Linear" className="text-primary" /> : <TrendDown size={16} color="currentColor" variant="Linear" className="text-primary" />}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Total {tipo === "receita" ? "a receber" : "a pagar"} · todo o período
          </p>
          <p className="font-display text-2xl font-semibold tabular-nums">{fmtBRL(totalAbertos)}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-3 text-xs">
          <Pill icon={Danger} tone="destructive" label="Atrasados" valor={grupos.atrasados.reduce((s, l) => s + l.valor, 0)} qtd={grupos.atrasados.length} />
          <Pill icon={Clock} tone="warning" label="Hoje" valor={grupos.hoje.reduce((s, l) => s + l.valor, 0)} qtd={grupos.hoje.length} />
          <Pill icon={Clock} tone="info" label="7 dias" valor={grupos.semana.reduce((s, l) => s + l.valor, 0)} qtd={grupos.semana.length} />
        </div>
      </div>

      <Bucket
        title="Atrasados" icon={Danger} tone="destructive"
        items={grupos.atrasados} tipo={tipo}
      />
      <Bucket
        title="Vencem hoje" icon={Clock} tone="warning"
        items={grupos.hoje} tipo={tipo}
      />
      <Bucket
        title="Próximos 7 dias" icon={Clock} tone="info"
        items={grupos.semana} tipo={tipo}
      />
      <Bucket
        title="Mais à frente" icon={Clock} tone="muted"
        items={grupos.depois} tipo={tipo}
      />
      <Bucket
        title={tipo === "receita" ? "Já recebidos" : "Já pagos"} icon={TickCircle} tone="success"
        items={grupos.quitados} tipo={tipo} collapsedDefault
      />
    </div>
  );
}

function agrupar(lancs: Lancamento[]) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const fim7 = new Date(hoje); fim7.setDate(fim7.getDate() + 7);
  const atrasados: Lancamento[] = [], hojeArr: Lancamento[] = [], semana: Lancamento[] = [], depois: Lancamento[] = [], quitados: Lancamento[] = [];
  for (const l of lancs.sort((a, b) => a.vencimento.localeCompare(b.vencimento))) {
    if (l.pagamentoEm) { quitados.push(l); continue; }
    // slice(0,10)+T12:00 evita o bug de meia-noite UTC virar dia anterior no fuso BR
    const v = new Date(l.vencimento.slice(0, 10) + "T12:00:00"); v.setHours(0, 0, 0, 0);
    if (v.getTime() < hoje.getTime()) atrasados.push(l);
    else if (v.getTime() === hoje.getTime()) hojeArr.push(l);
    else if (v <= fim7) semana.push(l);
    else depois.push(l);
  }
  return { atrasados, hoje: hojeArr, semana, depois, quitados };
}

function Pill({ icon: Icon, tone, label, valor, qtd }: {
  icon: typeof IconsaxIcon; tone: "destructive" | "warning" | "info" | "success" | "muted"; label: string; valor: number; qtd: number;
}) {
  const toneCls = {
    destructive: "text-destructive bg-destructive/10 border-destructive/30",
    warning: "text-warning bg-warning/10 border-warning/30",
    info: "text-info bg-info/10 border-info/30",
    success: "text-success bg-success/10 border-success/30",
    muted: "text-muted-foreground bg-surface-2 border-border",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1", toneCls)}>
      <Icon size={12} color="currentColor" variant="Linear" />
      <span className="font-medium">{label}</span>
      <span className="tabular-nums opacity-80">({qtd}) {fmtBRL(valor)}</span>
    </span>
  );
}

function Bucket({
  title, icon: Icon, tone, items, tipo, collapsedDefault = false,
}: {
  title: string; icon: typeof IconsaxIcon;
  tone: "destructive" | "warning" | "info" | "success" | "muted";
  items: Lancamento[]; tipo: LancTipo; collapsedDefault?: boolean;
}) {
  const [open, setOpen] = useState(!collapsedDefault);
  if (items.length === 0) return null;
  const total = items.reduce((s, l) => s + l.valor, 0);
  const toneCls = {
    destructive: "text-destructive bg-destructive/10 ring-destructive/30",
    warning: "text-warning bg-warning/10 ring-warning/30",
    info: "text-info bg-info/10 ring-info/30",
    success: "text-success bg-success/10 ring-success/30",
    muted: "text-muted-foreground bg-surface-2 ring-border",
  }[tone];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-1/40">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 bg-surface-2/40 px-4 py-2.5 transition hover:bg-surface-2"
      >
        <div className="flex items-center gap-2">
          <span className={cn("grid size-7 place-items-center rounded-lg ring-1", toneCls)}>
            <Icon size={14} color="currentColor" variant="Linear" />
          </span>
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        <span className="font-display text-sm font-semibold tabular-nums">{fmtBRL(total)}</span>
      </button>
      {open && (
        <ul className="divide-y divide-border">
          {items.map(l => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.descricao}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {l.categoria}{l.cliente ? ` · ${l.cliente}` : ""}{l.projeto ? ` · ${l.projeto}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-muted-foreground">{l.pagamentoEm ? `pago ${fmtData(l.pagamentoEm)}` : fmtData(l.vencimento)}</span>
                <span className="font-display text-sm font-semibold tabular-nums">{fmtBRL(l.valor)}</span>
                <StatusBadge status={l.status} />
                {l.pagamentoEm ? (
                  <Button
                    size="sm" variant="ghost" className="h-7 gap-1 text-xs"
                    onClick={() => { financeiroActions.desfazerPago(l.id); toast.success("Pagamento desfeito."); }}
                  >
                    Desfazer
                  </Button>
                ) : (
                  <Button
                    size="sm" className="h-7 gap-1 text-xs"
                    onClick={() => { financeiroActions.marcarPago(l.id); toast.success(tipo === "receita" ? "Recebido!" : "Pago!"); }}
                  >
                    <TickCircle size={12} color="currentColor" variant="Linear" className="text-primary-foreground" />
                    {tipo === "receita" ? "Recebi" : "Paguei"}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
