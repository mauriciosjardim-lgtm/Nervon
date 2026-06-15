-- Fix: update projetos.fase CHECK constraint to match app FaseProjeto values
-- The original constraint used old phase names that don't match the TypeScript types.

ALTER TABLE projetos DROP CONSTRAINT IF EXISTS projetos_fase_check;

ALTER TABLE projetos
  ADD CONSTRAINT projetos_fase_check
  CHECK (fase IN ('briefing','pre','captacao','edicao','revisao','entrega','concluido','pausado'));

ALTER TABLE projetos ALTER COLUMN fase SET DEFAULT 'briefing';
