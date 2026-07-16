-- Permite a categoria visual de edição antes de sincronizar os eventos.
alter table public.eventos drop constraint if exists eventos_tipo_check;
alter table public.eventos add constraint eventos_tipo_check
  check (tipo in ('reuniao', 'gravacao', 'edicao', 'entrega', 'tarefa', 'outro'));

-- Corrige eventos de Agenda já criados a partir das tarefas de Projetos.
-- Eventos novos já recebem esse tipo automaticamente pelo app.
update public.eventos as evento
set tipo = case tarefa.status
  when 'captacao' then 'gravacao'
  when 'edicao' then 'edicao'
  when 'entrega' then 'entrega'
  else 'tarefa'
end
from public.tarefas as tarefa
where evento.ref_tipo = 'tarefa'
  and evento.ref_id::text = tarefa.id::text
  and evento.tipo = 'tarefa';
