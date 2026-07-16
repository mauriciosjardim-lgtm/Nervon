-- Projetos podem seguir o calendário das tarefas, sem prazo geral.
-- Fechar um projeto arquiva a operação sem apagar seu histórico.
alter table public.projetos
  alter column data_entrega drop not null;

alter table public.projetos
  add column if not exists arquivado boolean not null default false;

create index if not exists projetos_empresa_arquivado_idx
  on public.projetos (empresa_id, arquivado);
