import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getEmpresaId } from "@/lib/empresaId";
import type {
  FaseProjeto, Prioridade, StatusEntregavel, TipoEntregavel,
  Projeto, Tarefa, Marco, Entregavel,
} from "@/lib/mock/projetos";
import { FASES_PADRAO } from "@/lib/mock/projetos";
import { agendaActions } from "./useAgenda";

// ─── helpers de conversão snake_case ↔ camelCase ───────────────────────────

function rowToProjeto(r: any): Projeto {
  return {
    id: r.id, nome: r.nome, cliente: r.cliente, descricao: r.descricao ?? undefined,
    fase: r.fase as FaseProjeto, progresso: r.progresso,
    fases: r.fases ?? [...FASES_PADRAO], equipe: r.equipe ?? [],
    dataInicio: r.data_inicio, dataEntrega: r.data_entrega,
    valor: Number(r.valor), cor: r.cor ?? "primary", criadoEm: r.criado_em,
    notas: r.notas ?? undefined,
  };
}

function rowToTarefa(r: any): Tarefa {
  return {
    id: r.id, projetoId: r.projeto_id, titulo: r.titulo,
    descricao: r.descricao ?? undefined, status: r.status,
    concluida: r.concluida ?? false, responsavel: r.responsavel,
    prazo: r.prazo ?? undefined, prioridade: r.prioridade as Prioridade,
    criadoEm: r.criado_em,
  };
}

function rowToMarco(r: any): Marco {
  return { id: r.id, projetoId: r.projeto_id, titulo: r.titulo, data: r.data, status: r.status };
}

function rowToEntregavel(r: any): Entregavel {
  return {
    id: r.id, projetoId: r.projeto_id, titulo: r.titulo,
    tipo: r.tipo as TipoEntregavel, status: r.status as StatusEntregavel,
    link: r.link ?? undefined, notas: r.notas ?? undefined, criadoEm: r.criado_em,
  };
}

// ─── estado global reativo ──────────────────────────────────────────────────

type Store = {
  projetos: Projeto[];
  tarefas: Tarefa[];
  marcos: Marco[];
  entregaveis: Entregavel[];
  loading: boolean;
};

let store: Store = { projetos: [], tarefas: [], marcos: [], entregaveis: [], loading: true };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());
const setStore = (patch: Partial<Store>) => { store = { ...store, ...patch }; emit(); };

let initialized = false;

async function init() {
  if (initialized) return;
  initialized = true;

  const [p, t, m, e] = await Promise.all([
    supabase.from("projetos").select("*").order("criado_em", { ascending: false }),
    supabase.from("tarefas").select("*").order("criado_em", { ascending: true }),
    supabase.from("marcos").select("*").order("data", { ascending: true }),
    supabase.from("entregaveis").select("*").order("criado_em", { ascending: true }),
  ]);

  setStore({
    projetos: (p.data ?? []).map(rowToProjeto),
    tarefas: (t.data ?? []).map(rowToTarefa),
    marcos: (m.data ?? []).map(rowToMarco),
    entregaveis: (e.data ?? []).map(rowToEntregavel),
    loading: false,
  });

  // Tempo real
  supabase.channel("projetos_realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "projetos" }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "tarefas" }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "marcos" }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "entregaveis" }, refresh)
    .subscribe();
}

async function refresh() {
  const [p, t, m, e] = await Promise.all([
    supabase.from("projetos").select("*").order("criado_em", { ascending: false }),
    supabase.from("tarefas").select("*").order("criado_em", { ascending: true }),
    supabase.from("marcos").select("*").order("data", { ascending: true }),
    supabase.from("entregaveis").select("*").order("criado_em", { ascending: true }),
  ]);
  setStore({
    projetos: (p.data ?? []).map(rowToProjeto),
    tarefas: (t.data ?? []).map(rowToTarefa),
    marcos: (m.data ?? []).map(rowToMarco),
    entregaveis: (e.data ?? []).map(rowToEntregavel),
  });
}

export function resetProjetosStore() {
  initialized = false;
  store = { projetos: [], tarefas: [], marcos: [], entregaveis: [], loading: true };
}

// ─── hook ───────────────────────────────────────────────────────────────────

export function useProjetos() {
  const [snap, setSnap] = useState(store);
  useEffect(() => {
    // Só inicializa se houver sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) init();
    });
    const update = () => setSnap({ ...store });
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);
  return snap;
}

// ─── actions ────────────────────────────────────────────────────────────────

function calcProgresso(projetoId: string): number {
  const ts = store.tarefas.filter(t => t.projetoId === projetoId);
  if (!ts.length) return 0;
  return Math.round(ts.filter(t => t.concluida).length / ts.length * 100);
}

async function atualizarProgresso(projetoId: string) {
  const prog = calcProgresso(projetoId);
  await supabase.from("projetos").update({ progresso: prog }).eq("id", projetoId);
}

export const projetosActions = {
  async criarProjeto(input: Omit<Projeto, "id" | "criadoEm" | "progresso">) {
    const empresa_id = await getEmpresaId();
    const { data, error } = await supabase.from("projetos").insert({
      empresa_id, nome: input.nome, cliente: input.cliente, descricao: input.descricao,
      fase: input.fase, fases: input.fases ?? [...FASES_PADRAO],
      equipe: input.equipe, data_inicio: input.dataInicio,
      data_entrega: input.dataEntrega, valor: input.valor,
      cor: input.cor, notas: input.notas, progresso: 0,
    }).select().single();
    if (!error && data) { setStore({ projetos: [rowToProjeto(data), ...store.projetos] }); }
    return data;
  },

  async atualizarProjeto(id: string, input: Partial<Omit<Projeto, "id" | "criadoEm">>) {
    const payload: any = {};
    if (input.nome !== undefined) payload.nome = input.nome;
    if (input.cliente !== undefined) payload.cliente = input.cliente;
    if (input.descricao !== undefined) payload.descricao = input.descricao;
    if (input.fase !== undefined) payload.fase = input.fase;
    if (input.fases !== undefined) payload.fases = input.fases;
    if (input.equipe !== undefined) payload.equipe = input.equipe;
    if (input.dataInicio !== undefined) payload.data_inicio = input.dataInicio;
    if (input.dataEntrega !== undefined) payload.data_entrega = input.dataEntrega;
    if (input.valor !== undefined) payload.valor = input.valor;
    if (input.cor !== undefined) payload.cor = input.cor;
    if (input.notas !== undefined) payload.notas = input.notas;
    if (input.progresso !== undefined) payload.progresso = input.progresso;
    await supabase.from("projetos").update(payload).eq("id", id);
    setStore({ projetos: store.projetos.map(p => p.id === id ? { ...p, ...input } : p) });
  },

  async removerProjeto(id: string) {
    await supabase.from("projetos").delete().eq("id", id);
    setStore({
      projetos: store.projetos.filter(p => p.id !== id),
      tarefas: store.tarefas.filter(t => t.projetoId !== id),
      marcos: store.marcos.filter(m => m.projetoId !== id),
      entregaveis: store.entregaveis.filter(e => e.projetoId !== id),
    });
  },

  async criarTarefa(input: Omit<Tarefa, "id" | "criadoEm">) {
    const empresa_id = await getEmpresaId();
    const { data, error } = await supabase.from("tarefas").insert({
      empresa_id, projeto_id: input.projetoId, titulo: input.titulo,
      descricao: input.descricao, status: input.status,
      concluida: input.concluida ?? false, responsavel: input.responsavel,
      prazo: input.prazo, prioridade: input.prioridade,
    }).select().single();
    if (!error && data) {
      const nova = rowToTarefa(data);
      setStore({ tarefas: [...store.tarefas, nova] });
      await atualizarProgresso(input.projetoId);
      if (nova.prazo) {
        await agendaActions.upsertPorRef("tarefa", nova.id, {
          titulo: nova.titulo,
          tipo: "tarefa",
          inicio: nova.prazo,
          fim: nova.prazo,
          diaTodo: false,
        });
      }
    }
  },

  async atualizarTarefa(id: string, input: Partial<Omit<Tarefa, "id" | "criadoEm">>) {
    const payload: any = {};
    if (input.titulo !== undefined) payload.titulo = input.titulo;
    if (input.descricao !== undefined) payload.descricao = input.descricao;
    if (input.status !== undefined) payload.status = input.status;
    if (input.concluida !== undefined) payload.concluida = input.concluida;
    if (input.responsavel !== undefined) payload.responsavel = input.responsavel;
    if (input.prazo !== undefined) payload.prazo = input.prazo;
    if (input.prioridade !== undefined) payload.prioridade = input.prioridade;
    await supabase.from("tarefas").update(payload).eq("id", id);
    const tarefa = store.tarefas.find(t => t.id === id);
    setStore({ tarefas: store.tarefas.map(t => t.id === id ? { ...t, ...input } : t) });
    if (tarefa && input.concluida !== undefined) await atualizarProgresso(tarefa.projetoId);
    if (input.prazo !== undefined) {
      if (input.prazo) {
        const titulo = input.titulo ?? tarefa?.titulo ?? "";
        await agendaActions.upsertPorRef("tarefa", id, {
          titulo,
          tipo: "tarefa",
          inicio: input.prazo,
          fim: input.prazo,
          diaTodo: false,
        });
      } else {
        await agendaActions.removerPorRef("tarefa", id);
      }
    }
  },

  async removerTarefa(id: string) {
    const tarefa = store.tarefas.find(t => t.id === id);
    await supabase.from("tarefas").delete().eq("id", id);
    setStore({ tarefas: store.tarefas.filter(t => t.id !== id) });
    if (tarefa) await atualizarProgresso(tarefa.projetoId);
    await agendaActions.removerPorRef("tarefa", id);
  },

  async criarMarco(input: Omit<Marco, "id">) {
    const empresa_id = await getEmpresaId();
    const { data } = await supabase.from("marcos").insert({
      empresa_id, projeto_id: input.projetoId, titulo: input.titulo,
      data: input.data, status: input.status,
    }).select().single();
    if (data) setStore({ marcos: [...store.marcos, rowToMarco(data)] });
  },

  async atualizarMarco(id: string, input: Partial<Omit<Marco, "id">>) {
    const payload: any = {};
    if (input.titulo !== undefined) payload.titulo = input.titulo;
    if (input.data !== undefined) payload.data = input.data;
    if (input.status !== undefined) payload.status = input.status;
    await supabase.from("marcos").update(payload).eq("id", id);
    setStore({ marcos: store.marcos.map(m => m.id === id ? { ...m, ...input } : m) });
  },

  async removerMarco(id: string) {
    await supabase.from("marcos").delete().eq("id", id);
    setStore({ marcos: store.marcos.filter(m => m.id !== id) });
  },

  async criarEntregavel(input: Omit<Entregavel, "id" | "criadoEm">) {
    const empresa_id = await getEmpresaId();
    const { data } = await supabase.from("entregaveis").insert({
      empresa_id, projeto_id: input.projetoId, titulo: input.titulo,
      tipo: input.tipo, status: input.status,
      link: input.link, notas: input.notas,
    }).select().single();
    if (data) setStore({ entregaveis: [...store.entregaveis, rowToEntregavel(data)] });
  },

  async atualizarEntregavel(id: string, input: Partial<Omit<Entregavel, "id" | "criadoEm">>) {
    const payload: any = {};
    if (input.titulo !== undefined) payload.titulo = input.titulo;
    if (input.tipo !== undefined) payload.tipo = input.tipo;
    if (input.status !== undefined) payload.status = input.status;
    if (input.link !== undefined) payload.link = input.link;
    if (input.notas !== undefined) payload.notas = input.notas;
    await supabase.from("entregaveis").update(payload).eq("id", id);
    setStore({ entregaveis: store.entregaveis.map(e => e.id === id ? { ...e, ...input } : e) });
  },

  async removerEntregavel(id: string) {
    await supabase.from("entregaveis").delete().eq("id", id);
    setStore({ entregaveis: store.entregaveis.filter(e => e.id !== id) });
  },

  async adicionarFase(projetoId: string, fase: string) {
    const projeto = store.projetos.find(p => p.id === projetoId);
    if (!projeto) return;
    const fases = projeto.fases ?? [...FASES_PADRAO];
    const key = fase.toLowerCase().replace(/\s+/g, "_");
    if (fases.includes(key)) return;
    const idx = fases.indexOf("concluida");
    const novas = [...fases];
    idx >= 0 ? novas.splice(idx, 0, key) : novas.push(key);
    await this.atualizarProjeto(projetoId, { fases: novas });
  },

  async moverFase(projetoId: string, fase: string, direcao: -1 | 1) {
    const projeto = store.projetos.find(p => p.id === projetoId);
    if (!projeto) return;
    const fases = [...(projeto.fases ?? [...FASES_PADRAO])];
    const idx = fases.indexOf(fase);
    const novoIdx = idx + direcao;
    if (idx < 0 || novoIdx < 0 || novoIdx >= fases.length) return;
    [fases[idx], fases[novoIdx]] = [fases[novoIdx], fases[idx]];
    await this.atualizarProjeto(projetoId, { fases });
  },

  async removerFase(projetoId: string, fase: string) {
    const projeto = store.projetos.find(p => p.id === projetoId);
    if (!projeto) return;
    const fases = projeto.fases ?? [...FASES_PADRAO];
    const idx = fases.indexOf(fase);
    const fallback = fases[idx - 1] ?? "concluida";
    // move tarefas da fase removida
    const afetadas = store.tarefas.filter(t => t.projetoId === projetoId && t.status === fase);
    await Promise.all(afetadas.map(t => this.atualizarTarefa(t.id, { status: fallback })));
    await this.atualizarProjeto(projetoId, { fases: fases.filter(f => f !== fase) });
  },

  async adicionarLink(projetoId: string, label: string, url: string) {
    const projeto = store.projetos.find(p => p.id === projetoId);
    if (!projeto) return;
    const links = [...(projeto.links ?? []), { id: `ln${Date.now()}`, label, url }];
    await supabase.from("projetos").update({ notas: projeto.notas }).eq("id", projetoId);
    setStore({ projetos: store.projetos.map(p => p.id === projetoId ? { ...p, links } : p) });
  },

  async removerLink(projetoId: string, linkId: string) {
    const projeto = store.projetos.find(p => p.id === projetoId);
    if (!projeto) return;
    const links = (projeto.links ?? []).filter(l => l.id !== linkId);
    setStore({ projetos: store.projetos.map(p => p.id === projetoId ? { ...p, links } : p) });
  },
};
