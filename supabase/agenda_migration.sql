-- Módulo Agenda — tabela de eventos
-- Execute no Supabase: SQL Editor → New query → Run

create table if not exists eventos (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references empresas(id) on delete cascade,
  titulo         text not null,
  descricao      text,
  inicio         timestamptz not null,
  fim            timestamptz not null,
  dia_todo       boolean default false,
  tipo           text not null default 'outro'
                   check (tipo in ('reuniao','gravacao','entrega','tarefa','outro')),
  local          text,
  participantes  text[] default '{}',
  ref_tipo       text check (ref_tipo in ('projeto','tarefa','marco')),
  ref_id         uuid,
  criado_em      timestamptz default now()
);

alter table eventos enable row level security;

create policy "eventos_select"  on eventos for select  using  (empresa_id = minha_empresa_id());
create policy "eventos_insert"  on eventos for insert  with check (empresa_id = minha_empresa_id());
create policy "eventos_update"  on eventos for update  using  (empresa_id = minha_empresa_id());
create policy "eventos_delete"  on eventos for delete  using  (empresa_id = minha_empresa_id());
