-- ============================================================================
-- Nervon MCP v5 — Importação em lote + cenário demo financeiro
-- Projeto Supabase: smsqhbbbyjacatxvihks
-- ============================================================================

-- ─── mcp_importar_lancamentos ────────────────────────────────────────────────
-- Importa N lançamentos de uma vez. Campos por item:
--   tipo (receita|despesa), descricao, valor, vencimento (YYYY-MM-DD)
--   categoria?, carteira? (nome OU uuid), cliente?, pago? (bool)

create or replace function public.mcp_importar_lancamentos(
  p_token_hash  text,
  p_lancamentos jsonb  -- array de objetos
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa     uuid;
  item          jsonb;
  v_carteira_id uuid;
  v_tipo        text;
  v_vencimento  date;
  v_pago        boolean;
  v_pgto        date;
  v_status      text;
  v_inseridos   int := 0;
  v_erros       jsonb := '[]'::jsonb;
  v_idx         int := 0;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  if jsonb_typeof(p_lancamentos) <> 'array' then
    return jsonb_build_object('ok', false, 'erro', 'lancamentos deve ser um array JSON.');
  end if;

  for item in select * from jsonb_array_elements(p_lancamentos) loop
    v_idx := v_idx + 1;
    begin
      -- Validações obrigatórias
      v_tipo := lower(trim(item->>'tipo'));
      if v_tipo not in ('receita','despesa') then
        v_erros := v_erros || jsonb_build_object('linha', v_idx, 'erro', 'tipo inválido: ' || coalesce(item->>'tipo','null'));
        continue;
      end if;

      if item->>'descricao' is null or trim(item->>'descricao') = '' then
        v_erros := v_erros || jsonb_build_object('linha', v_idx, 'erro', 'descricao é obrigatória');
        continue;
      end if;

      if (item->>'valor') is null then
        v_erros := v_erros || jsonb_build_object('linha', v_idx, 'erro', 'valor é obrigatório');
        continue;
      end if;

      begin
        v_vencimento := (item->>'vencimento')::date;
      exception when others then
        v_erros := v_erros || jsonb_build_object('linha', v_idx, 'erro', 'vencimento inválido: ' || coalesce(item->>'vencimento','null'));
        continue;
      end;

      -- Resolve carteira (aceita nome ou UUID)
      v_carteira_id := null;
      if item->>'carteira' is not null and trim(item->>'carteira') <> '' then
        begin
          v_carteira_id := (item->>'carteira')::uuid;
          if not exists (
            select 1 from public.carteiras where id = v_carteira_id and empresa_id = v_empresa
          ) then
            v_carteira_id := null;
          end if;
        exception when invalid_text_representation then
          select id into v_carteira_id
            from public.carteiras
           where empresa_id = v_empresa
             and lower(trim(nome)) = lower(trim(item->>'carteira'))
           limit 1;
        end;
      end if;

      -- Status
      v_pago := coalesce((item->>'pago')::boolean, false);
      v_pgto := case when v_pago then current_date else null end;
      v_status := case
        when v_pago and v_tipo = 'receita' then 'recebido'
        when v_pago then 'pago'
        when v_vencimento < current_date then 'atrasado'
        else 'previsto'
      end;

      insert into public.financeiro (
        empresa_id, tipo, categoria, descricao, valor, data, vencimento,
        pagamento_em, status, cliente, carteira_id
      ) values (
        v_empresa,
        v_tipo,
        coalesce(nullif(trim(item->>'categoria'),''), 'Geral'),
        trim(item->>'descricao'),
        (item->>'valor')::numeric,
        v_vencimento,
        v_vencimento,
        v_pgto,
        v_status,
        nullif(trim(coalesce(item->>'cliente','')), ''),
        v_carteira_id
      );

      v_inseridos := v_inseridos + 1;

    exception when others then
      v_erros := v_erros || jsonb_build_object('linha', v_idx, 'erro', sqlerrm);
    end;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'inseridos', v_inseridos,
    'total_enviados', v_idx,
    'erros', v_erros
  );
end;
$$;

-- ─── mcp_criar_cenario_demo_financeiro ───────────────────────────────────────
-- Popula o financeiro com ~20 lançamentos realistas de uma produtora audiovisual.

create or replace function public.mcp_criar_cenario_demo_financeiro(
  p_token_hash      text,
  p_limpar_existentes boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa uuid;
begin
  v_empresa := public._mcp_empresa(p_token_hash);
  if v_empresa is null then
    return jsonb_build_object('ok', false, 'erro', 'Token inválido ou revogado.');
  end if;

  if p_limpar_existentes then
    delete from public.financeiro where empresa_id = v_empresa;
  end if;

  insert into public.financeiro
    (empresa_id, tipo, categoria, descricao, valor, data, vencimento, pagamento_em, status, cliente, forma_pagamento)
  values
    -- ── Receitas recebidas ──
    (v_empresa,'receita','Projeto','Vibe Cosméticos — Vídeo institucional (entrada 50%)',
      9000, current_date-25, current_date-25, current_date-24, 'recebido','Vibe Cosméticos','PIX'),

    (v_empresa,'receita','Projeto','Studio Olympus — Documentário curto (entrada)',
      12500, current_date-18, current_date-18, current_date-17, 'recebido','Studio Olympus','Transferência'),

    (v_empresa,'receita','Avulso','Edição urgente — Nova Marca Bebidas',
      3200, current_date-10, current_date-10, current_date-9, 'recebido','Nova Marca Bebidas','PIX'),

    (v_empresa,'receita','Projeto','Fresh Burger — Reels Pack (parcela 1/2)',
      4500, current_date-5, current_date-5, current_date-4, 'recebido','Fresh Burger Co.','PIX'),

    (v_empresa,'receita','Treinamento','Workshop Reels — turma março',
      2800, current_date-30, current_date-30, current_date-29, 'recebido',null,'PIX'),

    -- ── Receitas previstas ──
    (v_empresa,'receita','Projeto','Vibe Cosméticos — Vídeo institucional (final 50%)',
      9000, current_date+5, current_date+5, null, 'previsto','Vibe Cosméticos',null),

    (v_empresa,'receita','Projeto','Atlas Imóveis — Tour 360 lançamento (entrada)',
      15000, current_date+8, current_date+8, null, 'previsto','Atlas Imóveis',null),

    (v_empresa,'receita','Projeto','Studio Olympus — Documentário curto (final)',
      12500, current_date+20, current_date+20, null, 'previsto','Studio Olympus',null),

    -- ── Receita atrasada ──
    (v_empresa,'receita','Projeto','Fresh Burger — Reels Pack (parcela 2/2)',
      4500, current_date-7, current_date-7, null, 'atrasado','Fresh Burger Co.',null),

    -- ── Despesas pagas ──
    (v_empresa,'despesa','Software','Adobe Creative Cloud + Frame.io (mensal)',
      420, current_date-3, current_date-3, current_date-3, 'pago',null,'Cartão'),

    (v_empresa,'despesa','Equipe','Cachê Pedro — captação Vibe Cosméticos',
      2800, current_date-20, current_date-20, current_date-20, 'pago',null,'PIX'),

    (v_empresa,'despesa','Equipamento','Aluguel câmera FX6 — 3 diárias',
      1800, current_date-22, current_date-22, current_date-22, 'pago',null,'PIX'),

    (v_empresa,'despesa','Estrutura','Aluguel estúdio + energia',
      4500, current_date-8, current_date-8, current_date-8, 'pago',null,'Transferência'),

    (v_empresa,'despesa','Marketing','Meta Ads — tráfego pago Instagram',
      1200, current_date-5, current_date-5, current_date-5, 'pago',null,'Cartão'),

    (v_empresa,'despesa','Estrutura','Internet + telefone + coworking',
      780, current_date-12, current_date-12, current_date-12, 'pago',null,'Débito'),

    -- ── Despesas previstas ──
    (v_empresa,'despesa','Equipe','Cachê Ana — colorização Documentário',
      1500, current_date+3, current_date+3, null, 'previsto',null,null),

    (v_empresa,'despesa','Equipamento','Drone Mavic 3 Pro — diária Atlas',
      650, current_date+4, current_date+4, null, 'previsto',null,null),

    (v_empresa,'despesa','Equipe','Pró-labore mensal',
      8000, current_date+10, current_date+10, null, 'previsto',null,null),

    (v_empresa,'despesa','Software','Frame.io upgrade plano Pro',
      280, current_date+12, current_date+12, null, 'previsto',null,null),

    -- ── Despesa atrasada ──
    (v_empresa,'despesa','Impostos','DAS Simples Nacional — competência anterior',
      3800, current_date-4, current_date-4, null, 'atrasado',null,null);

  return jsonb_build_object(
    'ok', true,
    'mensagem', 'Cenário demo criado com 20 lançamentos realistas de uma produtora audiovisual.',
    'limpos_antes', p_limpar_existentes
  );
end;
$$;

-- ─── Grants ──────────────────────────────────────────────────────────────────

grant execute on function public.mcp_importar_lancamentos(text, jsonb)          to anon, authenticated;
grant execute on function public.mcp_criar_cenario_demo_financeiro(text, boolean) to anon, authenticated;
