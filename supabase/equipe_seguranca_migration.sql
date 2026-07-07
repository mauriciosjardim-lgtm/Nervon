-- ============================================================
-- MAKERShub — Segurança de equipe / permissões no backend
-- Fecha o gap: permissões de módulo passam a ser validadas no
-- banco (RLS), não apenas escondidas no frontend.
-- Idempotente: pode rodar mais de uma vez.
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- 1. Helper: o usuário logado tem permissão no módulo?
--    admin = acesso total. membro = depende do jsonb permissoes.
-- ─────────────────────────────────────────────────────────
create or replace function tem_permissao(p_modulo text)
returns boolean language sql stable security definer as $$
  select coalesce(
    (select role = 'admin' or coalesce((permissoes ->> p_modulo)::boolean, false)
       from usuarios where id = auth.uid()),
    false);
$$;

-- ─────────────────────────────────────────────────────────
-- 2. Gating das tabelas sensíveis de DINHEIRO
--    (financeiro default = false para membros)
--    Substitui as policies amplas por policies com permissão.
-- ─────────────────────────────────────────────────────────

-- FINANCEIRO
drop policy if exists "mesma_empresa" on financeiro;
create policy "financeiro_acesso" on financeiro
  for all
  using      (empresa_id = minha_empresa_id() and tem_permissao('financeiro'))
  with check (empresa_id = minha_empresa_id() and tem_permissao('financeiro'));

-- CARTEIRAS
drop policy if exists "mesma_empresa" on carteiras;
create policy "carteiras_acesso" on carteiras
  for all
  using      (empresa_id = minha_empresa_id() and tem_permissao('financeiro'))
  with check (empresa_id = minha_empresa_id() and tem_permissao('financeiro'));

-- ORÇAMENTOS
drop policy if exists "orcamentos_empresa" on orcamentos;
create policy "orcamentos_acesso" on orcamentos
  for all
  using      (empresa_id = minha_empresa_id() and tem_permissao('orcamentos'))
  with check (empresa_id = minha_empresa_id() and tem_permissao('orcamentos'));

drop policy if exists "templates_empresa" on orcamento_templates;
create policy "templates_acesso" on orcamento_templates
  for all
  using      (empresa_id = minha_empresa_id() and tem_permissao('orcamentos'))
  with check (empresa_id = minha_empresa_id() and tem_permissao('orcamentos'));

-- ─────────────────────────────────────────────────────────
-- 3. Gating COMERCIAL (clientes/contatos/leads/timeline/tarefas)
-- ─────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['clientes_comercial','contatos_comercial','leads','timeline_lead','tarefas_lead']
  loop
    execute format('drop policy if exists %I on %I', 'cc_select', t);
    execute format('drop policy if exists %I on %I', 'cc_insert', t);
    execute format('drop policy if exists %I on %I', 'cc_update', t);
    execute format('drop policy if exists %I on %I', 'cc_delete', t);
    execute format('drop policy if exists %I on %I', 'cco_select', t);
    execute format('drop policy if exists %I on %I', 'cco_insert', t);
    execute format('drop policy if exists %I on %I', 'cco_update', t);
    execute format('drop policy if exists %I on %I', 'cco_delete', t);
    execute format('drop policy if exists %I on %I', 'leads_select', t);
    execute format('drop policy if exists %I on %I', 'leads_insert', t);
    execute format('drop policy if exists %I on %I', 'leads_update', t);
    execute format('drop policy if exists %I on %I', 'leads_delete', t);
    execute format('drop policy if exists %I on %I', 'tl_select', t);
    execute format('drop policy if exists %I on %I', 'tl_insert', t);
    execute format('drop policy if exists %I on %I', 'tl_update', t);
    execute format('drop policy if exists %I on %I', 'tl_delete', t);
    execute format('drop policy if exists %I on %I', 'tal_select', t);
    execute format('drop policy if exists %I on %I', 'tal_insert', t);
    execute format('drop policy if exists %I on %I', 'tal_update', t);
    execute format('drop policy if exists %I on %I', 'tal_delete', t);
    execute format('drop policy if exists %I on %I', 'comercial_acesso', t);
    execute format(
      'create policy %I on %I for all using (empresa_id = minha_empresa_id() and tem_permissao(''comercial'')) with check (empresa_id = minha_empresa_id() and tem_permissao(''comercial''))',
      'comercial_acesso', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────
-- 4. Gating PROJETOS (projetos/tarefas/marcos/entregaveis)
-- ─────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['projetos','tarefas','marcos','entregaveis']
  loop
    execute format('drop policy if exists %I on %I', 'mesma_empresa', t);
    execute format('drop policy if exists %I on %I', 'projetos_acesso', t);
    execute format(
      'create policy %I on %I for all using (empresa_id = minha_empresa_id() and tem_permissao(''projetos'')) with check (empresa_id = minha_empresa_id() and tem_permissao(''projetos''))',
      'projetos_acesso', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────
-- 5. Gating AGENDA (eventos)
-- ─────────────────────────────────────────────────────────
drop policy if exists "eventos_select" on eventos;
drop policy if exists "eventos_insert" on eventos;
drop policy if exists "eventos_update" on eventos;
drop policy if exists "eventos_delete" on eventos;
drop policy if exists "agenda_acesso"  on eventos;
create policy "agenda_acesso" on eventos
  for all
  using      (empresa_id = minha_empresa_id() and tem_permissao('agenda'))
  with check (empresa_id = minha_empresa_id() and tem_permissao('agenda'));

-- ─────────────────────────────────────────────────────────
-- 6. aceitar_convite — idempotente (UPSERT) e à prova de duplo aceite
-- ─────────────────────────────────────────────────────────
create or replace function aceitar_convite(p_token text, p_nome text)
returns jsonb language plpgsql security definer as $$
declare
  v_convite equipe_convites%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Não autenticado';
  end if;

  select * into v_convite from equipe_convites
  where token = p_token and status = 'pendente' and expira_em > now()
  for update;

  if not found then
    raise exception 'Convite inválido, expirado ou já utilizado';
  end if;

  -- libera o trigger guard_usuario_update para esta operação interna legítima
  perform set_config('app.bypass_guard', 'on', true);

  -- vincula o usuário à empresa do convite (sobrescreve se já existir linha)
  insert into usuarios (id, empresa_id, nome, email, role, permissoes)
  select v_uid, v_convite.empresa_id, p_nome,
         (select email from auth.users where id = v_uid),
         v_convite.role, v_convite.permissoes
  on conflict (id) do update
    set empresa_id = excluded.empresa_id,
        role       = excluded.role,
        permissoes = excluded.permissoes,
        nome       = excluded.nome;

  update equipe_convites set status = 'aceito' where id = v_convite.id;

  return jsonb_build_object('empresa_id', v_convite.empresa_id::text, 'ok', true);
end;
$$;

-- ─────────────────────────────────────────────────────────
-- 7. remover_membro — bloqueia auto-remoção e remoção do último admin
--    Só desvincula do workspace (não apaga auth.users → histórico intacto)
-- ─────────────────────────────────────────────────────────
create or replace function remover_membro(p_usuario_id uuid)
returns void language plpgsql security definer as $$
declare
  v_empresa_id  uuid := minha_empresa_id();
  v_target_role text;
  v_admin_count int;
begin
  if not exists (
    select 1 from usuarios
    where id = auth.uid() and empresa_id = v_empresa_id and role = 'admin'
  ) then
    raise exception 'Apenas administradores podem remover membros';
  end if;

  if p_usuario_id = auth.uid() then
    raise exception 'Você não pode remover a si mesmo';
  end if;

  select role into v_target_role from usuarios
    where id = p_usuario_id and empresa_id = v_empresa_id;
  if not found then
    raise exception 'Membro não encontrado nesta equipe';
  end if;

  if v_target_role = 'admin' then
    select count(*) into v_admin_count from usuarios
      where empresa_id = v_empresa_id and role = 'admin';
    if v_admin_count <= 1 then
      raise exception 'Não é possível remover o único administrador';
    end if;
  end if;

  -- só remove o vínculo usuário ↔ workspace; auth.users permanece
  delete from usuarios where id = p_usuario_id and empresa_id = v_empresa_id;
end;
$$;

-- ─────────────────────────────────────────────────────────
-- 8. alterar_papel_membro — muda cargo/permissões (admins apenas)
-- ─────────────────────────────────────────────────────────
create or replace function alterar_papel_membro(
  p_usuario_id uuid, p_role text, p_permissoes jsonb
) returns void language plpgsql security definer as $$
declare
  v_empresa_id  uuid := minha_empresa_id();
  v_target_role text;
  v_admin_count int;
begin
  if not exists (
    select 1 from usuarios
    where id = auth.uid() and empresa_id = v_empresa_id and role = 'admin'
  ) then
    raise exception 'Apenas administradores podem alterar papéis';
  end if;

  if p_role not in ('admin','membro') then
    raise exception 'Papel inválido';
  end if;

  select role into v_target_role from usuarios
    where id = p_usuario_id and empresa_id = v_empresa_id;
  if not found then
    raise exception 'Membro não encontrado nesta equipe';
  end if;

  -- não permite rebaixar o último admin
  if v_target_role = 'admin' and p_role <> 'admin' then
    select count(*) into v_admin_count from usuarios
      where empresa_id = v_empresa_id and role = 'admin';
    if v_admin_count <= 1 then
      raise exception 'A equipe precisa de pelo menos um administrador';
    end if;
  end if;

  update usuarios
    set role       = p_role,
        permissoes = case when p_role = 'admin' then '{}'::jsonb else p_permissoes end
    where id = p_usuario_id and empresa_id = v_empresa_id;
end;
$$;

-- ─────────────────────────────────────────────────────────
-- 9. Anti-escalonamento de privilégio em usuarios
--    Sem isto, um membro poderia rodar:
--      supabase.from('usuarios').update({ role: 'admin' }).eq('id', meuId)
--    e virar admin. O trigger só deixa admin mudar role/permissoes/empresa.
--    (alterar_papel_membro é SECURITY DEFINER mas auth.uid() continua sendo
--     o admin chamador, então passa pela checagem normalmente.)
-- ─────────────────────────────────────────────────────────
create or replace function guard_usuario_update()
returns trigger language plpgsql security definer as $$
begin
  -- operacoes internas (aceitar_convite) setam este flag transaction-local
  if current_setting('app.bypass_guard', true) = 'on' then
    return new;
  end if;
  if (new.role       is distinct from old.role
   or new.permissoes is distinct from old.permissoes
   or new.empresa_id is distinct from old.empresa_id) then
    if not exists (
      select 1 from usuarios
      where id = auth.uid() and empresa_id = old.empresa_id and role = 'admin'
    ) then
      raise exception 'Sem permissão para alterar papel, permissões ou empresa';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_usuario_update on usuarios;
create trigger trg_guard_usuario_update
  before update on usuarios
  for each row execute function guard_usuario_update();

-- ─────────────────────────────────────────────────────────
-- 10. Marca convites vencidos como expirados (housekeeping)
-- ─────────────────────────────────────────────────────────
update equipe_convites set status = 'expirado'
  where status = 'pendente' and expira_em <= now();
