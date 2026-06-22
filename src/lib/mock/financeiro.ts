// MakersHub — Mock store do módulo Financeiro
// Reativo via useSyncExternalStore, em memória, sem persistência.

import { useSyncExternalStore } from "react";

export type LancTipo = "receita" | "despesa";
export type LancStatus = "previsto" | "recebido" | "pago" | "atrasado";

export interface Lancamento {
  id: string;
  tipo: LancTipo;
  categoria: string;
  descricao: string;
  valor: number;
  vencimento: string; // ISO
  pagamentoEm?: string | null; // ISO ou null
  status: LancStatus;
  cliente?: string;
  projeto?: string;      // nome do projeto (para exibição)
  projetoId?: string;    // FK projetos.id (o que é persistido)
  carteiraId?: string;   // FK carteiras.id
  formaPagamento?: string;
  observacoes?: string;
}

const today = new Date();
const d = (offset: number) => {
  const x = new Date(today); x.setDate(x.getDate() + offset);
  return x.toISOString();
};

const seed: Lancamento[] = [
  // Receitas
  { id: "fr1", tipo: "receita", categoria: "Projeto", descricao: "Vibe Q1 — entrada (1/4)", valor: 16000, vencimento: d(-30), pagamentoEm: d(-29), status: "recebido", cliente: "Vibe Cosméticos", projeto: "Vibe Q1 — Conteúdo mensal", formaPagamento: "PIX" },
  { id: "fr2", tipo: "receita", categoria: "Projeto", descricao: "Vibe Q1 — parcela 2/4", valor: 16000, vencimento: d(5), status: "previsto", cliente: "Vibe Cosméticos", projeto: "Vibe Q1 — Conteúdo mensal" },
  { id: "fr3", tipo: "receita", categoria: "Projeto", descricao: "Vibe Q1 — parcela 3/4", valor: 16000, vencimento: d(35), status: "previsto", cliente: "Vibe Cosméticos", projeto: "Vibe Q1 — Conteúdo mensal" },
  { id: "fr4", tipo: "receita", categoria: "Projeto", descricao: "Olympus — entrada documentário", valor: 13250, vencimento: d(-22), pagamentoEm: d(-20), status: "recebido", cliente: "Studio Olympus", projeto: "Olympus — Documentário curto", formaPagamento: "Transferência" },
  { id: "fr5", tipo: "receita", categoria: "Projeto", descricao: "Olympus — final entrega", valor: 13250, vencimento: d(10), status: "previsto", cliente: "Studio Olympus", projeto: "Olympus — Documentário curto" },
  { id: "fr6", tipo: "receita", categoria: "Projeto", descricao: "Atlas — entrada Tour 360", valor: 32500, vencimento: d(3), status: "previsto", cliente: "Atlas Imóveis", projeto: "Atlas — Tour 360 lançamento" },
  { id: "fr7", tipo: "receita", categoria: "Projeto", descricao: "Fresh Burger — Reels Pack entrada", valor: 9250, vencimento: d(-3), status: "atrasado", cliente: "Fresh Burger Co.", projeto: "Fresh Burger — Reels Pack" },
  { id: "fr8", tipo: "receita", categoria: "Avulso", descricao: "Edição extra — Nova Marca", valor: 4500, vencimento: d(-10), pagamentoEm: d(-9), status: "recebido", cliente: "Nova Marca Bebidas", formaPagamento: "PIX" },

  // Despesas
  { id: "fd1", tipo: "despesa", categoria: "Equipe", descricao: "Cachê Pedro — captação Vibe", valor: 2400, vencimento: d(-2), pagamentoEm: d(-2), status: "pago", projeto: "Vibe Q1 — Conteúdo mensal", formaPagamento: "PIX" },
  { id: "fd2", tipo: "despesa", categoria: "Equipe", descricao: "Cachê Lucas — color grading", valor: 1800, vencimento: d(2), status: "previsto", projeto: "Olympus — Documentário curto" },
  { id: "fd3", tipo: "despesa", categoria: "Equipe", descricao: "Cachê Ana — roteiro abril", valor: 1500, vencimento: d(7), status: "previsto", projeto: "Vibe Q1 — Conteúdo mensal" },
  { id: "fd4", tipo: "despesa", categoria: "Equipamento", descricao: "Aluguel câmera FX6 (3 diárias)", valor: 1800, vencimento: d(-2), pagamentoEm: d(-2), status: "pago", projeto: "Vibe Q1 — Conteúdo mensal" },
  { id: "fd5", tipo: "despesa", categoria: "Equipamento", descricao: "Drone Mavic 3 — diária", valor: 650, vencimento: d(4), status: "previsto", projeto: "Atlas — Tour 360 lançamento" },
  { id: "fd6", tipo: "despesa", categoria: "Software", descricao: "Adobe CC + Frame.io", valor: 420, vencimento: d(-3), pagamentoEm: d(-3), status: "pago", formaPagamento: "Cartão" },
  { id: "fd7", tipo: "despesa", categoria: "Software", descricao: "Frame.io upgrade Pro", valor: 280, vencimento: d(15), status: "previsto" },
  { id: "fd8", tipo: "despesa", categoria: "Marketing", descricao: "Tráfego pago Instagram", valor: 1200, vencimento: d(-5), pagamentoEm: d(-5), status: "pago", formaPagamento: "Cartão" },
  { id: "fd9", tipo: "despesa", categoria: "Impostos", descricao: "Simples Nacional — DAS", valor: 3800, vencimento: d(-4), status: "atrasado" },
  { id: "fd10", tipo: "despesa", categoria: "Equipe", descricao: "Pró-labore — Você", valor: 8000, vencimento: d(0), status: "previsto" },
  { id: "fd11", tipo: "despesa", categoria: "Estrutura", descricao: "Aluguel estúdio", valor: 4500, vencimento: d(8), status: "previsto" },
  { id: "fd12", tipo: "despesa", categoria: "Estrutura", descricao: "Internet + telefone", valor: 320, vencimento: d(-8), pagamentoEm: d(-8), status: "pago" },
];

let state: { lancamentos: Lancamento[] } = { lancamentos: seed };

const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

export function useFinanceiro<T>(selector: (s: typeof state) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

function reconciliarStatus(l: Lancamento): Lancamento {
  if (l.pagamentoEm) return { ...l, status: l.tipo === "receita" ? "recebido" : "pago" };
  const venc = new Date(l.vencimento);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  if (venc < hoje && !l.pagamentoEm) return { ...l, status: "atrasado" };
  return { ...l, status: "previsto" };
}

export const financeiro = {
  add(input: Omit<Lancamento, "id" | "status"> & { status?: LancStatus }) {
    const id = `f-${Date.now()}`;
    const base: Lancamento = { ...input, id, status: input.status ?? "previsto" };
    state = { lancamentos: [...state.lancamentos, reconciliarStatus(base)] };
    emit();
    return id;
  },
  update(id: string, patch: Partial<Omit<Lancamento, "id">>) {
    state = {
      lancamentos: state.lancamentos.map(l =>
        l.id === id ? reconciliarStatus({ ...l, ...patch }) : l,
      ),
    };
    emit();
  },
  remove(id: string) {
    state = { lancamentos: state.lancamentos.filter(l => l.id !== id) };
    emit();
  },
  marcarPago(id: string, quando: string = new Date().toISOString()) {
    state = {
      lancamentos: state.lancamentos.map(l =>
        l.id === id ? reconciliarStatus({ ...l, pagamentoEm: quando }) : l,
      ),
    };
    emit();
  },
  desfazerPago(id: string) {
    state = {
      lancamentos: state.lancamentos.map(l =>
        l.id === id ? reconciliarStatus({ ...l, pagamentoEm: null }) : l,
      ),
    };
    emit();
  },
};

// ---------- Helpers / Métricas ----------
export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtBRLDetalhado = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtData = (iso: string) =>
  new Date(iso.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

export const STATUS_META: Record<LancStatus, { label: string; color: string; bg: string; border: string }> = {
  previsto: { label: "Previsto", color: "text-info", bg: "bg-info/10", border: "border-info/30" },
  recebido: { label: "Recebido", color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  pago: { label: "Pago", color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  atrasado: { label: "Atrasado", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
};

export const CATEGORIAS_RECEITA = ["Projeto", "Avulso", "Treinamento", "Outros"];
export const CATEGORIAS_DESPESA = ["Equipe", "Equipamento", "Software", "Marketing", "Impostos", "Estrutura", "Outros"];

export interface MetricasFin {
  recebido: number;
  aReceber: number;
  atrasadoReceber: number;
  pago: number;
  aPagar: number;
  atrasadoPagar: number;
  saldoRealizado: number; // recebido - pago
  saldoPrevisto: number;  // (recebido+aReceber) - (pago+aPagar)
  margemRealizada: number;
}

export function calcularMetricas(lancs: Lancamento[]): MetricasFin {
  const r = lancs.filter(l => l.tipo === "receita");
  const d = lancs.filter(l => l.tipo === "despesa");
  const recebido = r.filter(l => l.status === "recebido").reduce((s, l) => s + l.valor, 0);
  const aReceber = r.filter(l => l.status === "previsto").reduce((s, l) => s + l.valor, 0);
  const atrasadoReceber = r.filter(l => l.status === "atrasado").reduce((s, l) => s + l.valor, 0);
  const pago = d.filter(l => l.status === "pago").reduce((s, l) => s + l.valor, 0);
  const aPagar = d.filter(l => l.status === "previsto").reduce((s, l) => s + l.valor, 0);
  const atrasadoPagar = d.filter(l => l.status === "atrasado").reduce((s, l) => s + l.valor, 0);
  const saldoRealizado = recebido - pago;
  const saldoPrevisto = (recebido + aReceber) - (pago + aPagar);
  const margemRealizada = recebido ? (saldoRealizado / recebido) * 100 : 0;
  return { recebido, aReceber, atrasadoReceber, pago, aPagar, atrasadoPagar, saldoRealizado, saldoPrevisto, margemRealizada };
}

// Série mensal (últimos 6 meses) para gráfico
export function serieMensal(lancs: Lancamento[]) {
  const meses: { key: string; label: string; receita: number; despesa: number; saldo: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(); dt.setDate(1); dt.setMonth(dt.getMonth() - i);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    meses.push({
      key,
      label: dt.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      receita: 0, despesa: 0, saldo: 0,
    });
  }
  for (const l of lancs) {
    // Slice to "YYYY-MM" avoids UTC-midnight parsing bug for date-only strings from Supabase
    const key = (l.pagamentoEm ?? l.vencimento).slice(0, 7);
    const m = meses.find(x => x.key === key);
    if (!m) continue;
    if (l.tipo === "receita") m.receita += l.valor;
    else m.despesa += l.valor;
  }
  meses.forEach(m => { m.saldo = m.receita - m.despesa; });
  return meses;
}

// Agrupamento por projeto/cliente
export function porProjeto(lancs: Lancamento[]) {
  const map = new Map<string, { nome: string; cliente?: string; receita: number; despesa: number; saldo: number; margem: number }>();
  for (const l of lancs) {
    const k = l.projeto || "— Sem projeto —";
    if (!map.has(k)) map.set(k, { nome: k, cliente: l.cliente, receita: 0, despesa: 0, saldo: 0, margem: 0 });
    const a = map.get(k)!;
    if (l.tipo === "receita") a.receita += l.valor;
    else a.despesa += l.valor;
    if (l.cliente && !a.cliente) a.cliente = l.cliente;
  }
  return Array.from(map.values()).map(a => ({
    ...a,
    saldo: a.receita - a.despesa,
    margem: a.receita ? ((a.receita - a.despesa) / a.receita) * 100 : 0,
  })).sort((a, b) => b.saldo - a.saldo);
}

export function porCategoria(lancs: Lancamento[], tipo: LancTipo) {
  const map = new Map<string, number>();
  lancs.filter(l => l.tipo === tipo).forEach(l => {
    map.set(l.categoria, (map.get(l.categoria) || 0) + l.valor);
  });
  return Array.from(map.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);
}

export const getClientesUnicos = () =>
  Array.from(new Set(state.lancamentos.map(l => l.cliente).filter(Boolean))) as string[];
export const getProjetosUnicos = () =>
  Array.from(new Set(state.lancamentos.map(l => l.projeto).filter(Boolean))) as string[];
