export type StatusEvento = "planejamento" | "confirmado" | "em_campo" | "finalizado";

export type DiaEvento = {
  id: string;
  data: string;
  inicio: string;
  fim: string;
  local?: string;
};

export type FuncaoEquipeEvento = {
  id: string;
  nome: string;
  quantidade: number;
};

export type MembroEquipeEvento = {
  id: string;
  funcaoId: string;
  funcao: string;
  nome: string;
  vinculo: "equipe" | "freelancer" | "fornecedor";
  dias: string[];
  equipamentos: string[];
  telefone?: string;
  email?: string;
  status?: "convidado" | "aguardando" | "confirmado" | "indisponivel";
  funcoesAdicionais?: string[];
  escalas?: Array<{
    diaId: string;
    chamada: string;
    fim: string;
  }>;
  cache?: number;
  transporte?: boolean;
  alimentacao?: boolean;
  equipamentoOrigem?: "proprio" | "produtora" | "alugado";
  observacoes?: string;
};

export type MomentoEvento = {
  id: string;
  diaId: string;
  inicio: string;
  fim: string;
  titulo: string;
  responsavelIds: string[];
  origem?: "cronograma" | "operacao";
  natureza?: "conteudo" | "transicao" | "montagem" | "intervalo";
  critico?: boolean;
  dependenciaId?: string;
  local?: string;
  observacoes?: string;
  status?: "previsto" | "preparar" | "em_andamento" | "concluido" | "atrasado" | "cancelado";
  inicioReal?: string;
  fimReal?: string;
  chamada?: string;
  cobertura?: string;
  equipamentos?: string[];
  captacaoItens?: Array<{
    id: string;
    titulo: string;
    concluido: boolean;
  }>;
  planoB?: string;
  notasAoVivo?: string;
  entregasRealtime?: EntregaRealtimeEvento[];
};

export type EntregaRealtimeEvento = {
  id: string;
  titulo: string;
  logInicio: string;
  logFim?: string;
  prazo: string;
  responsavelId?: string;
  canal?: string;
  status: "aguardando" | "logando" | "editando" | "aprovacao" | "publicado";
};

export type ReferenciaEvento = {
  id: string;
  titulo: string;
  url: string;
};

export type EventoProducao = {
  id: string;
  nome: string;
  cliente: string;
  clienteId?: string;
  tipo: string;
  local: string;
  status: StatusEvento;
  cor: string;
  descricao?: string;
  dias: DiaEvento[];
  equipe: number;
  equipeFuncoes?: FuncaoEquipeEvento[];
  equipeMembros?: MembroEquipeEvento[];
  programacao?: MomentoEvento[];
  referencias?: ReferenciaEvento[];
  orientacoesGerais?: string;
  valorOrcado?: number;
  realtimeItens?: ItemRealtimeEvento[];
  checklist?: ChecklistEvento[];
  lancamentos?: LancamentoEvento[];
  tarefasConcluidas: number;
  tarefasTotal: number;
  receitaPrevista: number;
  custosPrevistos: number;
  criadoEm: string;
};

export type ChecklistEvento = {
  id: string;
  titulo: string;
  categoria: "preparacao" | "equipamento" | "logistica" | "execucao" | "encerramento";
  diaId?: string;
  responsavelId?: string;
  prazo?: string;
  concluido: boolean;
};

export type LancamentoEvento = {
  id: string;
  descricao: string;
  categoria: "equipe" | "equipamento" | "transporte" | "alimentacao" | "fornecedor" | "outro";
  valor: number;
  pago: boolean;
  data?: string;
  membroId?: string;
};

export type ItemRealtimeEvento = {
  id: string;
  titulo: string;
  origemMembroId?: string;
  editorId?: string;
  momentoId?: string;
  logPrevisto?: string;
  logConcluido?: string;
  prazo?: string;
  destino?: string;
  status:
    | "aguardando_material"
    | "logando"
    | "pronto_editar"
    | "editando"
    | "aprovacao"
    | "pronto"
    | "publicado";
};

export const STATUS_EVENTO: Record<StatusEvento, string> = {
  planejamento: "Planejamento",
  confirmado: "Confirmado",
  em_campo: "Em campo",
  finalizado: "Finalizado",
};
