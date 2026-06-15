# Plano: Ferramentas do FRAMEOS

Vou construir os 3 módulos em sequência, todos seguindo o Design System atual (dark, lime primary, cards arredondados, semantic tokens) e usando stores reativos em memória (mesmo padrão de `src/lib/mock/projetos.ts` e `agenda.ts`), prontos para futura migração para Lovable Cloud.

---

## 1. Orçamentos (`/orcamentos`)

Substitui `/calculadoras`. Configurador inteligente estilo "monte seu carro".

### Stores
- `src/lib/mock/custos.ts` — tabela de custos da produtora (diária videomaker, editor/h, motion/h, drone, drone FPV, km, locução, hora extra, etc.) com defaults editáveis e persistência reativa. Lida pela tela Configurações.
- `src/lib/mock/orcamentos.ts` — Orçamento, OrcamentoTemplate. Engine de cálculo: dado um payload (produção + pós + extras) e a tabela de custos, retorna `{ custoOperacional, margem, precoSugerido, lucroEstimado }`. Função `criarProjetoDeOrcamento` para integrar com `projetos.ts`.

### Rotas e componentes
- `src/routes/orcamentos.index.tsx` — tela inicial "O que você deseja orçar?" com 7 cards (Institucional, Conteúdo Mensal, Podcast, Captação, Edição, Fotografia, Personalizado) + linha de templates salvos + lista de orçamentos recentes.
- `src/routes/orcamentos.novo.tsx` — wizard com `?tipo=` e step state. 4 etapas (Geral → Produção → Pós → Extras) + tela de resultado. Layout: stepper no topo, formulário central com poucos campos por tela, **painel lateral fixo com cálculo em tempo real** (custo, margem slider, preço sugerido, lucro). Animações suaves entre etapas.
- `src/routes/orcamentos.$id.tsx` — visualização do orçamento finalizado com ações: Gerar Proposta, Salvar Template, Salvar, Criar Projeto.
- `src/components/orcamentos/tipo-card.tsx`, `wizard-stepper.tsx`, `resumo-lateral.tsx`, `campo-numero.tsx` (stepper +/-), `campo-toggle.tsx` (switch elegante).

### Configurações > Minha Produtora
- Adicionar seção "Tabela de Custos" em `src/routes/configuracoes.tsx` com inputs editáveis para cada item da tabela, agrupados por categoria (Equipe / Equipamento / Logística / Extras).

---

## 2. Central de Recursos (`/biblioteca`)

Substitui o placeholder atual. Estilo Notion + Drive.

### Store
- `src/lib/mock/biblioteca.ts` — Recurso `{ id, categoria, titulo, descricao, conteudo, variaveis[], favorito, compartilhado, atualizadoEm }`. Categorias: propostas, contratos, briefings, checklists, roteiros, mensagens, arquivos. Função `aplicarVariaveis(conteudo, dados)` que substitui `{{cliente}}`, `{{valor}}`, etc. Seed com 2–3 modelos por categoria.

### Rotas
- `src/routes/biblioteca.tsx` — layout com busca global no topo + grid de 9 category cards (incluindo Favoritos, Compartilhados, Marketplace "Em breve" desabilitado).
- `src/routes/biblioteca.$categoria.tsx` — lista de recursos da categoria com ações: visualizar, duplicar, editar, favoritar, compartilhar, usar.
- `src/components/biblioteca/recurso-modal.tsx` — modal de edição com textarea grande, chip-list das variáveis disponíveis (clique insere `{{x}}` no cursor), preview com dados de exemplo.
- `src/components/biblioteca/categoria-card.tsx`, `recurso-card.tsx`.

### Integração leve (sem refatorar módulos existentes ainda)
- API exportada `biblioteca.listarPorCategoria(cat)` para futuro consumo por Propostas/Contratos/Projetos. Documentado no header dos arquivos.

---

## 3. Performance (renomear Relatórios)

### Renomeação
- Renomear arquivo `src/routes/relatorios.tsx` → `src/routes/performance.tsx` (e demais sub-rotas via convenção dot).
- Atualizar `src/components/app-sidebar.tsx` (label + ícone TrendingUp + rota `/performance`).
- `routeTree.gen.ts` é regenerado automaticamente pelo plugin.

### Estrutura
- `src/routes/performance.tsx` — layout com sub-nav (tabs/segmented) entre as 7 áreas.
- `src/routes/performance.index.tsx` — Visão Geral.
- `performance.comercial.tsx`, `performance.producao.tsx`, `performance.financeiro.tsx`, `performance.clientes.tsx`, `performance.equipe.tsx`, `performance.crescimento.tsx`.

### Store de métricas
- `src/lib/mock/performance.ts` — derivações dos stores existentes (comercial, financeiro, projetos) + dados mock onde ainda não há fonte real (saúde da empresa, insights). KPIs reativos.

### Componentes
- `src/components/performance/kpi-card.tsx` (reaproveitar padrão do financeiro/kpi-card).
- `comparativo-card.tsx` — valor atual vs anterior com delta colorido.
- `progress-meta.tsx` — barra de progresso para meta.
- `saude-empresa.tsx` — gauge circular grande.
- `insights-card.tsx` — "🧠 FRAMEOS Insights" com lista de mensagens mock.
- `funil-comercial.tsx` — funil visual simples (CSS) para a aba Comercial.
- `mini-grafico.tsx` — sparkline minimalista para Crescimento (SVG puro, sem libs novas).

### Filtros
- Barra de filtros no topo do módulo (período, cliente, responsável, projeto) — estado local que componentes lerem via context simples.

---

## Detalhes técnicos

- **Sem novas dependências.** Tudo com componentes shadcn existentes (Card, Tabs, Dialog, Slider, Switch, Progress, Input, Select, Button) + SVG inline para gauges/sparkines.
- **Stores reativos:** mesmo padrão de `useSyncExternalStore` já usado nos demais mocks.
- **Roteamento:** segue convenção dot-separated do TanStack Router já usada no projeto (`orcamentos.index.tsx`, `orcamentos.novo.tsx`, `orcamentos.$id.tsx`, `biblioteca.$categoria.tsx`, `performance.<sub>.tsx`).
- **Design:** dark, primary lime, cards `rounded-xl border bg-card`, espaçamento generoso, transições `transition-all duration-300`, ícones lucide-react já em uso.
- **Sidebar:** atualizar `app-sidebar.tsx` para refletir `/orcamentos` (no lugar de Calculadoras) e `/performance` (no lugar de Relatórios), mantendo Biblioteca.

---

## Entrega
Vou implementar os 3 módulos em uma única passada, criando arquivos em paralelo. Ao final, tudo navegável e calculando ao vivo com dados mock.

Confirma que posso seguir?
