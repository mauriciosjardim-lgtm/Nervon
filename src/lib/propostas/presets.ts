import type { PropostaDocumento, PropostaItem } from "@/lib/propostas";

export type TomProposta = "premium" | "direto" | "humano";
export type TipoPresetProposta =
  | "institucional" | "mensal" | "podcast" | "evento" | "captacao" | "edicao" | "fotografia" | "custom";

interface Voz {
  subtitulo: string;
  contexto: (empresa: string) => string;
}

interface PresetConfig {
  narrativas: Record<TomProposta, Voz[]>;
  escopos: PropostaItem[][];
  cronogramas: { etapa: string; prazo: string }[][];
  condicoes: Record<string, unknown>;
  observacoes: { icone?: string; titulo: string; texto: string }[];
}

const institucional: PresetConfig = {
  narrativas: {
    premium: [
      {
        subtitulo:
          "Uma produção audiovisual concebida para transformar posicionamento, história e essência em uma peça memorável.",
        contexto: (empresa) =>
          `${empresa} construiu uma identidade que merece ser percebida com a mesma força no audiovisual. Este projeto nasce para traduzir história, diferenciais e visão em um filme institucional elegante, autêntico e preparado para gerar confiança em cada ponto de contato.`,
      },
      {
        subtitulo: "Um filme que posiciona a marca à altura da experiência que ela entrega.",
        contexto: (empresa) =>
          `Mais do que apresentar serviços, o filme institucional de ${empresa} será uma expressão de posicionamento. Uma narrativa cuidadosamente construída para revelar valor, gerar percepção de autoridade e criar uma presença audiovisual consistente.`,
      },
      {
        subtitulo:
          "Imagem, narrativa e direção reunidas para construir uma presença de marca inesquecível.",
        contexto: (empresa) =>
          `A excelência de ${empresa} precisa ser vista antes mesmo do primeiro contato. A proposta combina linguagem cinematográfica e estratégia para criar uma peça sofisticada, capaz de comunicar confiança e diferenciação sem recorrer a fórmulas genéricas.`,
      },
      {
        subtitulo: "Um filme institucional para marcas que não abrem mão de sofisticação.",
        contexto: (empresa) =>
          `A proposta é elevar a comunicação de ${empresa} a um novo patamar visual, com direção de fotografia, trilha autoral e um ritmo narrativo pensado para transmitir exclusividade em cada plano.`,
      },
      {
        subtitulo: "Quando a imagem certa comunica mais do que qualquer discurso comercial.",
        contexto: (empresa) =>
          `${empresa} tem uma história de peso — o papel deste filme é apresentá-la com a estética e a precisão narrativa que ela merece, criando uma peça que se torna referência de marca.`,
      },
    ],
    direto: [
      {
        subtitulo:
          "Um filme institucional claro, profissional e versátil para apresentar a empresa e fortalecer sua comunicação.",
        contexto: (empresa) =>
          `A proposta é criar para ${empresa} um vídeo objetivo, capaz de apresentar a operação, os diferenciais e as pessoas por trás da marca. A peça será planejada para funcionar em apresentações comerciais, site e canais digitais.`,
      },
      {
        subtitulo: "Sua empresa explicada de forma simples, convincente e profissional.",
        contexto: (empresa) =>
          `O projeto organiza as principais mensagens de ${empresa} em um filme direto ao ponto: o que a empresa faz, por que faz bem e por que o cliente deve confiar. Uma ferramenta comercial prática para diferentes canais.`,
      },
      {
        subtitulo: "Uma apresentação audiovisual que mostra valor sem complicar a mensagem.",
        contexto: (empresa) =>
          `${empresa} precisa de uma peça que facilite conversas comerciais e apresente seus diferenciais rapidamente. O filme será construído com ritmo, clareza e foco nas informações que realmente ajudam o público a decidir.`,
      },
      {
        subtitulo: "Um vídeo institucional pensado para vender — sem parecer um vídeo de vendas.",
        contexto: (empresa) =>
          `A proposta organiza os argumentos comerciais de ${empresa} em uma narrativa fluida, com linguagem acessível e foco total em ajudar o time comercial a fechar mais negócios.`,
      },
      {
        subtitulo: "Uma ferramenta audiovisual objetiva para abrir portas e encurtar decisões.",
        contexto: (empresa) =>
          `O filme institucional de ${empresa} será construído para resolver um problema prático: reduzir o tempo entre o primeiro contato e a decisão de compra, com informação clara e bem apresentada.`,
      },
    ],
    humano: [
      {
        subtitulo:
          "Pessoas, histórias e propósito reunidos em um filme que aproxima a marca do seu público.",
        contexto: (empresa) =>
          `Toda marca é feita de pessoas e decisões que nem sempre aparecem para quem está do lado de fora. O filme de ${empresa} vai revelar essa história com sensibilidade, mostrando o cuidado, a experiência e o propósito que sustentam o negócio.`,
      },
      {
        subtitulo:
          "Uma história verdadeira sobre as pessoas que fazem a marca acontecer todos os dias.",
        contexto: (empresa) =>
          `Por trás de ${empresa} existem trajetórias, relações e um jeito próprio de trabalhar. A proposta é transformar essa verdade em uma narrativa próxima, com depoimentos e cenas que façam o público sentir quem está por trás da marca.`,
      },
      {
        subtitulo: "Quando o público conhece a história, a marca deixa de ser apenas uma empresa.",
        contexto: (empresa) =>
          `O filme aproxima ${empresa} das pessoas ao revelar sua origem, seus valores e os pequenos gestos que constroem confiança. Uma produção sensível e natural, feita para criar identificação antes de apresentar argumentos.`,
      },
      {
        subtitulo: "Um filme que mostra o lado humano por trás de cada entrega da empresa.",
        contexto: (empresa) =>
          `A ideia é dar voz a quem faz ${empresa} acontecer — a equipe, os bastidores, os detalhes que normalmente ficam invisíveis — para criar uma conexão genuína com quem assiste.`,
      },
      {
        subtitulo: "Uma narrativa que aproxima antes de convencer.",
        contexto: (empresa) =>
          `Antes de falar de produtos ou serviços, o filme de ${empresa} vai apresentar pessoas reais e motivos reais — a confiança nasce daí, não de um discurso institucional genérico.`,
      },
    ],
  },
  escopos: [
    [
      { chave: "conceito", descricao: "Conceito e roteiro", detalhe: "Briefing, pesquisa, direção narrativa e roteiro técnico", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "producao", descricao: "Produção audiovisual", detalhe: "Equipe, câmera, iluminação e captação de áudio profissional", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "finalizacao", descricao: "Edição e finalização", detalhe: "Montagem, tratamento de cor, trilha, lettering e masterização", quantidade: 1, valor_unit: 0, ordem: 2 },
      { chave: "entregas", descricao: "Versões finais", detalhe: "Filme principal e arquivos otimizados para os canais definidos", quantidade: 1, valor_unit: 0, ordem: 3 },
    ],
    [
      { chave: "pre", descricao: "Imersão e pré-produção", detalhe: "Reunião criativa, construção da mensagem e planejamento de produção", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "diaria", descricao: "Diária de filmagem", detalhe: "Direção, fotografia, luz e som direto", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "pos", descricao: "Pós-produção completa", detalhe: "Edição, sound design, color grading e acabamento gráfico", quantidade: 1, valor_unit: 0, ordem: 2 },
      { chave: "adaptacoes", descricao: "Adaptações digitais", detalhe: "Versões e enquadramentos para apresentação, site e redes sociais", quantidade: 1, valor_unit: 0, ordem: 3 },
    ],
    [
      { chave: "entrevistas", descricao: "Entrevistas e depoimentos", detalhe: "Captação de falas de liderança, equipe e clientes", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "b-roll", descricao: "Imagens de apoio (B-roll)", detalhe: "Cenas de ambiente, operação e detalhes da marca", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "roteirizacao", descricao: "Roteirização e montagem", detalhe: "Construção da narrativa a partir das falas e imagens captadas", quantidade: 1, valor_unit: 0, ordem: 2 },
      { chave: "finalizacao", descricao: "Finalização e entrega", detalhe: "Trilha, legendas, cor e masterização final", quantidade: 1, valor_unit: 0, ordem: 3 },
    ],
  ],
  cronogramas: [
    [
      { etapa: "Imersão, briefing e definição da narrativa", prazo: "Semana 1" },
      { etapa: "Roteiro e planejamento da produção", prazo: "Semana 2" },
      { etapa: "Captação audiovisual", prazo: "Semana 3" },
      { etapa: "Edição, revisão e entrega final", prazo: "Semana 4" },
    ],
    [
      { etapa: "Alinhamento criativo", prazo: "Etapa 1" },
      { etapa: "Pré-produção e roteiro", prazo: "Etapa 2" },
      { etapa: "Filmagem", prazo: "Etapa 3" },
      { etapa: "Pós-produção e aprovação", prazo: "Etapa 4" },
    ],
    [
      { etapa: "Definição de pauta e entrevistados", prazo: "Semana 1" },
      { etapa: "Captação de entrevistas e B-roll", prazo: "Semana 2" },
      { etapa: "Montagem e roteirização", prazo: "Semana 3" },
      { etapa: "Finalização e aprovação", prazo: "Semana 4" },
    ],
  ],
  condicoes: {
    pagamento: "50% na aprovação e 50% na entrega final",
    validade_dias: 15,
    revisoes_inclusas: "2 rodadas de ajustes",
    prazo_entrega: "até 20 dias úteis após a captação",
    formato_entrega: "Arquivos digitais em alta resolução",
  },
  observacoes: [
    { icone: "video", titulo: "Produção planejada", texto: "Cada etapa é organizada para aproveitar melhor a diária e manter consistência visual." },
    { icone: "edit", titulo: "Revisões incluídas", texto: "Duas rodadas de ajustes para refinar o filme dentro do escopo aprovado." },
    { icone: "package", titulo: "Entrega versátil", texto: "Arquivos preparados para apresentações, site e canais digitais." },
  ],
};

const mensal: PresetConfig = {
  narrativas: {
    premium: [
      {
        subtitulo: "Presença constante e sofisticada nas redes, mês após mês.",
        contexto: (empresa) =>
          `${empresa} merece uma presença digital tão cuidada quanto o restante da sua marca. A proposta é um plano mensal de conteúdo que sustenta autoridade, consistência visual e proximidade com o público em cada publicação.`,
      },
      {
        subtitulo: "Um calendário de conteúdo pensado para elevar a percepção de marca todo mês.",
        contexto: (empresa) =>
          `A ideia é transformar a rotina de ${empresa} em conteúdo com direção estética e estratégica, garantindo que cada peça publicada reforce a posição da marca no mercado.`,
      },
      {
        subtitulo: "Consistência visual como estratégia de longo prazo.",
        contexto: (empresa) =>
          `A proposta estrutura um plano editorial contínuo para ${empresa}, com identidade visual coerente entre as peças e uma cadência que constrói autoridade mês após mês.`,
      },
      {
        subtitulo: "Redes sociais com o mesmo padrão de excelência da marca.",
        contexto: (empresa) =>
          `Cada peça publicada por ${empresa} passa a seguir uma direção de arte única, elevando a percepção do público sobre a qualidade e a seriedade da operação.`,
      },
    ],
    direto: [
      {
        subtitulo: "Conteúdo mensal organizado, recorrente e sem gargalos de produção.",
        contexto: (empresa) =>
          `A proposta entrega para ${empresa} um pacote fixo de peças por mês — planejamento, captação e edição resolvidos em um fluxo único, sem depender de decisões pontuais a cada publicação.`,
      },
      {
        subtitulo: "Redes sociais sempre ativas, com previsibilidade de custo e entrega.",
        contexto: (empresa) =>
          `${empresa} recebe um volume definido de conteúdo por mês, com prazos claros e o mesmo padrão de qualidade em toda entrega — ideal para manter o ritmo comercial sem sobrecarregar o time interno.`,
      },
      {
        subtitulo: "Um plano mensal para quem precisa de conteúdo, não de complicação.",
        contexto: (empresa) =>
          `A proposta resolve de forma prática a necessidade de ${empresa} de publicar com regularidade, com um fluxo de produção enxuto que entrega o combinado todo mês, no prazo.`,
      },
      {
        subtitulo: "Menos reuniões, mais conteúdo publicado.",
        contexto: (empresa) =>
          `O plano mensal reduz o tempo que ${empresa} gasta decidindo o que postar — a pauta, a captação e a edição já vêm resolvidas dentro do pacote contratado.`,
      },
    ],
    humano: [
      {
        subtitulo: "Conteúdo que aproxima a marca do público, um mês de cada vez.",
        contexto: (empresa) =>
          `Mais do que preencher o feed, a proposta é mostrar o dia a dia de ${empresa} de um jeito genuíno — as pessoas, os bastidores e as pequenas histórias que fazem o público confiar na marca.`,
      },
      {
        subtitulo:
          "Uma história verdadeira sobre as pessoas que fazem a marca acontecer todos os dias.",
        contexto: (empresa) =>
          `Por trás de ${empresa} existem trajetórias, relações e um jeito próprio de trabalhar. A proposta é transformar essa verdade em uma narrativa próxima, com depoimentos e cenas que façam o público sentir quem está por trás da marca.`,
      },
      {
        subtitulo: "Bastidores, rotina e propósito viram conteúdo todo mês.",
        contexto: (empresa) =>
          `A proposta acompanha de perto a rotina de ${empresa} para transformar momentos reais em conteúdo que gera identificação — sem perder a consistência de um plano mensal.`,
      },
      {
        subtitulo: "Quando o público acompanha de perto, a marca vira parte do dia a dia dele.",
        contexto: (empresa) =>
          `A proposta usa o conteúdo mensal para criar proximidade real entre ${empresa} e seu público, mostrando rotina, pessoas e propósito de forma constante e genuína.`,
      },
    ],
  },
  escopos: [
    [
      { chave: "planejamento", descricao: "Planejamento de conteúdo", detalhe: "Pauta mensal, roteiro e calendário de publicação", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "captacao", descricao: "Captação mensal", detalhe: "Diária de gravação para o volume de peças contratado", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "edicao", descricao: "Edição das peças", detalhe: "Cortes, motion, legendas e finalização para redes sociais", quantidade: 8, valor_unit: 0, ordem: 2 },
      { chave: "entrega", descricao: "Entrega mensal", detalhe: "Arquivos prontos para publicação nos formatos definidos", quantidade: 1, valor_unit: 0, ordem: 3 },
    ],
    [
      { chave: "pauta", descricao: "Definição de pauta e roteiro", detalhe: "Reunião mensal de alinhamento de temas e formatos", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "captacao-multipla", descricao: "Captação em múltiplas diárias", detalhe: "Gravações distribuídas ao longo do mês conforme a pauta", quantidade: 2, valor_unit: 0, ordem: 1 },
      { chave: "edicao-social", descricao: "Edição para redes sociais", detalhe: "Peças verticais, cortes curtos e versões para stories", quantidade: 12, valor_unit: 0, ordem: 2 },
      { chave: "relatorio", descricao: "Relatório de entregas", detalhe: "Resumo do conteúdo produzido e calendário do mês seguinte", quantidade: 1, valor_unit: 0, ordem: 3 },
    ],
  ],
  cronogramas: [
    [
      { etapa: "Definição de pauta e calendário", prazo: "Início do mês" },
      { etapa: "Captação do conteúdo", prazo: "1ª semana" },
      { etapa: "Edição e revisão das peças", prazo: "2ª e 3ª semana" },
      { etapa: "Entrega e publicação", prazo: "4ª semana" },
    ],
    [
      { etapa: "Reunião de alinhamento mensal", prazo: "Semana 1" },
      { etapa: "Diárias de captação distribuídas", prazo: "Semana 1 a 3" },
      { etapa: "Edição contínua das peças", prazo: "Semana 2 a 4" },
      { etapa: "Entrega final e relatório do mês", prazo: "Semana 4" },
    ],
  ],
  condicoes: {
    pagamento: "Mensalidade fixa, cobrada até o 5º dia útil de cada mês",
    validade_dias: 10,
    revisoes_inclusas: "1 rodada de ajustes por peça",
    prazo_entrega: "conforme calendário mensal definido em conjunto",
    formato_entrega: "Arquivos otimizados por rede social",
  },
  observacoes: [
    { icone: "calendar", titulo: "Fluxo recorrente", texto: "Pauta, captação e entrega organizadas em um ciclo mensal previsível." },
    { icone: "video", titulo: "Volume definido", texto: "Quantidade de peças por mês acordada antecipadamente, sem surpresas." },
    { icone: "edit", titulo: "Ajuste incluso", texto: "Uma rodada de revisão por peça garante alinhamento com a marca." },
  ],
};

const podcast: PresetConfig = {
  narrativas: {
    premium: [
      {
        subtitulo: "Um podcast com produção de estúdio para consolidar autoridade no seu mercado.",
        contexto: (empresa) =>
          `${empresa} tem o que dizer — e um podcast bem produzido transforma esse conteúdo em uma referência recorrente para o público. A proposta cobre captação, edição e finalização com o cuidado de uma produção premium.`,
      },
      {
        subtitulo: "Áudio e vídeo com qualidade de estúdio para elevar a percepção da marca.",
        contexto: (empresa) =>
          `A proposta estrutura um podcast completo para ${empresa}, com direção de conversa, tratamento de áudio profissional e finalização em vídeo pronta para publicação multi-plataforma.`,
      },
      {
        subtitulo: "Um formato pensado para posicionar a marca como referência de conteúdo.",
        contexto: (empresa) =>
          `O podcast de ${empresa} será estruturado com direção editorial e produção de estúdio, criando um ativo de mídia próprio que reforça autoridade a cada episódio.`,
      },
      {
        subtitulo: "Cada episódio, uma experiência de áudio e vídeo à altura da marca.",
        contexto: (empresa) =>
          `A proposta cuida de cada detalhe técnico — som, imagem, ritmo — para que o podcast de ${empresa} tenha o acabamento de uma produção de referência no mercado.`,
      },
    ],
    direto: [
      {
        subtitulo: "Captação, edição e publicação de episódios sem complicação.",
        contexto: (empresa) =>
          `A proposta resolve a produção completa dos episódios de ${empresa}: gravação, edição de áudio e vídeo, e entrega pronta para os canais de distribuição escolhidos.`,
      },
      {
        subtitulo: "Um fluxo simples para manter o podcast no ar com qualidade constante.",
        contexto: (empresa) =>
          `${empresa} recebe uma rotina de produção enxuta: grava, entrega os episódios editados e publica — sem gargalos técnicos no processo.`,
      },
      {
        subtitulo: "Produção de podcast sem dor de cabeça técnica.",
        contexto: (empresa) =>
          `A proposta cuida de toda a parte técnica da gravação e edição, para que ${empresa} possa focar só no conteúdo da conversa.`,
      },
      {
        subtitulo: "Do agendamento à publicação, um processo direto ao ponto.",
        contexto: (empresa) =>
          `A produção do podcast de ${empresa} segue um fluxo objetivo: agenda, grava, edita e entrega — sem etapas desnecessárias no meio do caminho.`,
      },
    ],
    humano: [
      {
        subtitulo: "Conversas reais, produzidas para soarem tão boas quanto são.",
        contexto: (empresa) =>
          `O objetivo é captar a essência das conversas de ${empresa} com naturalidade, cuidando da técnica para que a atenção fique na história e nas pessoas envolvidas.`,
      },
      {
        subtitulo: "Um espaço para dar voz a quem tem algo importante para dizer.",
        contexto: (empresa) =>
          `A proposta cria a estrutura para que ${empresa} converse com autenticidade, com produção que valoriza a escuta sem perder a qualidade técnica.`,
      },
      {
        subtitulo: "Histórias que ganham profundidade quando há tempo para escutar.",
        contexto: (empresa) =>
          `O formato podcast dá a ${empresa} o espaço que outros formatos não dão — tempo para aprofundar, contextualizar e criar conexão real com quem ouve.`,
      },
      {
        subtitulo: "Quando a conversa flui, a produção deve ser invisível.",
        contexto: (empresa) =>
          `A ideia é que a equipe técnica trabalhe nos bastidores para que as conversas de ${empresa} aconteçam de forma natural, sem a pressão de um estúdio formal.`,
      },
    ],
  },
  escopos: [
    [
      { chave: "pre", descricao: "Estrutura e formato", detalhe: "Definição de pauta, roteiro leve e estrutura dos episódios", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "captacao", descricao: "Captação do episódio", detalhe: "Áudio multipista e vídeo multicâmera", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "edicao-audio", descricao: "Edição de áudio", detalhe: "Tratamento, equalização e mixagem", quantidade: 1, valor_unit: 0, ordem: 2 },
      { chave: "edicao-video", descricao: "Edição de vídeo", detalhe: "Corte, cor e cortes verticais para redes", quantidade: 1, valor_unit: 0, ordem: 3 },
    ],
    [
      { chave: "roteiro-pauta", descricao: "Roteiro e pauta do episódio", detalhe: "Levantamento de temas e perguntas-guia para a conversa", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "captacao-estudio", descricao: "Captação em estúdio", detalhe: "Gravação com equipamento profissional de áudio e vídeo", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "pos-completa", descricao: "Pós-produção completa", detalhe: "Edição de áudio, vídeo, capa e thumbnail do episódio", quantidade: 1, valor_unit: 0, ordem: 2 },
      { chave: "cortes-redes", descricao: "Cortes para redes sociais", detalhe: "Trechos curtos extraídos do episódio principal", quantidade: 4, valor_unit: 0, ordem: 3 },
    ],
  ],
  cronogramas: [
    [
      { etapa: "Definição de formato e pauta", prazo: "Etapa 1" },
      { etapa: "Captação do episódio", prazo: "Etapa 2" },
      { etapa: "Edição de áudio e vídeo", prazo: "Etapa 3" },
      { etapa: "Entrega e publicação", prazo: "Etapa 4" },
    ],
    [
      { etapa: "Roteiro e pauta do episódio", prazo: "Semana 1" },
      { etapa: "Gravação em estúdio", prazo: "Semana 1" },
      { etapa: "Pós-produção e cortes para redes", prazo: "Semana 2" },
      { etapa: "Entrega final", prazo: "Semana 2" },
    ],
  ],
  condicoes: {
    pagamento: "50% no agendamento e 50% na entrega dos episódios",
    validade_dias: 15,
    revisoes_inclusas: "1 rodada de ajustes por episódio",
    prazo_entrega: "até 10 dias úteis após a captação",
    formato_entrega: "Áudio e vídeo prontos para publicação",
  },
  observacoes: [
    { icone: "mic", titulo: "Qualidade de estúdio", texto: "Áudio multipista e vídeo multicâmera para um resultado profissional." },
    { icone: "package", titulo: "Multi-plataforma", texto: "Entrega pensada para tocadores de áudio, YouTube e cortes para redes." },
  ],
};

const evento: PresetConfig = {
  narrativas: {
    premium: [
      {
        subtitulo: "Uma cobertura audiovisual à altura da experiência que o evento foi criado para entregar.",
        contexto: (empresa) =>
          `O evento de ${empresa} será registrado com direção visual, equipe especializada e atenção aos detalhes que constroem percepção de valor. A proposta combina cobertura de foto e vídeo para transformar um momento único em um acervo de comunicação duradouro.`,
      },
      {
        subtitulo: "Cada momento importante registrado com linguagem cinematográfica e acabamento de campanha.",
        contexto: (empresa) =>
          `A cobertura de ${empresa} será planejada para ir além do registro factual. Pessoas, ambiente, conteúdo e atmosfera serão traduzidos em imagens sofisticadas, prontas para prolongar o impacto do evento depois que ele terminar.`,
      },
      {
        subtitulo: "Uma operação audiovisual completa para eventos que precisam deixar marca.",
        contexto: (empresa) =>
          `A proposta reúne produção, captação multicâmera, fotografia e pós-produção em uma operação coordenada para ${empresa}, garantindo consistência visual e segurança em todos os momentos relevantes do evento.`,
      },
      {
        subtitulo: "O evento acontece uma vez. A imagem certa faz essa experiência continuar.",
        contexto: (empresa) =>
          `O projeto de ${empresa} será coberto com olhar editorial e estrutura técnica dimensionada para o evento, criando um filme e um banco de imagens capazes de preservar sua energia, relevância e posicionamento.`,
      },
    ],
    direto: [
      {
        subtitulo: "Equipe, cobertura e entregas definidas para registrar o evento sem deixar momentos importantes de fora.",
        contexto: (empresa) =>
          `A proposta organiza a cobertura do evento de ${empresa} com quantidade de profissionais, horas de atuação e entregas claramente definidas. Foto, vídeo e edição seguem um único plano de operação.`,
      },
      {
        subtitulo: "Cobertura de evento com equipe dimensionada, cronograma claro e entrega rápida.",
        contexto: (empresa) =>
          `O evento de ${empresa} contará com profissionais distribuídos conforme os ambientes e momentos previstos, garantindo registro completo e arquivos finais prontos para comunicação e redes sociais.`,
      },
      {
        subtitulo: "Da montagem ao encerramento: uma operação audiovisual pronta para acompanhar todo o evento.",
        contexto: (empresa) =>
          `A cobertura de ${empresa} contempla preparação, captação e entrega, com funções e quantidades visíveis para que o cliente saiba exatamente quem estará trabalhando e o que será produzido.`,
      },
      {
        subtitulo: "Foto e vídeo do evento com escopo objetivo e custos transparentes.",
        contexto: (empresa) =>
          `A proposta apresenta de forma simples a equipe necessária para o evento de ${empresa}, o valor de cada profissional e as entregas finais, facilitando aprovação e planejamento.`,
      },
    ],
    humano: [
      {
        subtitulo: "Pessoas, encontros e emoções registrados do jeito que realmente aconteceram.",
        contexto: (empresa) =>
          `O evento de ${empresa} é feito de momentos que não se repetem. A equipe trabalhará com presença discreta e olhar atento para registrar conexões, reações e detalhes com naturalidade.`,
      },
      {
        subtitulo: "Uma cobertura próxima, feita para preservar as histórias vividas durante o evento.",
        contexto: (empresa) =>
          `Mais do que documentar uma programação, a proposta busca guardar a experiência de quem participou do evento de ${empresa}, transformando gestos e encontros em memória audiovisual.`,
      },
      {
        subtitulo: "Registrar o que estava no palco e também tudo aquilo que aconteceu ao redor dele.",
        contexto: (empresa) =>
          `A cobertura acompanha o evento de ${empresa} por diferentes perspectivas, valorizando conteúdo, bastidores e público para construir uma narrativa verdadeira sobre aquele dia.`,
      },
      {
        subtitulo: "Um olhar sensível para que o evento continue vivo nas imagens.",
        contexto: (empresa) =>
          `A equipe será dimensionada para estar presente sem interferir, captando o ritmo e a emoção do evento de ${empresa} em fotografias e vídeos que façam sentido para quem viveu e para quem não pôde estar lá.`,
      },
    ],
  },
  escopos: [
    [
      { chave: "pre-evento", descricao: "Planejamento da cobertura", detalhe: "Briefing, programação, mapa de ambientes e alinhamento da equipe", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "produtor-evento", descricao: "Produtor de evento", detalhe: "Coordenação da operação audiovisual no local", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "videomaker-evento", descricao: "Videomakers", detalhe: "Cobertura de palco, público, bastidores e ambientes", quantidade: 2, valor_unit: 0, ordem: 2 },
      { chave: "fotografo-evento", descricao: "Fotógrafos", detalhe: "Cobertura fotográfica dos principais momentos", quantidade: 1, valor_unit: 0, ordem: 3 },
      { chave: "assistente-evento", descricao: "Assistentes de produção", detalhe: "Apoio à equipe, logística e equipamentos", quantidade: 1, valor_unit: 0, ordem: 4 },
      { chave: "after-movie", descricao: "Aftermovie", detalhe: "Filme com os melhores momentos do evento", quantidade: 1, valor_unit: 0, ordem: 5 },
      { chave: "fotos-evento", descricao: "Fotografias tratadas", detalhe: "Seleção de imagens em alta resolução", quantidade: 80, valor_unit: 0, ordem: 6 },
    ],
    [
      { chave: "pre-evento", descricao: "Roteiro de cobertura", detalhe: "Cronograma de cerimônia, recepção e momentos especiais", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "videomaker-evento", descricao: "Videomakers", detalhe: "Captação simultânea dos diferentes momentos e ambientes", quantidade: 2, valor_unit: 0, ordem: 1 },
      { chave: "fotografo-evento", descricao: "Fotógrafos", detalhe: "Registros espontâneos, protocolares e retratos", quantidade: 2, valor_unit: 0, ordem: 2 },
      { chave: "operador-drone", descricao: "Operador de drone", detalhe: "Imagens aéreas da locação e da experiência", quantidade: 1, valor_unit: 0, ordem: 3 },
      { chave: "after-movie", descricao: "Filme de melhores momentos", detalhe: "Narrativa emocional com os destaques do evento", quantidade: 1, valor_unit: 0, ordem: 4 },
      { chave: "fotos-evento", descricao: "Galeria fotográfica", detalhe: "Imagens selecionadas e tratadas", quantidade: 150, valor_unit: 0, ordem: 5 },
    ],
    [
      { chave: "pre-evento", descricao: "Planejamento técnico", detalhe: "Visita técnica, mapa de câmeras e programação de palco", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "produtor-evento", descricao: "Produtores de campo", detalhe: "Coordenação da equipe e interface com a organização", quantidade: 2, valor_unit: 0, ordem: 1 },
      { chave: "operador-camera", descricao: "Operadores de câmera", detalhe: "Câmeras fixas e móveis para palco e público", quantidade: 3, valor_unit: 0, ordem: 2 },
      { chave: "fotografo-evento", descricao: "Fotógrafos", detalhe: "Cobertura de palco, artistas, público e bastidores", quantidade: 2, valor_unit: 0, ordem: 3 },
      { chave: "assistente-evento", descricao: "Assistentes de produção", detalhe: "Apoio técnico, mídia e movimentação de equipamentos", quantidade: 2, valor_unit: 0, ordem: 4 },
      { chave: "editor-evento", descricao: "Editor no local", detalhe: "Seleção e montagem de conteúdo durante o evento", quantidade: 1, valor_unit: 0, ordem: 5 },
      { chave: "cortes-evento", descricao: "Conteúdos de entrega rápida", detalhe: "Vídeos curtos publicados durante ou logo após o evento", quantidade: 4, valor_unit: 0, ordem: 6 },
      { chave: "after-movie", descricao: "Aftermovie oficial", detalhe: "Filme final com os destaques da experiência", quantidade: 1, valor_unit: 0, ordem: 7 },
    ],
  ],
  cronogramas: [
    [
      { etapa: "Briefing e dimensionamento da equipe", prazo: "Até 15 dias antes" },
      { etapa: "Alinhamento final e plano de cobertura", prazo: "Até 3 dias antes" },
      { etapa: "Cobertura audiovisual do evento", prazo: "Data do evento" },
      { etapa: "Prévia de fotos e conteúdo rápido", prazo: "Até 48 horas" },
      { etapa: "Aftermovie e galeria completa", prazo: "Até 15 dias úteis" },
    ],
    [
      { etapa: "Planejamento e roteiro dos momentos especiais", prazo: "Etapa 1" },
      { etapa: "Cobertura de foto e vídeo", prazo: "Etapa 2" },
      { etapa: "Seleção e edição do material", prazo: "Etapa 3" },
      { etapa: "Entrega da galeria e filme final", prazo: "Etapa 4" },
    ],
    [
      { etapa: "Visita técnica e mapa de operação", prazo: "Pré-evento" },
      { etapa: "Montagem e testes da equipe", prazo: "Dia do evento" },
      { etapa: "Cobertura e entregas em tempo real", prazo: "Durante o evento" },
      { etapa: "Pós-produção do aftermovie", prazo: "Pós-evento" },
    ],
  ],
  condicoes: {
    pagamento: "50% na reserva da data e 50% até o dia do evento",
    validade_dias: 10,
    revisoes_inclusas: "1 rodada de ajustes no aftermovie",
    prazo_entrega: "prévia em até 48 horas e materiais finais conforme cronograma",
    formato_entrega: "Galeria digital e vídeos em alta resolução",
    horas_cobertura: "Conforme período contratado; horas adicionais cobradas separadamente",
  },
  observacoes: [
    { icone: "calendar", titulo: "Data reservada", texto: "A equipe é confirmada após aprovação da proposta e pagamento da reserva." },
    { icone: "video", titulo: "Equipe dimensionada", texto: "A quantidade de profissionais é definida conforme duração, ambientes e programação." },
    { icone: "package", titulo: "Entrega organizada", texto: "Fotos e vídeos são entregues em ambiente digital, separados por tipo de conteúdo." },
  ],
};

const captacao: PresetConfig = {
  narrativas: {
    premium: [
      {
        subtitulo: "Equipe e estrutura completa para uma captação impecável.",
        contexto: (empresa) =>
          `A proposta coloca à disposição de ${empresa} uma equipe experiente e equipamento de nível profissional para uma diária de captação sem imprevistos, com atenção a cada detalhe técnico e criativo.`,
      },
      {
        subtitulo: "Captação de alto padrão, pronta para qualquer etapa de pós-produção.",
        contexto: (empresa) =>
          `A diária de captação para ${empresa} é planejada com o mesmo rigor técnico de uma produção completa, garantindo material versátil e de alta qualidade para qualquer uso futuro.`,
      },
      {
        subtitulo: "Uma equipe profissional para registrar o momento com precisão cinematográfica.",
        contexto: (empresa) =>
          `A proposta é colocar à disposição de ${empresa} equipamento e direção de fotografia de nível cinematográfico durante toda a diária, sem se preocupar com a parte técnica.`,
      },
      {
        subtitulo: "Estrutura de set pensada para transformar cada hora de captação em imagem de alto valor.",
        contexto: (empresa) =>
          `A diária de ${empresa} será desenhada para extrair o máximo de cada cenário, com planejamento técnico, equipe especializada e equipamento escolhido para o resultado visual que o projeto exige.`,
      },
    ],
    direto: [
      {
        subtitulo: "Diária de captação com equipe e equipamento prontos para gravar.",
        contexto: (empresa) =>
          `A proposta cobre a estrutura necessária para captar o material de ${empresa} no dia combinado: câmera, luz, áudio e direção de produção, sem etapa de edição inclusa.`,
      },
      {
        subtitulo: "Equipe e equipamento no dia certo, sem complicação de logística.",
        contexto: (empresa) =>
          `${empresa} só precisa definir o local e o horário — a proposta resolve toda a estrutura técnica da diária, entregando o material bruto organizado ao final.`,
      },
      {
        subtitulo: "Uma diária de captação objetiva, com entrega rápida do material.",
        contexto: (empresa) =>
          `A proposta é simples: equipe e equipamento no dia combinado, captação eficiente e entrega organizada do material bruto para ${empresa} seguir com a edição por conta própria ou com outro time.`,
      },
      {
        subtitulo: "Produção em campo com escopo, equipe e prazo definidos desde o início.",
        contexto: (empresa) =>
          `A captação de ${empresa} será executada com uma estrutura clara: preparação técnica, gravação conforme o plano do dia e entrega segura dos arquivos, sem custos ou etapas escondidas.`,
      },
    ],
    humano: [
      {
        subtitulo: "Uma equipe que se adapta ao seu momento para captar com naturalidade.",
        contexto: (empresa) =>
          `O foco é registrar o que acontece de verdade no dia de ${empresa}, com uma equipe discreta e experiente que sabe se adaptar ao ritmo do ambiente.`,
      },
      {
        subtitulo: "Registrar sem interferir — essa é a proposta.",
        contexto: (empresa) =>
          `A equipe de captação chega para se integrar à rotina de ${empresa}, sem atropelar o momento, garantindo imagens naturais e verdadeiras.`,
      },
      {
        subtitulo: "Presença discreta, olhar atento e imagens que preservam a verdade do momento.",
        contexto: (empresa) =>
          `A captação acompanha o ritmo de ${empresa} com sensibilidade, deixando pessoas e acontecimentos fluírem enquanto a equipe registra os detalhes que tornam aquela história única.`,
      },
      {
        subtitulo: "Uma equipe preparada para ouvir o ambiente antes de apontar a câmera.",
        contexto: (empresa) =>
          `O trabalho começa entendendo as pessoas e a dinâmica de ${empresa}. Assim, cada imagem nasce com naturalidade, cuidado e respeito ao que está acontecendo diante da câmera.`,
      },
    ],
  },
  escopos: [
    [
      { chave: "pre", descricao: "Alinhamento e planejamento", detalhe: "Definição de locação, roteiro do dia e necessidades técnicas", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "diaria", descricao: "Diária de captação", detalhe: "Equipe de câmera, luz e áudio direto", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "entrega-bruto", descricao: "Entrega do material bruto", detalhe: "Arquivos organizados prontos para edição", quantidade: 1, valor_unit: 0, ordem: 2 },
    ],
    [
      { chave: "briefing", descricao: "Briefing técnico", detalhe: "Levantamento de locação, luz disponível e plano de câmeras", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "diaria-multicam", descricao: "Diária com múltiplas câmeras", detalhe: "Cobertura simultânea de diferentes ângulos", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "backup", descricao: "Backup e organização de arquivos", detalhe: "Cópia de segurança e nomeação dos arquivos captados", quantidade: 1, valor_unit: 0, ordem: 2 },
    ],
  ],
  cronogramas: [
    [
      { etapa: "Alinhamento e planejamento do dia", prazo: "Etapa 1" },
      { etapa: "Captação em locação", prazo: "Etapa 2" },
      { etapa: "Organização e entrega do material", prazo: "Etapa 3" },
    ],
    [
      { etapa: "Briefing técnico e visita prévia (se necessário)", prazo: "Etapa 1" },
      { etapa: "Diária de captação multicâmera", prazo: "Etapa 2" },
      { etapa: "Backup e entrega organizada", prazo: "Etapa 3" },
    ],
  ],
  condicoes: {
    pagamento: "100% na confirmação da diária",
    validade_dias: 10,
    revisoes_inclusas: "Não aplicável — escopo é somente captação",
    prazo_entrega: "até 5 dias úteis após a diária",
    formato_entrega: "Arquivos brutos em alta resolução",
  },
  observacoes: [
    { icone: "video", titulo: "Sem edição inclusa", texto: "Este escopo cobre apenas a captação; a edição pode ser orçada separadamente." },
    { icone: "package", titulo: "Material organizado", texto: "Arquivos entregues já nomeados e organizados por bloco de gravação." },
  ],
};

const edicao: PresetConfig = {
  narrativas: {
    premium: [
      {
        subtitulo: "Pós-produção de alto padrão para transformar material bruto em uma peça final marcante.",
        contexto: (empresa) =>
          `A proposta assume a finalização do material de ${empresa} com direção de montagem, color grading e sound design de nível profissional — o cuidado que transforma boas imagens em uma peça memorável.`,
      },
      {
        subtitulo: "Onde a montagem certa transforma boas imagens em uma grande peça.",
        contexto: (empresa) =>
          `O material já captado por ${empresa} passa por um processo de edição refinado, com atenção a ritmo, cor e som, elevando o resultado final a um padrão premium.`,
      },
      {
        subtitulo: "Finalização de estúdio para material que já nasceu bem produzido.",
        contexto: (empresa) =>
          `A proposta é dar ao material de ${empresa} o acabamento de uma produção de referência — cor, áudio e montagem tratados com precisão técnica e sensibilidade criativa.`,
      },
      {
        subtitulo: "Ritmo, cor e som tratados como uma única experiência.",
        contexto: (empresa) =>
          `A pós-produção de ${empresa} será conduzida como uma etapa autoral, combinando montagem, desenho de som e acabamento visual para construir uma peça coesa e sofisticada.`,
      },
    ],
    direto: [
      {
        subtitulo: "Edição sob demanda para transformar o material bruto em entrega final.",
        contexto: (empresa) =>
          `A proposta cobre a pós-produção completa do material já captado por ${empresa}: montagem, cor, áudio e entrega nos formatos definidos.`,
      },
      {
        subtitulo: "Do material bruto à entrega final, sem enrolação.",
        contexto: (empresa) =>
          `${empresa} envia o material captado e recebe de volta um vídeo editado, com cor e áudio tratados, pronto para os canais definidos.`,
      },
      {
        subtitulo: "Pós-produção objetiva para quem já tem o material em mãos.",
        contexto: (empresa) =>
          `A proposta resolve a etapa de edição do projeto de ${empresa} com um processo direto: seleção, montagem, tratamento técnico e entrega no prazo combinado.`,
      },
      {
        subtitulo: "Material organizado, edição bem definida e entrega pronta para publicar.",
        contexto: (empresa) =>
          `O fluxo de pós-produção de ${empresa} terá etapas e revisões claras, transformando os arquivos recebidos em versões finais adequadas aos canais escolhidos.`,
      },
    ],
    humano: [
      {
        subtitulo: "Um olhar dedicado para dar ritmo e emoção à história que já foi captada.",
        contexto: (empresa) =>
          `O objetivo é editar o material de ${empresa} com sensibilidade, encontrando o ritmo certo para que a história capturada realmente toque quem assiste.`,
      },
      {
        subtitulo: "Encontrar, no material bruto, a história que ainda não foi contada.",
        contexto: (empresa) =>
          `A edição do material de ${empresa} vai além da técnica — é um processo de garimpar os melhores momentos e organizá-los em uma narrativa que emociona.`,
      },
      {
        subtitulo: "Cada pausa, olhar e detalhe pode ser o ponto certo da história.",
        contexto: (empresa) =>
          `A montagem de ${empresa} será construída com escuta e cuidado, respeitando a verdade do material para encontrar uma narrativa fluida, próxima e capaz de permanecer com quem assiste.`,
      },
      {
        subtitulo: "Uma edição que respeita o tempo da história e aproxima quem está do outro lado.",
        contexto: (empresa) =>
          `O material de ${empresa} será trabalhado com sensibilidade para preservar falas, gestos e atmosferas, criando um resultado que parece verdadeiro porque nasce do que realmente aconteceu.`,
      },
    ],
  },
  escopos: [
    [
      { chave: "selecao", descricao: "Seleção e decupagem", detalhe: "Revisão do material bruto e escolha dos melhores momentos", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "montagem", descricao: "Montagem e corte", detalhe: "Construção do ritmo narrativo da peça", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "cor-audio", descricao: "Color grading e áudio", detalhe: "Tratamento de cor, trilha e mixagem de som", quantidade: 1, valor_unit: 0, ordem: 2 },
      { chave: "finalizacao", descricao: "Finalização e entrega", detalhe: "Masterização e exportação nos formatos definidos", quantidade: 1, valor_unit: 0, ordem: 3 },
    ],
    [
      { chave: "decupagem-detalhada", descricao: "Decupagem detalhada", detalhe: "Marcação e catalogação de todos os melhores trechos do material", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "montagem-narrativa", descricao: "Montagem narrativa", detalhe: "Estruturação da peça com foco em ritmo e clareza da mensagem", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "motion-grafismo", descricao: "Motion graphics e lettering", detalhe: "Elementos gráficos, legendas e identidade visual da peça", quantidade: 1, valor_unit: 0, ordem: 2 },
      { chave: "masterizacao", descricao: "Masterização final", detalhe: "Ajustes finais de cor, áudio e exportação em alta resolução", quantidade: 1, valor_unit: 0, ordem: 3 },
    ],
  ],
  cronogramas: [
    [
      { etapa: "Seleção do material e decupagem", prazo: "Semana 1" },
      { etapa: "Montagem e revisão interna", prazo: "Semana 2" },
      { etapa: "Cor, áudio e ajustes finais", prazo: "Semana 3" },
      { etapa: "Entrega final", prazo: "Semana 4" },
    ],
    [
      { etapa: "Decupagem e organização do material", prazo: "Semana 1" },
      { etapa: "Montagem narrativa", prazo: "Semana 2" },
      { etapa: "Motion graphics e finalização técnica", prazo: "Semana 3" },
      { etapa: "Masterização e entrega", prazo: "Semana 4" },
    ],
  ],
  condicoes: {
    pagamento: "50% no início da edição e 50% na entrega final",
    validade_dias: 15,
    revisoes_inclusas: "2 rodadas de ajustes",
    prazo_entrega: "conforme volume de material, definido no início do projeto",
    formato_entrega: "Arquivos digitais em alta resolução",
  },
  observacoes: [
    { icone: "edit", titulo: "Duas rodadas de revisão", texto: "Espaço para refinar cortes, ritmo e trilha antes da entrega final." },
    { icone: "package", titulo: "Entrega multi-formato", texto: "Versões adaptadas para os canais e proporções que o projeto precisar." },
  ],
};

const fotografia: PresetConfig = {
  narrativas: {
    premium: [
      {
        subtitulo: "Fotografia com direção de arte para registrar a marca com sofisticação.",
        contexto: (empresa) =>
          `A proposta é um ensaio fotográfico com direção de arte dedicada para ${empresa}, produzido para gerar um banco de imagens à altura do posicionamento da marca.`,
      },
      {
        subtitulo: "Imagens autorais para uma marca que não se contenta com o comum.",
        contexto: (empresa) =>
          `A cobertura fotográfica de ${empresa} será conduzida com direção de arte e iluminação de estúdio, criando um acervo visual exclusivo e coerente com o posicionamento da marca.`,
      },
      {
        subtitulo: "Um acervo visual concebido para elevar cada ponto de contato da marca.",
        contexto: (empresa) =>
          `A produção fotográfica de ${empresa} combina direção de arte, luz e composição para criar imagens consistentes, sofisticadas e prontas para sustentar campanhas e comunicação institucional.`,
      },
      {
        subtitulo: "Fotografia de campanha com identidade, intenção e acabamento editorial.",
        contexto: (empresa) =>
          `Cada imagem de ${empresa} será planejada como parte de uma coleção, com linguagem visual própria e tratamento refinado para apresentar a marca com força e unidade.`,
      },
    ],
    direto: [
      {
        subtitulo: "Cobertura fotográfica profissional, pronta para uso comercial.",
        contexto: (empresa) =>
          `A proposta cobre a produção fotográfica de ${empresa} com equipamento e iluminação profissional, entregando imagens prontas para site, redes e material comercial.`,
      },
      {
        subtitulo: "Fotos objetivas, entregues rápido e prontas para usar.",
        contexto: (empresa) =>
          `A proposta é simples: cobertura fotográfica profissional para ${empresa}, com tratamento de imagem e entrega rápida nos formatos que a marca precisar.`,
      },
      {
        subtitulo: "Um banco de imagens profissional para site, redes e materiais comerciais.",
        contexto: (empresa) =>
          `A produção entrega a ${empresa} um conjunto organizado de fotografias tratadas, com variedade de enquadramentos e formatos para uso imediato nos principais canais da marca.`,
      },
      {
        subtitulo: "Produção fotográfica com quantidade, prazo e formatos definidos.",
        contexto: (empresa) =>
          `A proposta organiza o ensaio de ${empresa} do planejamento à entrega: roteiro de fotos, captação, seleção, tratamento e arquivos finais prontos para aplicação.`,
      },
    ],
    humano: [
      {
        subtitulo: "Fotos que capturam o que há de mais genuíno na sua marca.",
        contexto: (empresa) =>
          `O objetivo é registrar momentos reais de ${empresa} com um olhar próximo e natural, criando um acervo de imagens que realmente representa o dia a dia da marca.`,
      },
      {
        subtitulo: "Um olhar sensível para os detalhes que fazem a marca ser única.",
        contexto: (empresa) =>
          `A cobertura fotográfica de ${empresa} vai além do still comercial padrão — busca capturar expressões e momentos que contam a história real por trás da marca.`,
      },
      {
        subtitulo: "Imagens vivas, feitas para que o público reconheça pessoas e não apenas uma empresa.",
        contexto: (empresa) =>
          `A fotografia de ${empresa} vai valorizar relações, bastidores e gestos espontâneos, formando um acervo próximo e verdadeiro para a comunicação da marca.`,
      },
      {
        subtitulo: "Fotografar o cotidiano com cuidado para revelar o que normalmente passa despercebido.",
        contexto: (empresa) =>
          `A proposta acompanha a rotina de ${empresa} com um olhar documental, registrando detalhes e pessoas que traduzem a cultura da marca de forma natural.`,
      },
    ],
  },
  escopos: [
    [
      { chave: "pre", descricao: "Planejamento do ensaio", detalhe: "Definição de locação, referências visuais e roteiro de still", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "cobertura", descricao: "Cobertura fotográfica", detalhe: "Diária de still com equipamento e iluminação profissional", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "tratamento", descricao: "Tratamento de imagem", detalhe: "Seleção, edição de cor e retoque das melhores fotos", quantidade: 1, valor_unit: 0, ordem: 2 },
      { chave: "entrega", descricao: "Entrega final", detalhe: "Arquivos em alta resolução prontos para uso comercial", quantidade: 1, valor_unit: 0, ordem: 3 },
    ],
    [
      { chave: "moodboard", descricao: "Moodboard e referências", detalhe: "Curadoria visual e definição de estilo do ensaio", quantidade: 1, valor_unit: 0, ordem: 0 },
      { chave: "producao-still", descricao: "Produção do ensaio", detalhe: "Direção de cena, poses e iluminação em locação ou estúdio", quantidade: 1, valor_unit: 0, ordem: 1 },
      { chave: "selecao-retoque", descricao: "Seleção e retoque avançado", detalhe: "Edição fina de cor, pele e composição das imagens escolhidas", quantidade: 1, valor_unit: 0, ordem: 2 },
      { chave: "entrega-formatos", descricao: "Entrega em múltiplos formatos", detalhe: "Versões otimizadas para redes, site e impressão", quantidade: 1, valor_unit: 0, ordem: 3 },
    ],
  ],
  cronogramas: [
    [
      { etapa: "Planejamento e referências", prazo: "Etapa 1" },
      { etapa: "Cobertura fotográfica", prazo: "Etapa 2" },
      { etapa: "Seleção e tratamento", prazo: "Etapa 3" },
      { etapa: "Entrega final", prazo: "Etapa 4" },
    ],
    [
      { etapa: "Moodboard e definição de estilo", prazo: "Semana 1" },
      { etapa: "Produção do ensaio", prazo: "Semana 1" },
      { etapa: "Seleção e retoque das imagens", prazo: "Semana 2" },
      { etapa: "Entrega em múltiplos formatos", prazo: "Semana 2" },
    ],
  ],
  condicoes: {
    pagamento: "50% na confirmação e 50% na entrega",
    validade_dias: 15,
    revisoes_inclusas: "1 rodada de seleção adicional",
    prazo_entrega: "até 7 dias úteis após a cobertura",
    formato_entrega: "Arquivos digitais em alta resolução",
  },
  observacoes: [
    { icone: "package", titulo: "Banco de imagens", texto: "Entrega de um acervo de fotos tratadas, pronto para múltiplos usos." },
    { icone: "edit", titulo: "Tratamento incluso", texto: "Seleção e edição de cor profissional em todas as imagens entregues." },
  ],
};

const PRESETS: Partial<Record<TipoPresetProposta, PresetConfig>> = {
  institucional, mensal, podcast, evento, captacao, edicao, fotografia,
};

/**
 * Gera documento (narrativa + condições + observações) e itens de escopo
 * para o tipo de proposta selecionado. Retorna `null` para "custom" — nesse
 * caso o usuário escreve tudo do zero ("Do meu jeito").
 */
export function gerarPreset(
  tipoPreset: TipoPresetProposta,
  empresa: string,
  tom: TomProposta = "premium",
  variante = 0,
): { documento: PropostaDocumento; itens: PropostaItem[] } | null {
  const preset = PRESETS[tipoPreset];
  if (!preset) return null;
  const vozes = preset.narrativas[tom];
  const voz = vozes[variante % vozes.length];
  return {
    documento: {
      preset: tipoPreset,
      tipo_preco: "fechado",
      subtitulo: voz.subtitulo,
      contexto: voz.contexto(empresa || "a marca"),
      cronograma: preset.cronogramas[variante % preset.cronogramas.length],
      condicoes: preset.condicoes,
      observacoes: preset.observacoes,
      exibir_valores_itens: tipoPreset === "evento" ? true : undefined,
      precificacao: {
        ativa: true,
        margem: 40,
        custos_itens: {},
      },
    },
    itens: preset.escopos[variante % preset.escopos.length].map((item) => ({ ...item })),
  };
}

// Mantido por compatibilidade — usa o preset institucional diretamente.
export function gerarInstitucional(
  empresa: string,
  tom: TomProposta = "premium",
  variante = 0,
): { documento: PropostaDocumento; itens: PropostaItem[] } {
  return gerarPreset("institucional", empresa, tom, variante)!;
}
