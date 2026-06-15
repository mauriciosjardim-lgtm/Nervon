-- Corrige RLS para permitir onboarding (primeiro acesso)
-- Execute no Supabase: SQL Editor → New query → Run

-- EMPRESAS: qualquer usuário autenticado pode criar 1 empresa (INSERT livre)
-- Só lê/edita a própria empresa depois (SELECT/UPDATE via minha_empresa_id)
drop policy if exists "empresa_propria" on empresas;

create policy "empresa_insert" on empresas
  for insert with check (auth.uid() is not null);

create policy "empresa_select_update_delete" on empresas
  for all using (id = minha_empresa_id());

-- USUARIOS: usuário só pode criar o próprio registro (id = auth.uid())
drop policy if exists "mesma_empresa" on usuarios;

create policy "usuario_insert_proprio" on usuarios
  for insert with check (id = auth.uid());

create policy "usuario_select_update_delete" on usuarios
  for all using (empresa_id = minha_empresa_id());
