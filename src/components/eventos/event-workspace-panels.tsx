import { useState } from "react";
import {
  AlertTriangle,
  Camera,
  Car,
  CheckCircle2,
  Circle,
  CircleDollarSign,
  Clapperboard,
  Clock3,
  FileText,
  Headphones,
  Mic2,
  PackageCheck,
  Pencil,
  Plane,
  Plus,
  Radio,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  Utensils,
  Video,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { EventoTimeField } from "@/components/eventos/event-form-fields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eventosProducaoActions } from "@/lib/eventos/storage";
import type {
  ChecklistEvento,
  EventoProducao,
  LancamentoEvento,
  MembroEquipeEvento,
  ReferenciaEvento,
} from "@/lib/eventos/types";
import { cn } from "@/lib/utils";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const field = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function ChecklistPanel({ evento }: { evento: EventoProducao }) {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<ChecklistEvento["categoria"]>("preparacao");
  const [responsavelId, setResponsavel] = useState("");
  const [diaId, setDia] = useState("");
  const itens = evento.checklist ?? [];
  const save = (next: ChecklistEvento[]) =>
    eventosProducaoActions.atualizar(evento.id, {
      checklist: next,
      tarefasTotal: next.length,
      tarefasConcluidas: next.filter((i) => i.concluido).length,
    });
  const add = () => {
    if (!titulo.trim()) return;
    save([
      ...itens,
      {
        id: crypto.randomUUID(),
        titulo: titulo.trim(),
        categoria,
        responsavelId: responsavelId || undefined,
        diaId: diaId || undefined,
        concluido: false,
      },
    ]);
    setTitulo("");
    setOpen(false);
  };
  const cats: ChecklistEvento["categoria"][] = [
    "preparacao",
    "equipamento",
    "logistica",
    "execucao",
    "encerramento",
  ];
  return (
    <PanelShell
      icon={CheckCircle2}
      title="Checklists da produção"
      desc="Ações verificáveis para preparar, executar e encerrar sem depender da memória."
      action={
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Novo item
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-5">
        {cats.map((cat) => (
          <div key={cat} className="rounded-2xl border border-border/60 bg-surface-1/20 p-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider capitalize text-muted-foreground">
                {cat}
              </h3>
              <span className="text-[9px] text-muted-foreground">
                {itens.filter((i) => i.categoria === cat).filter((i) => i.concluido).length}/
                {itens.filter((i) => i.categoria === cat).length}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {itens
                .filter((i) => i.categoria === cat)
                .map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-xl border border-border/50 bg-background/25 p-3"
                  >
                    <button
                      onClick={() =>
                        save(
                          itens.map((i) =>
                            i.id === item.id ? { ...i, concluido: !i.concluido } : i,
                          ),
                        )
                      }
                      className="flex w-full items-start gap-2 text-left"
                    >
                      {item.concluido ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      ) : (
                        <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          "text-[11px] leading-snug",
                          item.concluido && "text-muted-foreground line-through",
                        )}
                      >
                        {item.titulo}
                      </span>
                    </button>
                    <button
                      onClick={() => save(itens.filter((i) => i.id !== item.id))}
                      className="mt-2 hidden text-[9px] text-destructive group-hover:block"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              {!itens.some((i) => i.categoria === cat) && (
                <p className="rounded-xl border border-dashed border-border/45 py-6 text-center text-[9px] text-muted-foreground">
                  Vazio
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo item do checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <F label="O que precisa ser conferido?">
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Testar cartões e baterias"
              />
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Categoria">
                <select
                  className={field}
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as ChecklistEvento["categoria"])}
                >
                  {cats.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </F>
              <F label="Dia">
                <select className={field} value={diaId} onChange={(e) => setDia(e.target.value)}>
                  <option value="">Geral</option>
                  {evento.dias.map((d, i) => (
                    <option key={d.id} value={d.id}>
                      Dia {i + 1}
                    </option>
                  ))}
                </select>
              </F>
              <F label="Responsável">
                <select
                  className={field}
                  value={responsavelId}
                  onChange={(e) => setResponsavel(e.target.value)}
                >
                  <option value="">A definir</option>
                  {evento.equipeMembros?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome || m.funcao}
                    </option>
                  ))}
                </select>
              </F>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={add}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PanelShell>
  );
}

export function FinancePanel({ evento }: { evento: EventoProducao }) {
  const [open, setOpen] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [categoria, setCategoria] = useState<LancamentoEvento["categoria"]>("equipe");
  const itens = evento.lancamentos ?? [];
  const total = itens.reduce((n, i) => n + i.valor, 0);
  const aprovado = evento.valorOrcado ?? evento.receitaPrevista;
  const save = (next: LancamentoEvento[]) =>
    eventosProducaoActions.atualizar(evento.id, {
      lancamentos: next,
      custosPrevistos: next.reduce((n, i) => n + i.valor, 0),
    });
  const add = () => {
    if (!descricao.trim() || !valor) return;
    save([
      ...itens,
      { id: crypto.randomUUID(), descricao: descricao.trim(), valor, categoria, pago: false },
    ]);
    setDescricao("");
    setValor(0);
    setOpen(false);
  };
  return (
    <PanelShell
      icon={Wallet}
      title="Financeiro do evento"
      desc="Custos desta operação ficam isolados até você decidir levar ao Financeiro geral."
      action={
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Lançar custo
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Money label="Valor aprovado" value={aprovado} accent />
        <Money label="Custos lançados" value={total} />
        <Money label="Margem atual" value={aprovado - total} accent={aprovado - total >= 0} />
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-border/60">
        {itens.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0"
          >
            <button
              onClick={() =>
                save(itens.map((i) => (i.id === item.id ? { ...i, pago: !i.pago } : i)))
              }
            >
              {item.pago ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : (
                <Circle className="size-4 text-muted-foreground" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{item.descricao}</p>
              <p className="text-[9px] capitalize text-muted-foreground">
                {item.categoria} · {item.pago ? "pago" : "pendente"}
              </p>
            </div>
            <strong className="text-xs">{brl(item.valor)}</strong>
            <button
              onClick={() => save(itens.filter((i) => i.id !== item.id))}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {!itens.length && (
          <p className="py-12 text-center text-xs text-muted-foreground">Nenhum custo lançado.</p>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo custo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <F label="Descrição">
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Cachê operador de câmera"
              />
            </F>
            <F label="Categoria">
              <select
                className={field}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as LancamentoEvento["categoria"])}
              >
                <option value="equipe">Equipe</option>
                <option value="equipamento">Equipamento</option>
                <option value="transporte">Transporte</option>
                <option value="alimentacao">Alimentação</option>
                <option value="fornecedor">Fornecedor</option>
                <option value="outro">Outro</option>
              </select>
            </F>
            <F label="Valor">
              <CurrencyInput value={valor} onValueChange={setValor} />
            </F>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={add}>Lançar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PanelShell>
  );
}

export function ReferencesPanel({ evento }: { evento: EventoProducao }) {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [orientacoes, setOrientacoes] = useState(evento.orientacoesGerais ?? "");
  const refs = evento.referencias ?? [];
  const saveRefs = (next: ReferenciaEvento[]) =>
    eventosProducaoActions.atualizar(evento.id, { referencias: next });
  const add = () => {
    if (!titulo.trim() || !url.trim()) return;
    saveRefs([...refs, { id: crypto.randomUUID(), titulo: titulo.trim(), url: url.trim() }]);
    setTitulo("");
    setUrl("");
    setOpen(false);
  };
  return (
    <PanelShell
      icon={FileText}
      title="Informações e referências"
      desc="Tudo que a equipe precisa consultar antes e durante a operação."
      action={
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Referência
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-2xl border border-border/60 p-4">
          <F label="Orientações gerais">
            <Textarea
              rows={8}
              value={orientacoes}
              onChange={(e) => setOrientacoes(e.target.value)}
              placeholder="Ponto de encontro, dress code, contatos e regras…"
            />
          </F>
          <Button
            size="sm"
            className="mt-3"
            onClick={() =>
              eventosProducaoActions.atualizar(evento.id, { orientacoesGerais: orientacoes })
            }
          >
            Salvar orientações
          </Button>
        </div>
        <div className="space-y-2">
          {refs.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
            >
              <a href={r.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{r.titulo}</p>
                <p className="truncate text-[9px] text-muted-foreground">{r.url}</p>
              </a>
              <button
                onClick={() => saveRefs(refs.filter((x) => x.id !== r.id))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {!refs.length && (
            <p className="rounded-2xl border border-dashed border-border/60 py-14 text-center text-xs text-muted-foreground">
              Nenhuma referência adicionada.
            </p>
          )}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova referência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <F label="Título">
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Roteiro oficial"
              />
            </F>
            <F label="Link">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            </F>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={add}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PanelShell>
  );
}

const TEAM_ROLES = [
  { id: "producao", name: "Produção", icon: Clapperboard, desc: "Comando, cliente e operação" },
  { id: "direcao", name: "Direção", icon: Video, desc: "Linguagem e decisões criativas" },
  { id: "videomaker", name: "Videomaker", icon: Camera, desc: "Captação principal e apoio" },
  { id: "fotografia", name: "Fotografia", icon: Camera, desc: "Cobertura fotográfica" },
  { id: "audio", name: "Áudio", icon: Mic2, desc: "Captação, mesa e redundância" },
  { id: "drone", name: "Drone / FPV", icon: Plane, desc: "Imagem aérea e autorizações" },
  { id: "realtime", name: "Editor realtime", icon: Radio, desc: "Log, corte e entrega no evento" },
  { id: "edicao", name: "Edição", icon: Headphones, desc: "Pós-produção e finalização" },
] as const;

export function TeamPanel({ evento }: { evento: EventoProducao }) {
  const [open, setOpen] = useState(false);
  const [previewMember, setPreviewMember] = useState<MembroEquipeEvento | null>(null);
  const [step, setStep] = useState(1);
  const [view, setView] = useState<"equipe" | "dia" | "função">("equipe");
  const [dayFilter, setDayFilter] = useState("todos");
  const emptyMember = (): MembroEquipeEvento => ({
    id: crypto.randomUUID(),
    funcaoId: "",
    funcao: "",
    nome: "",
    vinculo: "freelancer",
    dias: evento.dias.map((day) => day.id),
    equipamentos: [],
    status: "aguardando",
    escalas: evento.dias.map((day) => ({ diaId: day.id, chamada: day.inicio, fim: day.fim })),
    transporte: false,
    alimentacao: true,
    equipamentoOrigem: "produtora",
  });
  const [draft, setDraft] = useState<MembroEquipeEvento>(emptyMember);
  const membros = evento.equipeMembros ?? [];
  const save = (next: MembroEquipeEvento[]) =>
    eventosProducaoActions.atualizar(evento.id, { equipeMembros: next, equipe: next.length });
  const openNew = () => {
    setDraft(emptyMember());
    setStep(1);
    setOpen(true);
  };
  const edit = (member: MembroEquipeEvento) => {
    setDraft({ ...emptyMember(), ...member });
    setStep(2);
    setOpen(true);
  };
  const submit = () => {
    if (!draft.nome.trim() || !draft.funcao.trim()) return;
    const normalizedDraft = {
      ...draft,
      equipamentos: draft.equipamentos
        .flatMap((item) => item.split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    };
    save(
      membros.some((member) => member.id === draft.id)
        ? membros.map((member) => (member.id === draft.id ? normalizedDraft : member))
        : [...membros, normalizedDraft],
    );
    setOpen(false);
  };
  const confirmed = membros.filter((member) => member.status === "confirmado").length;
  const costs = membros.reduce((total, member) => total + (member.cache ?? 0), 0);
  const uncovered = TEAM_ROLES.filter(
    (role) => !membros.some((member) => member.funcaoId === role.id),
  );
  const filtered =
    dayFilter === "todos" ? membros : membros.filter((member) => member.dias.includes(dayFilter));
  const groups =
    view === "função"
      ? TEAM_ROLES.map((role) => ({
          id: role.id,
          title: role.name,
          members: filtered.filter((member) => member.funcaoId === role.id),
        })).filter((group) => group.members.length)
      : view === "dia" && dayFilter === "todos"
        ? evento.dias.map((day, index) => ({
            id: day.id,
            title: `Dia ${index + 1} · ${new Date(`${day.data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}`,
            members: membros.filter((member) => member.dias.includes(day.id)),
          }))
        : [
            {
              id: "all",
              title:
                dayFilter === "todos"
                  ? "Escala da operação"
                  : `Escala do dia ${evento.dias.findIndex((day) => day.id === dayFilter) + 1}`,
              members: filtered,
            },
          ];
  return (
    <section className="min-h-[620px] overflow-hidden rounded-2xl border border-border/70 bg-card/45">
      <header className="border-b border-border/60 p-5 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </span>
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-[.2em] text-primary">
                Comando de equipe
              </span>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                Quem faz a operação acontecer
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Monte a escala por função e por dia. Chamada, kit e responsabilidade acompanham cada
                profissional até o Modo Live.
              </p>
            </div>
          </div>
          <Button onClick={openNew}>
            <Plus className="size-4" /> Adicionar à equipe
          </Button>
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <TeamMetric
            icon={Users}
            label="Equipe escalada"
            value={String(membros.length)}
            detail={`${confirmed} confirmados`}
          />
          <TeamMetric
            icon={UserCheck}
            label="Confirmação"
            value={membros.length ? `${Math.round((confirmed / membros.length) * 100)}%` : "0%"}
            detail={
              !membros.length
                ? "Nenhum escalado"
                : membros.length - confirmed
                  ? `${membros.length - confirmed} aguardando`
                  : "Escala fechada"
            }
          />
          <TeamMetric
            icon={PackageCheck}
            label="Kits atribuídos"
            value={String(membros.filter((member) => member.equipamentos.length).length)}
            detail={`${membros.reduce((total, member) => total + member.equipamentos.length, 0)} itens sob cuidado`}
          />
          <TeamMetric
            icon={CircleDollarSign}
            label="Cachês previstos"
            value={brl(costs)}
            detail="somente desta operação"
          />
        </div>
      </header>

      <div className="border-b border-border/50 bg-surface-1/20 px-5 py-3 sm:px-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-xl bg-background/60 p-1">
            {(["equipe", "dia", "função"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={cn(
                  "rounded-lg px-3 py-2 text-[10px] font-medium capitalize transition",
                  view === item
                    ? "bg-surface-2 text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {item === "equipe" ? "Visão geral" : `Por ${item}`}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setDayFilter("todos")}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-2 text-[10px]",
                dayFilter === "todos"
                  ? "border-primary/30 bg-primary/8 text-primary"
                  : "border-border/60 text-muted-foreground",
              )}
            >
              Todos os dias
            </button>
            {evento.dias.map((day, index) => (
              <button
                key={day.id}
                onClick={() => setDayFilter(day.id)}
                className={cn(
                  "shrink-0 rounded-lg border px-3 py-2 text-[10px]",
                  dayFilter === day.id
                    ? "border-primary/30 bg-primary/8 text-primary"
                    : "border-border/60 text-muted-foreground",
                )}
              >
                Dia {index + 1} ·{" "}
                {new Date(`${day.data}T12:00:00`).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.id}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold">{group.title}</h3>
                <span className="text-[9px] text-muted-foreground">
                  {group.members.length} profissionais
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {group.members.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    evento={evento}
                    onPreview={() => setPreviewMember(member)}
                    onEdit={() => edit(member)}
                  />
                ))}
              </div>
            </div>
          ))}
          {!filtered.length && <TeamEmpty onAdd={openNew} />}
        </div>
        <aside className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-surface-1/25 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="text-xs font-semibold">Saúde da escala</h3>
            </div>
            <div className="mt-4 space-y-3">
              <TeamHealth ok={membros.length > 0} text="Profissionais identificados" />
              <TeamHealth
                ok={membros.every((m) => m.status === "confirmado")}
                text="Confirmações concluídas"
              />
              <TeamHealth
                ok={membros.every((m) => m.dias.length > 0)}
                text="Presença definida por dia"
              />
              <TeamHealth
                ok={membros.every((m) => (m.escalas?.length ?? 0) > 0)}
                text="Chamadas configuradas"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" />
              <h3 className="text-xs font-semibold">Funções descobertas</h3>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              Sugestões operacionais, não exigências.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {uncovered.slice(0, 6).map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    setDraft({ ...emptyMember(), funcaoId: role.id, funcao: role.name });
                    setStep(2);
                    setOpen(true);
                  }}
                  className="rounded-lg border border-border/60 px-2 py-1.5 text-[9px] text-muted-foreground hover:border-primary/30 hover:text-primary"
                >
                  + {role.name}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <div className="flex items-center gap-4">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </span>
              <div>
                <DialogTitle className="font-display text-xl">
                  {membros.some((member) => member.id === draft.id)
                    ? "Editar escala"
                    : "Adicionar à operação"}
                </DialogTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step === 1
                    ? "Comece pela necessidade da produção."
                    : step === 2
                      ? "Identifique quem assume esta função."
                      : "Feche presença, chamada, kit e custos."}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="px-6 pt-5">
            <div className="grid grid-cols-3 gap-2">
              {["Função", "Profissional", "Operação"].map((label, index) => (
                <div
                  key={label}
                  className={cn(
                    "border-t-2 pt-2 text-[9px] font-semibold uppercase tracking-wider",
                    step >= index + 1
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  0{index + 1} · {label}
                </div>
              ))}
            </div>
          </div>
          <div className="min-h-[350px] px-6 py-6">
            {step === 1 && <RolePicker draft={draft} setDraft={setDraft} />}
            {step === 2 && <ProfessionalForm draft={draft} setDraft={setDraft} />}
            {step === 3 && <OperationForm evento={evento} draft={draft} setDraft={setDraft} />}
          </div>
          <DialogFooter className="border-t border-border/60 bg-surface-1/25 px-6 py-4 sm:justify-between">
            <div className="flex gap-2">
              {membros.some((member) => member.id === draft.id) && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    save(membros.filter((member) => member.id !== draft.id));
                    setOpen(false);
                  }}
                >
                  <Trash2 className="size-4" /> Remover
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => (step === 1 ? setOpen(false) : setStep(step - 1))}
              >
                {step === 1 ? "Cancelar" : "Voltar"}
              </Button>
            </div>
            {step < 3 ? (
              <Button
                disabled={step === 1 ? !draft.funcao : !draft.nome.trim()}
                onClick={() => setStep(step + 1)}
              >
                Continuar
              </Button>
            ) : (
              <Button disabled={!draft.nome.trim() || !draft.funcao} onClick={submit}>
                Salvar na operação
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TeamMemberPreview
        member={previewMember}
        evento={evento}
        onClose={() => setPreviewMember(null)}
        onEdit={(member) => {
          setPreviewMember(null);
          edit(member);
        }}
      />
    </section>
  );
}

function TeamMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/55 bg-surface-1/20 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background/60 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <strong className="font-display text-lg">{value}</strong>
          <span className="truncate text-[9px] text-muted-foreground">{detail}</span>
        </div>
      </div>
    </div>
  );
}

function TeamMemberCard({
  member,
  evento,
  onPreview,
  onEdit,
}: {
  member: MembroEquipeEvento;
  evento: EventoProducao;
  onPreview: () => void;
  onEdit: () => void;
}) {
  const role = TEAM_ROLES.find((item) => item.id === member.funcaoId);
  const Icon = role?.icon ?? Users;
  const status = member.status ?? "aguardando";
  const statusMap = {
    confirmado: ["Confirmado", "text-primary bg-primary/10"],
    aguardando: ["Aguardando", "text-warning bg-warning/10"],
    convidado: ["Convidado", "text-info bg-info/10"],
    indisponivel: ["Indisponível", "text-destructive bg-destructive/10"],
  } as const;
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onPreview}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPreview();
        }
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/65 bg-surface-1/25 p-4 outline-none transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-surface-2/40 focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="absolute inset-y-0 left-0 w-0.5 bg-primary/60" />
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="truncate text-sm font-semibold">
                {member.nome || "Profissional a definir"}
              </h3>
              <p className="mt-0.5 text-[10px] text-primary">{member.funcao}</p>
            </div>
            <button
              aria-label={`Editar ${member.nome}`}
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              className="grid size-7 place-items-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-background group-hover:opacity-100"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
          <span
            className={cn(
              "mt-2 inline-flex rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-wider",
              statusMap[status][1],
            )}
          >
            {statusMap[status][0]}
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <CardFact
          icon={Clock3}
          label="Chamada"
          value={member.escalas?.[0]?.chamada ?? "A definir"}
        />
        <CardFact
          icon={PackageCheck}
          label="Kit"
          value={member.equipamentos.length ? `${member.equipamentos.length} itens` : "Sem kit"}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {member.dias.map((dayId) => {
          const index = evento.dias.findIndex((day) => day.id === dayId);
          return index >= 0 ? (
            <span
              key={dayId}
              className="rounded-md border border-border/55 px-2 py-1 text-[8px] text-muted-foreground"
            >
              DIA {index + 1}
            </span>
          ) : null;
        })}
        <span className="rounded-md border border-border/55 px-2 py-1 text-[8px] capitalize text-muted-foreground">
          {member.vinculo}
        </span>
        {member.alimentacao && (
          <span className="rounded-md border border-border/55 p-1 text-muted-foreground">
            <Utensils className="size-2.5" />
          </span>
        )}
        {member.transporte && (
          <span className="rounded-md border border-border/55 p-1 text-muted-foreground">
            <Car className="size-2.5" />
          </span>
        )}
      </div>
      {member.equipamentos.length > 0 && (
        <p className="mt-3 truncate border-t border-border/45 pt-3 text-[9px] text-muted-foreground">
          {member.equipamentos.join(" · ")}
        </p>
      )}
    </article>
  );
}

function TeamMemberPreview({
  member,
  evento,
  onClose,
  onEdit,
}: {
  member: MembroEquipeEvento | null;
  evento: EventoProducao;
  onClose: () => void;
  onEdit: (member: MembroEquipeEvento) => void;
}) {
  if (!member) return null;
  const role = TEAM_ROLES.find((item) => item.id === member.funcaoId);
  const Icon = role?.icon ?? Users;
  const status = member.status ?? "aguardando";
  const statusMap = {
    confirmado: ["Confirmado", "border-primary/25 bg-primary/10 text-primary"],
    aguardando: ["Aguardando resposta", "border-warning/25 bg-warning/10 text-warning"],
    convidado: ["Convidado", "border-info/25 bg-info/10 text-info"],
    indisponivel: ["Indisponível", "border-destructive/25 bg-destructive/10 text-destructive"],
  } as const;

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/60 bg-surface-1/20 px-6 py-6 text-left">
          <div className="flex items-start gap-4 pr-8">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-display text-2xl">{member.nome}</DialogTitle>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-wider",
                    statusMap[status][1],
                  )}
                >
                  {statusMap[status][0]}
                </span>
              </div>
              <p className="mt-1 text-sm text-primary">{member.funcao}</p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {member.vinculo} · {member.dias.length} de {evento.dias.length} dias escalado
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {status !== "confirmado" && (
            <div className="flex gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                <p className="text-xs font-semibold">Presença ainda não confirmada</p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                  Confirme a disponibilidade antes de fechar chamadas, transporte e equipamentos.
                </p>
              </div>
            </div>
          )}

          <section>
            <PreviewHeading
              icon={Clock3}
              title="Escala por dia"
              detail="Presença e janela operacional"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {evento.dias.map((day, index) => {
                const active = member.dias.includes(day.id);
                const escala = member.escalas?.find((item) => item.diaId === day.id);
                return (
                  <div
                    key={day.id}
                    className={cn(
                      "rounded-xl border p-3",
                      active
                        ? "border-primary/20 bg-primary/[0.04]"
                        : "border-border/50 bg-surface-1/15 opacity-55",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-primary">
                          Dia {index + 1}
                        </p>
                        <p className="mt-1 text-xs font-medium">
                          {new Date(`${day.data}T12:00:00`).toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        {active
                          ? `${escala?.chamada ?? day.inicio} — ${escala?.fim ?? day.fim}`
                          : "Fora da escala"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <PreviewHeading
                icon={UserCheck}
                title="Contato operacional"
                detail="Acesso rápido durante o evento"
              />
              <div className="mt-3 space-y-2 rounded-2xl border border-border/55 bg-surface-1/15 p-4">
                <PreviewLine label="Telefone" value={member.telefone || "Não informado"} />
                <PreviewLine label="E-mail" value={member.email || "Não informado"} />
                <PreviewLine label="Vínculo" value={member.vinculo} capitalize />
              </div>
            </section>
            <section>
              <PreviewHeading icon={Wallet} title="Condições" detail="Acordos desta operação" />
              <div className="mt-3 space-y-2 rounded-2xl border border-border/55 bg-surface-1/15 p-4">
                <PreviewLine label="Cachê previsto" value={brl(member.cache ?? 0)} />
                <PreviewLine
                  label="Alimentação"
                  value={member.alimentacao ? "Prevista" : "Não prevista"}
                />
                <PreviewLine
                  label="Transporte"
                  value={member.transporte ? "Previsto" : "Não previsto"}
                />
              </div>
            </section>
          </div>

          <section>
            <PreviewHeading
              icon={PackageCheck}
              title="Kit sob responsabilidade"
              detail="Equipamentos vinculados ao profissional"
            />
            <div className="mt-3 rounded-2xl border border-border/55 bg-surface-1/15 p-4">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                Origem ·{" "}
                <span className="capitalize text-foreground">
                  {member.equipamentoOrigem ?? "produtora"}
                </span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {member.equipamentos.length ? (
                  member.equipamentos.map((item) => (
                    <span
                      key={item}
                      className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-[10px]"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhum equipamento atribuído.</p>
                )}
              </div>
            </div>
          </section>

          {member.observacoes && (
            <section>
              <PreviewHeading
                icon={FileText}
                title="Observações"
                detail="Recados e restrições operacionais"
              />
              <p className="mt-3 whitespace-pre-wrap rounded-2xl border border-border/55 bg-surface-1/15 p-4 text-xs leading-relaxed text-muted-foreground">
                {member.observacoes}
              </p>
            </section>
          )}
        </div>

        <DialogFooter className="border-t border-border/60 bg-surface-1/20 px-6 py-4">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={() => onEdit(member)}>
            <Pencil className="size-4" /> Editar escala
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewHeading({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Users;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary">
        <Icon className="size-3.5" />
      </span>
      <div>
        <h3 className="text-xs font-semibold">{title}</h3>
        <p className="mt-0.5 text-[9px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function PreviewLine({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <span className={cn("text-[10px] font-medium", capitalize && "capitalize")}>{value}</span>
    </div>
  );
}

function CardFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-background/35 px-2.5 py-2">
      <p className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-2.5" />
        {label}
      </p>
      <p className="mt-1 truncate text-[10px] font-medium">{value}</p>
    </div>
  );
}

function TeamHealth({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
      ) : (
        <Circle className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <span className={cn("text-[10px]", !ok && "text-muted-foreground")}>{text}</span>
    </div>
  );
}

function TeamEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border/60 bg-surface-1/10 p-8 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/8 text-primary">
          <Users className="size-6" />
        </span>
        <h3 className="mt-4 font-display text-lg font-semibold">
          Sua operação ainda não tem equipe
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
          Comece pela função que o evento precisa. Depois escolha a pessoa, os dias, a chamada e o
          kit que ela assume.
        </p>
        <Button className="mt-5" onClick={onAdd}>
          <Plus className="size-4" /> Montar primeira função
        </Button>
      </div>
    </div>
  );
}

function RolePicker({
  draft,
  setDraft,
}: {
  draft: MembroEquipeEvento;
  setDraft: (member: MembroEquipeEvento) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-xs font-medium">Qual necessidade esta pessoa cobre?</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM_ROLES.map((role) => {
          const Icon = role.icon;
          const active = draft.funcaoId === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setDraft({ ...draft, funcaoId: role.id, funcao: role.name })}
              className={cn(
                "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5",
                active
                  ? "border-primary/45 bg-primary/[.07]"
                  : "border-border/60 bg-surface-1/20 hover:border-primary/25",
              )}
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-xl",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <h3 className="mt-4 text-xs font-semibold">{role.name}</h3>
              <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">{role.desc}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <F label="Outra função">
          <Input
            value={TEAM_ROLES.some((role) => role.id === draft.funcaoId) ? "" : draft.funcao}
            onChange={(event) =>
              setDraft({ ...draft, funcaoId: "custom", funcao: event.target.value })
            }
            placeholder="Steadicam, assistente de câmera, logger…"
          />
        </F>
      </div>
    </div>
  );
}

function ProfessionalForm({
  draft,
  setDraft,
}: {
  draft: MembroEquipeEvento;
  setDraft: (member: MembroEquipeEvento) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <F label="Nome do profissional">
              <Input
                autoFocus
                className="h-11 rounded-xl bg-background/40"
                value={draft.nome}
                onChange={(event) => setDraft({ ...draft, nome: event.target.value })}
                placeholder="Quem assume esta função?"
              />
            </F>
          </div>
          <F label="Telefone operacional">
            <PhoneInput
              className="h-10 rounded-xl bg-background/40"
              value={draft.telefone ?? ""}
              onValueChange={(telefone) => setDraft({ ...draft, telefone })}
              placeholder="(00) 00000-0000"
            />
          </F>
          <F label="E-mail">
            <Input
              type="email"
              inputMode="email"
              className="h-10 rounded-xl bg-background/40"
              value={draft.email ?? ""}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              placeholder="nome@email.com"
            />
          </F>
          <F label="Vínculo">
            <Select
              value={draft.vinculo}
              onValueChange={(vinculo) =>
                setDraft({ ...draft, vinculo: vinculo as MembroEquipeEvento["vinculo"] })
              }
            >
              <SelectTrigger className="h-10 rounded-xl bg-background/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equipe">Equipe fixa</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="fornecedor">Fornecedor</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label="Confirmação">
            <Select
              value={draft.status ?? "aguardando"}
              onValueChange={(status) =>
                setDraft({ ...draft, status: status as MembroEquipeEvento["status"] })
              }
            >
              <SelectTrigger className="h-10 rounded-xl bg-background/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="convidado">Convidado</SelectItem>
                <SelectItem value="aguardando">Aguardando resposta</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="indisponivel">Indisponível</SelectItem>
              </SelectContent>
            </Select>
          </F>
        </div>
        <F label="Observações">
          <Textarea
            className="min-h-24 rounded-xl bg-background/40 leading-relaxed"
            value={draft.observacoes ?? ""}
            onChange={(event) => setDraft({ ...draft, observacoes: event.target.value })}
            placeholder="Restrições, contato alternativo, habilidades adicionais…"
          />
        </F>
      </div>
      <div className="rounded-2xl border border-primary/20 bg-primary/[.035] p-5">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </span>
        <h3 className="mt-4 font-display text-lg font-semibold">{draft.funcao || "Função"}</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Este profissional aparecerá na programação e no Modo Live apenas nos dias em que estiver
          escalado.
        </p>
        <div className="mt-5 rounded-xl border border-primary/15 p-3">
          <p className="text-[9px] uppercase tracking-wider text-primary">Boa prática</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Use o telefone que realmente estará disponível durante o evento. No campo, rapidez vale
            mais que cadastro completo.
          </p>
        </div>
      </div>
    </div>
  );
}

function OperationForm({
  evento,
  draft,
  setDraft,
}: {
  evento: EventoProducao;
  draft: MembroEquipeEvento;
  setDraft: (member: MembroEquipeEvento) => void;
}) {
  const toggleDay = (dayId: string) => {
    const active = draft.dias.includes(dayId);
    setDraft({
      ...draft,
      dias: active ? draft.dias.filter((id) => id !== dayId) : [...draft.dias, dayId],
      escalas: active
        ? (draft.escalas ?? []).filter((scale) => scale.diaId !== dayId)
        : [
            ...(draft.escalas ?? []),
            {
              diaId: dayId,
              chamada: evento.dias.find((day) => day.id === dayId)?.inicio ?? "08:00",
              fim: evento.dias.find((day) => day.id === dayId)?.fim ?? "18:00",
            },
          ],
    });
  };
  const updateScale = (
    dayId: string,
    patch: Partial<NonNullable<MembroEquipeEvento["escalas"]>[number]>,
  ) =>
    setDraft({
      ...draft,
      escalas: (draft.escalas ?? []).map((scale) =>
        scale.diaId === dayId ? { ...scale, ...patch } : scale,
      ),
    });
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3">
          <h3 className="text-xs font-semibold">Presença e chamada</h3>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Cada dia tem sua própria escala. Desmarque quando o profissional não trabalhar.
          </p>
        </div>
        <div className="space-y-2">
          {evento.dias.map((day, index) => {
            const active = draft.dias.includes(day.id);
            const scale = draft.escalas?.find((item) => item.diaId === day.id);
            return (
              <div
                key={day.id}
                className={cn(
                  "grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_130px_130px] sm:items-end",
                  active ? "border-primary/25 bg-primary/[.025]" : "border-border/50 opacity-55",
                )}
              >
                <button
                  onClick={() => toggleDay(day.id)}
                  className="flex items-center gap-3 text-left"
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-lg border",
                      active ? "border-primary/30 bg-primary/10 text-primary" : "border-border",
                    )}
                  >
                    {active ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                  </span>
                  <div>
                    <p className="text-xs font-semibold">Dia {index + 1}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      {new Date(`${day.data}T12:00:00`).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      })}
                    </p>
                  </div>
                </button>
                {active && (
                  <>
                    <F label="Chamada">
                      <EventoTimeField
                        value={scale?.chamada ?? day.inicio}
                        onChange={(chamada) => updateScale(day.id, { chamada })}
                      />
                    </F>
                    <F label="Liberação">
                      <EventoTimeField
                        value={scale?.fim ?? day.fim}
                        onChange={(fim) => updateScale(day.id, { fim })}
                      />
                    </F>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border/60 p-4">
          <div>
            <h3 className="text-xs font-semibold">Kit sob responsabilidade</h3>
            <p className="mt-1 text-[9px] text-muted-foreground">
              Itens que esta pessoa retira, usa e devolve.
            </p>
          </div>
          <Input
            value={draft.equipamentos.join(", ")}
            onChange={(event) =>
              setDraft({
                ...draft,
                equipamentos: [event.target.value],
              })
            }
            className="h-11 rounded-xl bg-background/40"
            placeholder="Câmera A, 24-70mm, gimbal, cartões…"
          />
          <F label="Origem do kit">
            <Select
              value={draft.equipamentoOrigem ?? "produtora"}
              onValueChange={(equipamentoOrigem) =>
                setDraft({
                  ...draft,
                  equipamentoOrigem: equipamentoOrigem as MembroEquipeEvento["equipamentoOrigem"],
                })
              }
            >
              <SelectTrigger className="h-10 rounded-xl bg-background/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="produtora">Produtora</SelectItem>
                <SelectItem value="proprio">Equipamento próprio</SelectItem>
                <SelectItem value="alugado">Alugado para o evento</SelectItem>
              </SelectContent>
            </Select>
          </F>
        </div>
        <div className="space-y-3 rounded-2xl border border-border/60 p-4">
          <div>
            <h3 className="text-xs font-semibold">Condições da diária</h3>
            <p className="mt-1 text-[9px] text-muted-foreground">
              Alimenta o financeiro interno do evento.
            </p>
          </div>
          <F label="Cachê / diária">
            <CurrencyInput
              className="h-11 rounded-xl bg-background/40"
              value={draft.cache ?? 0}
              onValueChange={(cache) => setDraft({ ...draft, cache })}
            />
          </F>
          <div className="flex gap-2">
            <ToggleOption
              active={!!draft.alimentacao}
              icon={Utensils}
              label="Alimentação"
              onClick={() => setDraft({ ...draft, alimentacao: !draft.alimentacao })}
            />
            <ToggleOption
              active={!!draft.transporte}
              icon={Car}
              label="Transporte"
              onClick={() => setDraft({ ...draft, transporte: !draft.transporte })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ToggleOption({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Car;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-[10px]",
        active
          ? "border-primary/30 bg-primary/8 text-primary"
          : "border-border/60 text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function PanelShell({
  icon: Icon,
  title,
  desc,
  action,
  children,
}: {
  icon: typeof Wallet;
  title: string;
  desc: string;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-[440px] rounded-2xl border border-border/70 bg-card/45 p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/8 text-primary">
            <Icon className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{desc}</p>
        </div>
        {action}
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px]">{label}</Label>
      {children}
    </div>
  );
}
function Money({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 p-5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-display text-2xl font-semibold", accent && "text-primary")}>
        {brl(value)}
      </p>
    </div>
  );
}
