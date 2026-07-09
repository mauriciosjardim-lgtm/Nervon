-- ============================================================================
-- Trial de 7 dias — coluna em empresas
-- Projeto Supabase: smsqhbbbyjacatxvihks
-- Rodado em produção em 2026-06-20.
-- null = vitalício/pago (contas antigas ficam null).
-- Novas empresas sem valor explícito nascem em trial de 7 dias.
-- ============================================================================

alter table public.empresas
  add column if not exists trial_expires_at timestamptz;

alter table public.empresas
  alter column trial_expires_at set default (now() + interval '7 days');
