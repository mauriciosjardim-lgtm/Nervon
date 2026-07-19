-- Makers Members — separa materiais para aprovação de entregas finais.

alter table public.portal_review_versions
  add column if not exists kind text not null default 'review';

alter table public.portal_review_versions
  drop constraint if exists portal_review_versions_kind_check;

alter table public.portal_review_versions
  add constraint portal_review_versions_kind_check
  check (kind in ('review', 'delivery'));

create index if not exists portal_review_versions_kind_idx
  on public.portal_review_versions (projeto_id, kind, created_at desc);

update public.portal_review_versions
set content_cycle = to_char(coalesce(published_at, created_at), 'YYYY-MM')
where content_cycle is null or btrim(content_cycle) = '';

alter table public.portal_review_versions
  alter column content_cycle set not null;

alter table public.portal_review_versions
  drop constraint if exists portal_review_versions_content_cycle_check;

alter table public.portal_review_versions
  add constraint portal_review_versions_content_cycle_check
  check (btrim(content_cycle) <> '');
