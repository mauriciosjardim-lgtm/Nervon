-- ============================================================
-- MAKERShub — Módulo CONTRATOS (Cofre do Cliente)
-- Multi-tenant por empresa_id + RLS. Templates/cláusulas globais.
-- Idempotente.
-- ============================================================

-- ─── 1. COFRES DO CLIENTE ─────────────────────────────────
create table if not exists client_vaults (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references empresas(id) on delete cascade,
  name            text not null,
  fantasy_name    text,
  type            text not null default 'individual' check (type in ('individual','company')),
  document        text,                       -- CPF/CNPJ
  email           text,
  phone           text,
  address         text,
  city            text,
  state           text,
  zip_code        text,
  responsible_name text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists client_vaults_empresa_idx on client_vaults(empresa_id);

-- ─── 2. MODELOS DE CONTRATO (biblioteca global) ───────────
create table if not exists contract_templates (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  description  text,
  type         text not null,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── 3. CLÁUSULAS MODULARES (biblioteca global) ───────────
create table if not exists contract_clauses (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  category         text not null,
  title            text not null,
  body             text not null,
  order_base       int not null default 100,
  required         boolean not null default false,
  active           boolean not null default true,
  variables        jsonb not null default '[]',
  depends_on       jsonb not null default '[]',  -- lista de slugs
  incompatible_with jsonb not null default '[]', -- lista de slugs
  contract_types   jsonb not null default '["*"]', -- slugs de template ou ["*"]
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─── 4. CONTRATOS ─────────────────────────────────────────
create table if not exists contracts (
  id                  uuid primary key default gen_random_uuid(),
  empresa_id          uuid not null references empresas(id) on delete cascade,
  client_vault_id     uuid not null references client_vaults(id) on delete cascade,
  template_id         uuid references contract_templates(id) on delete set null,
  numero              int,
  title               text not null,
  status              text not null default 'rascunho'
                        check (status in ('rascunho','gerado','enviado','aguardando_assinatura','assinado','cancelado','vencido')),
  form_data           jsonb not null default '{}',
  selected_clause_ids jsonb not null default '[]',  -- lista de slugs
  rendered_html       text,
  rendered_text       text,
  pdf_url             text,
  -- preparação assinatura digital (não ativo ainda)
  signature_provider   text,   -- clicksign | zapsign | docusign
  signature_request_id text,
  signature_url        text,
  signed_pdf_url       text,
  signed_at            timestamptz,
  -- preparação cobrança futura (Asaas)
  cobranca_id          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists contracts_empresa_idx on contracts(empresa_id);
create index if not exists contracts_vault_idx   on contracts(client_vault_id);

-- ─── 5. ARQUIVOS DO CLIENTE ───────────────────────────────
create table if not exists client_files (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references empresas(id) on delete cascade,
  client_vault_id uuid not null references client_vaults(id) on delete cascade,
  contract_id     uuid references contracts(id) on delete set null,
  name            text not null,
  file_url        text not null,
  file_type       text,
  category        text not null default 'outro'
                    check (category in ('contrato_assinado','documento_cliente','proposta','briefing','comprovante','outro')),
  uploaded_by     uuid,
  created_at      timestamptz not null default now()
);
create index if not exists client_files_vault_idx on client_files(client_vault_id);

-- ─── 6. HISTÓRICO / EVENTOS ───────────────────────────────
create table if not exists contract_events (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references empresas(id) on delete cascade,
  client_vault_id uuid references client_vaults(id) on delete cascade,
  contract_id     uuid references contracts(id) on delete cascade,
  event_type      text not null,
  description     text,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);
create index if not exists contract_events_vault_idx on contract_events(client_vault_id);

-- ============================================================
-- RLS
-- ============================================================
alter table client_vaults      enable row level security;
alter table contracts          enable row level security;
alter table client_files       enable row level security;
alter table contract_events    enable row level security;
alter table contract_templates enable row level security;
alter table contract_clauses   enable row level security;

-- Tabelas por empresa: isolamento + permissão de módulo 'contratos'
-- (tem_permissao já existe da migration de segurança; admin sempre true)
drop policy if exists "vaults_acesso" on client_vaults;
create policy "vaults_acesso" on client_vaults for all
  using      (empresa_id = minha_empresa_id() and tem_permissao('contratos'))
  with check (empresa_id = minha_empresa_id() and tem_permissao('contratos'));

drop policy if exists "contracts_acesso" on contracts;
create policy "contracts_acesso" on contracts for all
  using      (empresa_id = minha_empresa_id() and tem_permissao('contratos'))
  with check (empresa_id = minha_empresa_id() and tem_permissao('contratos'));

drop policy if exists "client_files_acesso" on client_files;
create policy "client_files_acesso" on client_files for all
  using      (empresa_id = minha_empresa_id() and tem_permissao('contratos'))
  with check (empresa_id = minha_empresa_id() and tem_permissao('contratos'));

drop policy if exists "contract_events_acesso" on contract_events;
create policy "contract_events_acesso" on contract_events for all
  using      (empresa_id = minha_empresa_id() and tem_permissao('contratos'))
  with check (empresa_id = minha_empresa_id() and tem_permissao('contratos'));

-- Biblioteca global: leitura por qualquer usuário autenticado
drop policy if exists "templates_leitura" on contract_templates;
create policy "templates_leitura" on contract_templates for select
  using (auth.uid() is not null);

drop policy if exists "clauses_leitura" on contract_clauses;
create policy "clauses_leitura" on contract_clauses for select
  using (auth.uid() is not null);

-- ============================================================
-- SEED — Modelos
-- ============================================================
insert into contract_templates (slug, name, description, type) values
  ('servico',   'Prestação de serviço',          'Contrato padrão de prestação de serviços audiovisuais.', 'servico'),
  ('recorrente','Contrato mensal / recorrente',  'Serviços contínuos com mensalidade.',                    'recorrente'),
  ('video',     'Produção de vídeo',             'Produção audiovisual com entregáveis e captação.',       'video'),
  ('evento',    'Evento',                        'Cobertura/produção de evento.',                          'evento'),
  ('edicao',    'Edição avulsa',                 'Edição/pós-produção pontual.',                           'edicao'),
  ('imagem',    'Termo de autorização de imagem','Autorização de uso de imagem e voz.',                    'imagem'),
  ('proposta',  'Proposta com aceite',           'Proposta comercial com aceite formal.',                  'proposta')
on conflict (slug) do nothing;

-- ============================================================
-- SEED — Cláusulas (corpo SEM número; o motor compõe o cabeçalho)
-- ============================================================
insert into contract_clauses (slug, category, title, body, order_base, required, variables, depends_on, incompatible_with, contract_types) values
-- Obrigatórias
('qualificacao_partes','Partes','Qualificação das Partes',
 'De um lado, {{CONTRATADA_NOME}}, inscrita no CNPJ sob nº {{CONTRATADA_CNPJ}}, doravante denominada CONTRATADA; e de outro lado, {{CLIENTE_NOME}}, portador(a) do documento {{CLIENTE_DOCUMENTO}}, com endereço em {{CLIENTE_ENDERECO}} e e-mail {{CLIENTE_EMAIL}}, doravante denominado(a) CONTRATANTE.',
 10, true, '["CONTRATADA_NOME","CONTRATADA_CNPJ","CLIENTE_NOME","CLIENTE_DOCUMENTO","CLIENTE_ENDERECO","CLIENTE_EMAIL"]','[]','[]','["*"]'),

('objeto','Objeto','Objeto do Contrato',
 'O presente contrato tem por objeto a prestação dos serviços de {{SERVICO_NOME}}, conforme descrição: {{SERVICO_DESCRICAO}}.',
 20, true, '["SERVICO_NOME","SERVICO_DESCRICAO"]','[]','[]','["*"]'),

('escopo_entregaveis','Escopo','Escopo e Entregáveis',
 'A CONTRATADA executará os serviços descritos, entregando {{QUANTIDADE_ENTREGAVEIS}} entregável(is) conforme especificação acordada entre as partes. Atividades não previstas neste escopo serão objeto de novo acordo.',
 30, true, '["QUANTIDADE_ENTREGAVEIS"]','[]','[]','["*"]'),

('prazo','Prazo','Prazo',
 'Os serviços terão início em {{DATA_INICIO}}, com prazo de entrega de {{PRAZO_ENTREGA}}. {{DATA_FIM}}',
 40, true, '["DATA_INICIO","DATA_FIM","PRAZO_ENTREGA"]','[]','[]','["*"]'),

('pagamento','Pagamento','Valor e Forma de Pagamento',
 'Pela prestação dos serviços, a CONTRATANTE pagará à CONTRATADA o valor total de {{VALOR_TOTAL}}, por meio de {{FORMA_PAGAMENTO}}.',
 50, true, '["VALOR_TOTAL","FORMA_PAGAMENTO"]','[]','[]','["*"]'),

('obrigacoes_contratada','Escopo','Obrigações da Contratada',
 'A CONTRATADA obriga-se a executar os serviços com zelo, técnica e qualidade profissional, cumprindo os prazos pactuados e mantendo a CONTRATANTE informada sobre o andamento dos trabalhos.',
 60, true, '[]','[]','[]','["*"]'),

('obrigacoes_contratante','Escopo','Obrigações da Contratante',
 'A CONTRATANTE obriga-se a fornecer, em tempo hábil, todas as informações, materiais e aprovações necessárias à execução dos serviços, bem como a efetuar os pagamentos nas datas acordadas.',
 70, true, '[]','[]','[]','["*"]'),

('rescisao','Rescisão','Rescisão',
 'O presente contrato poderá ser rescindido por qualquer das partes mediante notificação prévia, respeitados os serviços já executados e os valores devidos até a data da rescisão.',
 150, true, '[]','[]','[]','["*"]'),

('foro','Foro','Foro',
 'Fica eleito o foro da comarca de {{CIDADE_FORO}} para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.',
 170, true, '["CIDADE_FORO"]','[]','[]','["*"]'),

('assinaturas','Assinaturas','Assinaturas',
 'E, por estarem assim justas e contratadas, as partes firmam o presente instrumento. {{CIDADE_FORO}}, {{DATA_GERACAO}}.' || chr(10) || chr(10) || '_______________________________' || chr(10) || '{{CONTRATADA_NOME}} (CONTRATADA)' || chr(10) || chr(10) || '_______________________________' || chr(10) || '{{CLIENTE_NOME}} (CONTRATANTE)',
 180, true, '["CONTRATADA_NOME","CLIENTE_NOME","CIDADE_FORO","DATA_GERACAO"]','[]','[]','["*"]'),

-- Opcionais
('pagamento_parcelado','Pagamento','Pagamento Parcelado',
 'O valor total de {{VALOR_TOTAL}} será pago em {{NUMERO_PARCELAS}} parcelas iguais e sucessivas, vencendo a primeira na data de início e as demais em igual dia dos meses subsequentes.',
 51, false, '["VALOR_TOTAL","NUMERO_PARCELAS"]','["pagamento"]','["pagamento_recorrente"]','["*"]'),

('pagamento_recorrente','Pagamento','Pagamento Recorrente / Mensalidade',
 'A CONTRATANTE pagará à CONTRATADA a quantia mensal de {{VALOR_TOTAL}}, a título de mensalidade, enquanto vigente o presente contrato, vencível todo mês na data de aniversário do contrato.',
 52, false, '["VALOR_TOTAL"]','["pagamento"]','["pagamento_parcelado"]','["recorrente","servico"]'),

('multa_cancelamento','Multa','Multa por Cancelamento',
 'Em caso de cancelamento imotivado por qualquer das partes, a parte que der causa pagará à outra multa correspondente a {{MULTA_CANCELAMENTO}}, sem prejuízo dos valores referentes aos serviços já executados.',
 140, false, '["MULTA_CANCELAMENTO"]','[]','[]','["*"]'),

('limite_revisoes','Revisões','Limite de Revisões',
 'Estão inclusas no valor contratado até {{QUANTIDADE_REVISOES}} rodada(s) de revisão por entregável. Revisões adicionais serão cobradas à parte, mediante orçamento prévio.',
 80, false, '["QUANTIDADE_REVISOES"]','["escopo_entregaveis"]','[]','["*"]'),

('aprovacao_tacita','Aprovação','Aprovação Tácita',
 'Não havendo manifestação da CONTRATANTE quanto aos entregáveis no prazo de 5 (cinco) dias úteis após o envio, estes serão considerados tacitamente aprovados para todos os fins.',
 90, false, '[]','[]','[]','["*"]'),

('uso_imagem','Direito de imagem','Uso de Imagem',
 'A CONTRATANTE autoriza o uso das imagens e materiais produzidos para fins de portfólio e divulgação da CONTRATADA, salvo manifestação expressa em contrário.',
 100, false, '[]','[]','[]','["video","evento","imagem","servico"]'),

('cessao_total','Direitos autorais','Cessão Total de Direitos',
 'A CONTRATADA cede à CONTRATANTE, de forma total, definitiva e irrevogável, todos os direitos patrimoniais sobre o material produzido, podendo a CONTRATANTE utilizá-lo livremente.',
 110, false, '[]','[]','["licenca_limitada"]','["*"]'),

('licenca_limitada','Direitos autorais','Licença de Uso Limitada',
 'A CONTRATADA concede à CONTRATANTE licença de uso do material produzido limitada às finalidades e canais acordados, mantendo a titularidade dos direitos autorais.',
 111, false, '[]','[]','["cessao_total"]','["*"]'),

('confidencialidade','Confidencialidade','Confidencialidade',
 'As partes obrigam-se a manter sigilo sobre todas as informações confidenciais a que tiverem acesso em razão deste contrato, não as divulgando a terceiros sem autorização.',
 120, false, '[]','[]','[]','["*"]'),

('exclusividade','Exclusividade','Exclusividade',
 'Durante a vigência deste contrato, a CONTRATADA prestará os serviços com exclusividade à CONTRATANTE no segmento e território acordados.',
 121, false, '[]','[]','[]','["recorrente","servico"]'),

('deslocamento','Deslocamento','Deslocamento e Reembolso',
 'Despesas de deslocamento, hospedagem e alimentação fora da cidade de origem da CONTRATADA correrão por conta da CONTRATANTE, mediante apresentação de comprovantes.',
 122, false, '[]','[]','[]','["video","evento","servico"]'),

('subcontratacao','Subcontratação','Subcontratação',
 'A CONTRATADA poderá subcontratar terceiros para a execução de etapas específicas dos serviços, permanecendo responsável pela qualidade e prazo das entregas.',
 123, false, '[]','[]','[]','["*"]'),

('atraso_cliente','Prazo','Atraso por Falta de Retorno',
 'Os prazos serão automaticamente prorrogados pelo período em que a CONTRATADA permanecer aguardando informações, materiais ou aprovações de responsabilidade da CONTRATANTE.',
 91, false, '[]','[]','[]','["*"]'),

('taxa_alteracao_escopo','Escopo','Taxa por Alteração de Escopo',
 'Alterações solicitadas após o início dos trabalhos que impactem o escopo originalmente acordado serão objeto de aditivo, com revisão de prazo e valor.',
 92, false, '[]','[]','[]','["*"]'),

('entrega_urgente','Prazo','Entrega Urgente',
 'Entregas em regime de urgência, com prazo inferior ao padrão da CONTRATADA, estarão sujeitas a acréscimo no valor, previamente acordado entre as partes.',
 93, false, '[]','[]','[]','["*"]'),

('renovacao_automatica','Rescisão','Renovação Automática',
 'Este contrato renova-se automaticamente por períodos iguais e sucessivos, salvo manifestação por escrito de qualquer das partes com antecedência mínima de 30 (trinta) dias do término.',
 130, false, '[]','[]','[]','["recorrente"]'),

('prazo_minimo','Prazo','Prazo Mínimo de Contrato',
 'As partes acordam um prazo mínimo de vigência, durante o qual a rescisão imotivada sujeitará a parte que der causa ao pagamento das mensalidades remanescentes do período mínimo.',
 41, false, '[]','[]','[]','["recorrente"]')
on conflict (slug) do nothing;
