-- ============================================================================
-- Trial de 7 dias — coluna em empresas
-- Projeto Supabase: smsqhbbbyjacatxvihks
-- Rodado em produção em 2026-06-20.
-- null = vitalício (contas antigas ficam null). Onboarding grava now()+7d em novos cadastros.
-- ============================================================================

alter table public.empresas
  add column if not exists trial_expires_at timestamptz default null;
