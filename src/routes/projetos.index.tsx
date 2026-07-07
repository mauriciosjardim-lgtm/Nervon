import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Add, SearchNormal, Profile2User, Calendar, Flag, CloseCircle } from "iconsax-react";
import type { Icon as IconsaxIcon } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { FASES, type FaseProjeto } from "@/lib/mock/projetos";
import { useProjetos, projetosActions } from "@/lib/hooks/useProjetos";
import { calcularResumoProgresso, SAUDE_ESTILO } from "@/lib/projetos/progresso";
import { ProjetoModal } from "@/components/projetos/projeto-modal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { consumeCreate } from "@/lib/pendingCreate";

export const Route = createFileRoute("/projetos/")({ component: ProjetosPage });

function ProjetosPage() {
  const { projetos, tarefas, marcos } = useProjetos();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [filtroFase, setFiltroFase] = useState<FaseProjeto | "todos">("todos");
  const [modal, setModal] = useState(false);

  useEffect(() => {
    if (consumeCreate("projeto")) { setModal(true); return; }
    const h = (e: Event) => { if ((e as CustomEvent).detail === "projeto") setModal(true); };
    window.addEventListener("nervon:criar", h);
    return () => window.removeEventListener("nervon:criar", h);
  }, []);

  const filtrados = useMemo(() => projetos.filter(p => {
    if (filtroFase !== "todos" && p.fase !== filtroFase) return false;
    const t = busca.trim().toLowerCase();
    if (!t) return true;
    return p.nome.toLowerCase().includes(t) || p.cliente.toLowerCase().includes(t);
  }), [projetos, busca, filtroFase]);

  const ativos = projetos.filter(p => !["concluido", "pausado"].includes(p.fase)).length;
  const valorTotal = projetos.filter(p => !["concluido"].includes(p.fase)).reduce((s, p) => s + p.valor, 0);

  return (
    <div className="space-y-4 px-4 py-5 md:px-8 md:py-7">
      <header>
        <h1 className="font-display text-2xl font-semibold">Projetos</h1>
        <p className="text-xs text-muted-foreground">{ativos} ativos · {projetos.length} no total · R$ {valorTotal.toLocaleString("pt-BR")} em pipeline</p>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-1/40 p-2">
        <Button size="sm" onClick={() => setModal(true)} className="shrink-0"><Add size={16} color="currentColor" variant="Linear" /> Novo projeto</Button>
        <div className="relative flex-1 min-w-[180px]">
          <SearchNormal size={14} color="currentColor" variant="Linear" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar projeto ou cliente…" className="h-8 pl-8 text-xs" />
        </div>
        <Select value={filtroFase} onValueChange={v => setFiltroFase(v as FaseProjeto | "todos")}>
          <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as fases</SelectItem>
            {Object.entries(FASES).map(([id, f]) => <SelectItem key={id} value={id}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-1/30 p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum projeto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map(p => {
            const ms = marcos.filter(m => m.projetoId === p.id);
            const resumo = calcularResumoProgresso(p, tarefas);
            const saude = SAUDE_ESTILO[resumo.saude];
            return (
              <div key={p.id}
                role="link" tabIndex={0}
                onClick={() => navigate({ to: "/projetos/$id", params: { id: p.id } })}
                onKeyDown={e => { if (e.key === "Enter") navigate({ to: "/projetos/$id", params: { id: p.id } }); }}
                className="group relative cursor-pointer rounded-xl border border-border bg-surface-1/40 p-4 transition hover:border-primary/40 hover:bg-surface-1/60">
                <button
                  onClick={e => { e.stopPropagation(); if (confirm(`Remover projeto "${p.nome}"?`)) projetosActions.removerProjeto(p.id); }}
                  className="absolute right-2 top-2 z-10 inline-flex size-5 items-center justify-center rounded-full bg-surface-2 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/80 hover:text-white"
                  title="Remover projeto"
                >
                  <CloseCircle size={12} color="currentColor" variant="Linear" />
                </button>

                <div className="pr-6">
                  <h3 className="truncate font-display text-base font-semibold group-hover:text-primary">{p.nome}</h3>
                  <p className="truncate text-xs text-muted-foreground">{p.cliente}</p>
                  {p.descricao && (
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/80">{p.descricao}</p>
                  )}
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Progresso</span>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-medium", saude.badge)}>{resumo.label}</span>
                      <span className="tabular-nums">{resumo.percentual}%</span>
                    </div>
                  </div>
                  <Progress value={resumo.percentual} indicatorClassName={saude.barra} className="h-1.5" />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{resumo.concluidas} de {resumo.total} tarefas</span>
                    {resumo.atrasadas > 0 && <span className="font-medium text-destructive">{resumo.atrasadas} atrasada{resumo.atrasadas > 1 ? "s" : ""}</span>}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <Stat icon={Flag} label={`${ms.length} marcos`} />
                  <Stat icon={Profile2User} label={`${p.equipe.length} pessoas`} />
                  <Stat icon={Calendar} label={format(new Date(p.dataEntrega), "dd MMM", { locale: ptBR })} />
                </div>

                {p.equipe.length > 0 && (
                  <div className="mt-3 flex items-center border-t border-border/40 pt-3">
                    <div className="flex -space-x-1.5">
                      {p.equipe.slice(0, 5).map((m, i) => (
                        <div key={i} className="grid size-6 place-items-center rounded-full border-2 border-card bg-gradient-to-br from-primary to-primary-glow text-[9px] font-bold text-primary-foreground">
                          {m.split(" ").map(w => w[0]).slice(0, 2).join("")}
                        </div>
                      ))}
                      {p.equipe.length > 5 && <div className="grid size-6 place-items-center rounded-full border-2 border-card bg-surface-2 text-[9px] text-muted-foreground">+{p.equipe.length - 5}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ProjetoModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}

function Stat({ icon: Icon, label }: { icon: typeof IconsaxIcon; label: string }) {
  return <span className="inline-flex items-center gap-1 truncate text-muted-foreground"><Icon size={12} color="currentColor" variant="Linear" className="text-primary" /> {label}</span>;
}
