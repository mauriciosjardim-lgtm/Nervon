-- Atualiza tabela financeiro para suportar todos os campos do módulo
-- Execute no Supabase: SQL Editor → New query → Run

-- Remove constraint de status antiga e adiciona colunas extras
alter table financeiro
  add column if not exists vencimento    date,
  add column if not exists pagamento_em  date,
  add column if not exists cliente       text,
  add column if not exists forma_pagamento text,
  add column if not exists observacoes   text;

-- Popula vencimento com data onde for nulo (compatibilidade)
update financeiro set vencimento = data where vencimento is null;

-- Agora o campo `data` vira `vencimento` de fato — mantemos ambos por flexibilidade

-- Atualiza constraint de status para incluir todos os valores usados no app
alter table financeiro drop constraint if exists financeiro_status_check;
alter table financeiro add constraint financeiro_status_check
  check (status in ('previsto','recebido','pago','atrasado','cancelado'));

-- Atualiza valor padrão de status
alter table financeiro alter column status set default 'previsto';
