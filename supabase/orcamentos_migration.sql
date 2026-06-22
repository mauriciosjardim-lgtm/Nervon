-- Orçamentos e configurações da produtora
-- Migra orçamentos (antes só em memória) e tabela de preços/metas (antes no localStorage)

-- Orçamentos salvos
create table if not exists orcamentos (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references empresas(id) on delete cascade not null,
  tipo text not null,
  geral jsonb not null default '{}',
  producao jsonb not null default '{}',
  pos jsonb not null default '{}',
  extras jsonb not null default '{}',
  margem numeric not null default 40,
  calculo jsonb not null default '{}',
  criado_em timestamptz default now()
);

alter table orcamentos enable row level security;

create policy "orcamentos_empresa" on orcamentos
  using (empresa_id = minha_empresa_id())
  with check (empresa_id = minha_empresa_id());

-- Templates de orçamento
create table if not exists orcamento_templates (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references empresas(id) on delete cascade not null,
  nome text not null,
  tipo text not null,
  payload jsonb not null default '{}',
  criado_em timestamptz default now()
);

alter table orcamento_templates enable row level security;

create policy "templates_empresa" on orcamento_templates
  using (empresa_id = minha_empresa_id())
  with check (empresa_id = minha_empresa_id());

-- Tabela de custos e metas na empresa
alter table empresas
  add column if not exists custos_tabela jsonb,
  add column if not exists meta_mensal numeric default 100000,
  add column if not exists meta_super numeric default 150000;
