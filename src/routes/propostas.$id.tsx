import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Link2,
  Copy,
  ExternalLink,
  Download,
  Sparkles,
  Film,
  Plane,
  Mic2,
  Captions,
  WandSparkles,
  MessageSquare,
  PackageCheck,
  CarFront,
  UsersRound,
  CalendarCheck2,
  Calculator,
  Eye,
  EyeOff,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampoNumero } from "@/components/orcamentos/campo-numero";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardStepper } from "@/components/orcamentos/wizard-stepper";
import { gerarHtmlProposta } from "@/lib/proposta-html";
import { baixarHtmlProposta } from "@/lib/proposta-html";
import {
  obterProposta,
  publicarProposta,
  salvarProposta,
  slugServico,
  type Proposta,
  type PropostaItem,
  type PropostaPacote,
} from "@/lib/propostas";
import { gerarPreset, type TipoPresetProposta, type TomProposta } from "@/lib/propostas/presets";
import { custosSugeridosPara } from "@/lib/propostas/custos-sugeridos";
import { toast } from "sonner";

export const Route = createFileRoute("/propostas/$id")({
  validateSearch: (s: Record<string, unknown>): { tipo?: string } => ({ tipo: (s.tipo as string) || undefined }),
  component: Editor,
});
const PRESET_LABEL: Record<string, string> = {
  institucional: "Vídeo institucional",
  mensal: "Conteúdo mensal",
  podcast: "Podcast",
  evento: "Evento",
  captacao: "Captação",
  edicao: "Edição",
  fotografia: "Fotografia",
  custom: "Projeto personalizado",
};
// Exemplo de "Nome do projeto" por preset — antes era sempre institucional,
// mesmo em propostas de podcast, fotografia etc.
const PRESET_PLACEHOLDER_PROJETO: Record<string, string> = {
  institucional: "Ex.: Filme institucional — Nossa história",
  mensal: "Ex.: Conteúdo mensal — Redes sociais",
  podcast: "Ex.: Podcast — Temporada 1",
  evento: "Ex.: Convenção anual — Cobertura completa",
  captacao: "Ex.: Captação — Evento de lançamento",
  edicao: "Ex.: Edição — Vídeo de casamento",
  fotografia: "Ex.: Ensaio fotográfico — Catálogo de produtos",
  custom: "Ex.: Nome do projeto",
};
// Exemplo de entrega extra por preset (item avulso adicionado no Escopo).
const PRESET_PLACEHOLDER_ENTREGA: Record<string, string> = {
  institucional: "Ex.: Versão para cinema",
  mensal: "Ex.: Reels extra do mês",
  podcast: "Ex.: Episódio bônus",
  evento: "Ex.: Segundo fotógrafo",
  captacao: "Ex.: Diária adicional",
  edicao: "Ex.: Versão estendida",
  fotografia: "Ex.: Sessão still adicional",
  custom: "Ex.: Nome da entrega",
};
const accents = ["lime", "blue", "purple", "pink", "orange", "cyan", "red", "yellow", "white"];
type EntregaDisponivel = {
  chave: string;
  descricao: string;
  detalhe: string;
  quantitativo: boolean;
};

const entrega = (
  chave: string,
  descricao: string,
  detalhe: string,
  quantitativo = false,
): EntregaDisponivel => ({ chave, descricao, detalhe, quantitativo });

const deslocamento = entrega(
  "deslocamento",
  "Deslocamento",
  "Quilometragem total de ida e volta",
  true,
);

const itemDeEquipeEvento = (chave: string) =>
  [
    "produtor-evento",
    "videomaker-evento",
    "fotografo-evento",
    "assistente-evento",
    "operador-camera",
    "operador-drone",
    "editor-evento",
  ].includes(chave);

const ENTREGAS_POR_PRESET: Record<TipoPresetProposta, EntregaDisponivel[]> = {
  institucional: [
    entrega("entrevistas", "Entrevistas e depoimentos", "Falas para conduzir a narrativa", true),
    entrega("drone", "Imagens aéreas com drone", "Planos externos e imagens de contexto"),
    entrega("motion", "Motion graphics", "Animações, letterings e elementos gráficos"),
    entrega("locucao", "Locução profissional", "Gravação e direção de voz"),
    entrega("cortes", "Cortes para redes sociais", "Versões curtas derivadas do filme", true),
    entrega("legendas", "Legendagem", "Legendas abertas ou arquivo separado"),
    deslocamento,
  ],
  mensal: [
    entrega("reels-extra", "Reels adicionais", "Peças verticais além do volume mensal", true),
    entrega("stories", "Sequências de stories", "Conteúdo rápido para cobertura da rotina", true),
    entrega("fotos-mensais", "Banco de fotos mensal", "Imagens tratadas para acompanhar as publicações", true),
    entrega("motion-social", "Motion para redes", "Animações e letterings para as peças"),
    entrega("planejamento-extra", "Campanha especial", "Pauta e produção fora do calendário recorrente"),
    entrega("relatorio", "Relatório de entregas", "Resumo mensal do conteúdo produzido"),
    deslocamento,
  ],
  podcast: [
    entrega("cortes-podcast", "Cortes verticais", "Trechos de destaque para redes sociais", true),
    entrega("teaser", "Teaser do episódio", "Chamada curta para divulgação", true),
    entrega("thumbnail", "Thumbnail personalizada", "Capa visual para cada episódio", true),
    entrega("transcricao", "Transcrição do episódio", "Texto integral revisado"),
    entrega("publicacao", "Publicação nas plataformas", "Organização e distribuição do episódio"),
    entrega("convidado-remoto", "Convidado remoto", "Estrutura técnica para participação à distância"),
    deslocamento,
  ],
  evento: [
    entrega("produtor-evento", "Produtor de evento", "Coordenação da equipe e do cronograma no local", true),
    entrega("videomaker-evento", "Videomaker", "Profissional dedicado à captação de vídeo", true),
    entrega("fotografo-evento", "Fotógrafo", "Profissional dedicado à cobertura fotográfica", true),
    entrega("assistente-evento", "Assistente de produção", "Apoio de set, logística e equipamentos", true),
    entrega("operador-camera", "Operador de câmera", "Operação de câmera fixa ou móvel", true),
    entrega("operador-drone", "Operador de drone", "Captação aérea com profissional dedicado", true),
    entrega("editor-evento", "Editor no local", "Edição rápida durante o evento", true),
    entrega("after-movie", "Aftermovie", "Filme com os principais momentos do evento"),
    entrega("cortes-evento", "Cortes para redes sociais", "Vídeos curtos para publicação", true),
    entrega("fotos-evento", "Fotografias tratadas", "Seleção final de imagens editadas", true),
    entrega("transmissao", "Transmissão ao vivo", "Estrutura técnica para streaming"),
    deslocamento,
  ],
  captacao: [
    entrega("camera-extra", "Câmera adicional", "Novo ângulo com operação dedicada", true),
    entrega("operador-extra", "Operador adicional", "Profissional extra durante a diária", true),
    entrega("drone", "Captação com drone", "Imagens aéreas durante a diária"),
    entrega("audio-extra", "Canais adicionais de áudio", "Microfones e gravação multipista", true),
    entrega("backup-local", "Backup em locação", "Cópia de segurança realizada no set"),
    entrega("diaria-extra", "Diária adicional", "Nova diária com a estrutura selecionada", true),
    deslocamento,
  ],
  edicao: [
    entrega("cortes", "Versões adicionais", "Novos cortes derivados da edição principal", true),
    entrega("motion", "Motion graphics", "Letterings e elementos gráficos animados"),
    entrega("legendas", "Legendagem", "Legendas abertas ou arquivo separado"),
    entrega("thumbnail", "Thumbnail personalizada", "Capa pronta para publicação", true),
    entrega("idioma", "Versão em outro idioma", "Adaptação de textos, legendas ou locução", true),
    entrega("urgencia", "Entrega prioritária", "Reserva de agenda para prazo reduzido"),
  ],
  fotografia: [
    entrega("fotos-extra", "Fotos tratadas adicionais", "Imagens finais além do volume contratado", true),
    entrega("retoque", "Retoque avançado", "Tratamento fino de pele, produto ou composição", true),
    entrega("making-of", "Making of do ensaio", "Registros dos bastidores da produção"),
    entrega("producao", "Produção de objetos e cena", "Organização visual dos elementos fotografados"),
    entrega("modelo", "Direção de modelos", "Condução de poses e movimentos durante o ensaio"),
    entrega("formatos", "Versões para impressão", "Arquivos preparados para mídia impressa"),
    deslocamento,
  ],
  custom: [
    entrega("roteiro", "Roteiro e planejamento", "Estrutura criativa e técnica do projeto"),
    entrega("captacao", "Captação audiovisual", "Equipe e equipamento para produção"),
    entrega("edicao", "Edição e finalização", "Montagem, cor, áudio e exportação"),
    entrega("fotos", "Fotografia", "Cobertura e tratamento de imagens", true),
    entrega("cortes", "Versões adicionais", "Adaptações da entrega principal", true),
    deslocamento,
  ],
};

const NOMES_PACOTES: Record<TipoPresetProposta, string[][]> = {
  institucional: [
    ["Essencial", "Posicionamento", "Filme de Marca"],
    ["Apresentação", "Autoridade", "Referência"],
  ],
  mensal: [
    ["Presença", "Consistência", "Autoridade"],
    ["Calendário", "Frequência", "Always On"],
  ],
  podcast: [
    ["Episódio", "Temporada", "Canal Completo"],
    ["Essencial", "Multiplataforma", "Referência"],
  ],
  evento: [
    ["Cobertura Essencial", "Cobertura Completa", "Experiência 360°"],
    ["Registro", "Destaque", "Memória Completa"],
  ],
  captacao: [
    ["Diária Essencial", "Produção Completa", "Set Premium"],
    ["Equipe Base", "Multicâmera", "Estrutura Total"],
  ],
  edicao: [
    ["Montagem", "Finalização", "Pós Completa"],
    ["Corte Essencial", "Acabamento Pro", "Master"],
  ],
  fotografia: [
    ["Ensaio Essencial", "Banco de Imagens", "Campanha"],
    ["Seleção", "Coleção", "Acervo Premium"],
  ],
  custom: [
    ["Essencial", "Completo", "Premium"],
    ["Base", "Destaque", "Experiência"],
  ],
};

const DESCRICOES_PACOTES: Record<TipoPresetProposta, string[]> = {
  institucional: [
    "Uma apresentação objetiva da marca.",
    "Narrativa completa para fortalecer posicionamento.",
    "Produção de maior impacto e acabamento cinematográfico.",
  ],
  mensal: [
    "Volume essencial para manter a presença ativa.",
    "Cadência equilibrada para crescer com consistência.",
    "Cobertura completa do calendário de conteúdo.",
  ],
  podcast: [
    "Produção essencial do conteúdo principal.",
    "Episódio preparado para diferentes plataformas.",
    "Ecossistema completo de episódio, cortes e divulgação.",
  ],
  evento: [
    "Equipe essencial para registrar os momentos principais.",
    "Cobertura de foto e vídeo com equipe ampliada.",
    "Operação completa, entregas rápidas e conteúdo pós-evento.",
  ],
  captacao: [
    "Estrutura enxuta para realizar a captação.",
    "Equipe e equipamento para uma cobertura mais completa.",
    "Set ampliado para máxima segurança e possibilidades criativas.",
  ],
  edicao: [
    "Montagem objetiva da peça principal.",
    "Finalização completa com tratamento técnico.",
    "Pós-produção avançada e versões para diferentes canais.",
  ],
  fotografia: [
    "Seleção essencial de imagens tratadas.",
    "Acervo versátil para comunicação recorrente.",
    "Produção completa com direção de arte e retoque avançado.",
  ],
  custom: [
    "O essencial para realizar o projeto com qualidade.",
    "A opção mais equilibrada para ampliar o resultado.",
    "A experiência completa, com maior alcance e acabamento.",
  ],
};
const pacotesVazios = (): PropostaPacote[] =>
  [0, 1, 2].map((ordem) => ({
    nome: "",
    descricao: "",
    valor: 0,
    destaque: ordem === 1,
    ordem,
  }));
const input =
  "h-10 w-full rounded-lg border border-border/60 bg-background/40 px-3 text-sm outline-none focus:border-primary/50";
const area =
  "min-h-24 w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary/50";
const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
function Editor() {
  const { id } = Route.useParams();
  const { tipo: tipoDaUrl } = Route.useSearch();
  const [p, setP] = useState<Proposta>();
  const [itens, setItens] = useState<PropostaItem[]>([]);
  const [pacotes, setPacotes] = useState<PropostaPacote[]>([]);
  const [busy, setBusy] = useState(false);
  const [variante, setVariante] = useState(0);
  const [tom, setTom] = useState<TomProposta>("premium");
  const [conceitoGerado, setConceitoGerado] = useState(false);
  const [personalizando, setPersonalizando] = useState(false);
  const [step, setStep] = useState(0);
  const [novaEntrega, setNovaEntrega] = useState("");
  const [criandoEntrega, setCriandoEntrega] = useState(false);
  const [entregaCustom, setEntregaCustom] = useState({ descricao: "", detalhe: "" });
  const [variantePacote, setVariantePacote] = useState(0);
  const [novaEntregaMensal, setNovaEntregaMensal] = useState({ descricao: "", quantidade: 1 });
  const [confirmarExibicao, setConfirmarExibicao] = useState(false);
  useEffect(() => {
    obterProposta(id)
      .then((x) => {
        // Preset é guardado no rascunho (jsonb) na primeira vez que a proposta
        // é aberta — assim reabrir depois lembra qual gerador usar, mesmo sem
        // o parâmetro ?tipo= na URL (ex: link salvo, botão "Voltar").
        const presetJaSalvo = (x.rascunho as { preset?: string }).preset;
        if (!presetJaSalvo && tipoDaUrl) {
          x.rascunho = { ...x.rascunho, preset: tipoDaUrl };
        }
        setP(x);
        setItens(x.proposta_itens ?? []);
        const carregados = x.proposta_pacotes ?? [];
        setPacotes(
          x.rascunho.tipo_preco === "pacotes" && !carregados.length ? pacotesVazios() : carregados,
        );
        setConceitoGerado(Boolean(x.rascunho.contexto || x.rascunho.subtitulo));
        if (((presetJaSalvo || tipoDaUrl) ?? "custom") === "custom") setPersonalizando(true);
      })
      .catch((e) => toast.error(e.message));
  }, [id]);
  if (!p) return <div className="p-8 text-sm text-muted-foreground">Carregando proposta…</div>;
  const tipoAtual = ((p.rascunho as { preset?: string }).preset ?? tipoDaUrl ?? "custom") as TipoPresetProposta;
  const presetDisponivel = tipoAtual !== "custom";
  const entregasDisponiveis = ENTREGAS_POR_PRESET[tipoAtual] ?? ENTREGAS_POR_PRESET.custom;
  // Recorrência não tem default forçado por preset — o usuário decide, mas
  // "mensal" já nasce marcado (ver aplicarInstitucional).
  const recorrenciaAtiva = Boolean(p.rascunho.recorrencia?.ativa);
  const condicoes = (p.rascunho.condicoes ?? {}) as Record<string, unknown> & {
    parcelamento?: { max_parcelas: number };
  };
  const maxParcelas = condicoes.parcelamento?.max_parcelas ?? 1;
  const precificacao = p.rascunho.precificacao ?? {
    ativa: true,
    margem: 40,
    custos_itens: {},
  };
  const margem = Math.min(80, Math.max(0, Number(precificacao.margem ?? 40)));
  // Duração da cobertura (preset evento): multiplica só os itens de equipe
  // (diaristas) — entregas fixas (aftermovie, galeria de fotos) não mudam
  // com o número de dias.
  const numeroDiarias =
    tipoAtual === "evento" ? Math.max(1, Number(p.rascunho.numero_diarias || 1)) : 1;
  const multiplicadorItem = (chave: string) =>
    tipoAtual === "evento" && itemDeEquipeEvento(chave) ? numeroDiarias : 1;
  const custoOperacional = itens.reduce(
    (total, item) =>
      total +
      Number(item.quantidade || 1) * multiplicadorItem(item.chave) *
        Number(precificacao.custos_itens[item.chave] || 0),
    0,
  );
  const precoSugerido =
    margem >= 100
      ? custoOperacional
      : Math.round(custoOperacional / (1 - margem / 100));
  const lucroEstimado = Math.max(0, precoSugerido - custoOperacional);
  const valorParaDistribuir = Number(p.rascunho.valor_final || 0) || precoSugerido;
  const fatorVenda = custoOperacional > 0 ? valorParaDistribuir / custoOperacional : 0;
  const itensPrecificados = itens.map((item) => {
    const custoUnitario = Number(precificacao.custos_itens[item.chave] || 0);
    return precificacao.ativa && custoUnitario > 0
      ? { ...item, valor_unit: Math.round(custoUnitario * fatorVenda * 100) / 100 }
      : item;
  });
  const composicaoPacotes = p.rascunho.composicao_pacotes ?? {};
  // Aplica o multiplicador de diárias só na versão exibida ao cliente — o que
  // é salvo (itensPrecificados) mantém a quantidade "crua" (nº de
  // profissionais), senão reabrir a proposta multiplicaria de novo a cada save.
  const comDiariaExibida = (item: PropostaItem) => {
    const mult = multiplicadorItem(item.chave);
    if (mult <= 1) return item;
    const qtdOriginal = Number(item.quantidade || 1);
    return {
      ...item,
      quantidade: qtdOriginal * mult,
      detalhe: item.detalhe
        ? `${item.detalhe} · ${qtdOriginal} profissional${qtdOriginal > 1 ? "is" : ""} × ${mult} diária${mult > 1 ? "s" : ""}`
        : `${qtdOriginal} profissional${qtdOriginal > 1 ? "is" : ""} × ${mult} diária${mult > 1 ? "s" : ""}`,
    };
  };
  const itensPublicos =
    p.rascunho.tipo_preco === "pacotes"
      ? pacotes.flatMap((pacote, indice) => {
          const selecionados = new Set(composicaoPacotes[String(indice)] ?? []);
          return itensPrecificados
            .filter((item) => selecionados.has(item.chave))
            .map((item) => ({ ...comDiariaExibida(item), pacote: pacote.nome || `Pacote ${indice + 1}` }));
        })
      : itensPrecificados.map((item) => ({ ...comDiariaExibida(item), pacote: null }));
  const {
    precificacao: _precificacaoPrivada,
    composicao_pacotes: _composicaoPrivada,
    exibicao_valores_definida: _decisaoPrivada,
    ...rascunhoPublico
  } = p.rascunho;
  const snapshotPublico = {
    ...rascunhoPublico,
    cliente_nome: p.cliente_nome,
    cliente_empresa: p.cliente_empresa,
    titulo_projeto: p.titulo_projeto,
    ano: p.ano,
    numero: p.numero,
    expira_em: p.expira_em,
    itens: itensPublicos,
    pacotes,
    accent_key: p.accent_key,
    accent_hex: p.accent_hex,
  };
  const patch = (x: Partial<Proposta>) => setP({ ...p, ...x });
  const doc = (x: Record<string, unknown>) => patch({ rascunho: { ...p.rascunho, ...x } });
  const limparComposicaoSemItem = (
    listaItens: PropostaItem[],
    composicao: Record<string, string[]> = composicaoPacotes,
  ) => {
    const chavesValidas = new Set(listaItens.map((item) => item.chave));
    return Object.fromEntries(
      Object.entries(composicao).map(([pacote, chaves]) => [
        pacote,
        chaves.filter((chave) => chavesValidas.has(chave)),
      ]),
    );
  };
  const atualizarItens = (
    proximaLista: PropostaItem[],
    proximaComposicao = limparComposicaoSemItem(proximaLista),
  ) => {
    setItens(proximaLista);
    doc({ composicao_pacotes: proximaComposicao });
    setPacotes(
      pacotesRecalculados(
        precificacao.custos_itens,
        margem,
        proximaLista,
        proximaComposicao,
      ),
    );
  };
  const salvar = async (show = true) => {
    setBusy(true);
    try {
      await salvarProposta(p, itensPrecificados, pacotes);
      if (show) toast.success("Rascunho salvo");
    } catch (e: any) {
      toast.error(e.message);
      throw e;
    } finally {
      setBusy(false);
    }
  };
  const publicar = async () => {
    if (!p.cliente_nome || !p.titulo_projeto) return toast.error("Informe cliente e título");
    setBusy(true);
    try {
      await salvar(false);
      const slug = await publicarProposta(p.id, p.rascunho, snapshotPublico);
      const x = await obterProposta(p.id);
      setP(x);
      toast.success(p.slug ? "Proposta publicada atualizada" : "Link da proposta gerado");
      if (!x.slug) patch({ slug });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const url = p.slug ? `${location.origin}/p/${p.slug}` : "";
  const addItem = () => {
    const escolha = entregasDisponiveis.find((e) => e.chave === novaEntrega);
    if (!escolha) return;
    atualizarItens([
      ...itens,
      {
        chave: escolha.chave,
        descricao: escolha.descricao,
        detalhe: escolha.detalhe,
        quantidade: 1,
        valor_unit: 0,
        ordem: itens.length,
      },
    ]);
    setNovaEntrega("");
  };
  const gerarPacotes = () => {
    const opcoes = NOMES_PACOTES[tipoAtual] ?? NOMES_PACOTES.custom;
    const nomes = opcoes[variantePacote % opcoes.length];
    const descricoes = DESCRICOES_PACOTES[tipoAtual] ?? DESCRICOES_PACOTES.custom;
    setPacotes(
      nomes.map((nome, i) => ({
        nome,
        descricao: descricoes[i],
        valor: pacotes[i]?.valor || 0,
        destaque: i === 1,
        ordem: i,
      })),
    );
    setVariantePacote((v) => v + 1);
  };
  // Recalcula o valor dos pacotes montados por composição a partir dos custos
  // e da margem — fonte única de propagação: editar um valor unitário ou a
  // margem atualiza os pacotes junto.
  const pacotesRecalculados = (
    custos: Record<string, number>,
    margemAtual: number,
    listaItens: PropostaItem[] = itens,
    composicao: Record<string, string[]> = composicaoPacotes,
    listaPacotes: PropostaPacote[] = pacotes,
  ): PropostaPacote[] =>
    listaPacotes.map((pacote, indice) => {
      const chaves = composicao[String(indice)];
      if (!chaves?.length) return pacote; // pacote sem composição = valor manual, não mexe
      const custo = listaItens
        .filter((item) => chaves.includes(item.chave))
        .reduce(
          (total, item) =>
            total +
            Number(item.quantidade || 1) * multiplicadorItem(item.chave) *
              Number(custos[item.chave] || 0),
          0,
        );
      const valor = margemAtual >= 100 ? custo : Math.round(custo / (1 - margemAtual / 100));
      return { ...pacote, valor };
    });

  // Um clique: preenche a base de valores de TODOS os itens do escopo com a
  // sugestão do MakersHub (deriva da tabela de custos da empresa), sem tocar
  // no que o usuário já digitou. Pacotes com composição recalculam junto.
  const aplicarValoresSugeridos = () => {
    if (!itens.length) return toast.error("Adicione itens ao escopo primeiro");
    const custosCompletos = custosSugeridosPara(itens, precificacao.custos_itens);
    doc({ precificacao: { ...precificacao, ativa: true, custos_itens: custosCompletos } });
    setPacotes(pacotesRecalculados(custosCompletos, margem));
    toast.success("Valores sugeridos aplicados — ajuste qualquer item se quiser");
  };

  const sugerirComposicaoPacotes = () => {
    if (!itens.length) return toast.error("Adicione itens ao escopo primeiro");
    const extrasSugeridos = entregasDisponiveis
      .filter((opcao) => !itens.some((item) => item.chave === opcao.chave))
      .slice(0, 3)
      .map((opcao, indice) => ({
        chave: opcao.chave,
        descricao: opcao.descricao,
        detalhe: opcao.detalhe,
        quantidade: 1,
        valor_unit: 0,
        ordem: itens.length + indice,
      }));
    const itensExpandidos = [...itens, ...extrasSugeridos];
    // Completa os custos que faltam com a base sugerida do MakersHub — itens
    // fora do escopo original entravam zerados e derrubavam o valor do pacote.
    const custosCompletos = custosSugeridosPara(itensExpandidos, precificacao.custos_itens);
    const base = itens.map((item) => item.chave);
    const extras = extrasSugeridos.map((item) => item.chave);
    const composicao = {
      "0": base,
      "1": [...base, ...extras.slice(0, Math.max(1, Math.ceil(extras.length / 2)))],
      "2": [...base, ...extras],
    };
    const nomes = (NOMES_PACOTES[tipoAtual] ?? NOMES_PACOTES.custom)[0];
    const descricoes = DESCRICOES_PACOTES[tipoAtual] ?? DESCRICOES_PACOTES.custom;
    const pacotesBase = pacotes.length ? pacotes : pacotesVazios();
    const novosPacotes = pacotesRecalculados(
      custosCompletos, margem, itensExpandidos, composicao, pacotesBase,
    ).map((pacote, indice) => ({
      ...pacote,
      nome: pacote.nome || nomes[indice],
      descricao: pacote.descricao || descricoes[indice],
      destaque: indice === 1,
    }));
    if (extrasSugeridos.length) setItens(itensExpandidos);
    doc({
      composicao_pacotes: composicao,
      precificacao: { ...precificacao, ativa: true, custos_itens: custosCompletos },
    });
    setPacotes(novosPacotes);
    toast.success("Pacotes montados com valores sugeridos — ajuste o que quiser");
  };
  const aplicarInstitucional = (regenerar = false, tomEscolhido: TomProposta = tom) => {
    const proxima = regenerar ? variante + 1 : variante;
    const gerada = gerarPreset(tipoAtual, p.cliente_empresa || p.cliente_nome, tomEscolhido, proxima);
    if (!gerada) return; // "custom" não tem gerador — usuário escreve do zero
    setVariante(proxima);
    setConceitoGerado(true);
    const primeiraGeracao =
      !conceitoGerado &&
      !p.rascunho.contexto &&
      !p.rascunho.subtitulo &&
      !itens.length;
    patch({
      ...p,
      titulo_projeto: p.titulo_projeto || PRESET_LABEL[tipoAtual] || "Nova proposta",
      rascunho: primeiraGeracao
        ? {
            ...p.rascunho,
            ...gerada.documento,
            valor_final: p.rascunho.valor_final,
            precificacao: p.rascunho.precificacao ?? gerada.documento.precificacao,
            // Conteúdo mensal já nasce como recorrente — usuário pode desligar depois.
            recorrencia:
              tipoAtual === "mensal"
                ? {
                    ativa: true,
                    duracao_meses: p.rascunho.recorrencia?.duracao_meses ?? null,
                  }
                : p.rascunho.recorrencia,
          }
        : {
            ...p.rascunho,
            preset: tipoAtual,
            subtitulo: gerada.documento.subtitulo,
            contexto: gerada.documento.contexto,
            observacoes: p.rascunho.observacoes ?? gerada.documento.observacoes,
            condicoes: p.rascunho.condicoes ?? gerada.documento.condicoes,
            cronograma:
              p.rascunho.cronograma === undefined
                ? gerada.documento.cronograma
                : p.rascunho.cronograma,
          },
    });
    // O conceito nunca deve apagar um escopo já montado — principalmente
    // quando os itens vieram da calculadora de orçamento.
    if (!itens.length) setItens(gerada.itens);
    toast.success(regenerar ? "Nova versão gerada" : "Proposta gerada");
  };
  const validarEtapa = (destino: number) => {
    if (destino <= step) return true;
    if (destino >= 2 && presetDisponivel && !p.rascunho.contexto) {
      toast.error("Gere ou escreva o conceito antes de avançar");
      setStep(1);
      return false;
    }
    if (destino >= 3 && !itens.length) {
      toast.error("Selecione pelo menos uma entrega no escopo");
      setStep(2);
      return false;
    }
    if (destino >= 3 && precificacao.ativa && !p.rascunho.exibicao_valores_definida) {
      setConfirmarExibicao(true);
      setStep(2);
      return false;
    }
    if (
      destino >= 5 &&
      p.rascunho.tipo_preco === "pacotes" &&
      !Object.values(composicaoPacotes).some((lista) => lista.length)
    ) {
      toast.error("Monte a composição dos pacotes ou use a sugestão MakersHub");
      setStep(4);
      return false;
    }
    return true;
  };
  const irParaEtapa = (destino: number) => {
    if (validarEtapa(destino)) setStep(destino);
  };
  const steps = [
    { id: 0, label: "Geral" },
    { id: 1, label: "Conceito" },
    { id: 2, label: "Escopo" },
    { id: 3, label: "Cronograma" },
    { id: 4, label: "Investimento" },
    { id: 5, label: "Resultado" },
  ];
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <Link
        to="/propostas"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Voltar
      </Link>
      <header className="my-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[.18em] text-primary">{PRESET_LABEL[tipoAtual] ?? "Proposta"}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            {p.titulo_projeto || "Vamos construir sua proposta"}
          </h1>
        </div>
        <Button variant="outline" onClick={() => salvar()} disabled={busy}>
          <Save className="mr-2 size-4" />
          Salvar rascunho
        </Button>
      </header>
      <div className="mb-8">
        <WizardStepper steps={steps} current={step} onJump={irParaEtapa} />
      </div>
      {p.enviada_em && (
        <div className="mb-6 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
          Tu está editando um rascunho. O cliente ainda vê a versão publicada em{" "}
          {new Date(p.enviada_em).toLocaleString("pt-BR")}.
        </div>
      )}
      {p.slug && (
        <div className="mb-6 rounded-xl border border-border bg-surface-1 p-4">
          <p className="font-medium">Proposta publicada</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigator.clipboard.writeText(url).then(() => toast.success("Link copiado"))
              }
            >
              <Copy className="mr-2 size-3.5" />
              Copiar link
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-3.5" />
                Abrir proposta
              </a>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Visualizações: {p.visualizacoes} · Última abertura:{" "}
            {p.ultima_abertura ? new Date(p.ultima_abertura).toLocaleString("pt-BR") : "—"}
          </p>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main>
          {step === 1 && (
            <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 to-transparent p-5">
              <div className="flex flex-col gap-5">
                <div className="flex gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Film className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium">Conceito da apresentação</p>
                    <p className="text-sm text-muted-foreground">
                      Escolha um tom para gerar o texto ou escreva tudo do seu jeito.
                    </p>
                  </div>
                </div>
                <div className={`grid gap-3 ${presetDisponivel ? "sm:grid-cols-4" : "sm:grid-cols-1"}`}>
                  {presetDisponivel &&
                    (["premium", "direto", "humano"] as TomProposta[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTom(t);
                          setPersonalizando(false);
                          aplicarInstitucional(Boolean(p.rascunho.contexto), t);
                        }}
                        className={`rounded-xl border p-4 text-left capitalize transition ${!personalizando && tom === t ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background/30"}`}
                      >
                        {t}
                        <span className="mt-1 block text-xs normal-case text-muted-foreground">
                          {t === "premium"
                            ? "Sofisticado e estratégico"
                            : t === "direto"
                              ? "Objetivo e comercial"
                              : "Próximo e emocional"}
                        </span>
                      </button>
                    ))}
                  {presetDisponivel && (
                    <button
                      onClick={() => setPersonalizando(true)}
                      className={`rounded-xl border p-4 text-left transition ${personalizando ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background/30"}`}
                    >
                      Do meu jeito
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Escrever livremente
                      </span>
                    </button>
                  )}
                </div>
                {personalizando ? (
                  <div className="space-y-4 rounded-xl border border-border/60 bg-background/35 p-5">
                    <Field label="Frase de abertura">
                      <textarea
                        className={area}
                        value={p.rascunho.subtitulo || ""}
                        onChange={(e) => doc({ subtitulo: e.target.value })}
                        placeholder="Escreva a ideia principal da proposta…"
                      />
                    </Field>
                    <Field label="Contexto do projeto">
                      <textarea
                        className={area}
                        value={p.rascunho.contexto || ""}
                        onChange={(e) => doc({ contexto: e.target.value })}
                        placeholder="Explique o momento do cliente, o desafio e a proposta criativa…"
                      />
                    </Field>
                  </div>
                ) : (
                  p.rascunho.subtitulo && (
                    <div className="rounded-xl border border-border/60 bg-background/35 p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">
                        Ideia de apresentação
                      </p>
                      <h3 className="mt-3 font-display text-xl font-semibold leading-snug">
                        {p.rascunho.subtitulo}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {p.rascunho.contexto}
                      </p>
                    </div>
                  )
                )}
                {!personalizando && (
                  <Button
                    variant="outline"
                    onClick={() => aplicarInstitucional(conceitoGerado, tom)}
                  >
                    <Sparkles className="mr-2 size-4" />
                    {conceitoGerado ? "Gerar outra versão" : "Gerar conceito"}
                  </Button>
                )}
              </div>
            </div>
          )}
          {step === 0 && (
            <div className="grid gap-5">
              <Card title="Informações gerais">
                <Field label="Cliente">
                  <input
                    className={input}
                    placeholder="Nome da pessoa"
                    value={p.cliente_nome}
                    onChange={(e) => patch({ cliente_nome: e.target.value })}
                  />
                </Field>
                <Field label="Empresa ou marca">
                  <input
                    className={input}
                    placeholder="Nome da empresa"
                    value={p.cliente_empresa ?? ""}
                    onChange={(e) => patch({ cliente_empresa: e.target.value })}
                  />
                </Field>
                <Field label="Nome do projeto">
                  <input
                    className={input}
                    placeholder={PRESET_PLACEHOLDER_PROJETO[tipoAtual] ?? PRESET_PLACEHOLDER_PROJETO.custom}
                    value={p.titulo_projeto}
                    onChange={(e) => patch({ titulo_projeto: e.target.value })}
                  />
                </Field>
                {tipoAtual === "evento" && (
                  <Field
                    label="Número de diárias"
                    hint="Quantos dias de cobertura o evento tem. Multiplica automaticamente o custo e o valor da equipe (produtor, videomakers, fotógrafos etc.) — não afeta entregas fixas como aftermovie e galeria de fotos."
                  >
                    <CampoNumero
                      label="Diárias"
                      value={numeroDiarias}
                      onChange={(v) => doc({ numero_diarias: v })}
                      min={1}
                      max={30}
                    />
                  </Field>
                )}
              </Card>
            </div>
          )}
          {step === 3 && (
            <Card title="Cronograma da proposta">
              <p className="text-sm text-muted-foreground">
                Escolha como deseja apresentar as etapas ao cliente.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {presetDisponivel && (
                  <button
                    onClick={() => {
                      const gerada = gerarPreset(tipoAtual, p.cliente_empresa || p.cliente_nome, tom, 0);
                      if (gerada) doc({ cronograma: gerada.documento.cronograma });
                    }}
                    className={`rounded-xl border p-4 text-left transition ${p.rascunho.cronograma?.length ? "border-primary bg-primary/10" : "border-border/60"}`}
                  >
                    <b className="text-sm">Cronograma sugerido</b>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Planejamento em quatro etapas.
                    </span>
                  </button>
                )}
                <button
                  onClick={() =>
                    doc({
                      cronograma: [
                        { etapa: "Pré-produção", prazo: "A definir" },
                        { etapa: "Captação", prazo: "A definir" },
                        { etapa: "Entrega final", prazo: "A definir" },
                      ],
                    })
                  }
                  className="rounded-xl border border-border/60 p-4 text-left transition hover:border-primary/40"
                >
                  <b className="text-sm">Personalizar depois</b>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Cria uma estrutura básica editável.
                  </span>
                </button>
                <button
                  onClick={() => doc({ cronograma: [] })}
                  className={`rounded-xl border p-4 text-left transition ${p.rascunho.cronograma?.length === 0 ? "border-primary bg-primary/10" : "border-border/60"}`}
                >
                  <b className="text-sm">Sem cronograma</b>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Não mostrar esta seção.
                  </span>
                </button>
              </div>
              {!!p.rascunho.cronograma?.length && (
                <div className="space-y-2">
                  {p.rascunho.cronograma.map((etapa, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-2">
                      <input
                        className={input}
                        value={etapa.etapa}
                        onChange={(e) =>
                          doc({
                            cronograma: p.rascunho.cronograma?.map((item, i) =>
                              i === index ? { ...item, etapa: e.target.value } : item,
                            ),
                          })
                        }
                      />
                      <input
                        className={input}
                        value={etapa.prazo}
                        onChange={(e) =>
                          doc({
                            cronograma: p.rascunho.cronograma?.map((item, i) =>
                              i === index ? { ...item, prazo: e.target.value } : item,
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
          {step === 4 && (
            <div className="grid gap-5">
              {precificacao.ativa && (
                <Card title="Formação do preço">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <ResumoFinanceiro
                      label="Custo operacional"
                      valor={moeda(custoOperacional)}
                    />
                    <ResumoFinanceiro
                      label="Margem desejada"
                      valor={`${margem}%`}
                      destaque
                    />
                    <ResumoFinanceiro
                      label="Preço sugerido"
                      valor={moeda(precoSugerido)}
                      destaque
                    />
                    <ResumoFinanceiro
                      label="Lucro estimado"
                      valor={moeda(lucroEstimado)}
                      sucesso
                    />
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/25 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Quanto você quer de margem?</p>
                        <p className="text-xs text-muted-foreground">
                          O preço é recalculado em tempo real para proteger sua margem.
                        </p>
                      </div>
                      <b className="font-display text-xl text-primary">{margem}%</b>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={5}
                      value={margem}
                      onChange={(e) => {
                        const novaMargem = Number(e.target.value);
                        doc({
                          precificacao: { ...precificacao, margem: novaMargem },
                        });
                        // pacotes com composição acompanham a nova margem
                        setPacotes(pacotesRecalculados(precificacao.custos_itens, novaMargem));
                      }}
                      className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-primary"
                    />
                  </div>

                  <div className="rounded-xl border border-border/50 bg-background/20 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Custos do escopo
                      </p>
                      <span className="text-xs text-muted-foreground">{itens.length} itens</span>
                    </div>
                    <div className="max-h-52 space-y-2 overflow-y-auto">
                      {itens.map((item) => {
                        const custoUnitario = Number(
                          precificacao.custos_itens[item.chave] || 0,
                        );
                        const multiplicador = multiplicadorItem(item.chave);
                        const quantidadeReal = Number(item.quantidade || 1) * multiplicador;
                        return (
                          <div
                            key={item.chave}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="min-w-0 truncate text-foreground/80">
                              <span className="text-muted-foreground">
                                {quantidadeReal}×{" "}
                              </span>
                              {item.descricao}
                              {multiplicador > 1 && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({item.quantidade || 1} prof. × {multiplicador} diárias)
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {moeda(quantidadeReal * custoUnitario)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {custoOperacional > 0 ? (
                    p.rascunho.tipo_preco === "fechado" ? (
                      <Button
                        onClick={() => doc({ valor_final: precoSugerido, subtotal: custoOperacional })}
                      >
                        Usar {moeda(precoSugerido)} como investimento
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          const temComposicao = Object.values(composicaoPacotes).some(
                            (lista) => lista.length,
                          );
                          setPacotes(
                            (pacotes.length ? pacotes : pacotesVazios()).map((pacote, index) => {
                              const selecionados = new Set(
                                composicaoPacotes[String(index)] ?? [],
                              );
                              const custoDoPacote = temComposicao
                                ? itens
                                    .filter((item) => selecionados.has(item.chave))
                                    .reduce(
                                      (total, item) =>
                                        total +
                                        Number(item.quantidade || 1) *
                                          multiplicadorItem(item.chave) *
                                          Number(
                                            precificacao.custos_itens[item.chave] || 0,
                                          ),
                                      0,
                                    )
                                : custoOperacional * [0.7, 1, 1.3][index];
                              return {
                                ...pacote,
                                valor:
                                  margem >= 100
                                    ? Math.round(custoDoPacote)
                                    : Math.round(custoDoPacote / (1 - margem / 100)),
                                destaque: index === 1,
                              };
                            }),
                          );
                        }}
                      >
                        Aplicar sugestão aos três pacotes
                      </Button>
                    )
                  ) : (
                    <p className="rounded-lg border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
                      Volte ao Escopo e informe os custos para receber uma sugestão segura.
                    </p>
                  )}
                </Card>
              )}
              <Card title="Como será apresentada?">
                <Field
                  label="Modelo de investimento"
                  hint="Use preço fechado para uma produção única e pacotes para comparar opções."
                >
                  <Select
                    value={p.rascunho.tipo_preco}
                    onValueChange={(value) => {
                      doc({ tipo_preco: value });
                      if (value === "pacotes" && !pacotes.length) {
                        setPacotes(pacotesVazios());
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 border-border/60 bg-background/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fechado">Projeto único — preço fechado</SelectItem>
                      <SelectItem value="pacotes">Opções de pacotes</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Proposta válida até">
                  <input
                    type="date"
                    className={input}
                    value={p.expira_em ?? ""}
                    onChange={(e) => patch({ expira_em: e.target.value })}
                  />
                </Field>
                <Field label="Cor de destaque">
                  <div className="flex flex-wrap gap-2">
                    {accents.map((a) => (
                      <button
                        key={a}
                        title={a}
                        onClick={() => patch({ accent_key: a, accent_hex: null })}
                        className={`size-8 rounded-full border-2 ${p.accent_key === a && !p.accent_hex ? "border-foreground" : "border-transparent"}`}
                        style={{
                          background: (
                            {
                              lime: "#A3FF2B",
                              blue: "#1495F5",
                              purple: "#8B5CF6",
                              pink: "#E957B5",
                              orange: "#FF812B",
                              cyan: "#12C7CE",
                              red: "#FF4148",
                              yellow: "#FFD033",
                              white: "#EEF1F4",
                            } as any
                          )[a],
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      title="Cor personalizada"
                      value={p.accent_hex ?? "#A3FF2B"}
                      onChange={(e) => patch({ accent_hex: e.target.value })}
                      className="h-8 w-10"
                    />
                  </div>
                </Field>
                {p.rascunho.tipo_preco === "fechado" && (
                  <>
                    <Field
                      label={recorrenciaAtiva ? "Valor mensal" : "Investimento total"}
                      hint={
                        recorrenciaAtiva
                          ? "Valor cobrado a cada mês do contrato."
                          : "Valor final apresentado ao cliente."
                      }
                    >
                      <CurrencyInput
                        className={input}
                        value={p.rascunho.valor_final ?? 0}
                        onValueChange={(v) => doc({ valor_final: v })}
                      />
                    </Field>

                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border/60 bg-background/25 p-4">
                      <div>
                        <p className="text-sm font-medium">É um serviço recorrente (mensal)?</p>
                        <p className="text-xs text-muted-foreground">
                          Ativa quando o cliente paga uma mensalidade em vez de um valor fechado único.
                        </p>
                      </div>
                      <Checkbox
                        checked={recorrenciaAtiva}
                        onCheckedChange={(checked) =>
                          doc({
                            recorrencia: {
                              ativa: Boolean(checked),
                              duracao_meses: p.rascunho.recorrencia?.duracao_meses ?? null,
                            },
                          })
                        }
                        className="size-5"
                      />
                    </label>

                    {recorrenciaAtiva ? (
                      <Field
                        label="Duração do contrato"
                        hint="Sem prazo definido = renovação automática mês a mês."
                      >
                        <Select
                          value={String(p.rascunho.recorrencia?.duracao_meses ?? "indeterminado")}
                          onValueChange={(value) =>
                            doc({
                              recorrencia: {
                                ativa: true,
                                duracao_meses: value === "indeterminado" ? null : Number(value),
                              },
                            })
                          }
                        >
                          <SelectTrigger className="h-11 border-border/60 bg-background/40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="indeterminado">Sem prazo definido</SelectItem>
                            <SelectItem value="3">3 meses</SelectItem>
                            <SelectItem value="6">6 meses</SelectItem>
                            <SelectItem value="12">12 meses</SelectItem>
                            <SelectItem value="24">24 meses</SelectItem>
                          </SelectContent>
                        </Select>
                        {p.rascunho.recorrencia?.duracao_meses ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Total do contrato:{" "}
                            {(
                              (p.rascunho.valor_final ?? 0) * p.rascunho.recorrencia.duracao_meses
                            ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                        ) : null}
                      </Field>
                    ) : (
                      <Field
                        label="Parcelamento"
                        hint="Em até quantas vezes o cliente pode parcelar o valor fechado (1 = à vista)."
                      >
                        <CampoNumero
                          label="Em até quantas vezes"
                          value={maxParcelas}
                          onChange={(v) =>
                            doc({ condicoes: { ...condicoes, parcelamento: { max_parcelas: Math.max(1, v) } } })
                          }
                          min={1}
                          max={12}
                        />
                        {maxParcelas > 1 && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Aparece na proposta como: em até {maxParcelas}x de{" "}
                            {((p.rascunho.valor_final ?? 0) / maxParcelas).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}{" "}
                            (sem juros)
                          </p>
                        )}
                      </Field>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}
          {step === 2 && tipoAtual === "mensal" && (
            <Card title="Entregas mensais" wide>
              <p className="mb-4 text-sm text-muted-foreground">
                O que o cliente recebe a cada mês do contrato — aparece em destaque na proposta,
                separado da tabela de itens abaixo.
              </p>
              {(p.rascunho.entregas_mensais ?? []).length > 0 && (
                <div className="mb-4 space-y-2">
                  {(p.rascunho.entregas_mensais ?? []).map((e, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/25 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{e.descricao}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        × {e.quantidade}/mês
                      </span>
                      <button
                        onClick={() =>
                          doc({
                            entregas_mensais: (p.rascunho.entregas_mensais ?? []).filter(
                              (_, idx) => idx !== i,
                            ),
                          })
                        }
                        className="shrink-0 text-muted-foreground transition hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                <input
                  className={input}
                  placeholder="Ex.: Vídeos editados para feed"
                  value={novaEntregaMensal.descricao}
                  onChange={(e) =>
                    setNovaEntregaMensal({ ...novaEntregaMensal, descricao: e.target.value })
                  }
                />
                <CampoNumero
                  label="Qtd/mês"
                  value={novaEntregaMensal.quantidade}
                  onChange={(v) => setNovaEntregaMensal({ ...novaEntregaMensal, quantidade: v })}
                  min={1}
                />
                <Button
                  disabled={!novaEntregaMensal.descricao.trim()}
                  onClick={() => {
                    doc({
                      entregas_mensais: [
                        ...(p.rascunho.entregas_mensais ?? []),
                        { ...novaEntregaMensal, descricao: novaEntregaMensal.descricao.trim() },
                      ],
                    });
                    setNovaEntregaMensal({ descricao: "", quantidade: 1 });
                  }}
                >
                  <Plus className="mr-2 size-4" />
                  Adicionar
                </Button>
              </div>
            </Card>
          )}
          {step === 2 && (
            <Card title="Escolha o escopo" wide>
              <p className="mb-4 text-sm text-muted-foreground">
                Marque o que fará parte da proposta. Quantidade aparece apenas quando for relevante.
              </p>
              <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-primary/35 bg-primary/5 p-4">
                  <ListChecks className="size-5 text-primary" />
                  <p className="mt-3 text-sm font-medium">Entregas</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {itens.length} selecionadas para esta proposta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={aplicarValoresSugeridos}
                  className="rounded-xl border border-border/60 bg-background/20 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <WandSparkles className="size-5 text-primary" />
                  <p className="mt-3 text-sm font-medium">Valores sugeridos</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Preenche a base de preço de cada item com a sugestão do MakersHub.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    doc({
                      precificacao: {
                        ...precificacao,
                        ativa: !precificacao.ativa,
                      },
                    })
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    precificacao.ativa
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/60 bg-background/20 hover:border-primary/30"
                  }`}
                >
                  <Calculator className={`size-5 ${precificacao.ativa ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="mt-3 text-sm font-medium">Calculadora de orçamento</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {precificacao.ativa ? "Custos e margem ativados." : "Ativar formação de preço."}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    doc({
                      exibir_valores_itens: !p.rascunho.exibir_valores_itens,
                      exibicao_valores_definida: true,
                    })
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    p.rascunho.exibir_valores_itens
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/60 bg-background/20 hover:border-primary/30"
                  }`}
                >
                  {p.rascunho.exibir_valores_itens ? (
                    <Eye className="size-5 text-primary" />
                  ) : (
                    <EyeOff className="size-5 text-muted-foreground" />
                  )}
                  <p className="mt-3 text-sm font-medium">Valores para o cliente</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.rascunho.exibir_valores_itens
                      ? "Detalhamento visível na proposta."
                      : "Cliente verá somente o total."}
                  </p>
                </button>
              </div>
              <div className="space-y-3">
                {[
                  ...itens,
                  ...entregasDisponiveis
                    .filter((e) => !itens.some((i) => i.chave === e.chave))
                    .map((e, n) => ({
                      ...e,
                      quantidade: 1,
                      valor_unit: 0,
                      ordem: itens.length + n,
                    })),
                ].map((opcao) => {
                  const selecionado = itens.some((i) => i.chave === opcao.chave);
                  const quantitativo = entregasDisponiveis.find(
                    (e) => e.chave === opcao.chave,
                  )?.quantitativo;
                  const profissionalEvento =
                    tipoAtual === "evento" && itemDeEquipeEvento(opcao.chave);
                  return (
                    <div
                      key={opcao.chave}
                      className={`flex items-center gap-4 rounded-xl border p-4 transition ${selecionado ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/20 opacity-75"}`}
                    >
                      <Checkbox
                        checked={selecionado}
                        onCheckedChange={(checked) => {
                          const proximaLista = checked
                            ? [
                                ...itens,
                                {
                                  chave: opcao.chave,
                                  descricao: opcao.descricao,
                                  detalhe: opcao.detalhe,
                                  quantidade: 1,
                                  valor_unit: 0,
                                  ordem: itens.length,
                                },
                              ]
                            : itens.filter((i) => i.chave !== opcao.chave);
                          atualizarItens(proximaLista);
                        }}
                      />
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-primary">
                        <EntregaIcon chave={opcao.chave} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{opcao.descricao}</p>
                        <p className="text-xs text-muted-foreground">{opcao.detalhe}</p>
                      </div>
                      {selecionado && quantitativo && (
                        <CampoNumero
                          label={
                            opcao.chave === "deslocamento"
                              ? "Distância"
                              : profissionalEvento
                                ? "Profissionais"
                                : "Quantidade"
                          }
                          value={itens.find((i) => i.chave === opcao.chave)?.quantidade || 1}
                          onChange={(v) => {
                            const proximaLista = itens.map((i) =>
                              i.chave === opcao.chave ? { ...i, quantidade: v } : i,
                            );
                            atualizarItens(proximaLista);
                          }}
                          min={1}
                          step={opcao.chave === "deslocamento" ? 10 : 1}
                          sufixo={opcao.chave === "deslocamento" ? "km" : undefined}
                        />
                      )}
                      {selecionado &&
                        (precificacao.ativa || p.rascunho.exibir_valores_itens) && (
                        <div className="w-40">
                          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {precificacao.ativa
                              ? profissionalEvento
                                ? "Custo por profissional"
                                : "Custo interno"
                              : profissionalEvento
                                ? "Valor por profissional"
                                : "Valor ao cliente"}
                          </p>
                          <CurrencyInput
                            value={
                              precificacao.ativa
                                ? precificacao.custos_itens[opcao.chave] || 0
                                : itens.find((i) => i.chave === opcao.chave)?.valor_unit || 0
                            }
                            onValueChange={(valor) => {
                              if (precificacao.ativa) {
                                const novosCustos = {
                                  ...precificacao.custos_itens,
                                  [opcao.chave]: valor,
                                };
                                doc({
                                  precificacao: { ...precificacao, custos_itens: novosCustos },
                                });
                                // pacotes com composição acompanham a edição
                                setPacotes(pacotesRecalculados(novosCustos, margem));
                              } else {
                                setItens(
                                  itens.map((i) =>
                                    i.chave === opcao.chave ? { ...i, valor_unit: valor } : i,
                                  ),
                                );
                              }
                            }}
                            placeholder="R$ 0,00"
                          />
                        </div>
                        )}
                    </div>
                  );
                })}
              </div>
              {criandoEntrega ? (
                <div className="mt-4 grid gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 md:grid-cols-2">
                  <Field label="Nome da entrega">
                    <input
                      className={input}
                      value={entregaCustom.descricao}
                      onChange={(e) =>
                        setEntregaCustom({ ...entregaCustom, descricao: e.target.value })
                      }
                      placeholder={PRESET_PLACEHOLDER_ENTREGA[tipoAtual] ?? PRESET_PLACEHOLDER_ENTREGA.custom}
                    />
                  </Field>
                  <Field label="O que está incluído">
                    <input
                      className={input}
                      value={entregaCustom.detalhe}
                      onChange={(e) =>
                        setEntregaCustom({ ...entregaCustom, detalhe: e.target.value })
                      }
                      placeholder="Descreva brevemente"
                    />
                  </Field>
                  <div className="flex gap-2 md:col-span-2">
                    <Button
                      disabled={!entregaCustom.descricao.trim()}
                      onClick={() => {
                        const proximaLista = [
                          ...itens,
                          {
                            chave: `custom-${Date.now()}`,
                            descricao: entregaCustom.descricao.trim(),
                            detalhe: entregaCustom.detalhe.trim(),
                            quantidade: 1,
                            valor_unit: 0,
                            ordem: itens.length,
                          },
                        ];
                        atualizarItens(proximaLista);
                        setEntregaCustom({ descricao: "", detalhe: "" });
                        setCriandoEntrega(false);
                      }}
                    >
                      Adicionar à proposta
                    </Button>
                    <Button variant="ghost" onClick={() => setCriandoEntrega(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="mt-4" onClick={() => setCriandoEntrega(true)}>
                  <Plus className="mr-2 size-4" />
                  Criar entrega personalizada
                </Button>
              )}
              {confirmarExibicao && (
                <div className="mt-5 rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/10 to-transparent p-5">
                  <p className="font-display text-lg font-semibold">
                    Como os valores devem aparecer para o cliente?
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Os custos informados são sempre privados. Você pode mostrar os preços de cada
                    entrega ou apresentar somente o investimento total.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        doc({
                          exibir_valores_itens: false,
                          exibicao_valores_definida: true,
                        });
                        setConfirmarExibicao(false);
                        setStep(3);
                      }}
                      className="rounded-xl border border-border/60 bg-background/30 p-4 text-left transition hover:border-primary/40"
                    >
                      <EyeOff className="size-5 text-muted-foreground" />
                      <b className="mt-3 block text-sm">Somente controle interno</b>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        O cliente verá apenas o investimento final.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        doc({
                          exibir_valores_itens: true,
                          exibicao_valores_definida: true,
                        });
                        setConfirmarExibicao(false);
                        setStep(3);
                      }}
                      className="rounded-xl border border-primary/50 bg-primary/10 p-4 text-left transition hover:bg-primary/15"
                    >
                      <Eye className="size-5 text-primary" />
                      <b className="mt-3 block text-sm">Detalhar valores na proposta</b>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Cada entrega terá seu preço proporcional ao valor final.
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </Card>
          )}
          {step === 4 && p.rascunho.tipo_preco === "pacotes" && (
            <Card title="Pacotes" wide>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Crie três opções claras. Apenas uma pode ser recomendada.
                </p>
                <Button variant="outline" size="sm" onClick={gerarPacotes}>
                  <Sparkles className="mr-2 size-4" />
                  {variantePacote ? "Sugerir outros nomes" : "Sugerir nomes"}
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {pacotes.map((x, n) => (
                  <div
                    key={n}
                    className={`rounded-xl border p-4 transition ${x.destaque ? "border-primary bg-primary/5" : "border-border/60"}`}
                  >
                    <Field label="Nome do pacote">
                      <input
                        className={input}
                        placeholder={`Pacote ${n + 1}`}
                        value={x.nome}
                        onChange={(e) =>
                          setPacotes(
                            pacotes.map((q, k) => (k === n ? { ...q, nome: e.target.value } : q)),
                          )
                        }
                      />
                    </Field>
                    <Field label="Investimento">
                      <CurrencyInput
                        className={`${input} mt-2`}
                        value={x.valor}
                        onValueChange={(v) =>
                          setPacotes(pacotes.map((q, k) => (k === n ? { ...q, valor: v } : q)))
                        }
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() =>
                        setPacotes(pacotes.map((q, k) => ({ ...q, destaque: k === n })))
                      }
                      className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${x.destaque ? "border-primary bg-primary text-primary-foreground" : "border-border/60 text-muted-foreground hover:border-primary/40"}`}
                    >
                      <span
                        className={`size-2 rounded-full ${x.destaque ? "bg-primary-foreground" : "bg-muted-foreground/40"}`}
                      />
                      {x.destaque ? "Recomendado" : "Marcar como recomendado"}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-border/60 bg-background/20 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">O que entra em cada pacote?</p>
                    <p className="text-xs text-muted-foreground">
                      Marque as entregas de cada opção. Os pacotes podem crescer de forma progressiva.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={sugerirComposicaoPacotes}>
                    <Sparkles className="mr-2 size-4" />
                    Sugestão MakersHub
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <div
                    className="min-w-[680px] overflow-hidden rounded-xl border border-border/50"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `minmax(260px, 1.4fr) repeat(${Math.max(pacotes.length, 1)}, minmax(130px, 1fr))`,
                    }}
                  >
                    <div className="bg-surface-2/70 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Entrega
                    </div>
                    {pacotes.map((pacote, indice) => (
                      <div
                        key={`cabecalho-${indice}`}
                        className={`border-l border-border/50 p-3 text-center text-sm font-medium ${
                          pacote.destaque ? "bg-primary/10 text-primary" : "bg-surface-2/70"
                        }`}
                      >
                        {pacote.nome || `Pacote ${indice + 1}`}
                        <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
                          {(composicaoPacotes[String(indice)] ?? []).length} itens
                        </span>
                      </div>
                    ))}
                    {itens.map((item, linha) => (
                      <div key={item.chave} className="contents">
                        <div
                          className={`border-t border-border/40 p-3 ${
                            linha % 2 ? "bg-background/20" : "bg-background/35"
                          }`}
                        >
                          <p className="text-sm font-medium">{item.descricao}</p>
                          {item.detalhe && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {item.detalhe}
                            </p>
                          )}
                        </div>
                        {pacotes.map((pacote, indice) => {
                          const selecionados = composicaoPacotes[String(indice)] ?? [];
                          const marcado = selecionados.includes(item.chave);
                          return (
                            <label
                              key={`${item.chave}-${indice}`}
                              className={`grid cursor-pointer place-items-center border-l border-t border-border/40 p-3 ${
                                pacote.destaque ? "bg-primary/[.04]" : "bg-background/20"
                              }`}
                            >
                              <Checkbox
                                checked={marcado}
                                onCheckedChange={(checked) => {
                                  const atual = new Set(selecionados);
                                  if (checked) atual.add(item.chave);
                                  else atual.delete(item.chave);
                                  const proximaComposicao = {
                                    ...composicaoPacotes,
                                    [String(indice)]: Array.from(atual),
                                  };
                                  doc({
                                    composicao_pacotes: proximaComposicao,
                                  });
                                  setPacotes(
                                    pacotesRecalculados(
                                      precificacao.custos_itens,
                                      margem,
                                      itens,
                                      proximaComposicao,
                                    ),
                                  );
                                }}
                                className="size-5"
                              />
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
          {step === 5 && (
            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                title="Prévia da proposta"
                srcDoc={gerarHtmlProposta(snapshotPublico)}
                className="h-[640px] w-full border-0"
              />
            </div>
          )}
          <footer className="mt-6 flex justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Anterior
            </Button>
            {step < 5 ? (
              <Button
                onClick={() => {
                  if (step === 1 && !p.rascunho.contexto) aplicarInstitucional(false, tom);
                  if (
                    step === 2 &&
                    precificacao.ativa &&
                    !p.rascunho.exibicao_valores_definida
                  ) {
                    setConfirmarExibicao(true);
                    return;
                  }
                  if (
                    step === 4 &&
                    p.rascunho.tipo_preco === "pacotes" &&
                    !Object.values(composicaoPacotes).some((lista) => lista.length)
                  ) {
                    toast.error("Monte a composição dos pacotes ou use a sugestão MakersHub");
                    return;
                  }
                  setStep((s) => s + 1);
                }}
              >
                Próximo
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => baixarHtmlProposta(snapshotPublico)}
                >
                  <Download className="mr-2 size-4" />
                  Baixar offline
                </Button>
                <Button onClick={publicar}>
                  <Link2 className="mr-2 size-4" />
                  Gerar link
                </Button>
              </div>
            )}
          </footer>
        </main>
        <aside className="sticky top-5 h-fit rounded-2xl border border-border/60 bg-gradient-to-b from-surface-1/80 to-surface-1/30 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">
            Proposta em construção
          </p>
          <h3 className="mt-4 font-display text-xl font-semibold">
            {p.titulo_projeto || "Seu projeto"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.cliente_empresa || p.cliente_nome || "Cliente ainda não informado"}
          </p>
          <div className="mt-5 space-y-2 text-xs">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Entregas</span>
              <b>{itens.length}</b>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Narrativa</span>
              <b>{p.rascunho.contexto ? "Pronta" : "Pendente"}</b>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Investimento</span>
              <b>
                {p.rascunho.valor_final
                  ? Number(p.rascunho.valor_final).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : "—"}
              </b>
            </p>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((step + 1) / 6) * 100}%` }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
function Card({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      className={`mt-5 rounded-2xl border border-border/60 bg-surface-1/30 p-5 ${wide ? "" : "space-y-4"}`}
    >
      <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium">{label}</span>
      {hint && (
        <span className="mb-2 block text-xs leading-relaxed text-muted-foreground">{hint}</span>
      )}
      {children}
    </label>
  );
}

function ResumoFinanceiro({
  label,
  valor,
  destaque = false,
  sucesso = false,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
  sucesso?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/25 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-xl font-semibold tabular-nums ${
          sucesso ? "text-emerald-400" : destaque ? "text-primary" : "text-foreground"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function EntregaIcon({ chave }: { chave: string }) {
  const props = { className: "size-4" };
  if (chave.includes("drone")) return <Plane {...props} />;
  if (chave.includes("entrevista")) return <MessageSquare {...props} />;
  if (chave.includes("locucao")) return <Mic2 {...props} />;
  if (chave.includes("legenda")) return <Captions {...props} />;
  if (chave.includes("motion")) return <WandSparkles {...props} />;
  if (chave.includes("deslocamento")) return <CarFront {...props} />;
  if (
    chave.includes("produtor") ||
    chave.includes("videomaker") ||
    chave.includes("fotografo") ||
    chave.includes("assistente") ||
    chave.includes("operador") ||
    chave.includes("editor")
  ) return <UsersRound {...props} />;
  if (chave.includes("evento") || chave.includes("after")) return <CalendarCheck2 {...props} />;
  if (chave.includes("corte") || chave.includes("vers")) return <Film {...props} />;
  return <PackageCheck {...props} />;
}
