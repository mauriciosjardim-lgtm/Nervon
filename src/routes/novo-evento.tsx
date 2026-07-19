import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Clapperboard,
  ClipboardList,
  Headphones,
  Link2,
  MapPin,
  Mic2,
  MonitorPlay,
  Plane,
  Plus,
  Radio,
  Settings2,
  Trash2,
  UserRoundCog,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useComercialSupa } from "@/lib/hooks/useComercial";
import { eventosProducaoActions } from "@/lib/eventos/storage";
import { cn } from "@/lib/utils";
import { EventoDateField, EventoTimeField } from "@/components/eventos/event-form-fields";
import type {
  FuncaoEquipeEvento,
  MembroEquipeEvento,
  MomentoEvento,
  ReferenciaEvento,
} from "@/lib/eventos/types";
import { eventosPublicamenteAtivo } from "@/lib/eventos/availability";

export const Route = createFileRoute("/novo-evento")({
  beforeLoad: () => {
    if (!eventosPublicamenteAtivo()) throw redirect({ to: "/eventos" });
  },
  ssr: false,
  component: NovoEventoWizard,
});
type Dia = { id: string; data: string; inicio: string; fim: string; local: string };
const dia = (): Dia => ({
  id: crypto.randomUUID(),
  data: "",
  inicio: "08:00",
  fim: "18:00",
  local: "",
});
const passos = [
  { n: 1, nome: "Evento", icon: CalendarDays },
  { n: 2, nome: "Datas iniciais", icon: MapPin },
];
const funcoesPadrao = [
  {
    id: "produtor",
    nome: "Produtor",
    desc: "Coordenação e interface com o cliente",
    icon: UserRoundCog,
  },
  { id: "diretor", nome: "Diretor", desc: "Direção criativa e técnica", icon: Clapperboard },
  {
    id: "videomaker",
    nome: "Videomaker",
    desc: "Captação de palco, público e bastidores",
    icon: Video,
  },
  { id: "fotografo", nome: "Fotógrafo", desc: "Cobertura fotográfica do evento", icon: Camera },
  {
    id: "realtime",
    nome: "Editor realtime",
    desc: "Edição e publicação durante o evento",
    icon: MonitorPlay,
  },
  { id: "fpv", nome: "Piloto FPV", desc: "Imagens aéreas e movimentos especiais", icon: Plane },
  { id: "drone", nome: "Operador de drone", desc: "Captação aérea convencional", icon: Radio },
  {
    id: "audio",
    nome: "Técnico de áudio",
    desc: "Captação, monitoramento e backup de som",
    icon: Headphones,
  },
  {
    id: "assistente",
    nome: "Assistente",
    desc: "Apoio de produção, logística e equipamento",
    icon: Settings2,
  },
  {
    id: "reporter",
    nome: "Repórter / entrevistador",
    desc: "Entrevistas, conteúdo e apresentação",
    icon: Mic2,
  },
];

function NovoEventoWizard() {
  const navigate = useNavigate();
  const { empresas } = useComercialSupa();
  const [passo, setPasso] = useState(1);
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState("Corporativo");
  const [local, setLocal] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState("#90F826");
  const [dias, setDias] = useState<Dia[]>([dia()]);
  const [funcoes, setFuncoes] = useState<FuncaoEquipeEvento[]>([]);
  const [membros, setMembros] = useState<MembroEquipeEvento[]>([]);
  const [etapaEquipe, setEtapaEquipe] = useState<"composicao" | "escala">("composicao");
  const [funcaoCustom, setFuncaoCustom] = useState("");
  const [programacao, setProgramacao] = useState<MomentoEvento[]>([]);
  const [referencias, setReferencias] = useState<ReferenciaEvento[]>([]);
  const [orientacoes, setOrientacoes] = useState("");
  const [valorOrcado, setValorOrcado] = useState(0);
  const valido =
    passo === 1 ? !!nome.trim() && !!cliente.trim() : passo === 2 ? dias.some((d) => d.data) : true;
  const atualizarDia = (id: string, p: Partial<Dia>) =>
    setDias((ds) => ds.map((d) => (d.id === id ? { ...d, ...p } : d)));
  const quantidade = (id: string) => funcoes.find((f) => f.id === id)?.quantidade ?? 0;
  const definirQuantidade = (id: string, nomeFuncao: string, valor: number) =>
    setFuncoes((fs) =>
      valor <= 0
        ? fs.filter((f) => f.id !== id)
        : fs.some((f) => f.id === id)
          ? fs.map((f) => (f.id === id ? { ...f, quantidade: valor } : f))
          : [...fs, { id, nome: nomeFuncao, quantidade: valor }],
    );
  const totalEquipe = funcoes.reduce((n, f) => n + f.quantidade, 0);
  const adicionarCustom = () => {
    const nomeCustom = funcaoCustom.trim();
    if (!nomeCustom) return;
    const id = `custom-${crypto.randomUUID()}`;
    setFuncoes((fs) => [...fs, { id, nome: nomeCustom, quantidade: 1 }]);
    setFuncaoCustom("");
  };
  const prepararEscala = () => {
    const proximos: MembroEquipeEvento[] = [];
    for (const f of funcoes)
      for (let i = 0; i < f.quantidade; i++) {
        const existente = membros.filter((m) => m.funcaoId === f.id)[i];
        proximos.push(
          existente ?? {
            id: crypto.randomUUID(),
            funcaoId: f.id,
            funcao: f.nome,
            nome: "",
            vinculo: "freelancer",
            dias: dias.filter((d) => d.data).map((d) => d.id),
            equipamentos: [],
          },
        );
      }
    setMembros(proximos);
    setEtapaEquipe("escala");
  };
  const atualizarMembro = (id: string, p: Partial<MembroEquipeEvento>) =>
    setMembros((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const novoMomento = (diaId: string): MomentoEvento => ({
    id: crypto.randomUUID(),
    diaId,
    inicio: "09:00",
    fim: "10:00",
    titulo: "",
    responsavelIds: [],
  });
  const atualizarMomento = (id: string, p: Partial<MomentoEvento>) =>
    setProgramacao((ps) => ps.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const novaReferencia = (): ReferenciaEvento => ({ id: crypto.randomUUID(), titulo: "", url: "" });
  const concluir = () => {
    const ev = eventosProducaoActions.criar({
      nome: nome.trim(),
      cliente: cliente.trim(),
      clienteId: clienteId || undefined,
      tipo,
      local,
      descricao: descricao || undefined,
      cor,
      status: "planejamento",
      dias: dias.filter((d) => d.data),
      equipe: 0,
      equipeFuncoes: [],
      equipeMembros: [],
      programacao: [],
      referencias: [],
      tarefasConcluidas: 0,
      tarefasTotal: 0,
      receitaPrevista: 0,
      custosPrevistos: 0,
    });
    navigate({ to: "/operacao-evento/$id", params: { id: ev.id } });
  };
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <Link
          to="/eventos"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Voltar para a Central
        </Link>
        <header className="mt-7">
          <span className="text-[10px] font-semibold uppercase tracking-[.2em] text-primary">
            Nova operação
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold">Crie a base do evento</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre o que já está definido. Equipe, cronograma e custos podem amadurecer dentro do
            workspace.
          </p>
        </header>
        <div className="mt-8 grid gap-7 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-1">
            {passos.map((p) => (
              <button
                key={p.n}
                onClick={() => p.n < passo && setPasso(p.n)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                  passo === p.n
                    ? "bg-primary/10 text-primary"
                    : p.n < passo
                      ? "text-foreground hover:bg-surface-2"
                      : "cursor-default text-muted-foreground/50",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-lg border",
                    passo === p.n ? "border-primary/35 bg-primary/10" : "border-border/60",
                  )}
                >
                  {p.n < passo ? <Check className="size-4" /> : <p.icon className="size-4" />}
                </span>
                <span>
                  <span className="block text-[10px] uppercase tracking-wider opacity-60">
                    Etapa {p.n}
                  </span>
                  <span className="text-sm font-medium">{p.nome}</span>
                </span>
              </button>
            ))}
          </aside>
          <section className="min-h-[520px] rounded-2xl border border-border/70 bg-card/50 p-5 sm:p-7">
            {passo === 1 && (
              <div className="space-y-5">
                <StepTitle
                  n="01"
                  title="Identidade do evento"
                  desc="As informações que identificam esta operação."
                />
                <Field label="Nome do evento">
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Convenção comercial 2026"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Cliente">
                    <Input
                      list="clientes-wizard"
                      value={cliente}
                      onChange={(e) => {
                        setCliente(e.target.value);
                        setClienteId(empresas.find((x) => x.nome === e.target.value)?.id ?? "");
                      }}
                      placeholder="Livre ou vindo do CRM"
                    />
                    <datalist id="clientes-wizard">
                      {empresas.map((e) => (
                        <option key={e.id} value={e.nome} />
                      ))}
                    </datalist>
                  </Field>
                  <Field label="Tipo de evento">
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option>Corporativo</option>
                      <option>Social</option>
                      <option>Show / festival</option>
                      <option>Esportivo</option>
                      <option>Outro</option>
                    </select>
                  </Field>
                </div>
                <Field label="Local principal">
                  <Input
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Local, cidade ou endereço"
                  />
                </Field>
                <Field label="Contexto da operação">
                  <Textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={4}
                    placeholder="Escopo, objetivo e observações iniciais…"
                  />
                </Field>
                <Field label="Cor de identificação">
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                    <input
                      type="color"
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                      className="size-9"
                    />
                    <span className="text-xs text-muted-foreground">
                      Usada nos dias, cards e modo evento.
                    </span>
                  </div>
                </Field>
              </div>
            )}
            {passo === 2 && (
              <div className="space-y-5">
                <StepTitle
                  n="02"
                  title="Datas iniciais"
                  desc="Registre apenas o que já estiver confirmado. Locais e horários podem ser refinados depois."
                />
                <div className="space-y-3">
                  {dias.map((d, i) => (
                    <div
                      key={d.id}
                      className="rounded-xl border border-border/70 bg-surface-1/30 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary">
                          DIA {String(i + 1).padStart(2, "0")}
                        </span>
                        <button
                          disabled={dias.length === 1}
                          onClick={() => setDias((x) => x.filter((y) => y.id !== d.id))}
                          className="text-muted-foreground hover:text-destructive disabled:opacity-20"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <Field label="Data">
                          <EventoDateField
                            value={d.data}
                            onChange={(value) => atualizarDia(d.id, { data: value })}
                          />
                        </Field>
                        <Field label="Início estimado">
                          <EventoTimeField
                            value={d.inicio}
                            onChange={(value) => atualizarDia(d.id, { inicio: value })}
                          />
                        </Field>
                        <Field label="Fim estimado">
                          <EventoTimeField
                            value={d.fim}
                            onChange={(value) => atualizarDia(d.id, { fim: value })}
                          />
                        </Field>
                        <Field label="Local inicial">
                          <Input
                            value={d.local}
                            onChange={(e) => atualizarDia(d.id, { local: e.target.value })}
                            placeholder="Opcional"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={() => setDias((x) => [...x, dia()])}>
                  <Plus className="size-4" /> Adicionar outro dia
                </Button>
              </div>
            )}
            {passo === 3 && etapaEquipe === "composicao" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <StepTitle
                    n="03.1"
                    title="Monte a equipe da operação"
                    desc="Escolha as funções e dimensione a equipe. No próximo passo você identifica cada profissional."
                  />
                  <div className="mb-7 shrink-0 rounded-xl border border-primary/25 bg-primary/[.05] px-4 py-3 text-right">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Equipe prevista
                    </p>
                    <p className="font-display text-2xl font-semibold text-primary">
                      {totalEquipe}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {funcoesPadrao.map((f) => {
                    const q = quantidade(f.id);
                    const Icon = f.icon;
                    return (
                      <div
                        key={f.id}
                        className={cn(
                          "group rounded-2xl border p-4 transition",
                          q > 0
                            ? "border-primary/40 bg-primary/[.055] shadow-[0_10px_35px_-28px_var(--primary)]"
                            : "border-border/65 bg-surface-1/30 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-surface-2/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={cn(
                              "grid size-10 shrink-0 place-items-center rounded-xl border",
                              q > 0
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border/60 bg-surface-2 text-muted-foreground",
                            )}
                          >
                            <Icon className="size-4.5" />
                          </span>
                          {q > 0 && (
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary">
                              NA EQUIPE
                            </span>
                          )}
                        </div>
                        <h3 className="mt-4 font-display text-sm font-semibold">{f.nome}</h3>
                        <p className="mt-1 min-h-8 text-[11px] leading-relaxed text-muted-foreground">
                          {f.desc}
                        </p>
                        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                          <span className="text-[10px] text-muted-foreground">Quantidade</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => definirQuantidade(f.id, f.nome, q - 1)}
                              disabled={q === 0}
                              className="grid size-7 place-items-center rounded-lg border border-border text-sm text-muted-foreground transition hover:border-primary/30 hover:text-primary disabled:opacity-25"
                            >
                              −
                            </button>
                            <span className="w-6 text-center font-mono text-sm font-semibold">
                              {q}
                            </span>
                            <button
                              type="button"
                              onClick={() => definirQuantidade(f.id, f.nome, q + 1)}
                              className="grid size-7 place-items-center rounded-lg border border-border text-sm text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-2xl border border-dashed border-border/80 bg-surface-1/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <Field label="Não encontrou a função?">
                        <Input
                          value={funcaoCustom}
                          onChange={(e) => setFuncaoCustom(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && adicionarCustom()}
                          placeholder="Ex: Operador de LED, logger, diretor de corte…"
                        />
                      </Field>
                    </div>
                    <Button variant="outline" onClick={adicionarCustom}>
                      <Plus className="size-4" /> Adicionar função
                    </Button>
                  </div>
                  {funcoes.filter((f) => f.id.startsWith("custom-")).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {funcoes
                        .filter((f) => f.id.startsWith("custom-"))
                        .map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/[.04] px-3 py-2 text-xs"
                          >
                            <span>{f.nome}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => definirQuantidade(f.id, f.nome, f.quantidade - 1)}
                                className="text-muted-foreground hover:text-primary"
                              >
                                −
                              </button>
                              <strong className="w-4 text-center">{f.quantidade}</strong>
                              <button
                                onClick={() => definirQuantidade(f.id, f.nome, f.quantidade + 1)}
                                className="text-muted-foreground hover:text-primary"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => definirQuantidade(f.id, f.nome, 0)}
                              className="ml-1 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <p className="rounded-xl border border-primary/20 bg-primary/[.035] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Flexível por dia:</strong> esta é a
                  composição-base. No workspace será possível trocar profissionais, funções,
                  horários e cachês em cada data.
                </p>
              </div>
            )}
            {passo === 3 && etapaEquipe === "escala" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <StepTitle
                    n="03.2"
                    title="Quem estará na operação?"
                    desc="Identifique cada profissional, os dias em que participa e o equipamento sob sua responsabilidade."
                  />
                  <div className="mb-7 shrink-0 rounded-xl border border-primary/25 bg-primary/[.05] px-4 py-3 text-right">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Escala
                    </p>
                    <p className="font-display text-2xl font-semibold text-primary">
                      {membros.filter((m) => m.nome.trim()).length}/{membros.length}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {membros.map((m, i) => (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-border/70 bg-surface-1/30 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                        <div className="flex min-w-[170px] items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 font-mono text-xs font-semibold text-primary">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="text-sm font-semibold">{m.funcao}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Profissional da operação
                            </p>
                          </div>
                        </div>
                        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_.8fr_1fr]">
                          <Field label="Nome">
                            <Input
                              value={m.nome}
                              onChange={(e) => atualizarMembro(m.id, { nome: e.target.value })}
                              placeholder="Nome do profissional"
                            />
                          </Field>
                          <Field label="Vínculo">
                            <select
                              value={m.vinculo}
                              onChange={(e) =>
                                atualizarMembro(m.id, {
                                  vinculo: e.target.value as MembroEquipeEvento["vinculo"],
                                })
                              }
                              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-primary/65 focus-visible:ring-2 focus-visible:ring-primary/15"
                            >
                              <option value="equipe">Equipe fixa</option>
                              <option value="freelancer">Freelancer</option>
                              <option value="fornecedor">Fornecedor</option>
                            </select>
                          </Field>
                          <Field label="Telefone">
                            <PhoneInput
                              value={m.telefone ?? ""}
                              onValueChange={(value) => atualizarMembro(m.id, { telefone: value })}
                              placeholder="(11) 99999-9999"
                            />
                          </Field>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 border-t border-border/50 pt-4 lg:grid-cols-[1fr_1.4fr]">
                        <div>
                          <Label className="text-[10px]">Dias em que participa</Label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {dias
                              .filter((d) => d.data)
                              .map((d, idx) => {
                                const ativo = m.dias.includes(d.id);
                                return (
                                  <button
                                    key={d.id}
                                    type="button"
                                    onClick={() =>
                                      atualizarMembro(m.id, {
                                        dias: ativo
                                          ? m.dias.filter((x) => x !== d.id)
                                          : [...m.dias, d.id],
                                      })
                                    }
                                    className={cn(
                                      "rounded-lg border px-3 py-2 text-[10px] transition",
                                      ativo
                                        ? "border-primary/35 bg-primary/10 text-primary"
                                        : "border-border/60 text-muted-foreground hover:border-primary/25",
                                    )}
                                  >
                                    <strong>DIA {idx + 1}</strong> ·{" "}
                                    {new Date(`${d.data}T12:00:00`).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "short",
                                    })}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                        <Field label="Equipamentos que leva ou opera">
                          <Input
                            value={m.equipamentos.join(", ")}
                            onChange={(e) =>
                              atualizarMembro(m.id, {
                                equipamentos: e.target.value
                                  .split(",")
                                  .map((x) => x.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="Ex: Sony FX3, lente 24-70, gimbal RS4…"
                          />
                          <p className="mt-1 text-[9px] text-muted-foreground">
                            Separe os itens por vírgula.
                          </p>
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="rounded-xl border border-primary/20 bg-primary/[.035] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                  A escala poderá ser refinada depois com horários, cachês e responsáveis por
                  retirada e devolução de cada equipamento.
                </p>
              </div>
            )}
            {passo === 4 && (
              <div className="space-y-7">
                <StepTitle
                  n="04"
                  title="Plano operacional"
                  desc="Organize o que acontece, quando acontece, quem executa e quais referências a equipe precisa ter em mãos."
                />
                <div className="space-y-5">
                  {dias
                    .filter((d) => d.data)
                    .map((d, idx) => {
                      const momentos = programacao.filter((p) => p.diaId === d.id);
                      return (
                        <section
                          key={d.id}
                          className="rounded-2xl border border-border/70 bg-surface-1/25 p-4 sm:p-5"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <span className="text-[10px] font-semibold text-primary">
                                DIA {idx + 1}
                              </span>
                              <h3 className="mt-1 font-display text-base font-semibold capitalize">
                                {new Date(`${d.data}T12:00:00`).toLocaleDateString("pt-BR", {
                                  weekday: "long",
                                  day: "2-digit",
                                  month: "long",
                                })}
                              </h3>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setProgramacao((ps) => [...ps, novoMomento(d.id)])}
                            >
                              <Plus className="size-4" /> Adicionar momento
                            </Button>
                          </div>
                          {momentos.length === 0 ? (
                            <button
                              onClick={() => setProgramacao((ps) => [...ps, novoMomento(d.id)])}
                              className="mt-4 w-full rounded-xl border border-dashed border-border/60 py-7 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                            >
                              + Criar o primeiro item do cronograma
                            </button>
                          ) : (
                            <div className="mt-4 space-y-3">
                              {momentos.map((p, pidx) => (
                                <div
                                  key={p.id}
                                  className="rounded-xl border border-border/60 bg-background/30 p-4"
                                >
                                  <div className="grid gap-3 lg:grid-cols-[65px_110px_110px_1fr_auto]">
                                    <span className="pt-3 font-mono text-[10px] text-muted-foreground">
                                      {String(pidx + 1).padStart(2, "0")}
                                    </span>
                                    <Field label="Início">
                                      <Input
                                        type="time"
                                        value={p.inicio}
                                        onChange={(e) =>
                                          atualizarMomento(p.id, { inicio: e.target.value })
                                        }
                                      />
                                    </Field>
                                    <Field label="Fim">
                                      <Input
                                        type="time"
                                        value={p.fim}
                                        onChange={(e) =>
                                          atualizarMomento(p.id, { fim: e.target.value })
                                        }
                                      />
                                    </Field>
                                    <Field label="O que acontece">
                                      <Input
                                        value={p.titulo}
                                        onChange={(e) =>
                                          atualizarMomento(p.id, { titulo: e.target.value })
                                        }
                                        placeholder="Ex: Passagem de som, abertura, keynote…"
                                      />
                                    </Field>
                                    <button
                                      onClick={() =>
                                        setProgramacao((ps) => ps.filter((x) => x.id !== p.id))
                                      }
                                      className="mt-6 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  </div>
                                  <div className="mt-3 grid gap-3 border-t border-border/40 pt-3 lg:grid-cols-[1fr_1fr]">
                                    <div>
                                      <Label className="text-[10px]">Quem faz o quê</Label>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {membros.map((m) => {
                                          const ativo = p.responsavelIds.includes(m.id);
                                          return (
                                            <button
                                              type="button"
                                              key={m.id}
                                              onClick={() =>
                                                atualizarMomento(p.id, {
                                                  responsavelIds: ativo
                                                    ? p.responsavelIds.filter((x) => x !== m.id)
                                                    : [...p.responsavelIds, m.id],
                                                })
                                              }
                                              className={cn(
                                                "rounded-lg border px-2.5 py-1.5 text-[10px] transition",
                                                ativo
                                                  ? "border-primary/35 bg-primary/10 text-primary"
                                                  : "border-border/60 text-muted-foreground hover:border-primary/25",
                                              )}
                                            >
                                              <strong>{m.nome || "A definir"}</strong> · {m.funcao}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <Field label="Local / ambiente">
                                        <Input
                                          value={p.local ?? ""}
                                          onChange={(e) =>
                                            atualizarMomento(p.id, { local: e.target.value })
                                          }
                                          placeholder="Palco, sala, backstage…"
                                        />
                                      </Field>
                                      <Field label="Orientação rápida">
                                        <Input
                                          value={p.observacoes ?? ""}
                                          onChange={(e) =>
                                            atualizarMomento(p.id, { observacoes: e.target.value })
                                          }
                                          placeholder="O que não pode ser esquecido"
                                        />
                                      </Field>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      );
                    })}
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-semibold">Referências da operação</h3>
                        <p className="text-[11px] text-muted-foreground">
                          Links que estarão acessíveis no Modo Live.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReferencias((rs) => [...rs, novaReferencia()])}
                      >
                        <Link2 className="size-4" /> Link
                      </Button>
                    </div>
                    <div className="mt-4 space-y-2">
                      {referencias.map((r) => (
                        <div key={r.id} className="grid grid-cols-[.8fr_1.2fr_auto] gap-2">
                          <Input
                            value={r.titulo}
                            onChange={(e) =>
                              setReferencias((rs) =>
                                rs.map((x) =>
                                  x.id === r.id ? { ...x, titulo: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="Ex: Roteiro"
                          />
                          <Input
                            value={r.url}
                            onChange={(e) =>
                              setReferencias((rs) =>
                                rs.map((x) => (x.id === r.id ? { ...x, url: e.target.value } : x)),
                              )
                            }
                            placeholder="https://…"
                          />
                          <button
                            onClick={() => setReferencias((rs) => rs.filter((x) => x.id !== r.id))}
                            className="px-2 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ))}
                      {referencias.length === 0 && (
                        <p className="rounded-xl border border-dashed border-border/60 py-6 text-center text-[11px] text-muted-foreground">
                          Roteiros, mapas, moodboards, Drive, Frame.io…
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/70 p-5">
                    <h3 className="font-display font-semibold">Orientações gerais</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Informação fixa no topo do Modo Live.
                    </p>
                    <Textarea
                      className="mt-4"
                      rows={5}
                      value={orientacoes}
                      onChange={(e) => setOrientacoes(e.target.value)}
                      placeholder="Ponto de encontro, dress code, estacionamento, contato do produtor, regras do cliente…"
                    />
                  </div>
                </div>
              </div>
            )}
            {passo === 5 && (
              <div className="space-y-6">
                <StepTitle
                  n="05"
                  title="Valor fechado do evento"
                  desc="Registre apenas o valor aprovado com o cliente. O controle detalhado acontece dentro da operação."
                />
                <div className="max-w-md">
                  <Field label="Valor do orçamento aprovado">
                    <Input
                      type="number"
                      min={0}
                      value={valorOrcado}
                      onChange={(e) => setValorOrcado(Number(e.target.value))}
                      placeholder="0,00"
                    />
                  </Field>
                  <p className="mt-2 font-display text-2xl font-semibold text-primary">
                    {moeda(valorOrcado)}
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/25 bg-primary/[.04] p-5">
                  <Wallet className="size-5 text-primary" />
                  <h3 className="mt-3 font-display font-semibold">
                    O financeiro começa depois do planejamento
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Na seção Financeiro deste evento você poderá informar cachês individuais,
                    fornecedores, locações, transporte, alimentação e custos extras ao longo da
                    operação, acompanhar margem e gráficos e, no final, escolher o que migrar para o
                    Financeiro geral da produtora.
                  </p>
                </div>
              </div>
            )}
            <footer className="mt-8 flex items-center justify-between border-t border-border/60 pt-5">
              <Button variant="ghost" disabled={passo === 1} onClick={() => setPasso((p) => p - 1)}>
                <ArrowLeft className="size-4" /> Voltar
              </Button>
              {passo < 2 ? (
                <Button disabled={!valido} onClick={() => setPasso(2)}>
                  Continuar <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button disabled={!valido} onClick={concluir}>
                  Criar evento <Check className="size-4" />
                </Button>
              )}
            </footer>
          </section>
        </div>
      </div>
    </main>
  );
}
function StepTitle({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="mb-7">
      <span className="font-mono text-xs text-primary">{n}</span>
      <h2 className="mt-1 font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
function Summary({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-display text-lg font-semibold", accent && "text-primary")}>
        {moeda(value)}
      </p>
    </div>
  );
}
