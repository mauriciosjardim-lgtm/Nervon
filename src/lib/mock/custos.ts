// MakersHub — Tabela de custos da produtora
// Persiste em Supabase (empresas.custos_tabela) + localStorage como cache.

import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { getEmpresaId } from "@/lib/empresaId";
import { registerSessionDisposer } from "@/lib/sessionScope";

export interface TabelaCustos {
  diariaVideomaker: number;
  editorPorHora: number;
  motionPorHora: number;
  operadorAdicional: number;
  assistente: number;
  cameraExtra: number;
  drone: number;
  droneFpv: number;
  iluminacao: number;
  audio: number;
  km: number;
  hospedagem: number;
  alimentacao: number;
  locucao: number;
  roteiro: number;
  direcaoCriativa: number;
  fotografia: number;
  coberturaAdicional: number;
  entregaUrgente: number;
  horaExtra: number;
  margemPadrao: number;
}

export const CUSTOS_DEFAULT: TabelaCustos = {
  diariaVideomaker: 1000,
  editorPorHora: 80,
  motionPorHora: 120,
  operadorAdicional: 700,
  assistente: 400,
  cameraExtra: 350,
  drone: 600,
  droneFpv: 900,
  iluminacao: 350,
  audio: 350,
  km: 2.5,
  hospedagem: 200,
  alimentacao: 80,
  locucao: 350,
  roteiro: 600,
  direcaoCriativa: 1500,
  fotografia: 800,
  coberturaAdicional: 500,
  entregaUrgente: 1000,
  horaExtra: 180,
  margemPadrao: 40,
};

export const CUSTOS_LABELS: Record<keyof TabelaCustos, { label: string; sufixo: string; grupo: string }> = {
  diariaVideomaker:   { label: "Diária Videomaker",   sufixo: "diária",     grupo: "Equipe" },
  editorPorHora:      { label: "Editor",              sufixo: "hora",       grupo: "Equipe" },
  motionPorHora:      { label: "Motion Designer",     sufixo: "hora",       grupo: "Equipe" },
  operadorAdicional:  { label: "Operador adicional",  sufixo: "diária",     grupo: "Equipe" },
  assistente:         { label: "Assistente",          sufixo: "diária",     grupo: "Equipe" },
  cameraExtra:        { label: "Câmera extra",        sufixo: "diária",     grupo: "Equipamento" },
  drone:              { label: "Drone",               sufixo: "diária",     grupo: "Equipamento" },
  droneFpv:           { label: "Drone FPV",           sufixo: "diária",     grupo: "Equipamento" },
  iluminacao:         { label: "Kit de iluminação",   sufixo: "diária",     grupo: "Equipamento" },
  audio:              { label: "Captação de áudio",   sufixo: "diária",     grupo: "Equipamento" },
  km:                 { label: "Km rodado",           sufixo: "km",         grupo: "Logística" },
  hospedagem:         { label: "Hospedagem",          sufixo: "diária",     grupo: "Logística" },
  alimentacao:        { label: "Alimentação",         sufixo: "pessoa/dia", grupo: "Logística" },
  locucao:            { label: "Locução",             sufixo: "vídeo",      grupo: "Extras criativos" },
  roteiro:            { label: "Roteiro",             sufixo: "vídeo",      grupo: "Extras criativos" },
  direcaoCriativa:    { label: "Direção criativa",    sufixo: "projeto",    grupo: "Extras criativos" },
  fotografia:         { label: "Fotografia",          sufixo: "diária",     grupo: "Extras criativos" },
  coberturaAdicional: { label: "Cobertura adicional", sufixo: "diária",     grupo: "Extras criativos" },
  entregaUrgente:     { label: "Entrega urgente",     sufixo: "taxa",       grupo: "Extras criativos" },
  horaExtra:          { label: "Hora extra",          sufixo: "hora",       grupo: "Extras criativos" },
  margemPadrao:       { label: "Margem padrão",       sufixo: "%",          grupo: "Margem" },
};

const LS_KEY = "frameos:custos:v1";

function loadFromLS(): TabelaCustos | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...CUSTOS_DEFAULT, ...(JSON.parse(raw) as Partial<TabelaCustos>) } : null;
  } catch { return null; }
}

let state: TabelaCustos = loadFromLS() ?? CUSTOS_DEFAULT;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach(l => l());
const snapshot = () => state;
registerSessionDisposer(() => {
  state = CUSTOS_DEFAULT;
  try { localStorage.removeItem(LS_KEY); } catch { /* indisponível */ }
  emit();
});

// Carrega do Supabase na primeira autenticação (sobrescreve localStorage se há dados no servidor)
supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) return;
  supabase.from("empresas").select("custos_tabela").single().then(({ data }) => {
    if (data?.custos_tabela) {
      state = { ...CUSTOS_DEFAULT, ...(data.custos_tabela as Partial<TabelaCustos>) };
      emit();
    }
  });
});

export const useCustos = () => useSyncExternalStore(subscribe, snapshot, () => CUSTOS_DEFAULT);

export const custosActions = {
  async set(patch: Partial<TabelaCustos>) {
    state = { ...state, ...patch };
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(state));
    emit();
    const empresa_id = await getEmpresaId();
    await supabase.from("empresas").update({ custos_tabela: state }).eq("id", empresa_id);
  },
  async reset() {
    state = CUSTOS_DEFAULT;
    if (typeof window !== "undefined") localStorage.removeItem(LS_KEY);
    emit();
    const empresa_id = await getEmpresaId();
    await supabase.from("empresas").update({ custos_tabela: null }).eq("id", empresa_id);
  },
};

export const getCustos = () => state;
