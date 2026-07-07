import { supabase } from "@/lib/supabase";
import { getEmpresaId } from "@/lib/empresaId";
import type { Orcamento } from "@/lib/mock/orcamentos";

export type PropostaItem = {
  id?: string; pacote?: string | null; chave: string; descricao: string;
  detalhe?: string | null; quantidade: number; valor_unit: number; ordem: number;
};
export type PropostaPacote = {
  id?: string; nome: string; descricao?: string | null; valor: number;
  destaque: boolean; ordem: number;
};
export type PropostaDocumento = {
  // preset que originou a proposta (institucional/mensal/podcast/evento/
  // captacao/edicao/fotografia/custom) — guardado no jsonb pra não exigir migration.
  preset?: string;
  subtitulo?: string; contexto?: string; tipo_preco: "fechado" | "pacotes";
  subtotal?: number; desconto_tipo?: "percentual" | "fixo" | null;
  desconto_valor?: number; valor_final?: number;
  cronograma?: { etapa: string; prazo: string }[];
  // condicoes.parcelamento?: { max_parcelas: number } — cálculo da parcela é
  // feito na renderização (valor_final / max_parcelas), nunca guardado pronto.
  condicoes?: Record<string, unknown>;
  observacoes?: { icone?: string; titulo: string; texto: string }[];
  opcoes_comparacao?: { chave: string; titulo: string; descricao?: string }[];
  exibir_valores_itens?: boolean;
  exibicao_valores_definida?: boolean;
  composicao_pacotes?: Record<string, string[]>;
  // Serviço recorrente (ex.: conteúdo mensal): valor_final passa a
  // representar a MENSALIDADE. duracao_meses null = sem prazo definido
  // (renovação mês a mês).
  recorrencia?: { ativa: boolean; duracao_meses: number | null };
  // Formação interna do preço. Estes custos nunca são publicados no snapshot
  // enviado ao cliente; servem apenas para sugerir preço e margem no editor.
  precificacao?: {
    ativa: boolean;
    margem: number;
    custos_itens: Record<string, number>;
  };
  // "O que o cliente recebe todo mês" — lista própria e destacada na
  // proposta, separada da tabela de itens/custos do escopo.
  entregas_mensais?: { descricao: string; quantidade: number }[];
  // Duração da cobertura em dias (preset "evento"). Multiplica o custo/valor
  // dos itens de equipe (diaristas) — deliverables (aftermovie, fotos etc.)
  // não são afetados. Default 1 quando ausente.
  numero_diarias?: number;
};
export type Proposta = {
  id: string; empresa_id: string; lead_id: string | null; orcamento_id: string | null;
  numero: number; ano: number; status: "rascunho" | "enviada" | "aceita" | "recusada";
  cliente_nome: string; cliente_empresa: string | null; titulo_projeto: string;
  rascunho: PropostaDocumento; conteudo_enviado: Record<string, unknown> | null;
  slug: string | null; link_ativo: boolean; accent_key: string; accent_hex: string | null;
  expira_em: string | null; enviada_em: string | null; visualizacoes: number;
  ultima_abertura: string | null; criado_em: string; atualizado_em: string;
  proposta_itens?: PropostaItem[]; proposta_pacotes?: PropostaPacote[];
};

export async function listarPropostas(): Promise<Proposta[]> {
  const { data, error } = await supabase.from("propostas" as never).select("*").order("atualizado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Proposta[];
}

export async function obterProposta(id: string): Promise<Proposta> {
  const { data, error } = await supabase.from("propostas" as never)
    .select("*, proposta_itens(*), proposta_pacotes(*)").eq("id", id).single();
  if (error || !data) throw error ?? new Error("Proposta não encontrada");
  return data as unknown as Proposta;
}

export async function criarProposta(): Promise<Proposta> {
  const empresa_id = await getEmpresaId();
  const ano = new Date().getFullYear();
  const { data: numero, error: numeroError } = await supabase.rpc("proxima_proposta_numero" as never, { p_empresa_id: empresa_id, p_ano: ano } as never);
  if (numeroError) throw numeroError;
  const { data, error } = await supabase.from("propostas" as never).insert({
    empresa_id, ano, numero, rascunho: { tipo_preco: "fechado" },
  } as never).select().single();
  if (error || !data) throw error ?? new Error("Não foi possível criar a proposta");
  return data as unknown as Proposta;
}

export async function salvarProposta(
  proposta: Proposta,
  itens: PropostaItem[],
  pacotes: PropostaPacote[],
): Promise<void> {
  const { error } = await supabase.from("propostas" as never).update({
    cliente_nome: proposta.cliente_nome, cliente_empresa: proposta.cliente_empresa || null,
    titulo_projeto: proposta.titulo_projeto, rascunho: proposta.rascunho,
    accent_key: proposta.accent_key, accent_hex: proposta.accent_hex || null,
    expira_em: proposta.expira_em || null, atualizado_em: new Date().toISOString(),
  } as never).eq("id", proposta.id);
  if (error) throw error;

  // Guarda os ids atuais ANTES de mexer em nada — só apagamos essas linhas
  // depois que os novos itens/pacotes já estiverem gravados com sucesso.
  // Assim uma falha no meio do caminho nunca deixa a proposta sem itens.
  const [itensAntigos, pacotesAntigos] = await Promise.all([
    supabase.from("proposta_itens" as never).select("id").eq("proposta_id", proposta.id),
    supabase.from("proposta_pacotes" as never).select("id").eq("proposta_id", proposta.id),
  ]);
  if (itensAntigos.error) throw itensAntigos.error;
  if (pacotesAntigos.error) throw pacotesAntigos.error;

  if (itens.length) {
    const { error: e } = await supabase.from("proposta_itens" as never)
      .insert(itens.map(({ id: _, ...i }) => ({ ...i, proposta_id: proposta.id })) as never);
    if (e) throw e;
  }
  if (pacotes.length) {
    const { error: e } = await supabase.from("proposta_pacotes" as never)
      .insert(pacotes.map(({ id: _, ...p }) => ({ ...p, proposta_id: proposta.id })) as never);
    if (e) throw e;
  }

  const idsItensAntigos = ((itensAntigos.data ?? []) as { id: string }[]).map((r) => r.id);
  const idsPacotesAntigos = ((pacotesAntigos.data ?? []) as { id: string }[]).map((r) => r.id);
  if (idsItensAntigos.length) {
    const { error: e } = await supabase.from("proposta_itens" as never).delete().in("id", idsItensAntigos as never);
    if (e) throw e;
  }
  if (idsPacotesAntigos.length) {
    const { error: e } = await supabase.from("proposta_pacotes" as never).delete().in("id", idsPacotesAntigos as never);
    if (e) throw e;
  }
}

// Gera uma proposta pré-preenchida a partir de um orçamento já calculado
// (botão "Gerar proposta" da calculadora). Converte os itens do cálculo em
// itens de proposta e usa o preço sugerido como valor fechado inicial —
// o usuário ainda escolhe o tom/narrativa no editor.
export async function criarPropostaDeOrcamento(orcamento: Orcamento): Promise<Proposta> {
  const empresa_id = await getEmpresaId();
  const ano = new Date().getFullYear();
  const { data: numero, error: numeroError } = await supabase.rpc(
    "proxima_proposta_numero" as never,
    { p_empresa_id: empresa_id, p_ano: ano } as never,
  );
  if (numeroError) throw numeroError;

  const precoSugerido = orcamento.calculo.precoSugerido || 0;
  const itensCalculados = orcamento.calculo.itens.map((it, i) => ({
    chave: `${slugServico(it.label)}-${i}`,
    descricao: it.label,
    detalhe: it.grupo,
    quantidade: it.qtd || 1,
    custo_unit: it.unitario || 0,
    ordem: i,
  }));
  const { data, error } = await supabase.from("propostas" as never).insert({
    empresa_id, ano, numero, orcamento_id: orcamento.id,
    cliente_nome: orcamento.geral.cliente || "",
    titulo_projeto: orcamento.geral.nomeProjeto || "",
    rascunho: {
      preset: orcamento.tipo,
      tipo_preco: "fechado",
      subtotal: precoSugerido,
      valor_final: precoSugerido,
      precificacao: {
        ativa: true,
        margem: orcamento.calculo.margem ?? 40,
        custos_itens: Object.fromEntries(
          itensCalculados.map((item) => [item.chave, item.custo_unit]),
        ),
      },
    },
  } as never).select().single();
  if (error || !data) throw error ?? new Error("Não foi possível criar a proposta");
  const proposta = data as unknown as Proposta;

  const itens = itensCalculados.map(({ custo_unit, ...item }) => ({
    ...item,
    valor_unit: custo_unit,
    proposta_id: proposta.id,
  }));
  if (itens.length) {
    const { error: e } = await supabase.from("proposta_itens" as never).insert(itens as never);
    if (e) throw e;
  }
  return proposta;
}

export async function publicarProposta(
  id: string,
  rascunhoPrivado?: PropostaDocumento,
  snapshotPublico?: Record<string, unknown>,
): Promise<string> {
  // A RPC congela o rascunho inteiro no snapshot público. Removemos
  // temporariamente a formação interna de preço para jamais expor custos.
  const {
    precificacao: _,
    composicao_pacotes: _composicao,
    exibicao_valores_definida: _decisao,
    ...rascunhoPublico
  } = rascunhoPrivado ?? ({} as PropostaDocumento);
  if (rascunhoPrivado) {
    const { error } = await supabase
      .from("propostas" as never)
      .update({ rascunho: rascunhoPublico } as never)
      .eq("id", id);
    if (error) throw error;
  }

  try {
    const { data, error } = await supabase.rpc("publicar_proposta" as never, { p_id: id } as never);
    if (error || !data) throw error ?? new Error("Proposta não encontrada ou sem permissão");
    if (snapshotPublico) {
      const { data: atual, error: leituraError } = await supabase
        .from("propostas" as never)
        .select("conteudo_enviado")
        .eq("id", id)
        .single();
      if (leituraError) throw leituraError;
      const congelado = (atual as unknown as { conteudo_enviado?: Record<string, unknown> })
        .conteudo_enviado ?? {};
      const { error: snapshotError } = await supabase
        .from("propostas" as never)
        .update({ conteudo_enviado: { ...congelado, ...snapshotPublico } } as never)
        .eq("id", id);
      if (snapshotError) throw snapshotError;
    }
    return String(data);
  } finally {
    if (rascunhoPrivado) {
      await supabase
        .from("propostas" as never)
        .update({ rascunho: rascunhoPrivado } as never)
        .eq("id", id);
    }
  }
}

// Itens e pacotes têm FK "on delete cascade" pra propostas — apagar a linha
// principal já remove tudo relacionado, sem precisar de deletes separados.
export async function removerProposta(id: string): Promise<void> {
  const { error } = await supabase.from("propostas" as never).delete().eq("id", id);
  if (error) throw error;
}

export async function obterPropostaPublica(slug: string): Promise<Record<string, any> | null> {
  const { data, error } = await supabase.rpc("proposta_publica" as never, { p_slug: slug } as never);
  if (error) throw error;
  return data as Record<string, any> | null;
}

export function slugServico(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
