import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getEmpresaId } from "@/lib/empresaId";
import type { LancTipo, LancStatus, Lancamento } from "@/lib/mock/financeiro";
import { getCarteiraAtiva, subscribeCarteiraAtiva, useCarteiras } from "./useCarteiras";

// ─── conversão ──────────────────────────────────────────────────────────────

function rowToLanc(r: any): Lancamento {
  return {
    id: r.id,
    tipo: r.tipo as LancTipo,
    categoria: r.categoria,
    descricao: r.descricao,
    valor: Number(r.valor),
    vencimento: r.vencimento ?? r.data,
    pagamentoEm: r.pagamento_em ?? null,
    status: reconciliarStatus({
      tipo: r.tipo, vencimento: r.vencimento ?? r.data, pagamentoEm: r.pagamento_em,
    }),
    cliente: r.cliente ?? undefined,
    projetoId: r.projeto_id ?? undefined,
    projeto: r.projetos?.nome ?? undefined,
    carteiraId: r.carteira_id ?? undefined,
    formaPagamento: r.forma_pagamento ?? undefined,
    observacoes: r.observacoes ?? undefined,
  };
}

function reconciliarStatus({ tipo, vencimento, pagamentoEm }: Pick<Lancamento, "tipo" | "vencimento" | "pagamentoEm">): LancStatus {
  if (pagamentoEm) return tipo === "receita" ? "recebido" : "pago";
  const venc = new Date(vencimento.slice(0, 10) + "T12:00:00");
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  if (venc < hoje) return "atrasado";
  return "previsto";
}

// ─── store global ────────────────────────────────────────────────────────────

let lancamentos: Lancamento[] = [];
let loading = true;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

let initialized = false;

async function init() {
  if (initialized) return;
  initialized = true;
  const { data } = await supabase.from("financeiro").select("*, projetos(nome)").order("vencimento", { ascending: true });
  lancamentos = (data ?? []).map(rowToLanc);
  loading = false;
  emit();

  supabase.channel("financeiro_realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "financeiro" }, async () => {
      const { data: fresh } = await supabase.from("financeiro").select("*, projetos(nome)").order("vencimento", { ascending: true });
      lancamentos = (fresh ?? []).map(rowToLanc);
      emit();
    })
    .subscribe();
}

export function resetFinanceiroStore() {
  initialized = false;
  lancamentos = [];
  loading = true;
}

// ─── hook ────────────────────────────────────────────────────────────────────

export function useFinanceiroSupa(opts?: { somenteEmpresa?: boolean }) {
  const [snap, setSnap] = useState({ lancamentos, loading });
  const [carteiraId, setCarteiraId] = useState<string | null>(getCarteiraAtiva);
  const { carteiras } = useCarteiras();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) init(); });
    const update = () => setSnap({ lancamentos: [...lancamentos], loading });
    listeners.add(update);
    const unsubCarteira = subscribeCarteiraAtiva(() => setCarteiraId(getCarteiraAtiva()));
    return () => { listeners.delete(update); unsubCarteira(); };
  }, []);
  // Escopo "empresa" (somenteEmpresa OU chip Empresa/carteiraAtiva null):
  //   inclui lancamentos sem carteira (padrão) + carteiras tipo "pj" (contas da empresa).
  //   Assim o cockpit e o chip Empresa nunca ficam vazios se a pessoa criar uma conta PJ.
  // uuid específico = só aquela carteira (inclusive pf/pj).
  const empresaScope = opts?.somenteEmpresa || !carteiraId;
  const pjIds = new Set(carteiras.filter(c => c.tipo === "pj").map(c => c.id));
  const filtered = empresaScope
    ? snap.lancamentos.filter(l => !l.carteiraId || pjIds.has(l.carteiraId))
    : snap.lancamentos.filter(l => l.carteiraId === carteiraId);
  return { lancamentos: filtered, loading: snap.loading };
}

// ─── actions ─────────────────────────────────────────────────────────────────

type LancInput = Omit<Lancamento, "id" | "status">;

export const financeiroActions = {
  async add(input: LancInput) {
    const empresa_id = await getEmpresaId();
    const { data, error } = await supabase.from("financeiro").insert({
      empresa_id, tipo: input.tipo,
      categoria: input.categoria,
      descricao: input.descricao,
      valor: input.valor,
      data: input.vencimento,
      vencimento: input.vencimento,
      pagamento_em: input.pagamentoEm ?? null,
      status: reconciliarStatus(input),
      cliente: input.cliente ?? null,
      projeto_id: input.projetoId ?? null,
      carteira_id: input.carteiraId ?? null,
      forma_pagamento: input.formaPagamento ?? null,
      observacoes: input.observacoes ?? null,
    }).select("*, projetos(nome)").single();
    if (!error && data) {
      lancamentos = [...lancamentos, rowToLanc(data)];
      emit();
    }
    return data?.id;
  },

  async update(id: string, input: Partial<LancInput>) {
    const atual = lancamentos.find(l => l.id === id);
    if (!atual) return;
    const merged = { ...atual, ...input };
    const payload: any = {
      tipo: merged.tipo,
      categoria: merged.categoria,
      descricao: merged.descricao,
      valor: merged.valor,
      data: merged.vencimento,
      vencimento: merged.vencimento,
      pagamento_em: merged.pagamentoEm ?? null,
      status: reconciliarStatus(merged),
      cliente: merged.cliente ?? null,
      projeto_id: merged.projetoId ?? null,
      carteira_id: merged.carteiraId ?? null,
      forma_pagamento: merged.formaPagamento ?? null,
      observacoes: merged.observacoes ?? null,
    };
    await supabase.from("financeiro").update(payload).eq("id", id);
    lancamentos = lancamentos.map(l => l.id === id ? { ...l, ...input, status: reconciliarStatus(merged) } : l);
    emit();
  },

  async marcarPago(id: string) {
    const hoje = new Date().toISOString().slice(0, 10);
    await this.update(id, { pagamentoEm: hoje });
  },

  async desfazerPago(id: string) {
    await this.update(id, { pagamentoEm: null });
  },

  async remove(id: string) {
    await supabase.from("financeiro").delete().eq("id", id);
    lancamentos = lancamentos.filter(l => l.id !== id);
    emit();
  },
};
