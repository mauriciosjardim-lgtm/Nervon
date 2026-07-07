-- Planos e contadores de uso mensal (base para limites do plano Pro)

-- 1. Plano da empresa
alter table empresas add column if not exists plano text not null default 'free';

-- 2. Uso mensal por recurso (contratos, assinaturas, prospeccoes, ...)
create table if not exists uso_mensal (
  empresa_id    uuid not null references empresas(id) on delete cascade,
  ano_mes       text not null,                 -- 'YYYY-MM' (fuso America/Sao_Paulo)
  recurso       text not null,
  quantidade    int  not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (empresa_id, ano_mes, recurso)
);

alter table uso_mensal enable row level security;
drop policy if exists "uso_mesma_empresa" on uso_mensal;
create policy "uso_mesma_empresa" on uso_mensal for all
  using      (empresa_id = minha_empresa_id())
  with check (empresa_id = minha_empresa_id());

-- 3. Incrementa o uso do mês corrente e devolve o novo total
create or replace function incrementar_uso(p_recurso text, p_inc int default 1)
returns int language plpgsql security definer as $$
declare
  v_empresa uuid := minha_empresa_id();
  v_mes     text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM');
  v_total   int;
begin
  if v_empresa is null then raise exception 'Empresa não encontrada'; end if;
  insert into uso_mensal (empresa_id, ano_mes, recurso, quantidade)
  values (v_empresa, v_mes, p_recurso, p_inc)
  on conflict (empresa_id, ano_mes, recurso)
  do update set quantidade = uso_mensal.quantidade + p_inc, atualizado_em = now()
  returning quantidade into v_total;
  return v_total;
end;
$$;

-- 4. Uso do mês corrente (todos os recursos)
create or replace function uso_do_mes()
returns table(recurso text, quantidade int)
language sql security definer stable as $$
  select recurso, quantidade from uso_mensal
  where empresa_id = minha_empresa_id()
    and ano_mes = to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM');
$$;
