-- Fix: alinha os CHECK constraints de entregaveis aos valores usados no app.
-- App tipo:   video | foto | doc | design | audio | outro
-- App status: pendente | em_revisao | aprovado | entregue

alter table entregaveis drop constraint if exists entregaveis_tipo_check;
alter table entregaveis
  add constraint entregaveis_tipo_check
  check (tipo in ('video','foto','doc','design','audio','outro'));

alter table entregaveis drop constraint if exists entregaveis_status_check;
alter table entregaveis
  add constraint entregaveis_status_check
  check (status in ('pendente','em_revisao','aprovado','entregue'));

alter table entregaveis alter column status set default 'pendente';
