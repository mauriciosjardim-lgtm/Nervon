-- Módulo Comercial — CRM de leads
-- Execute no Supabase: SQL Editor → New query → Run

-- ─── Clientes (empresas clientes, diferente da tabela "empresas" do tenant) ──
create table if not exists clientes_comercial (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references empresas(id) on delete cascade,
  nome         text not null,
  segmento     text not null default '',
  cidade       text not null default '',
  site         text,
  instagram    text,
  observacoes  text,
  criado_em    timestamptz default now()
);

-- ─── Contatos ────────────────────────────────────────────────────────────────
create table if not exists contatos_comercial (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  cliente_id  uuid not null references clientes_comercial(id) on delete cascade,
  nome        text not null,
  cargo       text not null default '—',
  email       text not null default '—',
  telefone    text not null default '—',
  principal   boolean default false,
  criado_em   timestamptz default now()
);

-- ─── Leads ───────────────────────────────────────────────────────────────────
create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references empresas(id) on delete cascade,
  cliente_id    uuid not null references clientes_comercial(id),
  contato_id    uuid not null references contatos_comercial(id),
  etapa         text not null default 'novo'
                  check (etapa in ('novo','diagnostico','reuniao','proposta','negociacao','fechado','perdido')),
  valor         numeric(12,2) not null default 0,
  responsavel   text not null default 'Você',
  temperatura   text not null default 'morno'
                  check (temperatura in ('frio','morno','quente')),
  origem        text not null default '',
  proxima_acao  jsonb,
  observacoes   text,
  criado_em     timestamptz default now()
);

-- ─── Timeline de leads ───────────────────────────────────────────────────────
create table if not exists timeline_lead (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  lead_id     uuid not null references leads(id) on delete cascade,
  tipo        text not null
                check (tipo in ('criado','ligacao','reuniao','whatsapp','email',
                                'proposta_enviada','observacao','etapa_mudou','fechado','perdido')),
  titulo      text not null,
  descricao   text,
  quando      timestamptz not null default now(),
  autor       text not null default 'Você'
);

-- ─── Tarefas de leads ────────────────────────────────────────────────────────
create table if not exists tarefas_lead (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  lead_id     uuid not null references leads(id) on delete cascade,
  titulo      text not null,
  responsavel text not null default 'Você',
  prazo       timestamptz not null,
  feita       boolean default false,
  criado_em   timestamptz default now()
);

-- ─── RLS em todas ────────────────────────────────────────────────────────────
alter table clientes_comercial enable row level security;
alter table contatos_comercial  enable row level security;
alter table leads               enable row level security;
alter table timeline_lead       enable row level security;
alter table tarefas_lead        enable row level security;

create policy "cc_select"  on clientes_comercial for select  using  (empresa_id = minha_empresa_id());
create policy "cc_insert"  on clientes_comercial for insert  with check (empresa_id = minha_empresa_id());
create policy "cc_update"  on clientes_comercial for update  using  (empresa_id = minha_empresa_id());
create policy "cc_delete"  on clientes_comercial for delete  using  (empresa_id = minha_empresa_id());

create policy "cco_select" on contatos_comercial  for select  using  (empresa_id = minha_empresa_id());
create policy "cco_insert" on contatos_comercial  for insert  with check (empresa_id = minha_empresa_id());
create policy "cco_update" on contatos_comercial  for update  using  (empresa_id = minha_empresa_id());
create policy "cco_delete" on contatos_comercial  for delete  using  (empresa_id = minha_empresa_id());

create policy "leads_select" on leads for select  using  (empresa_id = minha_empresa_id());
create policy "leads_insert" on leads for insert  with check (empresa_id = minha_empresa_id());
create policy "leads_update" on leads for update  using  (empresa_id = minha_empresa_id());
create policy "leads_delete" on leads for delete  using  (empresa_id = minha_empresa_id());

create policy "tl_select" on timeline_lead for select  using  (empresa_id = minha_empresa_id());
create policy "tl_insert" on timeline_lead for insert  with check (empresa_id = minha_empresa_id());
create policy "tl_update" on timeline_lead for update  using  (empresa_id = minha_empresa_id());
create policy "tl_delete" on timeline_lead for delete  using  (empresa_id = minha_empresa_id());

create policy "tal_select" on tarefas_lead for select  using  (empresa_id = minha_empresa_id());
create policy "tal_insert" on tarefas_lead for insert  with check (empresa_id = minha_empresa_id());
create policy "tal_update" on tarefas_lead for update  using  (empresa_id = minha_empresa_id());
create policy "tal_delete" on tarefas_lead for delete  using  (empresa_id = minha_empresa_id());
