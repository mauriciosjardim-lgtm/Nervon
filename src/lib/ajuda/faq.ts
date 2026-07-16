// Base de conhecimento do tira-dúvidas (custo zero, busca local).
// Para adicionar/editar respostas, basta mexer no array FAQ abaixo.

export interface FaqItem {
  id: string;
  categoria: string;
  pergunta: string;
  palavras: string;   // sinônimos/termos extras pra melhorar a busca
  resposta: string;   // use \n para quebra de parágrafo
  rota?: string;      // link opcional para a tela relacionada
  rotaLabel?: string;
}

export const CATEGORIAS = [
  "Primeiros passos", "Equipe", "Projetos", "Comercial", "Agenda",
  "Financeiro", "Orçamentos", "Contratos", "Conta e plano",
];

export const FAQ: FaqItem[] = [
  // ── Primeiros passos ──
  {
    id: "o-que-e", categoria: "Primeiros passos",
    pergunta: "O que é o MakersHub?",
    palavras: "começar inicio sistema plataforma serve para que",
    resposta: "O MakersHub centraliza a operação da sua produtora: CRM/comercial, projetos, agenda, financeiro, orçamentos e contratos — tudo em um só lugar, separado por empresa (workspace).",
  },
  {
    id: "navegar", categoria: "Primeiros passos",
    pergunta: "Como navego entre os módulos?",
    palavras: "menu lateral sidebar acessar telas seções",
    resposta: "Use o menu lateral à esquerda. Os itens visíveis dependem das permissões do seu usuário — se algo não aparece, peça acesso ao admin da sua equipe.",
  },

  // ── Equipe ──
  {
    id: "convidar-membro", categoria: "Equipe",
    pergunta: "Como convido um membro para a equipe?",
    palavras: "adicionar colaborador convite novo usuário time pessoas",
    resposta: "Vá em Configurações → Equipe → \"Convidar novo membro\". Informe o e-mail, escolha o papel (Admin ou Membro) e marque os módulos que ele pode acessar. Ele recebe um e-mail com o link para criar a senha.",
    rota: "/configuracoes", rotaLabel: "Abrir Configurações",
  },
  {
    id: "permissoes-membro", categoria: "Equipe",
    pergunta: "Como controlo o que cada membro vê?",
    palavras: "permissão acesso módulo bloquear restringir esconder financeiro",
    resposta: "Na lista de membros (Configurações → Equipe), clique em \"Acessos\" no membro e marque/desmarque os módulos. Admins veem tudo; membros veem só o que você liberar. As permissões valem também no banco de dados, não só na tela.",
    rota: "/configuracoes", rotaLabel: "Abrir Configurações",
  },
  {
    id: "trocar-papel", categoria: "Equipe",
    pergunta: "Como promovo alguém a admin ou removo da equipe?",
    palavras: "papel cargo admin membro remover excluir tirar promover rebaixar",
    resposta: "Em Configurações → Equipe, use o seletor de papel (Membro/Admin) ao lado do nome, ou o ícone de lixeira para remover. O sistema não deixa remover o único admin, e remover alguém só desfaz o vínculo — o histórico de tarefas é preservado.",
    rota: "/configuracoes", rotaLabel: "Abrir Configurações",
  },

  // ── Projetos ──
  {
    id: "criar-projeto", categoria: "Projetos",
    pergunta: "Como crio um projeto?",
    palavras: "novo projeto adicionar cadastrar começar trabalho job",
    resposta: "Em Projetos, clique em \"Novo projeto\". Informe nome, cliente, datas e a equipe envolvida. A fase do projeto é definida depois, movendo os cards no kanban dentro do projeto.",
    rota: "/projetos", rotaLabel: "Abrir Projetos",
  },
  {
    id: "responsavel-tarefa", categoria: "Projetos",
    pergunta: "Como atribuo um responsável a uma tarefa?",
    palavras: "responsável tarefa atividade quem faz designar atribuir membro",
    resposta: "Ao criar ou editar uma tarefa dentro do projeto, use o campo \"Responsável\" — ele lista os membros do seu workspace. A tarefa atribuída a um membro aparece na dashboard dele.",
    rota: "/projetos", rotaLabel: "Abrir Projetos",
  },
  {
    id: "fase-kanban", categoria: "Projetos",
    pergunta: "Como mudo a fase de um projeto?",
    palavras: "fase etapa kanban mover card briefing edição entrega status",
    resposta: "Abra o projeto e arraste os cards entre as colunas do kanban. O progresso acompanha a posição das tarefas no fluxo e chega a 100% quando elas são concluídas.",
    rota: "/projetos", rotaLabel: "Abrir Projetos",
  },

  // ── Comercial ──
  {
    id: "criar-lead", categoria: "Comercial",
    pergunta: "Como cadastro um lead no CRM?",
    palavras: "lead cliente prospect funil pipeline comercial crm oportunidade",
    resposta: "Em Comercial, adicione um lead e mova-o pelas etapas do funil (novo, diagnóstico, reunião, proposta, negociação, fechado). Cada lead guarda timeline, tarefas e valor.",
    rota: "/comercial", rotaLabel: "Abrir Comercial",
  },

  // ── Agenda ──
  {
    id: "agenda-tarefas", categoria: "Agenda",
    pergunta: "As tarefas aparecem na agenda?",
    palavras: "agenda calendário prazo evento data tarefa compromisso",
    resposta: "Sim. Tarefas com prazo e marcos dos projetos aparecem automaticamente na Agenda. Você também pode criar eventos avulsos (reunião, gravação, entrega).",
    rota: "/agenda", rotaLabel: "Abrir Agenda",
  },

  // ── Financeiro ──
  {
    id: "lancamento-financeiro", categoria: "Financeiro",
    pergunta: "Como registro uma receita ou despesa?",
    palavras: "financeiro lançamento receita despesa dinheiro pagamento entrada saída caixa",
    resposta: "Em Financeiro, adicione um lançamento (receita ou despesa), com valor, categoria, data e carteira. O painel mostra receita do mês, metas e o gráfico de faturamento × custos.",
    rota: "/financeiro", rotaLabel: "Abrir Financeiro",
  },
  {
    id: "financeiro-bloqueado", categoria: "Financeiro",
    pergunta: "Por que não consigo ver o Financeiro?",
    palavras: "financeiro não aparece bloqueado sem acesso permissão escondido",
    resposta: "O Financeiro é restrito por permissão. Por padrão, membros não têm acesso. Peça ao admin para liberar o módulo Financeiro em Configurações → Equipe → Acessos.",
  },

  // ── Orçamentos ──
  {
    id: "criar-orcamento", categoria: "Orçamentos",
    pergunta: "Como faço um orçamento?",
    palavras: "orçamento proposta preço cálculo valor cotação estimativa",
    resposta: "Em Orçamentos, clique em \"Novo orçamento\", preencha os blocos (geral, produção, pós, extras) e a margem. O total é calculado automaticamente e o orçamento fica salvo para reuso.",
    rota: "/orcamentos", rotaLabel: "Abrir Orçamentos",
  },

  // ── Contratos ──
  {
    id: "cofre-cliente", categoria: "Contratos",
    pergunta: "O que é o Cofre do Cliente?",
    palavras: "cofre cliente contratos pasta vault organizar",
    resposta: "O Cofre é o espaço de cada cliente dentro de Contratos. Ele guarda os dados do cliente, os contratos, os arquivos e o histórico. Todo contrato pertence a um cofre.",
    rota: "/contratos", rotaLabel: "Abrir Contratos",
  },
  {
    id: "criar-contrato", categoria: "Contratos",
    pergunta: "Como crio um contrato?",
    palavras: "contrato novo gerar montar cláusulas modelo wizard",
    resposta: "Abra o cofre do cliente e clique em \"Novo contrato\". Escolha um modelo, preencha os dados comerciais, selecione as cláusulas (as obrigatórias já vêm marcadas) e veja a prévia com a numeração automática. Salve como rascunho ou gere o contrato.",
    rota: "/contratos", rotaLabel: "Abrir Contratos",
  },
  {
    id: "dados-empresa-contrato", categoria: "Contratos",
    pergunta: "Onde coloco os dados da minha empresa no contrato?",
    palavras: "contratada cnpj razão social meus dados emitente empresa contrato em branco",
    resposta: "Em Contratos, clique em \"Minha empresa\" e preencha razão social, CNPJ e endereço. Esses dados aparecem como CONTRATADA em todos os contratos. Sem isso, o contrato sai com os campos em branco.",
    rota: "/contratos", rotaLabel: "Abrir Contratos",
  },
  {
    id: "excluir-cofre", categoria: "Contratos",
    pergunta: "Como excluo um cliente de Contratos?",
    palavras: "excluir cofre cliente apagar deletar remover backup",
    resposta: "Na lista de Contratos, passe o mouse no card e clique no X. O sistema avisa que a exclusão é irreversível e oferece baixar um backup (JSON) antes de apagar tudo.",
    rota: "/contratos", rotaLabel: "Abrir Contratos",
  },
  {
    id: "assinatura-digital", categoria: "Contratos",
    pergunta: "Dá para assinar o contrato digitalmente?",
    palavras: "assinatura digital assinar clicksign zapsign docusign enviar",
    resposta: "A estrutura de assinatura digital já está preparada, mas a integração com a API de assinatura ainda está em desenvolvimento. Por enquanto você pode gerar o contrato e anexar a versão assinada manualmente na aba Arquivos do cofre.",
  },

  // ── Conta e plano ──
  {
    id: "alterar-dados-empresa", categoria: "Conta e plano",
    pergunta: "Como mudo o nome ou a logo da produtora?",
    palavras: "logo nome produtora empresa marca cor identidade configurações",
    resposta: "Em Configurações → Minha Produtora você altera nome e logo; em Brand Kit, a cor de destaque da interface.",
    rota: "/configuracoes", rotaLabel: "Abrir Configurações",
  },
  {
    id: "esqueci-senha", categoria: "Conta e plano",
    pergunta: "Esqueci minha senha, e agora?",
    palavras: "senha esqueci recuperar resetar login entrar acesso",
    resposta: "Na tela de login, use \"Esqueci minha senha\" para receber um link de redefinição no seu e-mail.",
  },
];

// ─── Busca local ────────────────────────────────────────────
const STOPWORDS = new Set([
  "a","o","as","os","de","da","do","das","dos","e","em","um","uma","para","pra",
  "por","com","no","na","nos","nas","que","como","qual","quais","meu","minha",
  "the","is","of","to","eu","se","ao","à","ou","já","tem","ter","faz","fazer",
]);

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ");

function tokens(s: string): string[] {
  return norm(s).split(/\s+/).filter(t => t.length >= 3 && !STOPWORDS.has(t));
}

export interface FaqMatch { item: FaqItem; score: number; }

/** Retorna os FAQs mais relevantes para a pergunta (ordenados). */
export function buscarFaq(query: string, limite = 4): FaqMatch[] {
  const q = tokens(query);
  if (q.length === 0) return [];
  const qNorm = norm(query).trim();

  const matches: FaqMatch[] = FAQ.map(item => {
    const hay = norm(`${item.pergunta} ${item.palavras} ${item.categoria}`);
    const hayTokens = new Set(hay.split(/\s+/));
    let score = 0;
    for (const t of q) {
      if (hayTokens.has(t)) score += 2;          // termo exato
      else if (hay.includes(t)) score += 1;      // termo como substring
    }
    if (qNorm.length >= 4 && norm(item.pergunta).includes(qNorm)) score += 3; // frase quase igual
    return { item, score };
  }).filter(m => m.score > 0);

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limite);
}
