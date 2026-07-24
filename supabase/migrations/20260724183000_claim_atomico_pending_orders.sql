-- Impede que webhooks/retries concorrentes provisionem a mesma cobrança mais
-- de uma vez. A lease expira para que um Worker interrompido possa ser
-- recuperado por uma entrega posterior.

alter table public.pending_orders
  add column if not exists processing_started_at timestamptz;

create or replace function public.claim_pending_order(
  p_payment_id text,
  p_lease_interval interval default interval '5 minutes'
)
returns setof public.pending_orders
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.pending_orders
     set status = 'processing',
         processing_started_at = clock_timestamp(),
         error_msg = null
   where id = (
     select id
       from public.pending_orders
      where asaas_payment_id = p_payment_id
        and (
          status in ('pending', 'failed')
          or (
            status = 'processing'
            and processing_started_at < clock_timestamp() - p_lease_interval
          )
        )
      for update skip locked
      limit 1
   )
  returning *;
$$;

create or replace function public.clear_pending_order_processing_lease()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.status <> 'processing' then
    new.processing_started_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists pending_orders_clear_processing_lease
  on public.pending_orders;
create trigger pending_orders_clear_processing_lease
before insert or update of status
on public.pending_orders
for each row
execute function public.clear_pending_order_processing_lease();

revoke all on function public.claim_pending_order(text, interval) from public;
revoke all on function public.claim_pending_order(text, interval) from anon;
revoke all on function public.claim_pending_order(text, interval) from authenticated;
grant execute on function public.claim_pending_order(text, interval) to service_role;
