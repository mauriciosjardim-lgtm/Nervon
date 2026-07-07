-- MakersHub — módulo de propostas
-- Adaptado ao tenant real: empresas / usuarios / empresa_id / minha_empresa_id().

create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  orcamento_id uuid references public.orcamentos(id) on delete set null,
  numero bigint not null,
  ano integer not null default extract(year from current_date)::integer,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'enviada', 'aceita', 'recusada')),
  cliente_nome text not null default '',
  cliente_empresa text,
  titulo_projeto text not null default '',
  rascunho jsonb not null default '{}'::jsonb,
  conteudo_enviado jsonb,
  slug text unique,
  link_ativo boolean not null default false,
  accent_key text not null default 'lime',
  accent_hex text,
  expira_em date,
  enviada_em timestamptz,
  visualizacoes integer not null default 0,
  primeira_abertura timestamptz,
  ultima_abertura timestamptz,
  ultima_visualizacao_contada_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, ano, numero),
  check (accent_hex is null or accent_hex ~ '^#[0-9A-Fa-f]{6}$')
);

create index if not exists propostas_empresa_idx on public.propostas(empresa_id);
create index if not exists propostas_slug_idx on public.propostas(slug);
create index if not exists propostas_lead_idx on public.propostas(lead_id);

create table if not exists public.proposta_itens (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.propostas(id) on delete cascade,
  pacote text,
  chave text not null,
  descricao text not null,
  detalhe text,
  quantidade numeric not null default 1,
  valor_unit numeric(12,2) not null default 0,
  ordem integer not null default 0
);

create table if not exists public.proposta_pacotes (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.propostas(id) on delete cascade,
  nome text not null,
  descricao text,
  valor numeric(12,2) not null default 0,
  destaque boolean not null default false,
  ordem integer not null default 0
);

alter table public.propostas enable row level security;
alter table public.proposta_itens enable row level security;
alter table public.proposta_pacotes enable row level security;

drop policy if exists propostas_empresa on public.propostas;
create policy propostas_empresa on public.propostas
  for all using (empresa_id = public.minha_empresa_id())
  with check (empresa_id = public.minha_empresa_id());

drop policy if exists proposta_itens_empresa on public.proposta_itens;
create policy proposta_itens_empresa on public.proposta_itens
  for all using (
    exists (select 1 from public.propostas p
      where p.id = proposta_id and p.empresa_id = public.minha_empresa_id())
  )
  with check (
    exists (select 1 from public.propostas p
      where p.id = proposta_id and p.empresa_id = public.minha_empresa_id())
  );

drop policy if exists proposta_pacotes_empresa on public.proposta_pacotes;
create policy proposta_pacotes_empresa on public.proposta_pacotes
  for all using (
    exists (select 1 from public.propostas p
      where p.id = proposta_id and p.empresa_id = public.minha_empresa_id())
  )
  with check (
    exists (select 1 from public.propostas p
      where p.id = proposta_id and p.empresa_id = public.minha_empresa_id())
  );

create or replace function public.proxima_proposta_numero(p_empresa_id uuid, p_ano integer)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_numero bigint;
begin
  if p_empresa_id <> public.minha_empresa_id() then
    raise exception 'Acesso negado';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_empresa_id::text || ':' || p_ano::text, 0));
  select coalesce(max(numero), 0) + 1 into v_numero
    from public.propostas where empresa_id = p_empresa_id and ano = p_ano;
  return v_numero;
end;
$$;

create or replace function public.publicar_proposta(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_slug text;
begin
  update public.propostas p
     set status = 'enviada',
         enviada_em = now(),
         link_ativo = true,
         slug = coalesce(p.slug, lower(format(
           'prop-%s-%s-%s', p.ano, lpad(p.numero::text, 3, '0'),
           substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)
         ))),
         conteudo_enviado = coalesce(p.rascunho, '{}'::jsonb)
           || jsonb_build_object(
             'numero', p.numero,
             'ano', p.ano,
             'enviada_em', now(),
             'organizacao_nome', e.nome,
             'organizacao_tagline', '',
             'cliente_nome', p.cliente_nome,
             'cliente_empresa', p.cliente_empresa,
             'titulo_projeto', p.titulo_projeto,
             'accent_key', p.accent_key,
             'accent_hex', p.accent_hex,
             'expira_em', p.expira_em,
             'itens', coalesce((
               select jsonb_agg(to_jsonb(i) - 'id' - 'proposta_id' order by i.ordem)
               from public.proposta_itens i where i.proposta_id = p.id
             ), '[]'::jsonb),
             'pacotes', coalesce((
               select jsonb_agg(to_jsonb(k) - 'id' - 'proposta_id' order by k.ordem)
               from public.proposta_pacotes k where k.proposta_id = p.id
             ), '[]'::jsonb)
           ),
         atualizado_em = now()
    from public.empresas e
   where p.id = p_id
     and e.id = p.empresa_id
     and p.empresa_id = public.minha_empresa_id()
  returning p.slug into v_slug;
  return v_slug;
end;
$$;

create or replace function public.proposta_publica(p_slug text)
returns jsonb
language plpgsql
security definer
volatile
set search_path = public, pg_temp
as $$
declare v_resultado jsonb;
begin
  update public.propostas
     set visualizacoes = visualizacoes + case
           when ultima_visualizacao_contada_em is null
             or ultima_visualizacao_contada_em < now() - interval '30 minutes'
           then 1 else 0 end,
         ultima_visualizacao_contada_em = case
           when ultima_visualizacao_contada_em is null
             or ultima_visualizacao_contada_em < now() - interval '30 minutes'
           then now() else ultima_visualizacao_contada_em end,
         primeira_abertura = coalesce(primeira_abertura, now()),
         ultima_abertura = now()
   where slug = lower(trim(p_slug))
     and link_ativo
     and status <> 'rascunho'
     and conteudo_enviado is not null
  returning conteudo_enviado || jsonb_build_object(
    'expirada', expira_em is not null and expira_em < current_date
  ) into v_resultado;
  return v_resultado;
end;
$$;

revoke all on function public.proxima_proposta_numero(uuid, integer) from public;
revoke all on function public.publicar_proposta(uuid) from public;
revoke all on function public.proposta_publica(text) from public;
grant execute on function public.proxima_proposta_numero(uuid, integer) to authenticated;
grant execute on function public.publicar_proposta(uuid) to authenticated;
grant execute on function public.proposta_publica(text) to anon, authenticated;
