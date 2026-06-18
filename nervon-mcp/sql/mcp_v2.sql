-- ============================================================================
-- Nervon MCP v2 — novas ferramentas: financeiro, projetos, follow-ups, agenda
-- ============================================================================
-- Roda este arquivo inteiro no SQL Editor do Supabase (projeto smsqhbbbyjacatxvihks).
-- Mesmo padrão do mcp.sql: SECURITY DEFINER, valida o token via _mcp_empresa,
-- resolve a empresa e escreve já amarrado nela. Sem service role key.
-- ============================================================================

-- ─── FINANCEIRO ─────────────────────────────────────────────────────────────

-- Cria um lançamento (receita ou despesa).
create or replace function public.mcp_criar_lancamento(
  p_token_hash      text,
  p_tipo            text,            -- 'receita' | 'despesa'
  p_categoria       text,
  p_descricao       text,
  p_valor           numeric,
  p_vencimento      date,
  p_cliente         text default null,
  p_forma_pagamento text default null,
  p_observacoes     text default null,
  p_pago            boolean default false  -- já pago/recebido?
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

  v_pgto := case when p_pago then current_date else null end;
  v_status := case
    when p_pago and p_tipo = 'receita' then 'recebido'
    when p_pago then 'pago'
    when p_vencimento < current_date then 'atrasado'
    else 'previsto'
  end;

  insert into public.financeiro (empresa_id, tipo, categoria, descricao, valor, data, vencimento, pagamento_em, status, cliente, forma_pagamento, observacoes)
  values (v_empresa, p_tipo, coalesce(p_categoria,'Geral'), p_descricao, coalesce(p_valor,0), p_vencimento, p_vencimento, v_pgto, v_status, p_cliente, p_forma_pagamento, p_observacoes)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'lancamento_id', v_id, 'status', v_status, 'tipo', p_tipo, 'valor', coalesce(p_valor,0));
end;
$$;

-- Lista lançamentos (status recalculado igual o app). Filtros opcionais.
create or replace function public.mcp_listar_lancamentos(
  p_token_hash text,
  p_tipo       text default null,   -- 'receita' | 'despesa' | null
  p_status     text default null    -- 'previsto'|'recebido'|'pago'|'atrasado' | null
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
    select f.id, f.tipo, f.categoria, f.descricao, f.valor, f.vencimento, f.cliente,
           f.pagamento_em,
           case
             when f.pagamento_em is not null and f.tipo = 'receita' then 'recebido'
             when f.pagamento_em is not null then 'pago'
             when f.vencimento < current_date then 'atrasado'
             else 'previsto'
           end as status
      from public.financeiro f
     where f.empresa_id = v_empresa
       and (p_tipo is null or f.tipo = p_tipo)
  ) t
  where (p_status is null or t.status = p_status);

  return jsonb_build_object('ok', true, 'lancamentos', v_result);
end;
$$;

-- Marca um lançamento como pago/recebido (hoje).
create or replace function public.mcp_marcar_pago(
  p_token_hash   text,
  p_lancamento_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid;
  v_tipo    text;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  update public.financeiro
     set pagamento_em = current_date,
         status = case when tipo = 'receita' then 'recebido' else 'pago' end
   where id = p_lancamento_id and empresa_id = v_empresa
  returning tipo into v_tipo;

  if v_tipo is null then
    return jsonb_build_object('ok', false, 'erro', 'Lançamento não encontrado nesta empresa.');
  end if;
  return jsonb_build_object('ok', true, 'lancamento_id', p_lancamento_id, 'status', case when v_tipo='receita' then 'recebido' else 'pago' end);
end;
$$;

-- Resumo financeiro: a receber, a pagar, atrasados e saldo do mês.
create or replace function public.mcp_resumo_financeiro(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid;
  v_a_receber numeric;
  v_a_pagar   numeric;
  v_atrasado  numeric;
  v_receb_mes numeric;
  v_pago_mes  numeric;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  select
    coalesce(sum(valor) filter (where tipo='receita' and pagamento_em is null), 0),
    coalesce(sum(valor) filter (where tipo='despesa' and pagamento_em is null), 0),
    coalesce(sum(valor) filter (where pagamento_em is null and vencimento < current_date), 0),
    coalesce(sum(valor) filter (where tipo='receita' and pagamento_em is not null and date_trunc('month', pagamento_em) = date_trunc('month', current_date)), 0),
    coalesce(sum(valor) filter (where tipo='despesa' and pagamento_em is not null and date_trunc('month', pagamento_em) = date_trunc('month', current_date)), 0)
  into v_a_receber, v_a_pagar, v_atrasado, v_receb_mes, v_pago_mes
  from public.financeiro
  where empresa_id = v_empresa;

  return jsonb_build_object('ok', true,
    'a_receber', v_a_receber, 'a_pagar', v_a_pagar, 'atrasados', v_atrasado,
    'recebido_no_mes', v_receb_mes, 'pago_no_mes', v_pago_mes,
    'saldo_do_mes', v_receb_mes - v_pago_mes);
end;
$$;

-- ─── PROJETOS ───────────────────────────────────────────────────────────────

create or replace function public.mcp_criar_projeto(
  p_token_hash  text,
  p_nome        text,
  p_cliente     text,
  p_descricao   text default null,
  p_valor       numeric default 0,
  p_data_inicio date default null,
  p_data_entrega date default null
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

  insert into public.projetos (empresa_id, nome, cliente, descricao, fase, progresso, fases, equipe, data_inicio, data_entrega, valor, cor)
  values (
    v_empresa, p_nome, coalesce(p_cliente,'—'), p_descricao, 'briefing', 0,
    array['briefing','pre_producao','captacao','edicao','revisao','entrega','concluida'],
    array[]::text[],
    coalesce(p_data_inicio, current_date),
    coalesce(p_data_entrega, current_date + 30),
    coalesce(p_valor,0), 'primary'
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'projeto_id', v_id, 'nome', p_nome);
end;
$$;

create or replace function public.mcp_listar_projetos(p_token_hash text)
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
           'id', id, 'nome', nome, 'cliente', cliente, 'fase', fase,
           'progresso', progresso, 'valor', valor, 'data_entrega', data_entrega
         ) order by criado_em desc), '[]'::jsonb)
    into v_result
  from public.projetos where empresa_id = v_empresa;

  return jsonb_build_object('ok', true, 'projetos', v_result);
end;
$$;

-- ─── FOLLOW-UPS (tarefas de lead) ───────────────────────────────────────────

create or replace function public.mcp_criar_followup(
  p_token_hash  text,
  p_lead_id     uuid,
  p_titulo      text,
  p_prazo       date,
  p_responsavel text default 'Agente IA'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid;
  v_id      uuid;
  v_ok      int;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  -- garante que o lead é desta empresa
  select 1 into v_ok from public.leads where id = p_lead_id and empresa_id = v_empresa;
  if v_ok is null then
    return jsonb_build_object('ok', false, 'erro', 'Lead não encontrado nesta empresa.');
  end if;

  insert into public.tarefas_lead (empresa_id, lead_id, titulo, responsavel, prazo, feita)
  values (v_empresa, p_lead_id, p_titulo, coalesce(p_responsavel,'Agente IA'), p_prazo, false)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'followup_id', v_id, 'titulo', p_titulo, 'prazo', p_prazo);
end;
$$;

-- ─── AGENDA (eventos) ───────────────────────────────────────────────────────

create or replace function public.mcp_criar_evento(
  p_token_hash text,
  p_titulo     text,
  p_inicio     timestamptz,
  p_fim        timestamptz,
  p_descricao  text default null,
  p_tipo       text default 'reuniao',  -- reuniao|gravacao|entrega|tarefa|outro
  p_local      text default null
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

  if coalesce(p_tipo,'reuniao') not in ('reuniao','gravacao','entrega','tarefa','outro') then
    return jsonb_build_object('ok', false, 'erro', 'tipo inválido.');
  end if;

  insert into public.eventos (empresa_id, titulo, descricao, inicio, fim, dia_todo, tipo, local, participantes)
  values (v_empresa, p_titulo, p_descricao, p_inicio, p_fim, false, coalesce(p_tipo,'reuniao'), p_local, array[]::text[])
  returning id into v_id;

  return jsonb_build_object('ok', true, 'evento_id', v_id, 'titulo', p_titulo, 'inicio', p_inicio);
end;
$$;

create or replace function public.mcp_listar_eventos(
  p_token_hash text,
  p_de         timestamptz default null,
  p_ate        timestamptz default null
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
           'id', id, 'titulo', titulo, 'inicio', inicio, 'fim', fim,
           'tipo', tipo, 'local', local
         ) order by inicio), '[]'::jsonb)
    into v_result
  from public.eventos
  where empresa_id = v_empresa
    and (p_de  is null or inicio >= p_de)
    and (p_ate is null or inicio <= p_ate);

  return jsonb_build_object('ok', true, 'eventos', v_result);
end;
$$;

-- ─── PERMISSÕES (Worker usa a chave anon; as funções são o porteiro) ─────────
grant execute on function public.mcp_criar_lancamento(text,text,text,text,numeric,date,text,text,text,boolean) to anon, authenticated;
grant execute on function public.mcp_listar_lancamentos(text,text,text) to anon, authenticated;
grant execute on function public.mcp_marcar_pago(text,uuid) to anon, authenticated;
grant execute on function public.mcp_resumo_financeiro(text) to anon, authenticated;
grant execute on function public.mcp_criar_projeto(text,text,text,text,numeric,date,date) to anon, authenticated;
grant execute on function public.mcp_listar_projetos(text) to anon, authenticated;
grant execute on function public.mcp_criar_followup(text,uuid,text,date,text) to anon, authenticated;
grant execute on function public.mcp_criar_evento(text,text,timestamptz,timestamptz,text,text,text) to anon, authenticated;
grant execute on function public.mcp_listar_eventos(text,timestamptz,timestamptz) to anon, authenticated;
