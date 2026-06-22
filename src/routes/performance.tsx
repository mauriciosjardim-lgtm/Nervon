import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  TrendingUp, TrendingDown, Target, DollarSign, Briefcase, Users,
  Activity, Brain, AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import {
  useVisaoGeral, usePerformanceComercial, usePerformanceProducao,
  usePerformanceFinanceiro, usePerformanceClientes, usePerformanceEquipe,
  usePerformanceCrescimento, useInsights, fmtBRL, type Insight,
} from "@/lib/mock/performance";

export const Route = createFileRoute("/performance")({
  ssr: false,
  head: () => ({ meta: [{ title: "Performance — MakersHub" }] }),
  component: PerformancePage,
});

const TABS = [
  { id: "geral", label: "Visão Geral" },
  { id: "comercial", label: "Comercial" },
  { id: "producao", label: "Produção" },
  { id: "financeiro", label: "Financeiro" },
  { id: "clientes", label: "Clientes" },
  { id: "equipe", label: "Equipe" },
  { id: "crescimento", label: "Crescimento" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function PerformancePage() {
  const [tab, setTab] = useState<TabId>("geral");

  return (
    <div className="flex flex-col gap-6 p-5 md:p-7">
      <header>
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <TrendingUp className="size-3.5 text-primary" /> Performance
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Centro Estratégico
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estou crescendo? Estou lucrando? Minha operação está saudável?
        </p>
      </header>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-border/60 bg-surface-1/40 p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "geral" && <TabGeral />}
      {tab === "comercial" && <TabComercial />}
      {tab === "producao" && <TabProducao />}
      {tab === "financeiro" && <TabFinanceiro />}
      {tab === "clientes" && <TabClientes />}
      {tab === "equipe" && <TabEquipe />}
      {tab === "crescimento" && <TabCrescimento />}
    </div>
  );
}

/* ============ Cards ============ */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border/60 bg-surface-1/60 p-5 ${className}`}>
      {children}
    </div>
  );
}

function KPI({ label, value, hint, icon: Icon }: {
  label: string; value: string; hint?: string; icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3 text-primary" /> {label}
      </div>
      <div className="font-display text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function Delta({ pct }: { pct: number }) {
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-primary" : "text-destructive"}`}>
      <Icon className="size-3" />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

/* ============ Visão Geral ============ */
function TabGeral() {
  const vg = useVisaoGeral();
  const insights = useInsights();

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPI label="Receita do Mês" value={fmtBRL(vg.receitaMes)} icon={DollarSign} />
          <KPI label="Lucro" value={fmtBRL(vg.lucroMes)} hint={`${vg.margemMes.toFixed(1)}% margem`} icon={TrendingUp} />
          <KPI label="Projetos Ativos" value={String(vg.projetosAtivos)} hint={`${vg.projetosCriticos} críticos`} icon={Briefcase} />
          <KPI label="Clientes Ativos" value={String(vg.clientesAtivos)} icon={Users} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="size-3 text-primary" /> Meta do mês
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-semibold tabular-nums">{vg.pctMeta.toFixed(0)}%</span>
              <span className="text-xs text-muted-foreground">{fmtBRL(vg.receitaMes)} / {fmtBRL(vg.meta)}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, vg.pctMeta)}%` }} />
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Activity className="size-3 text-primary" /> Conversão Comercial
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-semibold tabular-nums">{vg.taxaConversao.toFixed(0)}%</span>
              <span className="text-xs text-muted-foreground">Ticket {fmtBRL(vg.ticketMedio)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Receita recorrente: {fmtBRL(vg.receitaRecorrente)}</p>
          </Card>
        </div>
      </div>

      <div className="space-y-5">
        <Card>
          <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="size-3 text-primary" /> Saúde da Empresa
          </div>
          <Gauge value={vg.saudeEmpresa} />
          <div className="mt-4 space-y-2 text-xs">
            <SaudeRow label="Financeira" value={vg.saudeFinanceira} />
            <SaudeRow label="Operacional" value={vg.saudeOperacional} />
            <SaudeRow label="Comercial" value={vg.saudeComercial} />
            <SaudeRow label="Meta" value={vg.saudeMeta} />
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Brain className="size-3 text-primary" /> MakersHub Insights
          </div>
          <div className="space-y-2">
            {insights.length === 0 && (
              <p className="rounded-lg border border-border/40 bg-background/40 p-3 text-xs text-muted-foreground">
                Comece a usar o MakersHub — cadastre leads, projetos e lançamentos — e os insights reais aparecem aqui.
              </p>
            )}
            {insights.map(i => <InsightRow key={i.id} insight={i} />)}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 56, c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  const color = value >= 70 ? "hsl(var(--primary))" : value >= 40 ? "#eab308" : "hsl(var(--destructive))";
  return (
    <div className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} stroke="hsl(var(--border))" strokeWidth="10" fill="none" />
        <circle cx="70" cy="70" r={r} stroke={color} strokeWidth="10" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold tabular-nums">{value}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">de 100</span>
      </div>
    </div>
  );
}

function SaudeRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="w-8 text-right tabular-nums">{Math.round(value)}</span>
    </div>
  );
}

function InsightRow({ insight }: { insight: Insight }) {
  const Icon = insight.tipo === "positivo" ? CheckCircle2 : insight.tipo === "alerta" ? AlertTriangle : Info;
  const color = insight.tipo === "positivo" ? "text-primary" : insight.tipo === "alerta" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="flex gap-2 rounded-lg border border-border/40 bg-background/40 p-3">
      <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} />
      <div>
        <div className="text-sm font-medium">{insight.titulo}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{insight.descricao}</div>
      </div>
    </div>
  );
}

/* ============ Comercial ============ */
function TabComercial() {
  const c = usePerformanceComercial();
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Novos Leads" value={String(c.novos)} icon={Users} />
        <KPI label="Conversão" value={`${c.conversao.toFixed(0)}%`} hint={`${c.ganhos} ganhos / ${c.perdidos} perdidos`} icon={Activity} />
        <KPI label="Ticket Médio" value={fmtBRL(c.ticketMedio)} icon={DollarSign} />
        <KPI label="Em Negociação" value={fmtBRL(c.emNegociacao)} hint={`${c.tempoMedioFechamento}d fechamento médio`} icon={Briefcase} />
      </div>

      <Card>
        <div className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Funil Comercial</div>
        <div className="space-y-2">
          {c.etapas.map((e, i) => {
            const max = Math.max(...c.etapas.map(x => x.qtd), 1);
            const w = (e.qtd / max) * 100;
            return (
              <div key={e.id} className="flex items-center gap-3">
                <span className="w-28 text-xs text-muted-foreground">{e.label}</span>
                <div className="h-7 flex-1 overflow-hidden rounded-md bg-surface-2">
                  <div className="flex h-full items-center justify-end bg-primary/80 px-2 text-xs font-medium text-primary-foreground transition-all"
                    style={{ width: `${Math.max(8, w)}%`, opacity: 1 - i * 0.08 }}>
                    {e.qtd}
                  </div>
                </div>
                <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">{fmtBRL(e.valor)}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ============ Produção ============ */
function TabProducao() {
  const p = usePerformanceProducao();
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Projetos Ativos" value={String(p.ativos)} icon={Briefcase} />
        <KPI label="Concluídos" value={String(p.concluidos)} icon={CheckCircle2} />
        <KPI label="Atrasados" value={String(p.atrasados)} icon={AlertTriangle} />
        <KPI label="Tempo Médio" value={`${p.tempoMedioEntrega}d`} hint={`${p.mediaRevisoes} revisões em média`} icon={Activity} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <KPI label="Tarefas Concluídas" value={String(p.tarefasConcluidas)} icon={CheckCircle2} />
        <KPI label="Tarefas Pendentes" value={String(p.tarefasPendentes)} icon={Info} />
      </div>

      <Card>
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Carga por colaborador</div>
        <div className="space-y-2">
          {p.colaboradores.length === 0 && <p className="text-sm text-muted-foreground">Sem dados.</p>}
          {p.colaboradores.map(c => (
            <div key={c.nome} className="flex items-center gap-3">
              <span className="w-32 text-sm">{c.nome}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, c.qtd * 20)}%` }} />
              </div>
              <span className="w-10 text-right text-xs tabular-nums">{c.qtd}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============ Financeiro ============ */
function TabFinanceiro() {
  const f = usePerformanceFinanceiro();
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Recebido" value={fmtBRL(f.recebido)} icon={DollarSign} />
        <KPI label="A Receber" value={fmtBRL(f.aReceber)} hint={`${fmtBRL(f.atrasadoReceber)} atrasado`} icon={Activity} />
        <KPI label="Pago" value={fmtBRL(f.pago)} icon={TrendingDown} />
        <KPI label="Saldo" value={fmtBRL(f.saldoRealizado)} hint={`${f.margemRealizada.toFixed(1)}% margem`} icon={TrendingUp} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPI label="Receita Recorrente" value={fmtBRL(f.receitaRecorrente)} hint="estimativa" icon={DollarSign} />
        <KPI label="A Pagar" value={fmtBRL(f.aPagar)} hint={`${fmtBRL(f.atrasadoPagar)} atrasado`} icon={Info} />
        <KPI label="Saldo Previsto" value={fmtBRL(f.saldoPrevisto)} icon={Activity} />
      </div>
    </div>
  );
}

/* ============ Clientes ============ */
function TabClientes() {
  const c = usePerformanceClientes();
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <KPI label="Total de Clientes" value={String(c.total)} icon={Users} />
        <KPI label="Sem Contato 60d+" value={String(c.semContato)} icon={AlertTriangle} />
        <KPI label="Relacionamento Médio" value={`${c.tempoMedioRelacionamento}m`} icon={Activity} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Top por Receita</div>
          <div className="space-y-2">
            {c.porReceita.slice(0, 5).map(cl => (
              <div key={cl.nome} className="flex items-center justify-between text-sm">
                <span>{cl.nome}</span>
                <span className="tabular-nums text-muted-foreground">{fmtBRL(cl.receita)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Top por Lucro</div>
          <div className="space-y-2">
            {c.porLucro.slice(0, 5).map(cl => (
              <div key={cl.nome} className="flex items-center justify-between text-sm">
                <span>{cl.nome}</span>
                <span className={`tabular-nums ${cl.lucro >= 0 ? "text-primary" : "text-destructive"}`}>{fmtBRL(cl.lucro)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============ Equipe ============ */
function TabEquipe() {
  const e = usePerformanceEquipe();
  return (
    <Card>
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Performance da Equipe</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-xs text-muted-foreground">
              <th className="py-2">Colaborador</th>
              <th className="py-2 text-right">Projetos</th>
              <th className="py-2 text-right">Tarefas concluídas</th>
              <th className="py-2 text-right">Pendentes</th>
            </tr>
          </thead>
          <tbody>
            {e.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">Sem dados.</td></tr>}
            {e.map(p => (
              <tr key={p.nome} className="border-b border-border/20">
                <td className="py-2">{p.nome}</td>
                <td className="py-2 text-right tabular-nums">{p.projetos}</td>
                <td className="py-2 text-right tabular-nums text-primary">{p.tarefasFeitas}</td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">{p.tarefasPendentes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ============ Crescimento ============ */
function TabCrescimento() {
  const c = usePerformanceCrescimento();
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ComparativoCard label="Receita" atual={fmtBRL(c.receita.atual)} pct={c.receita.deltaPct} />
        <ComparativoCard label="Lucro" atual={fmtBRL(c.lucro.atual)} pct={c.lucro.deltaPct} />
        <ComparativoCard label="Clientes" atual={String(c.clientes.atual)} pct={c.clientes.deltaPct} />
        <ComparativoCard label="Projetos" atual={String(c.projetos.atual)} pct={c.projetos.deltaPct} />
      </div>

      <Card>
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Receita — últimos 6 meses</div>
        <Sparkline data={c.serie.map(s => s.receita)} labels={c.serie.map(s => s.mes)} />
      </Card>

      <Card>
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lucro — últimos 6 meses</div>
        <Sparkline data={c.serie.map(s => s.lucro)} labels={c.serie.map(s => s.mes)} />
      </Card>
    </div>
  );
}

function ComparativoCard({ label, atual, pct }: { label: string; atual: string; pct: number }) {
  return (
    <Card>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-2xl font-semibold tabular-nums">{atual}</span>
        <Delta pct={pct} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">vs mês anterior</p>
    </Card>
  );
}

function Sparkline({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 600, h = 120, pad = 20;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const step = (w - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const path = points.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${points.at(-1)![0]},${h - pad} L${points[0][0]},${h - pad} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
        <path d={area} fill="hsl(var(--primary))" fillOpacity="0.12" />
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="hsl(var(--primary))" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}
