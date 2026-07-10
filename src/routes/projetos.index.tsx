import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Add, Calendar, Clock, Profile2User, SearchNormal } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjetoModal } from "@/components/projetos/projeto-modal";
import { CentralAtencao } from "@/components/projetos/central-atencao";
import { FASES, type FaseProjeto, type Projeto, type Tarefa } from "@/lib/mock/projetos";
import { useProjetos, projetosActions } from "@/lib/hooks/useProjetos";
import { calcularResumoProgresso, SAUDE_ESTILO } from "@/lib/projetos/progresso";
import { consumeCreate } from "@/lib/pendingCreate";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projetos/")({ component: ProjetosPage });

type Visao = "pipeline" | "semana" | "lista";
const ORDEM_FASES: FaseProjeto[] = ["briefing", "pre", "captacao", "edicao", "revisao", "entrega", "concluido", "pausado"];
const CORES_CLIENTE = ["#90F826", "#66B8FF", "#BD8CFF", "#F0B34B", "#FF737A", "#46D6B1", "#FF8FD1", "#8AA2FF"];

function corCliente(nome: string) {
  let hash = 0;
  for (const c of nome) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return CORES_CLIENTE[hash % CORES_CLIENTE.length];
}

function iniciais(nome: string) {
  return nome.split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

function ProjetosPage() {
  const { projetos, tarefas, marcos, entregaveis } = useProjetos();
  const navigate = useNavigate();
  const [visao, setVisao] = useState<Visao>("semana");
  const [cliente, setCliente] = useState("todos");
  const [responsavel, setResponsavel] = useState("todos");
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);

  useEffect(() => {
    if (consumeCreate("projeto")) { setModal(true); return; }
    const abrir = (e: Event) => { if ((e as CustomEvent).detail === "projeto") setModal(true); };
    window.addEventListener("nervon:criar", abrir);
    return () => window.removeEventListener("nervon:criar", abrir);
  }, []);

  const clientes = useMemo(() => [...new Set(projetos.map(p => p.cliente))].sort(), [projetos]);
  const equipe = useMemo(() => [...new Set(projetos.flatMap(p => p.equipe))].sort(), [projetos]);
  const filtrados = useMemo(() => projetos.filter(p => {
    if (cliente !== "todos" && p.cliente !== cliente) return false;
    if (responsavel !== "todos" && !p.equipe.includes(responsavel)) return false;
    const q = busca.trim().toLowerCase();
    return !q || p.nome.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q);
  }), [projetos, cliente, responsavel, busca]);

  const ativos = projetos.filter(p => !["concluido", "pausado"].includes(p.fase));
  const atrasadas = tarefas.filter(t => !t.concluida && t.prazo && new Date(t.prazo) < new Date()).length;
  const emAprovacao = projetos.filter(p => p.fase === "revisao").length;

  return (
    <div className="space-y-5 px-4 py-5 md:px-8 md:py-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Operação</span><h1 className="mt-1 font-display text-2xl font-semibold">Projetos</h1><p className="text-xs text-muted-foreground">Clientes, produções e próximos passos no mesmo lugar.</p></div>
        <Button size="sm" onClick={() => setModal(true)}><Add size={16} color="currentColor" /> Novo projeto</Button>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-5">
          <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Metrica label="Produções ativas" valor={ativos.length} />
            <Metrica label="Tarefas atrasadas" valor={atrasadas} danger={atrasadas > 0} />
            <Metrica label="Em aprovação" valor={emAprovacao} />
            <Metrica label="Entregas próximas" valor={marcos.filter(m => m.status === "pendente").length} />
          </section>

          <section>
            <div className="mb-2 flex items-end justify-between"><div><h2 className="font-display text-sm font-semibold">Clientes ativos</h2><p className="text-[10px] text-muted-foreground">Clique para abrir o workspace do cliente.</p></div><button className="text-[10px] font-medium text-primary" onClick={() => setCliente("todos")}>Limpar filtro</button></div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {clientes.map(nome => {
                const ps = projetos.filter(p => p.cliente === nome);
                const pendentes = tarefas.filter(t => ps.some(p => p.id === t.projetoId) && !t.concluida).length;
                const cor = corCliente(nome);
                const maisRecente = [...ps].sort((a, b) => +new Date(b.criadoEm) - +new Date(a.criadoEm))[0];
                return <button key={nome} onClick={() => maisRecente && navigate({ to: "/projetos/$id", params: { id: maisRecente.id } })} style={{ "--cliente": cor } as React.CSSProperties} className={cn("min-w-[220px] rounded-xl border bg-surface-1/40 p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--cliente)]", cliente === nome ? "border-[var(--cliente)] bg-surface-1/70" : "border-border")}>
                  <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--cliente)_16%,transparent)] text-[10px] font-bold text-[var(--cliente)]">{iniciais(nome)}</span><div className="min-w-0"><p className="truncate text-xs font-semibold">{nome}</p><p className="text-[9px] text-muted-foreground">{ps.length} projeto{ps.length === 1 ? "" : "s"} ativo{ps.length === 1 ? "" : "s"}</p></div></div>
                  <div className="mt-3 flex justify-between border-t border-border/40 pt-2 text-[9px] text-muted-foreground"><span>{pendentes} tarefas abertas</span><span className="text-[var(--cliente)]">Abrir →</span></div>
                </button>;
              })}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-1/25">
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
              <Tabs value={visao} onValueChange={v => setVisao(v as Visao)}><TabsList className="h-8"><TabsTrigger value="pipeline" className="text-xs">Pipeline</TabsTrigger><TabsTrigger value="semana" className="text-xs">Semana</TabsTrigger><TabsTrigger value="lista" className="text-xs">Lista</TabsTrigger></TabsList></Tabs>
              <div className="relative min-w-[180px] flex-1"><SearchNormal size={13} color="currentColor" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar projeto ou cliente…" className="h-8 pl-8 text-xs" /></div>
              <Select value={responsavel} onValueChange={setResponsavel}><SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Toda a equipe</SelectItem>{equipe.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
              <Select value={cliente} onValueChange={setCliente}><SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os clientes</SelectItem>{clientes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            {visao === "pipeline" && <Pipeline projetos={filtrados} tarefas={tarefas} onAbrir={id => navigate({ to: "/projetos/$id", params: { id } })} />}
            {visao === "semana" && <Semana projetos={filtrados} tarefas={tarefas} onAbrir={id => navigate({ to: "/projetos/$id", params: { id } })} />}
            {visao === "lista" && <Lista projetos={filtrados} tarefas={tarefas} onAbrir={id => navigate({ to: "/projetos/$id", params: { id } })} />}
          </section>
        </div>

        <CentralAtencao
          projetos={projetos}
          tarefas={tarefas}
          entregaveis={entregaveis}
          onAbrir={id => navigate({ to: "/projetos/$id", params: { id } })}
        />
      </div>
      <ProjetoModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}

function Metrica({ label, valor, danger }: { label: string; valor: number; danger?: boolean }) { return <div className="rounded-xl border border-border bg-surface-1/40 p-3"><p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p><p className={cn("mt-1 font-display text-xl font-semibold", danger && "text-destructive")}>{valor}</p></div>; }

function ProjetoCard({ p, tarefas, onAbrir }: { p: Projeto; tarefas: Tarefa[]; onAbrir: () => void }) {
  const r = calcularResumoProgresso(p, tarefas); const saude = SAUDE_ESTILO[r.saude];
  return <button onClick={onAbrir} className="w-full rounded-lg border border-border/60 bg-card p-3 text-left transition hover:border-primary/35"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-semibold">{p.nome}</p><p className="truncate text-[9px] text-muted-foreground">{p.cliente}</p></div><span className={cn("rounded border px-1.5 py-0.5 text-[8px]", saude.badge)}>{r.percentual}%</span></div><div className="mt-3 flex items-center justify-between text-[9px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Calendar size={10} color="currentColor" />{format(new Date(p.dataEntrega), "dd MMM", { locale: ptBR })}</span><span>{r.atrasadas ? `${r.atrasadas} atrasada(s)` : `${r.concluidas}/${r.total} tarefas`}</span></div></button>;
}

function Pipeline({ projetos, tarefas, onAbrir }: { projetos: Projeto[]; tarefas: Tarefa[]; onAbrir: (id: string) => void }) { return <div className="flex gap-3 overflow-x-auto p-3">{ORDEM_FASES.filter(f => f !== "pausado").map(fase => { const ps = projetos.filter(p => p.fase === fase); return <div key={fase} className="w-[230px] shrink-0 rounded-xl border border-border/60 bg-surface-1/35 p-2"><div className="mb-2 flex items-center justify-between px-1"><h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{FASES[fase].label}</h3><span className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] text-muted-foreground">{ps.length}</span></div><div className="space-y-2">{ps.map(p => <ProjetoCard key={p.id} p={p} tarefas={tarefas} onAbrir={() => onAbrir(p.id)} />)}{!ps.length && <p className="rounded-lg border border-dashed border-border/40 p-4 text-center text-[9px] text-muted-foreground/60">Nenhuma produção</p>}</div></div>; })}</div>; }

function Semana({ projetos, tarefas, onAbrir }: { projetos: Projeto[]; tarefas: Tarefa[]; onAbrir: (id: string) => void }) { const inicio = startOfWeek(new Date(), { weekStartsOn: 1 }); const dias = Array.from({ length: 5 }, (_, i) => addDays(inicio, i)); const ids = new Set(projetos.map(p => p.id)); return <div className="grid min-w-[800px] grid-cols-5 gap-2 overflow-x-auto p-3">{dias.map(d => { const ts = tarefas.filter(t => ids.has(t.projetoId) && t.prazo && isSameDay(new Date(t.prazo), d)); return <div key={d.toISOString()} className="min-h-[300px] rounded-xl border border-border/60 bg-surface-1/30 p-2"><div className="mb-2 flex items-center justify-between"><span className="text-[9px] uppercase text-muted-foreground">{format(d, "EEE", { locale: ptBR })}</span><span className={cn("grid size-6 place-items-center rounded-md text-xs", isSameDay(d, new Date()) && "bg-primary font-bold text-primary-foreground")}>{format(d, "dd")}</span></div><div className="space-y-2">{ts.map(t => { const p = projetos.find(x => x.id === t.projetoId)!; return <button key={t.id} onClick={() => onAbrir(p.id)} className="w-full rounded-lg border border-border/60 bg-card p-2 text-left"><p className="text-[9px] text-muted-foreground">{format(new Date(t.prazo!), "HH:mm")} · {p.cliente}</p><p className="mt-1 text-[10px] font-medium">{t.titulo}</p><p className="mt-2 inline-flex items-center gap-1 text-[8px] text-muted-foreground"><Profile2User size={9} color="currentColor" />{t.responsavel}</p></button>; })}{!ts.length && <p className="py-6 text-center text-[9px] text-muted-foreground/50">Sem ações</p>}</div></div>; })}</div>; }

function Lista({ projetos, tarefas, onAbrir }: { projetos: Projeto[]; tarefas: Tarefa[]; onAbrir: (id: string) => void }) { return <div className="divide-y divide-border/60">{projetos.map(p => { const r = calcularResumoProgresso(p, tarefas); return <button key={p.id} onClick={() => onAbrir(p.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 p-3 text-left hover:bg-surface-2/30"><div><p className="text-xs font-medium">{p.nome}</p><p className="text-[9px] text-muted-foreground">{p.cliente} · {FASES[p.fase].label}</p></div><div className="flex items-center gap-4 text-[9px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock size={10} color="currentColor" />{format(new Date(p.dataEntrega), "dd MMM")}</span><span>{r.percentual}%</span></div></button>; })}</div>; }
