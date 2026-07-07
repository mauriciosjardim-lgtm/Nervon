-- Adiciona campo de comprovante nos lançamentos + bucket de storage
-- Execute no Supabase: SQL Editor → New query → Run

alter table financeiro
  add column if not exists comprovante_url text;

-- Storage bucket para comprovantes (público via path com empresa_id)
insert into storage.buckets (id, name, public)
  values ('comprovantes', 'comprovantes', true)
  on conflict do nothing;

-- ATENÇÃO: Postgres NÃO suporta "create policy if not exists" → usar drop+create.
drop policy if exists "comprovantes_select" on storage.objects;
create policy "comprovantes_select"
  on storage.objects for select
  using (bucket_id = 'comprovantes');

drop policy if exists "comprovantes_insert" on storage.objects;
create policy "comprovantes_insert"
  on storage.objects for insert
  with check (bucket_id = 'comprovantes' and auth.uid() is not null);

drop policy if exists "comprovantes_delete" on storage.objects;
create policy "comprovantes_delete"
  on storage.objects for delete
  using (bucket_id = 'comprovantes' and auth.uid() is not null);
