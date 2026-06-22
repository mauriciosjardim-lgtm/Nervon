import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getEmpresaId } from "@/lib/empresaId";
import {
  calcular,
  type Orcamento, type OrcamentoPayload, type OrcamentoTemplate,
} from "@/lib/mock/orcamentos";

// ─── store global ─────────────────────────────────────────────────────────────

let orcamentos: Orcamento[] = [];
let templates: OrcamentoTemplate[] = [];
let loading = true;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

let initialized = false;

function rowToOrc(r: any): Orcamento {
  return {
    id: r.id,
    criadoEm: r.criado_em,
    tipo: r.tipo,
    geral: r.geral,
    producao: r.producao,
    pos: r.pos,
    extras: r.extras,
    margem: r.margem,
    calculo: r.calculo,
  };
}

function rowToTemplate(r: any): OrcamentoTemplate {
  return { id: r.id, nome: r.nome, tipo: r.tipo, payload: r.payload };
}

async function init() {
  if (initialized) return;
  initialized = true;

  const [{ data: orcs }, { data: tpls }] = await Promise.all([
    supabase.from("orcamentos").select("*").order("criado_em", { ascending: false }),
    supabase.from("orcamento_templates").select("*").order("criado_em", { ascending: false }),
  ]);

  orcamentos = (orcs ?? []).map(rowToOrc);
  templates = (tpls ?? []).map(rowToTemplate);
  loading = false;
  emit();

  supabase.channel("orcamentos_realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "orcamentos" }, async () => {
      const { data } = await supabase.from("orcamentos").select("*").order("criado_em", { ascending: false });
      orcamentos = (data ?? []).map(rowToOrc);
      emit();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "orcamento_templates" }, async () => {
      const { data } = await supabase.from("orcamento_templates").select("*").order("criado_em", { ascending: false });
      templates = (data ?? []).map(rowToTemplate);
      emit();
    })
    .subscribe();
}

export function resetOrcamentosStore() {
  initialized = false;
  orcamentos = [];
  templates = [];
  loading = true;
}

// ─── hooks ───────────────────────────────────────────────────────────────────

export function useOrcamentos() {
  const [snap, setSnap] = useState({ orcamentos, templates, loading });
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) init(); });
    const update = () => setSnap({ orcamentos: [...orcamentos], templates: [...templates], loading });
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);
  return snap;
}

export function useOrcamento(id: string) {
  const [snap, setSnap] = useState({ orcamento: orcamentos.find(o => o.id === id), loading });
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) init(); });
    const update = () => setSnap({ orcamento: orcamentos.find(o => o.id === id), loading });
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, [id]);
  return snap;
}

// Sync lookup para uso após salvar (store já está populado)
export const getOrcamento = (id: string) => orcamentos.find(o => o.id === id);
export const getTemplate = (id: string) => templates.find(t => t.id === id);

// ─── actions ─────────────────────────────────────────────────────────────────

export const orcamentosActions = {
  async salvar(payload: OrcamentoPayload): Promise<Orcamento> {
    const empresa_id = await getEmpresaId();
    const calculo = calcular(payload);
    const { data, error } = await supabase.from("orcamentos").insert({
      empresa_id,
      tipo: payload.tipo,
      geral: payload.geral,
      producao: payload.producao,
      pos: payload.pos,
      extras: payload.extras,
      margem: payload.margem,
      calculo,
    }).select().single();
    if (error || !data) throw error ?? new Error("Falha ao salvar orçamento");
    const novo = rowToOrc(data);
    orcamentos = [novo, ...orcamentos];
    emit();
    return novo;
  },

  async remover(id: string) {
    await supabase.from("orcamentos").delete().eq("id", id);
    orcamentos = orcamentos.filter(o => o.id !== id);
    emit();
  },

  async salvarTemplate(nome: string, payload: OrcamentoPayload): Promise<OrcamentoTemplate> {
    const empresa_id = await getEmpresaId();
    const { data, error } = await supabase.from("orcamento_templates").insert({
      empresa_id, nome, tipo: payload.tipo, payload,
    }).select().single();
    if (error || !data) throw error ?? new Error("Falha ao salvar template");
    const tpl = rowToTemplate(data);
    templates = [tpl, ...templates];
    emit();
    return tpl;
  },

  async removerTemplate(id: string) {
    await supabase.from("orcamento_templates").delete().eq("id", id);
    templates = templates.filter(t => t.id !== id);
    emit();
  },
};
