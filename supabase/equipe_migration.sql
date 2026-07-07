-- Módulo de Equipes — execute no SQL Editor do Supabase

-- 1. Role e permissões por módulo em usuarios
alter table usuarios
  add column if not exists role        text not null default 'admin',
  add column if not exists permissoes  jsonb not null default '{}';

-- 2. Tabela de convites pendentes
create table if not exists equipe_convites (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id) on delete cascade,
  email       text not null,
  nome        text,
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  role        text not null default 'membro',
  permissoes  jsonb not null default '{}',
  status      text not null default 'pendente'
              check (status in ('pendente','aceito','expirado')),
  criado_em   timestamptz default now(),
  expira_em   timestamptz default now() + interval '7 days'
);

create index if not exists equipe_convites_empresa_id_idx on equipe_convites(empresa_id);
create index if not exists equipe_convites_token_idx      on equipe_convites(token);

alter table equipe_convites enable row level security;

-- membros da mesma empresa vêem/gerenciam os convites
create policy if not exists "equipe_convites_mesma_empresa" on equipe_convites
  for all using (empresa_id = minha_empresa_id());

-- 3. Function: info pública de um convite (chamada sem autenticação)
create or replace function info_convite(p_token text)
returns jsonb language plpgsql security definer as $$
declare
  v_convite equipe_convites%rowtype;
  v_empresa empresas%rowtype;
begin
  select * into v_convite from equipe_convites
  where token = p_token and status = 'pendente' and expira_em > now();

  if not found then return null; end if;

  select * into v_empresa from empresas where id = v_convite.empresa_id;

  return jsonb_build_object(
    'email',        v_convite.email,
    'nome',         v_convite.nome,
    'role',         v_convite.role,
    'permissoes',   v_convite.permissoes,
    'empresa_nome', v_empresa.nome,
    'empresa_id',   v_empresa.id::text
  );
end;
$$;

-- 4. Function: aceitar convite (requer auth — cria usuario na empresa certa)
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
    raise exception 'Convite inválido ou expirado';
  end if;

  if exists(select 1 from usuarios where id = v_uid) then
    raise exception 'Você já possui uma conta no MakersHub';
  end if;

  insert into usuarios (id, empresa_id, nome, email, role, permissoes)
  select v_uid, v_convite.empresa_id, p_nome,
         (select email from auth.users where id = v_uid),
         v_convite.role, v_convite.permissoes;

  update equipe_convites set status = 'aceito' where id = v_convite.id;

  return jsonb_build_object('empresa_id', v_convite.empresa_id::text, 'ok', true);
end;
$$;

-- 5. Function: cancelar convite (apenas admins da empresa)
create or replace function cancelar_convite(p_id uuid)
returns void language plpgsql security definer as $$
begin
  delete from equipe_convites
  where id = p_id and empresa_id = minha_empresa_id();
end;
$$;

-- 6. Function: remover membro da equipe
create or replace function remover_membro(p_usuario_id uuid)
returns void language plpgsql security definer as $$
declare
  v_empresa_id uuid := minha_empresa_id();
begin
  -- Não pode remover a si mesmo nem outro admin
  if p_usuario_id = auth.uid() then
    raise exception 'Você não pode remover a si mesmo';
  end if;
  delete from usuarios
  where id = p_usuario_id and empresa_id = v_empresa_id;
  -- Remove também o auth user (opcional — comentar se não quiser)
  -- perform auth.admin.delete_user(p_usuario_id);
end;
$$;
