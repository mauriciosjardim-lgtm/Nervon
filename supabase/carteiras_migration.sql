-- Carteiras (contas bancárias, pessoal, empresa)
-- Execute no Supabase: SQL Editor → New query → Run

-- 1. Tabela carteiras
create table if not exists carteiras (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome       text not null,
  tipo       text not null default 'outro'
             check (tipo in ('pj', 'pf', 'dinheiro', 'cartao', 'outro')),
  created_at timestamptz not null default now()
);

create index if not exists carteiras_empresa_idx on carteiras (empresa_id);

alter table carteiras enable row level security;

create policy "mesma_empresa" on carteiras
  for all using (empresa_id = minha_empresa_id());

-- 2. FK em financeiro
alter table financeiro
  add column if not exists carteira_id uuid references carteiras(id) on delete set null;
