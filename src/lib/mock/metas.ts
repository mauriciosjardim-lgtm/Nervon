import { isSameMonth, subMonths } from "date-fns";
import type { Lancamento } from "./financeiro";
import { supabase } from "@/lib/supabase";
import { getEmpresaId } from "@/lib/empresaId";

const LS_KEY = "frameos:metas:v1";

export interface MetasConfig {
  meta: number;
  superMeta: number;
}

const DEFAULT: MetasConfig = { meta: 100000, superMeta: 150000 };

function loadFromLS(): MetasConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<MetasConfig>) } : null;
  } catch { return null; }
}

let cached: MetasConfig | null = loadFromLS();

// Carrega do Supabase na primeira autenticação
supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) return;
  supabase.from("empresas").select("meta_mensal, meta_super").single().then(({ data }) => {
    if (data && (data.meta_mensal != null || data.meta_super != null)) {
      cached = {
        meta: data.meta_mensal ?? DEFAULT.meta,
        superMeta: data.meta_super ?? DEFAULT.superMeta,
      };
      window.dispatchEvent(new CustomEvent("frameos:metas"));
    }
  });
});

export function loadMetas(): MetasConfig {
  return cached ?? DEFAULT;
}

export async function saveMetas(m: MetasConfig) {
  cached = m;
  if (typeof window !== "undefined") {
    localStorage.setItem(LS_KEY, JSON.stringify(m));
    window.dispatchEvent(new CustomEvent("frameos:metas"));
  }
  const empresa_id = await getEmpresaId();
  await supabase.from("empresas").update({ meta_mensal: m.meta, meta_super: m.superMeta }).eq("id", empresa_id);
}

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
