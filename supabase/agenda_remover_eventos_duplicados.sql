-- Mantém apenas o evento mais recente de cada tarefa/marco sincronizado.
-- Rode uma vez no SQL Editor para limpar duplicados já existentes.
with duplicados as (
  select id,
    row_number() over (
      partition by empresa_id, ref_tipo, ref_id
      order by criado_em desc, id desc
    ) as posicao
  from public.eventos
  where ref_tipo is not null and ref_id is not null
)
delete from public.eventos
where id in (select id from duplicados where posicao > 1);

-- Garante no banco que uma tarefa/marco tenha no máximo um evento sincronizado.
create unique index if not exists eventos_referencia_unica
  on public.eventos (empresa_id, ref_tipo, ref_id)
  where ref_tipo is not null and ref_id is not null;
