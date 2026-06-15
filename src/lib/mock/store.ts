// Nervon mock store — fonte única para todos os módulos.
// Tudo é referenciado por id. Nada é duplicado.

export type Status =
  | "lead-novo" | "diagnostico" | "reuniao" | "proposta" | "negociacao" | "fechado" | "perdido"
  | "rascunho" | "enviada" | "aprovada" | "recusada"
  | "pendente_assinatura" | "assinado"
  | "briefing" | "pre" | "captacao" | "edicao" | "revisao" | "aprovacao" | "entrega" | "arquivado"
  | "a_fazer" | "fazendo" | "concluida"
  | "previsto" | "recebido" | "pago";

export interface Cliente { id: string; nome: string; empresa: string; email: string; telefone: string; instagram?: string; }
export interface Lead {
  id: string; clienteId: string; origem: string; responsavel: string;
  status: Status; valorPotencial: number; proximaAcao: string; proximaAcaoData: string;
  observacoes?: string; criadoEm: string;
}
export interface Proposta { id: string; clienteId: string; titulo: string; status: Status; valor: number; criadaEm: string; }
export interface Contrato { id: string; propostaId: string; clienteId: string; status: Status; criadoEm: string; }
export interface Projeto {
  id: string; nome: string; clienteId: string; contratoId?: string; propostaId?: string;
  fase: Status; progresso: number; equipe: string[]; entregaPrevista: string; valor: number;
}
export interface Tarefa {
  id: string; projetoId: string; titulo: string; responsavel: string;
  prazo: string; prioridade: "baixa" | "media" | "alta" | "urgente"; status: Status;
}
export interface EventoAgenda {
  id: string; tipo: "reuniao" | "gravacao" | "entrega" | "tarefa" | "followup" | "vencimento";
  titulo: string; data: string; duracaoMin?: number;
  refId?: string; responsavel?: string;
}
export interface Lancamento {
  id: string; tipo: "receita" | "despesa"; categoria: string; descricao: string;
  valor: number; data: string; status: Status; clienteId?: string; projetoId?: string; contratoId?: string;
}
export interface Notificacao { id: string; tipo: "alerta" | "info" | "sucesso"; titulo: string; descricao: string; quando: string; }

const today = new Date();
const d = (offset: number) => {
  const x = new Date(today); x.setDate(x.getDate() + offset);
  return x.toISOString();
};

export const clientes: Cliente[] = [
  { id: "c1", nome: "Marina Costa", empresa: "Nova Marca Bebidas", email: "marina@novamarca.com", telefone: "+55 11 99812-3344", instagram: "@novamarca" },
  { id: "c2", nome: "Rafael Andrade", empresa: "Studio Olympus", email: "rafa@olympus.tv", telefone: "+55 21 99654-8821", instagram: "@studioolympus" },
  { id: "c3", nome: "Beatriz Lemos", empresa: "Vibe Cosméticos", email: "bia@vibe.com.br", telefone: "+55 11 98123-7766", instagram: "@vibe.oficial" },
  { id: "c4", nome: "Carlos Menezes", empresa: "Atlas Imóveis", email: "carlos@atlas.com", telefone: "+55 31 99887-2210" },
  { id: "c5", nome: "Júlia Tavares", empresa: "Fresh Burger Co.", email: "julia@freshburger.com", telefone: "+55 47 98456-1199", instagram: "@freshburgerco" },
  { id: "c6", nome: "Henrique Paiva", empresa: "Orbital Tech", email: "henrique@orbital.tech", telefone: "+55 11 99001-4488" },
];

export const leads: Lead[] = [
  { id: "l1", clienteId: "c1", origem: "Instagram", responsavel: "Você", status: "negociacao", valorPotencial: 48000, proximaAcao: "Enviar proposta revisada", proximaAcaoData: d(0), criadoEm: d(-7) },
  { id: "l2", clienteId: "c2", origem: "Indicação", responsavel: "Ana", status: "reuniao", valorPotencial: 22000, proximaAcao: "Call de diagnóstico", proximaAcaoData: d(1), criadoEm: d(-4) },
  { id: "l3", clienteId: "c4", origem: "Site", responsavel: "Você", status: "proposta", valorPotencial: 65000, proximaAcao: "Apresentar proposta", proximaAcaoData: d(2), criadoEm: d(-12) },
  { id: "l4", clienteId: "c6", origem: "LinkedIn", responsavel: "Você", status: "diagnostico", valorPotencial: 38000, proximaAcao: "Follow-up por e-mail", proximaAcaoData: d(-1), criadoEm: d(-9) },
];

export const propostas: Proposta[] = [
  { id: "p1", clienteId: "c1", titulo: "Campanha Verão Nova Marca", status: "enviada", valor: 48000, criadaEm: d(-3) },
  { id: "p2", clienteId: "c3", titulo: "Linha de conteúdo Vibe Q1", status: "aprovada", valor: 32000, criadaEm: d(-10) },
  { id: "p3", clienteId: "c5", titulo: "Vídeo institucional Fresh Burger", status: "rascunho", valor: 18500, criadaEm: d(-1) },
];

export const contratos: Contrato[] = [
  { id: "k1", propostaId: "p2", clienteId: "c3", status: "assinado", criadoEm: d(-8) },
  { id: "k2", propostaId: "p1", clienteId: "c1", status: "pendente_assinatura", criadoEm: d(-2) },
];

export const projetos: Projeto[] = [
  { id: "pr1", nome: "Vibe Q1 — Conteúdo mensal", clienteId: "c3", contratoId: "k1", propostaId: "p2", fase: "captacao", progresso: 42, equipe: ["Você", "Ana", "Pedro"], entregaPrevista: d(18), valor: 32000 },
  { id: "pr2", nome: "Olympus — Documentário curto", clienteId: "c2", fase: "edicao", progresso: 68, equipe: ["Você", "Lucas"], entregaPrevista: d(7), valor: 26500 },
  { id: "pr3", nome: "Fresh Burger — Reels Pack", clienteId: "c5", fase: "briefing", progresso: 12, equipe: ["Ana"], entregaPrevista: d(30), valor: 18500 },
  { id: "pr4", nome: "Atlas — Tour 360 lançamento", clienteId: "c4", fase: "pre", progresso: 25, equipe: ["Você", "Pedro", "Lucas"], entregaPrevista: d(22), valor: 65000 },
];

export const tarefas: Tarefa[] = [
  { id: "t1", projetoId: "pr1", titulo: "Decupagem das captações de ontem", responsavel: "Pedro", prazo: d(0), prioridade: "alta", status: "fazendo" },
  { id: "t2", projetoId: "pr2", titulo: "Color grading episódio 02", responsavel: "Lucas", prazo: d(1), prioridade: "alta", status: "a_fazer" },
  { id: "t3", projetoId: "pr1", titulo: "Roteiro pauta abril", responsavel: "Ana", prazo: d(2), prioridade: "media", status: "a_fazer" },
  { id: "t4", projetoId: "pr4", titulo: "Locação — visita técnica", responsavel: "Você", prazo: d(0), prioridade: "urgente", status: "a_fazer" },
  { id: "t5", projetoId: "pr2", titulo: "Aprovação cliente — corte 1", responsavel: "Você", prazo: d(3), prioridade: "media", status: "a_fazer" },
  { id: "t6", projetoId: "pr3", titulo: "Reunião de briefing", responsavel: "Ana", prazo: d(1), prioridade: "alta", status: "a_fazer" },
];

export const eventos: EventoAgenda[] = [
  { id: "e1", tipo: "reuniao", titulo: "Call diagnóstico — Olympus", data: d(1), duracaoMin: 45, refId: "l2", responsavel: "Ana" },
  { id: "e2", tipo: "gravacao", titulo: "Captação Vibe — estúdio A", data: d(0), duracaoMin: 480, refId: "pr1", responsavel: "Você" },
  { id: "e3", tipo: "entrega", titulo: "Entrega Olympus ep.02", data: d(7), refId: "pr2" },
  { id: "e4", tipo: "followup", titulo: "Follow-up Orbital", data: d(-1), refId: "l4", responsavel: "Você" },
  { id: "e5", tipo: "vencimento", titulo: "NF Vibe parcela 2/4", data: d(5) },
];

export const lancamentos: Lancamento[] = [
  { id: "f1", tipo: "receita", categoria: "Projeto", descricao: "Vibe Q1 — entrada", valor: 16000, data: d(-8), status: "recebido", clienteId: "c3", projetoId: "pr1", contratoId: "k1" },
  { id: "f2", tipo: "receita", categoria: "Projeto", descricao: "Vibe Q1 — parcela 2", valor: 16000, data: d(5), status: "previsto", clienteId: "c3", projetoId: "pr1", contratoId: "k1" },
  { id: "f3", tipo: "receita", categoria: "Projeto", descricao: "Olympus — entrada", valor: 13250, data: d(-15), status: "recebido", clienteId: "c2", projetoId: "pr2" },
  { id: "f4", tipo: "despesa", categoria: "Equipe", descricao: "Cachê Pedro — captação", valor: 2400, data: d(-2), status: "pago", projetoId: "pr1" },
  { id: "f5", tipo: "despesa", categoria: "Equipamento", descricao: "Aluguel câmera FX6", valor: 1800, data: d(-2), status: "pago", projetoId: "pr1" },
  { id: "f6", tipo: "despesa", categoria: "Software", descricao: "Adobe + Frame.io", valor: 420, data: d(-3), status: "pago" },
  { id: "f7", tipo: "receita", categoria: "Projeto", descricao: "Atlas — entrada", valor: 32500, data: d(3), status: "previsto", clienteId: "c4", projetoId: "pr4" },
];

export const notificacoes: Notificacao[] = [
  { id: "n1", tipo: "alerta", titulo: "Proposta sem resposta há 4 dias", descricao: "Nova Marca Bebidas — R$ 48.000", quando: d(0) },
  { id: "n2", tipo: "info", titulo: "Contrato pendente de assinatura", descricao: "Nova Marca Bebidas aguarda assinatura", quando: d(-1) },
  { id: "n3", tipo: "sucesso", titulo: "Projeto Vibe atingiu 42%", descricao: "Captação em andamento dentro do prazo", quando: d(-1) },
];

// Helpers
export const getCliente = (id: string) => clientes.find(c => c.id === id);
export const getProjeto = (id: string) => projetos.find(p => p.id === id);

// Métricas derivadas (não duplicar — sempre calcular)
export const metricas = () => {
  const receitas = lancamentos.filter(l => l.tipo === "receita");
  const despesas = lancamentos.filter(l => l.tipo === "despesa");
  const faturamento = receitas.filter(l => l.status === "recebido").reduce((s, l) => s + l.valor, 0);
  const previsto = receitas.filter(l => l.status === "previsto").reduce((s, l) => s + l.valor, 0);
  const custos = despesas.reduce((s, l) => s + l.valor, 0);
  return {
    faturamento,
    previsto,
    custos,
    lucro: faturamento - custos,
    margem: faturamento ? ((faturamento - custos) / faturamento) * 100 : 0,
    pipeline: leads.filter(l => !["fechado", "perdido"].includes(l.status)).reduce((s, l) => s + l.valorPotencial, 0),
    projetosAtivos: projetos.filter(p => p["fase"] !== "arquivado" && p["fase"] !== "entrega").length,
    tarefasHoje: tarefas.filter(t => new Date(t.prazo).toDateString() === new Date().toDateString()).length,
  };
};

// Série de 12 semanas para gráficos
export const serieFaturamento = () => {
  const base = [22, 28, 24, 31, 29, 35, 33, 38, 36, 42, 45, 48];
  return base.map((v, i) => ({
    semana: `S${i + 1}`,
    faturamento: v * 1000,
    custos: Math.round(v * 1000 * (0.35 + Math.random() * 0.1)),
  }));
};
