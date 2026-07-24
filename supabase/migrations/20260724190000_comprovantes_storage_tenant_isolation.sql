-- O bucket legado era público e aceitava qualquer path autenticado. Torna os
-- objetos privados e exige que o primeiro segmento seja a empresa da sessão.

update storage.buckets
set public = false
where id = 'comprovantes';

drop policy if exists "comprovantes_select" on storage.objects;
drop policy if exists "comprovantes_insert" on storage.objects;
drop policy if exists "comprovantes_update" on storage.objects;
drop policy if exists "comprovantes_delete" on storage.objects;

create policy "comprovantes_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'comprovantes'
  and (storage.foldername(name))[1] = (
    select u.empresa_id::text
    from public.usuarios u
    where u.id = auth.uid()
  )
);

create policy "comprovantes_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'comprovantes'
  and (storage.foldername(name))[1] = (
    select u.empresa_id::text
    from public.usuarios u
    where u.id = auth.uid()
  )
);

create policy "comprovantes_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'comprovantes'
  and (storage.foldername(name))[1] = (
    select u.empresa_id::text
    from public.usuarios u
    where u.id = auth.uid()
  )
)
with check (
  bucket_id = 'comprovantes'
  and (storage.foldername(name))[1] = (
    select u.empresa_id::text
    from public.usuarios u
    where u.id = auth.uid()
  )
);

create policy "comprovantes_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'comprovantes'
  and (storage.foldername(name))[1] = (
    select u.empresa_id::text
    from public.usuarios u
    where u.id = auth.uid()
  )
);
