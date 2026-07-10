-- ============================================================
-- Cliente como entidade real em Projetos (reaproveitando clientes_comercial)
-- ============================================================
-- Antes: projetos.cliente era texto livre, sem cor nem entidade própria.
-- Agora: projetos.cliente_id aponta pro mesmo cadastro usado no Comercial
-- (clientes_comercial), com cor de destaque própria. O campo texto
-- `cliente` é mantido por compatibilidade (exibição/filtros legados) e
-- passa a ser sincronizado a partir do nome do cliente vinculado.

alter table public.clientes_comercial
  add column if not exists accent_color text;

alter table public.projetos
  add column if not exists cliente_id uuid references clientes_comercial(id) on delete set null;

-- Backfill: cria (ou reaproveita) um cliente_comercial pra cada nome de
-- cliente distinto já usado em projetos, e vincula cliente_id.
do $$
declare
  r record;
  v_cliente_id uuid;
begin
  for r in
    select distinct empresa_id, cliente from projetos where cliente_id is null and cliente is not null
  loop
    select id into v_cliente_id
    from clientes_comercial
    where empresa_id = r.empresa_id and lower(nome) = lower(r.cliente)
    limit 1;

    if v_cliente_id is null then
      insert into clientes_comercial (empresa_id, nome, segmento, cidade)
      values (r.empresa_id, r.cliente, 'Não informado', 'Não informado')
      returning id into v_cliente_id;
    end if;

    update projetos
      set cliente_id = v_cliente_id
      where empresa_id = r.empresa_id and cliente = r.cliente and cliente_id is null;
  end loop;
end $$;
