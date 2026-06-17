-- ============================================================================
-- Nervon MCP — tokens de acesso + funções para o agente IA externo
-- ============================================================================
-- Roda este arquivo inteiro no SQL Editor do Supabase (projeto smsqhbbbyjacatxvihks).
--
-- Arquitetura de segurança:
--   * O app gera um token "nvn_<aleatório>" e guarda APENAS o hash SHA-256 dele.
--     O token em texto puro só aparece uma vez, no momento da criação (igual GitHub).
--   * O Worker (Cloudflare) NÃO usa service role key. Ele recebe o token, calcula
--     o hash e chama as funções abaixo passando o hash. As funções são
--     SECURITY DEFINER: validam o token, resolvem a empresa e fazem tudo já
--     "amarrado" naquela empresa. Sem token válido, nada acontece.
--   * Por isso podemos dar EXECUTE para o papel `anon` (a chave pública do Worker):
--     a função em si é o porteiro.
-- ============================================================================

-- 1. Tabela de tokens -------------------------------------------------------
create table if not exists public.mcp_tokens (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  nome        text not null default 'Agente IA',
  token_hash  text not null unique,
  criado_em   timestamptz not null default now(),
  ultimo_uso  timestamptz,
  revogado    boolean not null default false
);

create index if not exists mcp_tokens_empresa_idx on public.mcp_tokens(empresa_id);
create index if not exists mcp_tokens_hash_idx on public.mcp_tokens(token_hash);

alter table public.mcp_tokens enable row level security;

-- O app (usuário logado) gerencia os tokens da própria empresa.
drop policy if exists mcp_tokens_select on public.mcp_tokens;
create policy mcp_tokens_select on public.mcp_tokens
  for select using (empresa_id = public.minha_empresa_id());

drop policy if exists mcp_tokens_insert on public.mcp_tokens;
create policy mcp_tokens_insert on public.mcp_tokens
  for insert with check (empresa_id = public.minha_empresa_id());

drop policy if exists mcp_tokens_update on public.mcp_tokens;
create policy mcp_tokens_update on public.mcp_tokens
  for update using (empresa_id = public.minha_empresa_id());

drop policy if exists mcp_tokens_delete on public.mcp_tokens;
create policy mcp_tokens_delete on public.mcp_tokens
  for delete using (empresa_id = public.minha_empresa_id());

-- 2. Helper interno: resolve a empresa a partir do hash do token ------------
-- Atualiza ultimo_uso e devolve o empresa_id (ou null se token inválido/revogado).
create or replace function public._mcp_empresa(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid;
begin
  update public.mcp_tokens
     set ultimo_uso = now()
   where token_hash = p_token_hash
     and revogado = false
  returning empresa_id into v_empresa;
  return v_empresa;
end;
$$;

-- 3. Tool: criar_lead -------------------------------------------------------
create or replace function public.mcp_criar_lead(
  p_token_hash text,
  p_empresa     text,
  p_contato     text,
  p_email       text default null,
  p_telefone    text default null,
  p_valor       numeric default 0,
  p_origem      text default 'Agente IA',
  p_temperatura text default 'morno',
  p_segmento    text default null,
  p_cidade      text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid;
  v_cliente uuid;
  v_contato uuid;
  v_lead    uuid;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  insert into public.clientes_comercial (empresa_id, nome, segmento, cidade)
  values (v_empresa, p_empresa, coalesce(p_segmento, 'Não informado'), coalesce(p_cidade, 'Não informado'))
  returning id into v_cliente;

  insert into public.contatos_comercial (empresa_id, cliente_id, nome, cargo, email, telefone, principal)
  values (v_empresa, v_cliente, p_contato, '—', coalesce(p_email, '—'), coalesce(p_telefone, '—'), true)
  returning id into v_contato;

  insert into public.leads (empresa_id, cliente_id, contato_id, etapa, valor, responsavel, temperatura, origem)
  values (
    v_empresa, v_cliente, v_contato, 'novo', coalesce(p_valor, 0), 'Agente IA',
    (case when p_temperatura in ('frio','morno','quente') then p_temperatura else 'morno' end),
    coalesce(p_origem, 'Agente IA')
  )
  returning id into v_lead;

  insert into public.timeline_lead (empresa_id, lead_id, tipo, titulo, descricao, quando, autor)
  values (v_empresa, v_lead, 'criado', 'Lead criado pelo agente IA', p_empresa, now(), 'Agente IA');

  return jsonb_build_object('ok', true, 'lead_id', v_lead, 'cliente', p_empresa, 'contato', p_contato);
end;
$$;

-- 4. Tool: listar_leads -----------------------------------------------------
create or replace function public.mcp_listar_leads(
  p_token_hash text,
  p_etapa      text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid;
  v_result  jsonb;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', l.id,
           'cliente', c.nome,
           'contato', ct.nome,
           'etapa', l.etapa,
           'valor', l.valor,
           'temperatura', l.temperatura,
           'origem', l.origem
         ) order by l.criado_em desc), '[]'::jsonb)
    into v_result
    from public.leads l
    join public.clientes_comercial c on c.id = l.cliente_id
    left join public.contatos_comercial ct on ct.id = l.contato_id
   where l.empresa_id = v_empresa
     and (p_etapa is null or l.etapa::text = p_etapa);

  return jsonb_build_object('ok', true, 'leads', v_result);
end;
$$;

-- 5. Tool: mover_etapa ------------------------------------------------------
create or replace function public.mcp_mover_etapa(
  p_token_hash text,
  p_lead_id    uuid,
  p_etapa      text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid;
  v_ok      int;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  if p_etapa not in ('novo','diagnostico','reuniao','proposta','negociacao','fechado','perdido') then
    return jsonb_build_object('ok', false, 'erro', 'Etapa inválida: ' || p_etapa);
  end if;

  update public.leads
     set etapa = p_etapa
   where id = p_lead_id
     and empresa_id = v_empresa;
  get diagnostics v_ok = row_count;

  if v_ok = 0 then
    return jsonb_build_object('ok', false, 'erro', 'Lead não encontrado nesta empresa.');
  end if;

  insert into public.timeline_lead (empresa_id, lead_id, tipo, titulo, descricao, quando, autor)
  values (v_empresa, p_lead_id, 'etapa_mudou', 'Etapa alterada pelo agente IA', 'Nova etapa: ' || p_etapa, now(), 'Agente IA');

  return jsonb_build_object('ok', true, 'lead_id', p_lead_id, 'etapa', p_etapa);
end;
$$;

-- 6. Permissões: o Worker usa a chave anon (pública) ------------------------
-- As funções são o porteiro (validam o token), então é seguro liberá-las.
grant execute on function public.mcp_criar_lead(text,text,text,text,text,numeric,text,text,text,text) to anon, authenticated;
grant execute on function public.mcp_listar_leads(text,text) to anon, authenticated;
grant execute on function public.mcp_mover_etapa(text,uuid,text) to anon, authenticated;
-- o helper interno NÃO é liberado para anon de propósito.
revoke execute on function public._mcp_empresa(text) from anon, authenticated;
