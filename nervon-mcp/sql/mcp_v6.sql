-- ============================================================================
-- Nervon MCP v6 — resumo por carteira + excluir carteira
-- Projeto Supabase: smsqhbbbyjacatxvihks
-- Idempotente (apenas create or replace + grants). NÃO apaga dados.
-- ============================================================================

-- ─── mcp_resumo_financeiro (agora com escopo de carteira) ────────────────────
-- p_carteira:
--   null            → EMPRESA (lançamentos sem carteira) — bate com o cockpit/app
--   'todas'         → todas as carteiras + empresa (total geral)
--   uuid ou nome    → uma carteira específica (resolve por id ou nome)

create or replace function public.mcp_resumo_financeiro(
  p_token_hash text,
  p_carteira   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa     uuid;
  v_carteira_id uuid;
  v_todas       boolean := false;
  v_escopo      text;
  v_a_receber   numeric;
  v_a_pagar     numeric;
  v_atrasado    numeric;
  v_receb_mes   numeric;
  v_pago_mes    numeric;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  -- Resolve o escopo
  if p_carteira is null then
    v_escopo := 'empresa';
  elsif lower(trim(p_carteira)) in ('todas', 'todos', 'tudo', 'all', 'geral') then
    v_todas := true;
    v_escopo := 'todas as carteiras';
  else
    begin
      v_carteira_id := p_carteira::uuid;
      if not exists (select 1 from public.carteiras where id = v_carteira_id and empresa_id = v_empresa) then
        return jsonb_build_object('ok', false, 'erro', 'Carteira não encontrada nesta empresa.');
      end if;
    exception when invalid_text_representation then
      select id into v_carteira_id
        from public.carteiras
       where empresa_id = v_empresa and lower(trim(nome)) = lower(trim(p_carteira))
       limit 1;
      if v_carteira_id is null then
        return jsonb_build_object('ok', false, 'erro', 'Carteira "' || p_carteira || '" não encontrada.');
      end if;
    end;
    select nome into v_escopo from public.carteiras where id = v_carteira_id;
  end if;

  select
    coalesce(sum(valor) filter (where tipo='receita' and pagamento_em is null), 0),
    coalesce(sum(valor) filter (where tipo='despesa' and pagamento_em is null), 0),
    coalesce(sum(valor) filter (where pagamento_em is null and vencimento < current_date), 0),
    coalesce(sum(valor) filter (where tipo='receita' and pagamento_em is not null and date_trunc('month', pagamento_em) = date_trunc('month', current_date)), 0),
    coalesce(sum(valor) filter (where tipo='despesa' and pagamento_em is not null and date_trunc('month', pagamento_em) = date_trunc('month', current_date)), 0)
  into v_a_receber, v_a_pagar, v_atrasado, v_receb_mes, v_pago_mes
  from public.financeiro
  where empresa_id = v_empresa
    and (
      v_todas
      or (p_carteira is null and carteira_id is null)
      or (v_carteira_id is not null and carteira_id = v_carteira_id)
    );

  return jsonb_build_object('ok', true,
    'escopo', v_escopo,
    'a_receber', v_a_receber, 'a_pagar', v_a_pagar, 'atrasados', v_atrasado,
    'recebido_no_mes', v_receb_mes, 'pago_no_mes', v_pago_mes,
    'saldo_do_mes', v_receb_mes - v_pago_mes);
end;
$$;

-- ─── mcp_excluir_carteira ────────────────────────────────────────────────────
-- Exclui uma carteira. Os lançamentos vinculados voltam para a empresa
-- (carteira_id → null) automaticamente via FK ON DELETE SET NULL.

create or replace function public.mcp_excluir_carteira(
  p_token_hash  text,
  p_carteira_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa   uuid;
  v_nome      text;
  v_afetados  int;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  select nome into v_nome
    from public.carteiras
   where id = p_carteira_id and empresa_id = v_empresa;
  if v_nome is null then
    return jsonb_build_object('ok', false, 'erro', 'Carteira não encontrada nesta empresa.');
  end if;

  select count(*) into v_afetados
    from public.financeiro
   where carteira_id = p_carteira_id and empresa_id = v_empresa;

  delete from public.carteiras where id = p_carteira_id and empresa_id = v_empresa;

  return jsonb_build_object('ok', true, 'nome', v_nome, 'lancamentos_movidos', v_afetados);
end;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────
grant execute on function public.mcp_resumo_financeiro(text, text) to anon, authenticated;
grant execute on function public.mcp_excluir_carteira(text, uuid)   to anon, authenticated;
