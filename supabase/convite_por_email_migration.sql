-- Rede de segurança: aceitar convite pelo e-mail autenticado (sem depender do token).
-- Resolve o bug do convidado virar admin de empresa nova quando o redirect do
-- e-mail não preserva /aceitar-convite?token=...

create or replace function aceitar_convite_por_email(p_nome text default null)
returns jsonb language plpgsql security definer as $$
declare
  v_uid     uuid := auth.uid();
  v_email   text;
  v_convite equipe_convites%rowtype;
begin
  if v_uid is null then
    raise exception 'Não autenticado';
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    return jsonb_build_object('ok', false, 'motivo', 'sem_email');
  end if;

  -- convite pendente mais recente para este e-mail
  select * into v_convite from equipe_convites
   where lower(email) = lower(v_email)
     and status = 'pendente'
     and expira_em > now()
   order by criado_em desc
   limit 1
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'sem_convite');
  end if;

  -- operação interna legítima → libera o trigger anti-escalonamento
  perform set_config('app.bypass_guard', 'on', true);

  insert into usuarios (id, empresa_id, nome, email, role, permissoes)
  select v_uid, v_convite.empresa_id,
         coalesce(nullif(trim(p_nome), ''), v_convite.nome, split_part(v_email, '@', 1)),
         v_email, v_convite.role, v_convite.permissoes
  on conflict (id) do update
    set empresa_id = excluded.empresa_id,
        role       = excluded.role,
        permissoes = excluded.permissoes,
        nome       = excluded.nome;

  update equipe_convites set status = 'aceito' where id = v_convite.id;

  return jsonb_build_object('ok', true, 'empresa_id', v_convite.empresa_id::text);
end;
$$;
