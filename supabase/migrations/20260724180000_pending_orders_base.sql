-- Traz para a sequência oficial a estrutura legada que antes existia apenas
-- em supabase/pending_orders_migration.sql. É idempotente para instalações que
-- já executaram o SQL manual e permite reconstruir um banco novo por migrations.

create table if not exists public.pending_orders (
  id uuid primary key default gen_random_uuid(),
  asaas_payment_id text unique not null,
  nome text not null,
  email text not null,
  empresa_nome text not null,
  cpf text not null,
  senha text,
  billing_type text not null,
  status text not null default 'pending',
  error_msg text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

alter table public.pending_orders enable row level security;

create or replace function public.criar_conta_paga(
  p_auth_user_id uuid,
  p_nome text,
  p_email text,
  p_empresa_nome text,
  p_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_empresa_id uuid;
begin
  if exists (
    select 1
    from public.pending_orders
    where asaas_payment_id = p_payment_id
      and status = 'completed'
  ) then
    return;
  end if;

  select empresa_id
    into v_empresa_id
    from public.usuarios
   where id = p_auth_user_id;

  if v_empresa_id is not null then
    update public.empresas
       set nome = p_empresa_nome,
           trial_expires_at = null
     where id = v_empresa_id;

    update public.pending_orders
       set status = 'completed',
           completed_at = now(),
           senha = null
     where asaas_payment_id = p_payment_id;
    return;
  end if;

  insert into public.empresas (nome, trial_expires_at)
  values (p_empresa_nome, null)
  returning id into v_empresa_id;

  insert into public.usuarios (id, empresa_id, nome, email)
  values (p_auth_user_id, v_empresa_id, p_nome, p_email);

  update public.pending_orders
     set status = 'completed',
         completed_at = now(),
         senha = null
   where asaas_payment_id = p_payment_id;
end;
$$;

revoke all on table public.pending_orders from public;
revoke all on table public.pending_orders from anon;
revoke all on table public.pending_orders from authenticated;
grant select, insert, update, delete on table public.pending_orders to service_role;
revoke all on function public.criar_conta_paga(uuid, text, text, text, text) from public;
revoke all on function public.criar_conta_paga(uuid, text, text, text, text) from anon;
revoke all on function public.criar_conta_paga(uuid, text, text, text, text) from authenticated;
grant execute on function public.criar_conta_paga(uuid, text, text, text, text) to service_role;
