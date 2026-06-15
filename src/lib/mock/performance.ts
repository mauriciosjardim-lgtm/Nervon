// Nervon — Métricas de Performance da Produtora
// Deriva indicadores dos stores existentes (financeiro, comercial, projetos)
// e adiciona dados mock onde ainda não há fonte real.

import { calcularMetricas, fmtBRL } from "./financeiro";
import { useFinanceiroSupa } from "@/lib/hooks/useFinanceiro";
import { useComercial, leadScore, type EtapaJornada } from "@/lib/hooks/useComercial";
import { useProjetos } from "@/lib/hooks/useProjetos";
import { loadMetas } from "./metas";

export { fmtBRL };

export interface DeltaInfo { atual: number; anterior: number; deltaPct: number }

const delta = (atual: number, anterior: number): DeltaInfo => ({
  atual, anterior,
  deltaPct: anterior ? ((atual - anterior) / anterior) * 100 : 0,
});

/* ============ Visão Geral ============ */
export function useVisaoGeral() {
  const { lancamentos: lancs } = useFinanceiroSupa();
  const com = useComercial(s => s);
  const pj = useProjetos();

  const m = calcularMetricas(lancs);
  const metas = loadMetas();
  const receitaMes = m.recebido;
  const lucroMes = m.saldoRealizado;
  const margemMes = m.margemRealizada;
  const receitaRecorrente = Math.round(receitaMes * 0.42); // mock: 42% recorrente
  const projetosAtivos = pj.projetos.filter(p => p.fase !== "concluido" && p.fase !== "pausado").length;
  const projetosCriticos = pj.projetos.filter(p => {
    const diasAteEntrega = (new Date(p.dataEntrega).getTime() - Date.now()) / 86400000;
    return diasAteEntrega < 7 && p.progresso < 60;
  }).length;
  const clientesAtivos = new Set(pj.projetos.filter(p => p.fase !== "concluido").map(p => p.cliente)).size;

  const leadsFechados = com.leads.filter(l => l.etapa === "fechado").length;
  const leadsPerdidos = com.leads.filter(l => l.etapa === "perdido").length;
  const taxaConversao = (leadsFechados + leadsPerdidos) ? (leadsFechados / (leadsFechados + leadsPerdidos)) * 100 : 0;
  const ticketMedio = leadsFechados ? com.leads.filter(l => l.etapa === "fechado").reduce((s, l) => s + l.valor, 0) / leadsFechados : 0;

  const pctMeta = metas.meta ? (receitaMes / metas.meta) * 100 : 0;

  // Saúde da Empresa — score composto
  const saudeFinanceira = Math.min(100, Math.max(0, margemMes * 2));
  const saudeOperacional = Math.min(100, Math.max(0, 100 - (projetosCriticos * 20)));
  const saudeComercial = Math.min(100, Math.max(0, taxaConversao * 1.2));
  const saudeMeta = Math.min(100, pctMeta);
  const saudeEmpresa = Math.round((saudeFinanceira + saudeOperacional + saudeComercial + saudeMeta) / 4);

  return {
    receitaMes, lucroMes, margemMes,
    receitaRecorrente,
    projetosAtivos, projetosCriticos, clientesAtivos,
    taxaConversao, ticketMedio,
    meta: metas.meta, pctMeta,
    saudeEmpresa,
    saudeFinanceira, saudeOperacional, saudeComercial, saudeMeta,
  };
}

/* ============ Comercial ============ */
export function usePerformanceComercial() {
  const com = useComercial(s => s);
  const novos = com.leads.length;
  const ganhos = com.leads.filter(l => l.etapa === "fechado").length;
  const perdidos = com.leads.filter(l => l.etapa === "perdido").length;
  const propostasEnviadas = com.leads.filter(l => ["proposta", "negociacao", "fechado", "perdido"].includes(l.etapa)).length;
  const conversao = (ganhos + perdidos) ? (ganhos / (ganhos + perdidos)) * 100 : 0;
  const ticketMedio = ganhos ? com.leads.filter(l => l.etapa === "fechado").reduce((s, l) => s + l.valor, 0) / ganhos : 0;
  const emNegociacao = com.leads.filter(l => !["fechado", "perdido"].includes(l.etapa)).reduce((s, l) => s + l.valor, 0);

  const etapas: { id: EtapaJornada; label: string; qtd: number; valor: number }[] = [
    { id: "novo",        label: "Novo Lead",   qtd: 0, valor: 0 },
    { id: "diagnostico", label: "Diagnóstico", qtd: 0, valor: 0 },
    { id: "reuniao",     label: "Reunião",     qtd: 0, valor: 0 },
    { id: "proposta",    label: "Proposta",    qtd: 0, valor: 0 },
    { id: "negociacao",  label: "Negociação",  qtd: 0, valor: 0 },
    { id: "fechado",     label: "Fechado",     qtd: 0, valor: 0 },
  ];
  for (const l of com.leads) {
    const e = etapas.find(x => x.id === l.etapa);
    if (e) { e.qtd++; e.valor += l.valor; }
  }

  return { novos, ganhos, perdidos, propostasEnviadas, conversao, ticketMedio, emNegociacao, etapas, tempoMedioFechamento: 18 };
}

/* ============ Produção ============ */
export function usePerformanceProducao() {
  const pj = useProjetos();
  const ativos = pj.projetos.filter(p => p.fase !== "concluido").length;
  const concluidos = pj.projetos.filter(p => p.fase === "concluido").length;
  const atrasados = pj.projetos.filter(p => new Date(p.dataEntrega) < new Date() && p.fase !== "concluido").length;
  const tarefasConcluidas = pj.tarefas.filter(t => t.concluida).length;
  const tarefasPendentes = pj.tarefas.filter(t => !t.concluida).length;

  // Projetos por colaborador
  const porColab = new Map<string, number>();
  pj.projetos.forEach(p => p.equipe.forEach(c => porColab.set(c, (porColab.get(c) || 0) + 1)));
  const colaboradores = Array.from(porColab.entries()).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);

  return { ativos, concluidos, atrasados, tarefasConcluidas, tarefasPendentes, tempoMedioEntrega: 14, mediaRevisoes: 2.3, colaboradores };
}

/* ============ Financeiro ============ */
export function usePerformanceFinanceiro() {
  const { lancamentos: lancs } = useFinanceiroSupa();
  const m = calcularMetricas(lancs);
  return { ...m, receitaRecorrente: Math.round(m.recebido * 0.42) };
}

/* ============ Clientes ============ */
export function usePerformanceClientes() {
  const pj = useProjetos();
  const { lancamentos: lancs } = useFinanceiroSupa();

  const map = new Map<string, { nome: string; receita: number; projetos: number; lucro: number }>();
  pj.projetos.forEach(p => {
    const e = map.get(p.cliente) || { nome: p.cliente, receita: 0, projetos: 0, lucro: 0 };
    e.projetos++; e.receita += p.valor; map.set(p.cliente, e);
  });
  lancs.forEach(l => {
    if (!l.cliente) return;
    const e = map.get(l.cliente);
    if (!e) return;
    if (l.tipo === "receita") e.lucro += l.valor;
    else e.lucro -= l.valor;
  });
  const arr = Array.from(map.values());
  return {
    porReceita: [...arr].sort((a, b) => b.receita - a.receita),
    porLucro: [...arr].sort((a, b) => b.lucro - a.lucro),
    total: arr.length,
    semContato: 4, // mock
    tempoMedioRelacionamento: 8, // meses
  };
}

/* ============ Equipe ============ */
export function usePerformanceEquipe() {
  const pj = useProjetos();
  const equipe = new Map<string, { nome: string; projetos: number; tarefasFeitas: number; tarefasPendentes: number }>();
  pj.projetos.forEach(p => p.equipe.forEach(c => {
    const e = equipe.get(c) || { nome: c, projetos: 0, tarefasFeitas: 0, tarefasPendentes: 0 };
    e.projetos++; equipe.set(c, e);
  }));
  pj.tarefas.forEach(t => {
    const e = equipe.get(t.responsavel);
    if (!e) return;
    if (t.concluida) e.tarefasFeitas++;
    else e.tarefasPendentes++;
  });
  return Array.from(equipe.values()).sort((a, b) => (b.tarefasFeitas + b.projetos) - (a.tarefasFeitas + a.projetos));
}

/* ============ Crescimento ============ */
export function usePerformanceCrescimento() {
  const { lancamentos: lancs } = useFinanceiroSupa();
  // Série mock de 6 meses para receita/lucro/clientes
  const baseReceita = [42, 48, 51, 56, 62, 68].map(v => v * 1000);
  const baseLucro = baseReceita.map(r => Math.round(r * (0.32 + Math.random() * 0.08)));
  const baseClientes = [4, 5, 5, 6, 7, 8];
  const baseProjetos = [3, 5, 6, 7, 9, 11];
  const baseRecorrente = baseReceita.map(r => Math.round(r * 0.35));

  const meses = ["jan", "fev", "mar", "abr", "mai", "jun"];
  const serie = meses.map((m, i) => ({
    mes: m, receita: baseReceita[i], lucro: baseLucro[i], clientes: baseClientes[i], projetos: baseProjetos[i], recorrente: baseRecorrente[i],
  }));

  // Sobrescreve o último mês com dado real
  const calc = calcularMetricas(lancs);
  serie[serie.length - 1].receita = calc.recebido || serie[serie.length - 1].receita;
  serie[serie.length - 1].lucro = calc.saldoRealizado || serie[serie.length - 1].lucro;

  const last = serie[serie.length - 1];
  const prev = serie[serie.length - 2];
  return {
    serie,
    receita: delta(last.receita, prev.receita),
    lucro: delta(last.lucro, prev.lucro),
    clientes: delta(last.clientes, prev.clientes),
    projetos: delta(last.projetos, prev.projetos),
    recorrente: delta(last.recorrente, prev.recorrente),
  };
}

/* ============ Insights ============ */
export interface Insight { id: string; tipo: "positivo" | "alerta" | "neutro"; titulo: string; descricao: string }

export function useInsights(): Insight[] {
  const vg = useVisaoGeral();
  const insights: Insight[] = [];

  if (vg.pctMeta >= 100) insights.push({ id: "i1", tipo: "positivo", titulo: "Meta do mês atingida 🎯", descricao: `Você bateu ${vg.pctMeta.toFixed(0)}% da meta — parabéns.` });
  else if (vg.pctMeta >= 70) insights.push({ id: "i1", tipo: "positivo", titulo: "Caminho certo para meta", descricao: `Projetando fechar o mês em ${vg.pctMeta.toFixed(0)}% da meta.` });
  else insights.push({ id: "i1", tipo: "alerta", titulo: "Meta sob risco", descricao: `Apenas ${vg.pctMeta.toFixed(0)}% da meta atingida. Tem 4 propostas em aberto.` });

  if (vg.projetosCriticos > 0) insights.push({ id: "i2", tipo: "alerta", titulo: `${vg.projetosCriticos} projeto(s) em estado crítico`, descricao: "Prazo curto e progresso abaixo de 60%." });
  insights.push({ id: "i3", tipo: "neutro", titulo: "Instagram gerou 62% dos novos leads", descricao: "Considere aumentar investimento no canal." });
  insights.push({ id: "i4", tipo: "positivo", titulo: "Projeto mais lucrativo: Atlas Tour 360", descricao: "Margem estimada de 58% — replique o modelo." });
  if (vg.taxaConversao < 50) insights.push({ id: "i5", tipo: "alerta", titulo: `Conversão caiu para ${vg.taxaConversao.toFixed(0)}%`, descricao: "Reveja qualificação de leads na entrada do funil." });
  insights.push({ id: "i6", tipo: "alerta", titulo: "4 clientes sem contato há mais de 60 dias", descricao: "Reaqueça relacionamento — pode virar recompra." });

  return insights;
}
