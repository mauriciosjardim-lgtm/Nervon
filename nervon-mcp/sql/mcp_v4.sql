-- ============================================================================
-- Nervon MCP v4 — Carteiras + carteira_id em lançamentos
-- Projeto Supabase: smsqhbbbyjacatxvihks
-- ============================================================================
-- Roda TUDO no SQL Editor do Supabase.
-- Dropa as funções com assinatura antiga antes de recriar com os novos params.
-- ============================================================================

-- ─── Drop assinaturas antigas ────────────────────────────────────────────────

drop function if exists public.mcp_criar_lancamento(text,text,text,text,numeric,date,text,text,text,boolean);
drop function if exists public.mcp_atualizar_lancamento(text,uuid,text,numeric,text,date,text,text,text);
drop function if exists public.mcp_listar_lancamentos(text,text,text);

-- ─── mcp_criar_lancamento (agora aceita carteira_id) ─────────────────────────

create or replace function public.mcp_criar_lancamento(
  p_token_hash      text,
  p_tipo            text,
  p_categoria       text,
  p_descricao       text,
  p_valor           numeric,
  p_vencimento      date,
  p_cliente         text    default null,
  p_forma_pagamento text    default null,
  p_observacoes     text    default null,
  p_pago            boolean default false,
  p_carteira_id     uuid    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid;
  v_id      uuid;
  v_status  text;
  v_pgto    date;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  if p_tipo not in ('receita','despesa') then
    return jsonb_build_object('ok', false, 'erro', 'tipo deve ser "receita" ou "despesa".');
  end if;

  -- Valida carteira (se informada) pertence à mesma empresa
  if p_carteira_id is not null then
    if not exists (select 1 from public.carteiras where id = p_carteira_id and empresa_id = v_empresa) then
      return jsonb_build_object('ok', false, 'erro', 'Carteira não encontrada nesta empresa.');
    end if;
  end if;

  v_pgto := case when p_pago then current_date else null end;
  v_status := case
    when p_pago and p_tipo = 'receita' then 'recebido'
    when p_pago then 'pago'
    when p_vencimento < current_date then 'atrasado'
    else 'previsto'
  end;

  insert into public.financeiro (
    empresa_id, tipo, categoria, descricao, valor, data, vencimento,
    pagamento_em, status, cliente, forma_pagamento, observacoes, carteira_id
  )
  values (
    v_empresa, p_tipo, coalesce(p_categoria,'Geral'), p_descricao,
    coalesce(p_valor,0), p_vencimento, p_vencimento,
    v_pgto, v_status, p_cliente, p_forma_pagamento, p_observacoes, p_carteira_id
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true, 'lancamento_id', v_id, 'status', v_status,
    'tipo', p_tipo, 'valor', coalesce(p_valor,0), 'carteira_id', p_carteira_id
  );
end;
$$;

-- ─── mcp_listar_lancamentos (inclui carteira_id no output + filtro opcional) ──

create or replace function public.mcp_listar_lancamentos(
  p_token_hash  text,
  p_tipo        text  default null,
  p_status      text  default null,
  p_carteira_id uuid  default null
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

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.vencimento), '[]'::jsonb)
    into v_result
  from (
    select f.id, f.tipo, f.categoria, f.descricao, f.valor, f.vencimento,
           f.cliente, f.pagamento_em, f.carteira_id,
           case
             when f.pagamento_em is not null and f.tipo = 'receita' then 'recebido'
             when f.pagamento_em is not null then 'pago'
             when f.vencimento < current_date then 'atrasado'
             else 'previsto'
           end as status
      from public.financeiro f
     where f.empresa_id = v_empresa
       and (p_tipo is null or f.tipo = p_tipo)
       and (p_carteira_id is null or f.carteira_id = p_carteira_id)
  ) t
  where (p_status is null or t.status = p_status);

  return jsonb_build_object('ok', true, 'lancamentos', v_result);
end;
$$;

-- ─── mcp_atualizar_lancamento (agora aceita carteira_id) ─────────────────────

create or replace function public.mcp_atualizar_lancamento(
  p_token_hash      text,
  p_lancamento_id   uuid,
  p_descricao       text    default null,
  p_valor           numeric default null,
  p_categoria       text    default null,
  p_vencimento      date    default null,
  p_cliente         text    default null,
  p_forma_pagamento text    default null,
  p_observacoes     text    default null,
  p_carteira_id     uuid    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid;
  v_ok      int;
  v_venc    date;
  v_pgto    date;
  v_tipo    text;
  v_status  text;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  -- Valida carteira (se informada) pertence à mesma empresa
  if p_carteira_id is not null then
    if not exists (select 1 from public.carteiras where id = p_carteira_id and empresa_id = v_empresa) then
      return jsonb_build_object('ok', false, 'erro', 'Carteira não encontrada nesta empresa.');
    end if;
  end if;

  update public.financeiro
     set descricao       = coalesce(p_descricao, descricao),
         valor           = coalesce(p_valor, valor),
         categoria       = coalesce(p_categoria, categoria),
         vencimento      = coalesce(p_vencimento, vencimento),
         data            = coalesce(p_vencimento, data),
         cliente         = coalesce(p_cliente, cliente),
         forma_pagamento = coalesce(p_forma_pagamento, forma_pagamento),
         observacoes     = coalesce(p_observacoes, observacoes),
         carteira_id     = coalesce(p_carteira_id, carteira_id)
   where id = p_lancamento_id and empresa_id = v_empresa
  returning vencimento, pagamento_em, tipo into v_venc, v_pgto, v_tipo;
  get diagnostics v_ok = row_count;

  if v_ok = 0 then
    return jsonb_build_object('ok', false, 'erro', 'Lançamento não encontrado nesta empresa.');
  end if;

  v_status := case
    when v_pgto is not null and v_tipo = 'receita' then 'recebido'
    when v_pgto is not null then 'pago'
    when v_venc < current_date then 'atrasado'
    else 'previsto'
  end;
  update public.financeiro set status = v_status where id = p_lancamento_id and empresa_id = v_empresa;

  return jsonb_build_object('ok', true, 'lancamento_id', p_lancamento_id, 'status', v_status);
end;
$$;

-- ─── mcp_listar_carteiras ────────────────────────────────────────────────────

create or replace function public.mcp_listar_carteiras(
  p_token_hash text
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

  select coalesce(jsonb_agg(row_to_json(c)::jsonb order by c.nome), '[]'::jsonb)
    into v_result
  from (
    select id, nome, tipo, created_at
      from public.carteiras
     where empresa_id = v_empresa
  ) c;

  return jsonb_build_object('ok', true, 'carteiras', v_result);
end;
$$;

-- ─── mcp_criar_carteira ──────────────────────────────────────────────────────

create or replace function public.mcp_criar_carteira(
  p_token_hash text,
  p_nome       text,
  p_tipo       text default 'outro'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid;
  v_id      uuid;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  if p_tipo not in ('pj','pf','dinheiro','cartao','outro') then
    return jsonb_build_object('ok', false, 'erro', 'tipo deve ser: pj, pf, dinheiro, cartao ou outro.');
  end if;

  insert into public.carteiras (empresa_id, nome, tipo)
  values (v_empresa, p_nome, p_tipo)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'carteira_id', v_id, 'nome', p_nome, 'tipo', p_tipo);
end;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────

grant execute on function public.mcp_criar_lancamento(text,text,text,text,numeric,date,text,text,text,boolean,uuid)   to anon, authenticated;
grant execute on function public.mcp_listar_lancamentos(text,text,text,uuid)                                          to anon, authenticated;
grant execute on function public.mcp_atualizar_lancamento(text,uuid,text,numeric,text,date,text,text,text,uuid)       to anon, authenticated;
grant execute on function public.mcp_listar_carteiras(text)                                                           to anon, authenticated;
grant execute on function public.mcp_criar_carteira(text,text,text)                                                   to anon, authenticated;
