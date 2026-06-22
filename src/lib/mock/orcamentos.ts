// MakersHub — Tipos e engine de cálculo de orçamentos
// Persistência via Supabase: src/lib/hooks/useOrcamentos.ts

import { Film, Smartphone, Mic, Video, Scissors, Camera, Plus, type LucideIcon } from "lucide-react";
import type { TabelaCustos } from "./custos";
import { getCustos } from "./custos";

export type TipoOrcamento =
  | "institucional" | "mensal" | "podcast" | "captacao" | "edicao" | "fotografia" | "custom";

export const TIPOS_ORCAMENTO: Record<TipoOrcamento, { label: string; descricao: string }> = {
  institucional: { label: "Vídeo Institucional", descricao: "Conteúdo único de alto padrão." },
  mensal:        { label: "Conteúdo Mensal",     descricao: "Pacote recorrente de social." },
  podcast:       { label: "Podcast",             descricao: "Captação e edição de episódios." },
  captacao:      { label: "Captação",            descricao: "Apenas produção, sem edição." },
  edicao:        { label: "Edição",              descricao: "Pós-produção sob demanda." },
  fotografia:    { label: "Fotografia",          descricao: "Ensaios e cobertura still." },
  custom:        { label: "Projeto Personalizado", descricao: "Monte do zero." },
};

export const TIPO_ICONS: Record<TipoOrcamento, LucideIcon> = {
  institucional: Film,
  mensal:        Smartphone,
  podcast:       Mic,
  captacao:      Video,
  edicao:        Scissors,
  fotografia:    Camera,
  custom:        Plus,
};

export interface OrcamentoGeral {
  cliente: string;
  nomeProjeto: string;
  dataPrevista: string;
  responsavel: string;
}

export interface OrcamentoProducao {
  diarias: number;
  cameras: number;
  drone: boolean;
  droneFpv: boolean;
  iluminacao: boolean;
  operadorAdicional: number;
  assistente: number;
  audio: boolean;
  deslocamento: boolean;
  km: number;
}

export interface OrcamentoPos {
  videos: number;
  motionHoras: number;
  colorHoras: number;
  legendagem: boolean;
  thumb: boolean;
  shorts: number;
  vertical: boolean;
  horizontal: boolean;
  revisoes: number;
}

export interface ExtraCustom { id: string; label: string; qtd: number; valor: number }

export interface OrcamentoExtras {
  locucao: number;
  roteiro: number;
  direcaoCriativa: boolean;
  fotografia: number;
  coberturaAdicional: number;
  entregaUrgente: boolean;
  hospedagem: number;
  alimentacao: number;
  custom: ExtraCustom[];
}

export interface OrcamentoPayload {
  tipo: TipoOrcamento;
  geral: OrcamentoGeral;
  producao: OrcamentoProducao;
  pos: OrcamentoPos;
  extras: OrcamentoExtras;
  margem: number;
}

export interface ItemCalculo { grupo: string; label: string; qtd: number; unitario: number; total: number }

export interface CalculoOrcamento {
  itens: ItemCalculo[];
  custoOperacional: number;
  margem: number;
  precoSugerido: number;
  lucroEstimado: number;
}

export interface Orcamento extends OrcamentoPayload {
  id: string;
  criadoEm: string;
  calculo: CalculoOrcamento;
}

export interface OrcamentoTemplate {
  id: string;
  nome: string;
  tipo: TipoOrcamento;
  payload: OrcamentoPayload;
}

/* ============== Defaults ============== */
export const PAYLOAD_VAZIO = (tipo: TipoOrcamento = "custom"): OrcamentoPayload => ({
  tipo,
  geral: { cliente: "", nomeProjeto: "", dataPrevista: "", responsavel: "Você" },
  producao: { diarias: 1, cameras: 1, drone: false, droneFpv: false, iluminacao: false, operadorAdicional: 0, assistente: 0, audio: false, deslocamento: false, km: 0 },
  pos: { videos: 1, motionHoras: 0, colorHoras: 0, legendagem: false, thumb: false, shorts: 0, vertical: false, horizontal: true, revisoes: 2 },
  extras: { locucao: 0, roteiro: 0, direcaoCriativa: false, fotografia: 0, coberturaAdicional: 0, entregaUrgente: false, hospedagem: 0, alimentacao: 0, custom: [] },
  margem: 40,
});

const presetMensal = (): OrcamentoPayload => {
  const p = PAYLOAD_VAZIO("mensal");
  p.producao = { ...p.producao, diarias: 2, cameras: 2 };
  p.pos = { ...p.pos, videos: 12, motionHoras: 4, colorHoras: 2, legendagem: true, vertical: true, horizontal: true, revisoes: 2 };
  p.extras = { ...p.extras, roteiro: 12 };
  return p;
};
const presetInstitucional = (): OrcamentoPayload => {
  const p = PAYLOAD_VAZIO("institucional");
  p.producao = { ...p.producao, diarias: 2, cameras: 2, drone: true, iluminacao: true, audio: true, operadorAdicional: 1 };
  p.pos = { ...p.pos, videos: 1, motionHoras: 8, colorHoras: 4, legendagem: true, horizontal: true, revisoes: 3 };
  p.extras = { ...p.extras, roteiro: 1, locucao: 1, direcaoCriativa: true };
  return p;
};
const presetPodcast = (): OrcamentoPayload => {
  const p = PAYLOAD_VAZIO("podcast");
  p.producao = { ...p.producao, diarias: 1, cameras: 3, audio: true, operadorAdicional: 1 };
  p.pos = { ...p.pos, videos: 1, shorts: 8, motionHoras: 2, colorHoras: 1, vertical: true, horizontal: true, revisoes: 1 };
  return p;
};
const presetFotografia = (): OrcamentoPayload => {
  const p = PAYLOAD_VAZIO("fotografia");
  p.producao = { ...p.producao, diarias: 1, cameras: 1 };
  p.pos = { ...p.pos, videos: 0, revisoes: 1 };
  p.extras = { ...p.extras, fotografia: 1 };
  return p;
};

export const PRESETS_INICIAIS_POR_TIPO: Partial<Record<TipoOrcamento, () => OrcamentoPayload>> = {
  mensal: presetMensal,
  institucional: presetInstitucional,
  podcast: presetPodcast,
  fotografia: presetFotografia,
};

/* ============== Engine ============== */
export function calcular(payload: OrcamentoPayload, custos: TabelaCustos = getCustos()): CalculoOrcamento {
  const itens: ItemCalculo[] = [];
  const add = (grupo: string, label: string, qtd: number, unitario: number) => {
    if (qtd <= 0 || unitario <= 0) return;
    itens.push({ grupo, label, qtd, unitario, total: qtd * unitario });
  };

  const { producao: p } = payload;
  add("Produção", "Diária videomaker", p.diarias, custos.diariaVideomaker);
  add("Produção", "Câmera extra", Math.max(0, p.cameras - 1) * p.diarias, custos.cameraExtra);
  if (p.drone) add("Produção", "Drone", p.diarias, custos.drone);
  if (p.droneFpv) add("Produção", "Drone FPV", p.diarias, custos.droneFpv);
  if (p.iluminacao) add("Produção", "Iluminação", p.diarias, custos.iluminacao);
  add("Produção", "Operador adicional", p.operadorAdicional * p.diarias, custos.operadorAdicional);
  add("Produção", "Assistente", p.assistente * p.diarias, custos.assistente);
  if (p.audio) add("Produção", "Captação de áudio", p.diarias, custos.audio);
  if (p.deslocamento && p.km > 0) add("Produção", "Deslocamento", p.km, custos.km);

  const { pos: q } = payload;
  add("Pós-produção", "Edição (vídeo cheio)", q.videos * 6, custos.editorPorHora);
  add("Pós-produção", "Motion graphics", q.motionHoras, custos.motionPorHora);
  add("Pós-produção", "Color grading", q.colorHoras, custos.editorPorHora * 1.1);
  if (q.legendagem) add("Pós-produção", "Legendagem", q.videos, 60);
  if (q.thumb) add("Pós-produção", "Thumbnail", q.videos, 80);
  add("Pós-produção", "Shorts", q.shorts, custos.editorPorHora * 1.5);
  if (q.vertical && q.horizontal) add("Pós-produção", "Versão extra (vert/horiz)", q.videos, custos.editorPorHora * 1.5);
  if (q.revisoes > 2) add("Pós-produção", `Revisões extras (${q.revisoes - 2})`, q.revisoes - 2, custos.horaExtra);

  const { extras: e } = payload;
  add("Extras", "Locução", e.locucao, custos.locucao);
  add("Extras", "Roteiro", e.roteiro, custos.roteiro);
  if (e.direcaoCriativa) add("Extras", "Direção criativa", 1, custos.direcaoCriativa);
  add("Extras", "Fotografia", e.fotografia, custos.fotografia);
  add("Extras", "Cobertura adicional", e.coberturaAdicional, custos.coberturaAdicional);
  if (e.entregaUrgente) add("Extras", "Entrega urgente", 1, custos.entregaUrgente);
  add("Extras", "Hospedagem", e.hospedagem, custos.hospedagem);
  add("Extras", "Alimentação", e.alimentacao, custos.alimentacao);
  e.custom.forEach(c => add("Extras", c.label || "Item personalizado", c.qtd, c.valor));

  const custoOperacional = itens.reduce((s, i) => s + i.total, 0);
  const margem = payload.margem;
  const precoSugerido = margem >= 100 ? custoOperacional : Math.round(custoOperacional / (1 - margem / 100));
  const lucroEstimado = precoSugerido - custoOperacional;

  return { itens, custoOperacional, margem, precoSugerido, lucroEstimado };
}

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
