// Nervon — Mock store da Agenda genérica
// Em memória, reativo via useSyncExternalStore.

import { useSyncExternalStore } from "react";

export type TipoEvento = "reuniao" | "gravacao" | "entrega" | "tarefa" | "outro";
export type RefTipo = "projeto" | "tarefa" | "marco";

export interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  inicio: string; // ISO
  fim: string;    // ISO
  diaTodo?: boolean;
  tipo: TipoEvento;
  local?: string;
  participantes?: string[];
  criadoEm: string;
  refTipo?: RefTipo;
  refId?: string;
}

export const TIPOS: Record<TipoEvento, { label: string; classe: string; dot: string }> = {
  reuniao:  { label: "Reunião",  classe: "border-info/40 bg-info/10 text-info",                   dot: "bg-info" },
  gravacao: { label: "Gravação", classe: "border-primary/40 bg-primary/10 text-primary",          dot: "bg-primary" },
  entrega:  { label: "Entrega",  classe: "border-success/40 bg-success/10 text-success",          dot: "bg-success" },
  tarefa:   { label: "Tarefa",   classe: "border-warning/40 bg-warning/10 text-warning",          dot: "bg-warning" },
  outro:    { label: "Outro",    classe: "border-border bg-surface-2 text-foreground/80",         dot: "bg-muted-foreground" },
};

const now = new Date();
const at = (offsetDays: number, h: number, m = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

let eventos: Evento[] = [
  { id: "ag1", titulo: "Reunião com Nova Marca", inicio: at(0, 10), fim: at(0, 11), tipo: "reuniao", local: "Google Meet", participantes: ["Você", "Marina"], criadoEm: at(-2, 9) },
  { id: "ag2", titulo: "Captação Vibe — estúdio A", inicio: at(0, 14), fim: at(0, 19), tipo: "gravacao", local: "Estúdio A", participantes: ["Você", "Pedro"], criadoEm: at(-5, 10) },
  { id: "ag3", titulo: "Edição ep.02 Olympus", inicio: at(1, 9), fim: at(1, 13), tipo: "tarefa", participantes: ["Lucas"], criadoEm: at(-1, 12) },
  { id: "ag4", titulo: "Entrega Olympus ep.02", inicio: at(3, 18), fim: at(3, 18), tipo: "entrega", diaTodo: false, criadoEm: at(-1, 10) },
  { id: "ag5", titulo: "Call diagnóstico Atlas", inicio: at(2, 15, 30), fim: at(2, 16, 30), tipo: "reuniao", local: "Zoom", participantes: ["Você", "Carlos"], criadoEm: at(-3, 11) },
  { id: "ag6", titulo: "Briefing Fresh Burger", inicio: at(4, 11), fim: at(4, 12), tipo: "reuniao", local: "Presencial", participantes: ["Ana", "Júlia"], criadoEm: at(-2, 14) },
  { id: "ag7", titulo: "Revisão de pauta abril", inicio: at(-1, 16), fim: at(-1, 17), tipo: "tarefa", participantes: ["Ana"], criadoEm: at(-4, 9) },
];

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach(l => l());
const snapshot = () => eventos;

export const useAgenda = () => useSyncExternalStore(subscribe, snapshot, snapshot);

export const agendaActions = {
  criar(input: Omit<Evento, "id" | "criadoEm">) {
    const novo: Evento = { ...input, id: `ag${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, criadoEm: new Date().toISOString() };
    eventos = [...eventos, novo];
    emit();
    return novo;
  },
  atualizar(id: string, patch: Partial<Evento>) {
    eventos = eventos.map(e => (e.id === id ? { ...e, ...patch } : e));
    emit();
  },
  remover(id: string) {
    eventos = eventos.filter(e => e.id !== id);
    emit();
  },
  // Sync helpers usados pelo módulo de projetos
  upsertPorRef(refTipo: RefTipo, refId: string, input: Omit<Evento, "id" | "criadoEm" | "refTipo" | "refId">) {
    const existente = eventos.find(e => e.refTipo === refTipo && e.refId === refId);
    if (existente) {
      eventos = eventos.map(e => (e.id === existente.id ? { ...e, ...input, refTipo, refId } : e));
      emit();
      return existente.id;
    }
    return this.criar({ ...input, refTipo, refId }).id;
  },
  removerPorRef(refTipo: RefTipo, refId: string) {
    eventos = eventos.filter(e => !(e.refTipo === refTipo && e.refId === refId));
    emit();
  },
  listarPorRef(refTipo: RefTipo, refId: string) {
    return eventos.filter(e => e.refTipo === refTipo && e.refId === refId);
  },
};

