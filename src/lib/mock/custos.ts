// Nervon — Tabela de custos da produtora
// Persiste em localStorage; alimenta o módulo de Orçamentos.

import { useSyncExternalStore } from "react";

export interface TabelaCustos {
  // Equipe
  diariaVideomaker: number;
  editorPorHora: number;
  motionPorHora: number;
  operadorAdicional: number;
  assistente: number;
  // Equipamento
  cameraExtra: number;
  drone: number;
  droneFpv: number;
  iluminacao: number;
  audio: number;
  // Logística
  km: number;
  hospedagem: number;
  alimentacao: number;
  // Extras criativos
  locucao: number;
  roteiro: number;
  direcaoCriativa: number;
  fotografia: number;
  coberturaAdicional: number;
  entregaUrgente: number;
  horaExtra: number;
  // Margem padrão (%)
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
  diariaVideomaker:   { label: "Diária Videomaker",   sufixo: "diária",  grupo: "Equipe" },
  editorPorHora:      { label: "Editor",              sufixo: "hora",    grupo: "Equipe" },
  motionPorHora:      { label: "Motion Designer",     sufixo: "hora",    grupo: "Equipe" },
  operadorAdicional:  { label: "Operador adicional",  sufixo: "diária",  grupo: "Equipe" },
  assistente:         { label: "Assistente",          sufixo: "diária",  grupo: "Equipe" },
  cameraExtra:        { label: "Câmera extra",        sufixo: "diária",  grupo: "Equipamento" },
  drone:              { label: "Drone",               sufixo: "diária",  grupo: "Equipamento" },
  droneFpv:           { label: "Drone FPV",           sufixo: "diária",  grupo: "Equipamento" },
  iluminacao:         { label: "Kit de iluminação",   sufixo: "diária",  grupo: "Equipamento" },
  audio:              { label: "Captação de áudio",   sufixo: "diária",  grupo: "Equipamento" },
  km:                 { label: "Km rodado",           sufixo: "km",      grupo: "Logística" },
  hospedagem:         { label: "Hospedagem",          sufixo: "diária",  grupo: "Logística" },
  alimentacao:        { label: "Alimentação",         sufixo: "pessoa/dia", grupo: "Logística" },
  locucao:            { label: "Locução",             sufixo: "vídeo",   grupo: "Extras criativos" },
  roteiro:            { label: "Roteiro",             sufixo: "vídeo",   grupo: "Extras criativos" },
  direcaoCriativa:    { label: "Direção criativa",    sufixo: "projeto", grupo: "Extras criativos" },
  fotografia:         { label: "Fotografia",          sufixo: "diária",  grupo: "Extras criativos" },
  coberturaAdicional: { label: "Cobertura adicional", sufixo: "diária",  grupo: "Extras criativos" },
  entregaUrgente:     { label: "Entrega urgente",     sufixo: "taxa",    grupo: "Extras criativos" },
  horaExtra:          { label: "Hora extra",          sufixo: "hora",    grupo: "Extras criativos" },
  margemPadrao:       { label: "Margem padrão",       sufixo: "%",       grupo: "Margem" },
};

const KEY = "frameos:custos:v1";
const load = (): TabelaCustos => {
  if (typeof window === "undefined") return CUSTOS_DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return CUSTOS_DEFAULT;
    return { ...CUSTOS_DEFAULT, ...(JSON.parse(raw) as Partial<TabelaCustos>) };
  } catch { return CUSTOS_DEFAULT; }
};

let state: TabelaCustos = load();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach(l => l());
const snapshot = () => state;
const snapshotServer = () => CUSTOS_DEFAULT;

export const useCustos = () => useSyncExternalStore(subscribe, snapshot, snapshotServer);

export const custosActions = {
  set(patch: Partial<TabelaCustos>) {
    state = { ...state, ...patch };
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
    emit();
  },
  reset() {
    state = CUSTOS_DEFAULT;
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
    emit();
  },
};

export const getCustos = () => state;
