import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Circle } from "lucide-react";
import { ArrowLeft2, Add, Edit2, Calendar, Profile2User, DollarCircle, TickCircle, Flag, Export, Link2, Trash, DocumentText1, DocumentDownload, ArrowRight2, CloseCircle } from "iconsax-react";
import type { Icon as IconsaxIcon } from "iconsax-react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, useDraggable, type DragEndEvent } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FASES, PRIORIDADES, TIPOS_ENTREGAVEL, TIPO_ENTREGAVEL_ICONS, STATUS_ENTREGAVEL, getFaseInfo,
  type Tarefa, type Marco, type Entregavel, type StatusTarefa, type StatusEntregavel, type FaseProjeto, type Projeto,
} from "@/lib/mock/projetos";
import { useProjetos, projetosActions } from "@/lib/hooks/useProjetos";
import { calcularResumoProgresso, SAUDE_ESTILO, linkSeguro } from "@/lib/projetos/progresso";
import { ProjetoModal } from "@/components/projetos/projeto-modal";
import { TarefaModal } from "@/components/projetos/tarefa-modal";
import { MarcoModal } from "@/components/projetos/marco-modal";
import { EntregavelModal } from "@/components/projetos/entregavel-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projetos/$id")({ component: ProjetoDetalhe });

function ProjetoDetalhe() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { projetos, tarefas, marcos, entregaveis } = useProjetos();
  const projeto = projetos.find(p => p.id === id);

  const [editandoProjeto, setEditandoProjeto] = useState(false);
  const [tarefaModal, setTarefaModal] = useState<{ open: boolean; tarefa?: Tarefa | null }>({ open: false });
  const [marcoModal, setMarcoModal] = useState<{ open: boolean; marco?: Marco | null }>({ open: false });
  const [entregavelModal, setEntregavelModal] = useState<{ open: boolean; entregavel?: Entregavel | null }>({ open: false });

  if (!projeto) {
    return (
      <div className="space-y-3">
        <Link to="/projetos" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><ArrowLeft2 size={12} color="currentColor" variant="Linear" /> Voltar</Link>
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">Projeto não encontrado.</div>
      </div>
    );
  }

  const minhasTarefas = tarefas.filter(t => t.projetoId === id);
  const meusMarcos = marcos.filter(m => m.projetoId === id);
  const meusEntregaveis = entregaveis.filter(e => e.projetoId === id);
  const fase = FASES[projeto.fase];

  return (
    <div className="space-y-4">
      <Link to="/projetos" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><ArrowLeft2 size={12} color="currentColor" variant="Linear" /> Todos os projetos</Link>

      <header className="rounded-xl border border-border bg-surface-1/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-medium", fase.classe)}>{fase.label}</span>
              <span className="text-[10px] text-muted-foreground">Iniciado {formatDistanceToNow(new Date(projeto.dataInicio), { locale: ptBR, addSuffix: true })}</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold">{projeto.nome}</h1>
            <p className="text-sm text-muted-foreground">{projeto.cliente}</p>
            {projeto.descricao && <p className="mt-2 text-xs text-muted-foreground">{projeto.descricao}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={projeto.fase} onValueChange={v => projetosActions.atualizarProjeto(projeto.id, { fase: v as FaseProjeto })}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(FASES).map(([id, f]) => <SelectItem key={id} value={id}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setEditandoProjeto(true)}><Edit2 size={14} color="currentColor" variant="Linear" /> Editar</Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard icon={Calendar} label="Entrega" valor={format(new Date(projeto.dataEntrega), "dd MMM yyyy", { locale: ptBR })} />
          <StatCard icon={DollarCircle} label="Valor" valor={`R$ ${projeto.valor.toLocaleString("pt-BR")}`} />
          <StatCard icon={Profile2User} label="Equipe" valor={`${projeto.equipe.length} pessoas`} />
        </div>

        <ResumoProgresso projeto={projeto} tarefas={minhasTarefas} />
      </header>

      <Tabs defaultValue="tarefas">
        <TabsList>
          <TabsTrigger value="tarefas">Tarefas ({minhasTarefas.length})</TabsTrigger>
          <TabsTrigger value="entregaveis">Entregáveis ({meusEntregaveis.length})</TabsTrigger>
          <TabsTrigger value="marcos">Marcos ({meusMarcos.length})</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="tarefas" className="mt-3">
          <div className="mb-3 flex items-center gap-3">
            <Button size="sm" onClick={() => setTarefaModal({ open: true })}><Add size={16} color="currentColor" variant="Linear" /> Nova tarefa</Button>
            <p className="text-xs text-muted-foreground">Arraste entre colunas para mudar fase · clique no card para editar</p>
          </div>
          <div className="overflow-x-auto">
            <KanbanTarefas tarefas={minhasTarefas} projetoId={projeto.id} fases={projeto.fases ?? []} onEditar={t => setTarefaModal({ open: true, tarefa: t })} />
          </div>
        </TabsContent>

        <TabsContent value="entregaveis" className="mt-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Cada item representa um vídeo, foto, doc ou peça que você precisa entregar — com link pro Drive e status.</p>
            <Button size="sm" onClick={() => setEntregavelModal({ open: true })}><Add size={16} color="currentColor" variant="Linear" /> Novo entregável</Button>
          </div>
          <ListaEntregaveis entregaveis={meusEntregaveis} onEditar={e => setEntregavelModal({ open: true, entregavel: e })} />
        </TabsContent>

        <TabsContent value="marcos" className="mt-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Marcos importantes do projeto. Sempre aparecem na Agenda.</p>
            <Button size="sm" onClick={() => setMarcoModal({ open: true })}><Add size={16} color="currentColor" variant="Linear" /> Novo marco</Button>
          </div>
          <ListaMarcos marcos={meusMarcos} onEditar={m => setMarcoModal({ open: true, marco: m })} />
        </TabsContent>

        <TabsContent value="info" className="mt-3">
          <InfoProjeto projeto={projeto} />
        </TabsContent>

        <TabsContent value="equipe" className="mt-3">
          <div className="rounded-xl border border-border bg-surface-1/40 p-4">
            <h3 className="mb-3 font-display text-sm font-semibold">Equipe do projeto</h3>
            <div className="space-y-2">
              {projeto.equipe.map((m, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border/40 bg-surface-2/30 p-3">
                  <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-xs font-bold text-primary-foreground">
                    {m.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(() => {
                        const n = minhasTarefas.filter(t => t.responsavel === m && t.status !== "concluida").length;
                        return `${n} tarefa${n === 1 ? "" : "s"} aberta${n === 1 ? "" : "s"}`;
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ProjetoModal open={editandoProjeto} onClose={() => setEditandoProjeto(false)} projeto={projeto} />
      <TarefaModal open={tarefaModal.open} onClose={() => setTarefaModal({ open: false })} projetoId={projeto.id} tarefa={tarefaModal.tarefa} fases={projeto.fases ?? []} />
      <MarcoModal open={marcoModal.open} onClose={() => setMarcoModal({ open: false })} projetoId={projeto.id} marco={marcoModal.marco} />
      <EntregavelModal open={entregavelModal.open} onClose={() => setEntregavelModal({ open: false })} projetoId={projeto.id} entregavel={entregavelModal.entregavel} />
      {/* exemplo: navigate seria útil em delete – evita warning */}
      <span className="hidden">{String(typeof navigate)}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, valor, extra }: { icon: typeof IconsaxIcon; label: string; valor: string; extra?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/40 bg-surface-2/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Icon size={12} color="currentColor" variant="Linear" className="text-primary" /> {label}</div>
      <p className="mt-1 font-display text-sm font-semibold tabular-nums">{valor}</p>
      {extra}
    </div>
  );
}

function ResumoProgresso({ projeto, tarefas }: { projeto: Projeto; tarefas: Tarefa[] }) {
  const r = calcularResumoProgresso(projeto, tarefas);
  const saude = SAUDE_ESTILO[r.saude];
  const proxima = tarefas
    .filter(t => !t.concluida && t.prazo)
    .sort((a, b) => +new Date(a.prazo!) - +new Date(b.prazo!))[0];

  return (
    <div className="mt-3 rounded-lg border border-border/40 bg-surface-2/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Progresso</span>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-medium", saude.badge)}>{r.label}</span>
          <span className="font-display text-sm font-semibold tabular-nums">{r.percentual}%</span>
        </div>
      </div>
      <Progress value={r.percentual} indicatorClassName={saude.barra} className="mt-2 h-1.5" />
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span>{r.concluidas} de {r.total} tarefas concluídas</span>
        {r.atrasadas > 0 && <span className="font-medium text-destructive">{r.atrasadas} atrasada{r.atrasadas > 1 ? "s" : ""}</span>}
        {proxima && (
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} color="currentColor" variant="Linear" className="text-primary" />
            Próxima: {proxima.titulo} · {format(new Date(proxima.prazo!), "dd MMM", { locale: ptBR })}
          </span>
        )}
      </div>
    </div>
  );
}

const SUGESTOES_FASE = ["Aprovação interna", "Aprovação cliente", "Animação", "Locução", "Mixagem", "Finalização", "Publicação", "Arquivamento"];

function KanbanTarefas({ tarefas, projetoId, fases, onEditar }: {
  tarefas: Tarefa[]; projetoId: string; fases: string[]; onEditar: (t: Tarefa) => void
}) {
  const [adicionando, setAdicionando] = useState(false);
  const [novaFase, setNovaFase] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const confirmarNovaFase = (nome: string) => {
    const n = nome.trim(); if (!n) return;
    projetosActions.adicionarFase(projetoId, n);
    setNovaFase(""); setAdicionando(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);
    if (!over || active.id === over.id) return;
    const novaFaseId = String(over.id);
    if (fases.includes(novaFaseId)) {
      projetosActions.atualizarTarefa(String(active.id), { status: novaFaseId });
    }
  };

  const draggingTarefa = draggingId ? tarefas.find(t => t.id === draggingId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={e => setDraggingId(String(e.active.id))} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {fases.map((faseId, idx) => {
          const info = getFaseInfo(faseId);
          const items = tarefas.filter(t => t.status === faseId);
          const isConcluida = faseId === "concluida";
          return (
            <KanbanColuna key={faseId} faseId={faseId} label={info.label} isConcluida={isConcluida}
              podeEsquerda={idx > 0} podeDireita={idx < fases.length - 1}
              onMover={dir => projetosActions.moverFase(projetoId, faseId, dir)}
              onRemover={items.length === 0 && !isConcluida ? () => projetosActions.removerFase(projetoId, faseId) : undefined}
              count={items.length}>
              {items.map(t => (
                <TarefaCard key={t.id} tarefa={t} onEditar={() => onEditar(t)} isDragging={draggingId === t.id} />
              ))}
            </KanbanColuna>
          );
        })}

        {/* botão nova coluna */}
        <div className="min-w-[220px] flex-shrink-0">
          {!adicionando ? (
            <button onClick={() => setAdicionando(true)}
              className="flex h-full min-h-[80px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/40 text-xs text-muted-foreground/50 transition hover:border-primary/40 hover:text-primary">
              <Add size={14} color="currentColor" variant="Linear" /> Nova coluna
            </button>
          ) : (
            <div className="rounded-xl border border-primary/40 bg-surface-1/40 p-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nova fase</p>
              <div className="flex flex-wrap gap-1">
                {SUGESTOES_FASE.filter(s => !fases.includes(s.toLowerCase().replace(/\s+/g, "_"))).slice(0, 6).map(s => (
                  <button key={s} onClick={() => confirmarNovaFase(s)}
                    className="rounded-md border border-border/60 bg-surface-2/60 px-2 py-0.5 text-[10px] text-muted-foreground transition hover:border-primary/40 hover:text-primary">
                    {s}
                  </button>
                ))}
              </div>
              <input autoFocus value={novaFase} onChange={e => setNovaFase(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirmarNovaFase(novaFase); if (e.key === "Escape") setAdicionando(false); }}
                placeholder="Nome personalizado…"
                className="h-8 w-full rounded-lg border border-border/60 bg-background/40 px-2.5 text-xs outline-none focus:border-primary/50" />
              <div className="flex gap-1.5">
                <button onClick={() => confirmarNovaFase(novaFase)} disabled={!novaFase.trim()}
                  className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40">Adicionar</button>
                <button onClick={() => { setAdicionando(false); setNovaFase(""); }}
                  className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {draggingTarefa && <TarefaCard tarefa={draggingTarefa} onEditar={() => {}} isDragging overlay />}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColuna({ faseId, label, isConcluida, podeEsquerda, podeDireita, onMover, onRemover, count, children }: {
  faseId: string; label: string; isConcluida: boolean;
  podeEsquerda: boolean; podeDireita: boolean;
  onMover: (d: -1 | 1) => void; onRemover?: () => void;
  count: number; children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: faseId });
  return (
    <div ref={setNodeRef}
      className={cn("min-w-[240px] w-[240px] flex-shrink-0 rounded-xl border bg-surface-1/40 p-3 transition",
        isConcluida ? "border-muted-foreground/20" : "border-border",
        isOver && "border-primary/50 bg-primary/5")}>
      <div className="mb-2 flex items-center gap-1">
        <button onClick={() => onMover(-1)} disabled={!podeEsquerda}
          className="rounded p-0.5 text-muted-foreground/40 transition hover:text-muted-foreground disabled:invisible">
          <ArrowLeft2 size={12} color="currentColor" variant="Linear" />
        </button>
        <h3 className={cn("flex-1 truncate text-[11px] font-semibold uppercase tracking-wider",
          isConcluida ? "text-muted-foreground/60" : "text-muted-foreground")}>
          {label}
        </h3>
        {count > 0 && <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">{count}</span>}
        <button onClick={() => onMover(1)} disabled={!podeDireita}
          className="rounded p-0.5 text-muted-foreground/40 transition hover:text-muted-foreground disabled:invisible">
          <ArrowRight2 size={12} color="currentColor" variant="Linear" />
        </button>
        {onRemover && (
          <button onClick={onRemover} className="rounded p-0.5 text-muted-foreground/30 transition hover:text-destructive" title="Remover coluna">
            <CloseCircle size={12} color="currentColor" variant="Linear" />
          </button>
        )}
      </div>
      <div className="space-y-2 min-h-[40px]">
        {count === 0 && <p className="rounded-md border border-dashed border-border/30 p-3 text-center text-[10px] text-muted-foreground/40">Arraste tarefas aqui</p>}
        {children}
      </div>
    </div>
  );
}

function TarefaCard({ tarefa, onEditar, isDragging, overlay }: {
  tarefa: Tarefa; onEditar: () => void; isDragging?: boolean; overlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: tarefa.id });
  const prio = PRIORIDADES[tarefa.prioridade];
  const lk = linkSeguro(tarefa.link);
  const style = transform && !overlay
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style}
      className={cn("group rounded-lg border border-border/60 bg-card p-2.5 transition",
        isDragging && !overlay && "opacity-40",
        overlay && "shadow-xl rotate-1 scale-105",
        !isDragging && "hover:border-primary/40")}>
      <div className="flex items-start gap-2">
        {/* toggle concluída */}
        <button
          onClick={e => { e.stopPropagation(); projetosActions.atualizarTarefa(tarefa.id, { concluida: !tarefa.concluida }); }}
          className="mt-0.5 shrink-0 transition hover:scale-110"
          title={tarefa.concluida ? "Marcar como pendente" : "Marcar como concluída"}>
          {tarefa.concluida
            ? <TickCircle size={16} color="currentColor" variant="Linear" className="text-success" />
            : <Circle className="size-4 text-muted-foreground hover:text-primary" />}
        </button>

        {/* clique no conteúdo abre o modal */}
        <button onClick={onEditar} className="min-w-0 flex-1 text-left">
          <p className={cn("text-xs font-medium leading-snug", tarefa.concluida && "text-muted-foreground line-through")}>
            {tarefa.titulo}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className={cn("font-medium", prio.classe)}>● {prio.label}</span>
            <span className="text-muted-foreground">{tarefa.responsavel}</span>
            {tarefa.prazo && (
              <span className="ml-auto inline-flex items-center gap-0.5 tabular-nums text-muted-foreground">
                <Calendar size={10} color="currentColor" variant="Linear" />{format(new Date(tarefa.prazo), "dd MMM", { locale: ptBR })}
              </span>
            )}
          </div>
        </button>

        {/* handle de drag */}
        <button {...listeners} {...attributes}
          className="mt-0.5 shrink-0 cursor-grab touch-none opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
          title="Arrastar para outra fase">
          <svg className="size-3.5 text-muted-foreground" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.2"/><circle cx="5" cy="8" r="1.2"/><circle cx="5" cy="12" r="1.2"/>
            <circle cx="11" cy="4" r="1.2"/><circle cx="11" cy="8" r="1.2"/><circle cx="11" cy="12" r="1.2"/>
          </svg>
        </button>
      </div>

      {lk && (
        <a
          href={lk.href} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          className="mt-2 inline-flex max-w-full items-center gap-1 rounded-md border border-border/40 bg-surface-2/40 px-1.5 py-0.5 text-[10px] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          title={lk.href}
        >
          <Link2 size={10} color="currentColor" variant="Linear" className="shrink-0" />
          <span className="truncate">{lk.dominio}</span>
        </a>
      )}
    </div>
  );
}

function ListaMarcos({ marcos, onEditar }: { marcos: Marco[]; onEditar: (m: Marco) => void }) {
  const ordenados = [...marcos].sort((a, b) => +new Date(a.data) - +new Date(b.data));
  if (ordenados.length === 0) return <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">Nenhum marco ainda. Crie marcos para acompanhar entregas importantes.</div>;
  return (
    <div className="space-y-2">
      {ordenados.map(m => {
        const passou = new Date(m.data) < new Date();
        return (
          <button key={m.id} onClick={() => onEditar(m)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-1/40 p-3 text-left transition hover:border-primary/40">
            <button onClick={(e) => { e.stopPropagation(); projetosActions.atualizarMarco(m.id, { status: m.status === "concluido" ? "pendente" : "concluido" }); }}>
              {m.status === "concluido" ? <TickCircle size={20} color="currentColor" variant="Linear" className="text-success" /> : <Flag size={20} color="currentColor" variant="Linear" className={cn(passou ? "text-destructive" : "text-warning")} />}
            </button>
            <div className="flex-1">
              <p className={cn("text-sm font-medium", m.status === "concluido" && "text-muted-foreground line-through")}>{m.titulo}</p>
              <p className="text-[11px] text-muted-foreground">{format(new Date(m.data), "EEEE, dd MMM yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
            {m.status !== "concluido" && passou && <span className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">Atrasado</span>}
          </button>
        );
      })}
    </div>
  );
}

function ListaEntregaveis({ entregaveis, onEditar }: { entregaveis: Entregavel[]; onEditar: (e: Entregavel) => void }) {
  if (entregaveis.length === 0) {
    return <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">Nenhum entregável ainda. Crie um pra cada peça que precisa ser entregue (vídeo, foto, doc…) e cole o link do Drive.</div>;
  }
  const grupos: { id: StatusEntregavel; label: string }[] = [
    { id: "pendente", label: "Pendentes" },
    { id: "em_revisao", label: "Em revisão" },
    { id: "aprovado", label: "Aprovados" },
    { id: "entregue", label: "Entregues" },
  ];
  return (
    <div className="space-y-4">
      {grupos.map(g => {
        const items = entregaveis.filter(e => e.status === g.id);
        if (items.length === 0) return null;
        return (
          <div key={g.id}>
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label} · {items.length}</h4>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {items.map(e => <EntregavelCard key={e.id} entregavel={e} onEditar={() => onEditar(e)} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EntregavelCard({ entregavel, onEditar }: { entregavel: Entregavel; onEditar: () => void }) {
  const tipo = TIPOS_ENTREGAVEL[entregavel.tipo];
  const TipoIcon = TIPO_ENTREGAVEL_ICONS[entregavel.tipo];
  const status = STATUS_ENTREGAVEL[entregavel.status];
  return (
    <div className="group rounded-lg border border-border/60 bg-card p-3 transition hover:border-primary/40">
      <div className="flex items-start gap-2.5">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-border/40 bg-surface-2/40 text-primary"><TipoIcon className="size-4" /></div>
        <button onClick={onEditar} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{entregavel.titulo}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-muted-foreground">{tipo.label}</span>
            <span className={cn("rounded-md border px-1.5 py-0.5 font-medium", status.classe)}>{status.label}</span>
          </div>
          {entregavel.notas && <p className="mt-1.5 line-clamp-2 text-[11px] text-muted-foreground">{entregavel.notas}</p>}
        </button>
        {entregavel.link && (
          <a href={entregavel.link} target="_blank" rel="noreferrer" onClick={ev => ev.stopPropagation()}
            className="grid size-7 shrink-0 place-items-center rounded-md border border-border/40 bg-surface-2/30 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            title="Abrir link">
            <Export size={14} color="currentColor" variant="Linear" />
          </a>
        )}
      </div>
    </div>
  );
}

function InfoProjeto({ projeto }: { projeto: Projeto }) {
  const [notas, setNotas] = useState(projeto.notas ?? "");
  const [novoLabel, setNovoLabel] = useState("");
  const [novoUrl, setNovoUrl] = useState("");
  const dirty = notas !== (projeto.notas ?? "");

  const salvarNotas = () => projetosActions.atualizarProjeto(projeto.id, { notas: notas.trim() || undefined });
  const addLink = () => {
    if (!novoLabel.trim() || !novoUrl.trim()) return;
    projetosActions.adicionarLink(projeto.id, novoLabel.trim(), novoUrl.trim());
    setNovoLabel(""); setNovoUrl("");
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-surface-1/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold"><Link2 size={14} color="currentColor" variant="Linear" className="text-primary" /> Links do projeto</h3>
          <span className="text-[10px] text-muted-foreground">{projeto.links?.length ?? 0} link(s)</span>
        </div>
        <div className="space-y-1.5">
          {(projeto.links ?? []).length === 0 && (
            <p className="rounded-md border border-dashed border-border/40 p-3 text-center text-[11px] text-muted-foreground">Nenhum link ainda. Adicione a pasta raiz no Drive, o brief, o moodboard…</p>
          )}
          {(projeto.links ?? []).map(l => (
            <div key={l.id} className="group flex items-center gap-2 rounded-lg border border-border/40 bg-surface-2/30 p-2">
              <a href={l.url} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center gap-2 text-xs hover:text-primary">
                <Export size={12} color="currentColor" variant="Linear" className="shrink-0 text-primary" />
                <span className="truncate font-medium">{l.label}</span>
                <span className="hidden truncate text-[10px] text-muted-foreground md:inline">{l.url}</span>
              </a>
              <button onClick={() => projetosActions.removerLink(projeto.id, l.id)} className="opacity-0 transition group-hover:opacity-100" title="Remover">
                <Trash size={14} color="currentColor" variant="Linear" className="text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_2fr_auto] gap-1.5">
          <Input value={novoLabel} onChange={e => setNovoLabel(e.target.value)} placeholder="Rótulo" className="h-8 text-xs" />
          <Input value={novoUrl} onChange={e => setNovoUrl(e.target.value)} placeholder="https://…" className="h-8 text-xs" />
          <Button size="sm" variant="outline" onClick={addLink} disabled={!novoLabel.trim() || !novoUrl.trim()}><Add size={14} color="currentColor" variant="Linear" /></Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface-1/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold"><DocumentText1 size={14} color="currentColor" variant="Linear" className="text-primary" /> Anotações</h3>
          {dirty && <Button size="sm" variant="outline" onClick={salvarNotas}><DocumentDownload size={14} color="currentColor" variant="Linear" /> Salvar</Button>}
        </div>
        <Textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          onBlur={salvarNotas}
          rows={10}
          placeholder="Briefing detalhado, preferências do cliente, decisões importantes, contatos, observações de produção…"
          className="text-xs"
        />
        <p className="mt-1.5 text-[10px] text-muted-foreground">Salva automaticamente ao sair do campo.</p>
      </section>
    </div>
  );
}
