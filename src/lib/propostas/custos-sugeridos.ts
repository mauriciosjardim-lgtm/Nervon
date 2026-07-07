import { getCustos } from "@/lib/mock/custos";
import type { PropostaItem } from "@/lib/propostas";

// Base de custos sugeridos por item de proposta ("sugestão do MakersHub").
// Deriva da tabela de custos da empresa (Configurações → Tabela de preços,
// mesma base da calculadora de orçamentos) — assim quem já personalizou os
// próprios custos ganha sugestões coerentes; quem não personalizou recebe os
// defaults do MakersHub. Nunca substitui um custo que o usuário já digitou.

type Tabela = ReturnType<typeof getCustos>;

// Custo sugerido por chave conhecida (presets + entregas extras + equipe de evento).
function porChave(t: Tabela): Record<string, number> {
  const diaria = t.diariaVideomaker;
  const hEd = t.editorPorHora;
  return {
    // pré-produção / conceito
    conceito: t.roteiro, roteirizacao: t.roteiro, "roteiro-pauta": t.roteiro,
    pauta: t.roteiro, planejamento: t.roteiro, briefing: Math.round(t.roteiro / 2),
    pre: Math.round(t.roteiro / 2), moodboard: Math.round(t.roteiro / 2),
    "pre-evento": Math.round(t.roteiro / 2),
    // captação
    producao: diaria, diaria: diaria, captacao: diaria, cobertura: diaria,
    "captacao-estudio": diaria, "diaria-multicam": Math.round(diaria * 1.5),
    "captacao-multipla": diaria, "producao-still": t.fotografia,
    entrevistas: Math.round(diaria / 2), "b-roll": Math.round(diaria / 2),
    // pós-produção
    finalizacao: hEd * 8, pos: hEd * 8, edicao: hEd * 8, montagem: hEd * 8,
    "edicao-video": hEd * 8, "pos-completa": hEd * 10, "montagem-narrativa": hEd * 8,
    "edicao-audio": hEd * 4, "cor-audio": hEd * 6, masterizacao: hEd * 4,
    selecao: hEd * 3, "decupagem-detalhada": hEd * 4,
    "motion-grafismo": t.motionPorHora * 4, motion: t.motionPorHora * 4,
    tratamento: t.fotografia, "selecao-retoque": Math.round(t.fotografia / 2),
    // entregas
    entregas: hEd * 2, entrega: hEd * 2, adaptacoes: hEd * 3,
    "entrega-formatos": hEd * 2, "entrega-bruto": hEd * 2,
    backup: Math.round(hEd * 1.5), relatorio: hEd,
    cortes: hEd * 2, "cortes-redes": hEd * 2, "edicao-social": hEd * 2,
    "reels-extra": hEd * 3, legendas: hEd * 2,
    locucao: t.locucao, drone: t.drone, deslocamento: t.km,
    // evento (equipe e entregas)
    "produtor-evento": diaria, "videomaker-evento": diaria,
    "fotografo-evento": t.fotografia, "assistente-evento": t.assistente,
    "operador-camera": t.operadorAdicional, "operador-drone": t.drone,
    "editor-evento": hEd * 8, "after-movie": hEd * 10,
    "cortes-evento": hEd * 3, "fotos-evento": t.fotografia,
  };
}

// Heurística por texto — cobre itens personalizados sem chave conhecida.
function porTexto(texto: string, t: Tabela): number {
  const s = texto
    .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/drone|aere/.test(s)) return t.drone;
  if (/foto|still|ensaio/.test(s)) return t.fotografia;
  if (/motion|anima|lettering/.test(s)) return t.motionPorHora * 4;
  if (/locu|voz|narra/.test(s)) return t.locucao;
  if (/legenda/.test(s)) return t.editorPorHora * 2;
  if (/roteiro|pauta|briefing|conceito|planejamento/.test(s)) return t.roteiro;
  if (/corte|reel|stor|vertical|social/.test(s)) return t.editorPorHora * 2;
  if (/edi|montagem|pos|finaliza|master|color|decupa/.test(s)) return t.editorPorHora * 6;
  if (/capta|diaria|filma|grava|cobertura|producao/.test(s)) return t.diariaVideomaker;
  if (/desloc|km|viagem/.test(s)) return t.km;
  if (/assistente/.test(s)) return t.assistente;
  if (/operador|camera/.test(s)) return t.operadorAdicional;
  if (/entrevista|depoimento/.test(s)) return Math.round(t.diariaVideomaker / 2);
  if (/entrega|arquivo|export|versao|versoes/.test(s)) return t.editorPorHora * 2;
  return 300; // piso genérico — melhor um valor editável do que zero
}

export function custoSugerido(item: Pick<PropostaItem, "chave" | "descricao">): number {
  const t = getCustos();
  const mapa = porChave(t);
  if (mapa[item.chave] != null) return mapa[item.chave];
  return porTexto(`${item.chave} ${item.descricao}`, t);
}

/**
 * Sugere custos para todos os itens, preservando qualquer custo que o
 * usuário já tenha definido (>0). Retorna o mapa completo chave → custo.
 */
export function custosSugeridosPara(
  itens: Pick<PropostaItem, "chave" | "descricao">[],
  existentes: Record<string, number> = {},
): Record<string, number> {
  const resultado: Record<string, number> = { ...existentes };
  for (const item of itens) {
    if (!(Number(resultado[item.chave]) > 0)) {
      resultado[item.chave] = custoSugerido(item);
    }
  }
  return resultado;
}
