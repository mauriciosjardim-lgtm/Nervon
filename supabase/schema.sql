-- MAKERShub — Schema completo
-- Execute no Supabase: SQL Editor → New query → Cole tudo → Run

-- ============================================================
-- EXTENSÕES
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- EMPRESAS (tenant raiz — multi-tenancy por empresa_id)
-- ============================================================
create table empresas (
  id            uuid primary key default uuid_generate_v4(),
  nome          text not null,
  logo_url      text,
  accent_color  text default 'oklch(0.88 0.22 130)',
  criado_em     timestamptz default now(),
  trial_expires_at timestamptz default (now() + interval '7 days')
);

-- ============================================================
-- USUARIOS (vinculados ao auth.users do Supabase)
-- ============================================================
create table usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  empresa_id  uuid not null references empresas(id) on delete cascade,
  nome        text not null,
  email       text not null,
  cargo       text,
  criado_em   timestamptz default now()
);

-- ============================================================
-- CLIENTES
-- ============================================================
create table clientes (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  nome        text not null,
  email       text,
  telefone    text,
  empresa     text,
  status      text not null default 'lead'
              check (status in ('lead','contato','proposta','cliente','inativo')),
  notas       text,
  criado_em   timestamptz default now()
);

-- ============================================================
-- PROJETOS
-- ============================================================
create table projetos (
  id            uuid primary key default uuid_generate_v4(),
  empresa_id    uuid not null references empresas(id) on delete cascade,
  nome          text not null,
  cliente       text not null,
  descricao     text,
  fase          text not null default 'briefing'
                check (fase in ('briefing','pre','captacao','edicao','revisao','entrega','concluido','pausado')),
  progresso     int not null default 0 check (progresso between 0 and 100),
  fases         text[] not null default array['briefing','pre_producao','captacao','edicao','revisao','entrega','concluida'],
  equipe        text[] not null default '{}',
  data_inicio   date not null,
  data_entrega  date not null,
  valor         numeric(12,2) not null default 0,
  cor           text not null default 'primary',
  notas         text,
  criado_em     timestamptz default now()
);

-- ============================================================
-- TAREFAS
-- ============================================================
create table tarefas (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  projeto_id  uuid not null references projetos(id) on delete cascade,
  titulo      text not null,
  descricao   text,
  status      text not null default 'briefing',
  concluida   boolean not null default false,
  responsavel text not null default 'Você',
  prazo       timestamptz,
  prioridade  text not null default 'media'
              check (prioridade in ('baixa','media','alta','urgente')),
  criado_em   timestamptz default now()
);

-- ============================================================
-- MARCOS
-- ============================================================
create table marcos (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  projeto_id  uuid not null references projetos(id) on delete cascade,
  titulo      text not null,
  data        date not null,
  status      text not null default 'pendente'
              check (status in ('pendente','concluido','atrasado')),
  criado_em   timestamptz default now()
);

-- ============================================================
-- ENTREGAVEIS
-- ============================================================
create table entregaveis (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  projeto_id  uuid not null references projetos(id) on delete cascade,
  titulo      text not null,
  tipo        text not null default 'video'
              check (tipo in ('video','foto','documento','audio','outro')),
  status      text not null default 'pendente'
              check (status in ('pendente','em_producao','revisao','aprovado','entregue')),
  link        text,
  notas       text,
  criado_em   timestamptz default now()
);

-- ============================================================
-- FINANCEIRO
-- ============================================================
create table financeiro (
  id          uuid primary key default uuid_generate_v4(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  projeto_id  uuid references projetos(id) on delete set null,
  tipo        text not null check (tipo in ('receita','despesa')),
  categoria   text not null,
  descricao   text not null,
  valor       numeric(12,2) not null,
  data        date not null,
  status      text not null default 'pendente'
              check (status in ('pendente','pago','cancelado')),
  criado_em   timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on clientes    (empresa_id);
create index on projetos    (empresa_id);
create index on tarefas     (empresa_id);
create index on tarefas     (projeto_id);
create index on marcos      (empresa_id);
create index on marcos      (projeto_id);
create index on entregaveis (empresa_id);
create index on entregaveis (projeto_id);
create index on financeiro  (empresa_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: retorna o empresa_id do usuário logado
create or replace function minha_empresa_id()
returns uuid language sql stable security definer as $$
  select empresa_id from usuarios where id = auth.uid()
$$;

-- Habilita RLS em todas as tabelas
alter table empresas    enable row level security;
alter table usuarios    enable row level security;
alter table clientes    enable row level security;
alter table projetos    enable row level security;
alter table tarefas     enable row level security;
alter table marcos      enable row level security;
alter table entregaveis enable row level security;
alter table financeiro  enable row level security;

-- EMPRESAS: usuário vê apenas a sua empresa
create policy "empresa_propria" on empresas
  for all using (id = minha_empresa_id());

-- USUARIOS: vê apenas colegas da mesma empresa
create policy "mesma_empresa" on usuarios
  for all using (empresa_id = minha_empresa_id());

-- CLIENTES
create policy "mesma_empresa" on clientes
  for all using (empresa_id = minha_empresa_id());

-- PROJETOS
create policy "mesma_empresa" on projetos
  for all using (empresa_id = minha_empresa_id());

-- TAREFAS
create policy "mesma_empresa" on tarefas
  for all using (empresa_id = minha_empresa_id());

-- MARCOS
create policy "mesma_empresa" on marcos
  for all using (empresa_id = minha_empresa_id());

-- ENTREGAVEIS
create policy "mesma_empresa" on entregaveis
  for all using (empresa_id = minha_empresa_id());

-- FINANCEIRO
create policy "mesma_empresa" on financeiro
  for all using (empresa_id = minha_empresa_id());

-- ============================================================
-- STORAGE — bucket para logos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict do nothing;

create policy "logos_publicos" on storage.objects
  for select using (bucket_id = 'logos');

create policy "upload_proprio_logo" on storage.objects
  for insert with check (
    bucket_id = 'logos' and auth.uid() is not null
  );
