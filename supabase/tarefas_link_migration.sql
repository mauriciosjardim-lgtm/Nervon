-- Link persistente por tarefa (Drive, Frame.io, Vimeo, documento ou referência).
-- Campo próprio — não reutiliza descricao/notas. Aditivo e idempotente.
alter table tarefas
  add column if not exists link text;
