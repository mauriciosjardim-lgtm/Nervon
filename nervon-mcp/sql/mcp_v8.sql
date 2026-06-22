-- ============================================================================
-- Nervon MCP v8 — criar_lancamento passa a gravar projeto_id
-- Projeto Supabase: smsqhbbbyjacatxvihks
-- Idempotente (create or replace + grant). NÃO apaga dados.
-- Adiciona p_projeto_id (default null) com mesma validação por empresa da carteira.
-- ============================================================================

-- Remove a assinatura antiga (11 args, sem projeto_id) pra não virar sobrecarga ambígua
drop function if exists public.mcp_criar_lancamento(text, text, text, text, numeric, date, text, text, text, boolean, uuid);

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
  p_carteira_id     uuid    default null,
  p_projeto_id      uuid    default null
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

  -- Valida projeto (se informado) pertence à mesma empresa
  if p_projeto_id is not null then
    if not exists (select 1 from public.projetos where id = p_projeto_id and empresa_id = v_empresa) then
      return jsonb_build_object('ok', false, 'erro', 'Projeto não encontrado nesta empresa.');
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
    pagamento_em, status, cliente, forma_pagamento, observacoes, carteira_id, projeto_id
  )
  values (
    v_empresa, p_tipo, coalesce(p_categoria,'Geral'), p_descricao,
    coalesce(p_valor,0), p_vencimento, p_vencimento,
    v_pgto, v_status, p_cliente, p_forma_pagamento, p_observacoes, p_carteira_id, p_projeto_id
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true, 'lancamento_id', v_id, 'status', v_status,
    'tipo', p_tipo, 'valor', coalesce(p_valor,0),
    'carteira_id', p_carteira_id, 'projeto_id', p_projeto_id
  );
end;
$$;

grant execute on function public.mcp_criar_lancamento(text, text, text, text, numeric, date, text, text, text, boolean, uuid, uuid) to anon, authenticated;
