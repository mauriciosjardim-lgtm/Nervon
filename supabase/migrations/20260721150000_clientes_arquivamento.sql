-- Arquivamento reversível de clientes.
-- Preserva projetos, CRM, contratos, portal e histórico financeiro.

alter table public.clientes_comercial
  add column if not exists arquivado boolean not null default false;

create index if not exists clientes_comercial_arquivado_idx
  on public.clientes_comercial (empresa_id, arquivado, nome);

