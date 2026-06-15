import { isSameMonth, subMonths } from "date-fns";
import type { Lancamento } from "./financeiro";

const KEY = "frameos:metas:v1";

export interface MetasConfig {
  meta: number;
  superMeta: number;
}

const DEFAULT: MetasConfig = { meta: 100000, superMeta: 150000 };

export function loadMetas(): MetasConfig {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<MetasConfig>) };
  } catch {
    return DEFAULT;
  }
}

export function saveMetas(m: MetasConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(m));
  window.dispatchEvent(new CustomEvent("frameos:metas"));
}

// Snapshot derivado para o componente de Progresso.
export function progressoMes(config: MetasConfig, lancamentos: Lancamento[]) {
  const hoje = new Date();
  const mesPassado = subMonths(hoje, 1);

  const realizado = lancamentos
    .filter(l => l.tipo === "receita" && l.pagamentoEm && isSameMonth(new Date(l.pagamentoEm), hoje))
    .reduce((s, l) => s + l.valor, 0);

  const mesAnterior = lancamentos
    .filter(l => l.tipo === "receita" && l.pagamentoEm && isSameMonth(new Date(l.pagamentoEm), mesPassado))
    .reduce((s, l) => s + l.valor, 0);

  const restanteMeta = Math.max(0, config.meta - realizado);
  const restanteSuper = Math.max(0, config.superMeta - realizado);
  const pctMeta = config.meta ? (realizado / config.meta) * 100 : 0;
  const pctSuper = config.superMeta ? (realizado / config.superMeta) * 100 : 0;
  const atingiuMeta = realizado >= config.meta;
  const atingiuSuper = realizado >= config.superMeta;

  const diaAtual = hoje.getDate();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const projecao = diaAtual > 0 ? (realizado / diaAtual) * diasNoMes : realizado;
  const crescimento = mesAnterior ? ((realizado - mesAnterior) / mesAnterior) * 100 : 0;

  return {
    realizado, projecao, mesAnterior, crescimento,
    meta: config.meta, superMeta: config.superMeta,
    restanteMeta, restanteSuper,
    pctMeta, pctSuper,
    atingiuMeta, atingiuSuper,
    diaAtual, diasNoMes,
  };
}
