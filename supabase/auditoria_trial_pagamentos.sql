-- Auditoria: empresas com acesso vitalicio (trial_expires_at NULL) sem pedido pago.
-- Rode no SQL Editor do Supabase depois de aplicar as correcoes.

WITH empresas_pagas AS (
  SELECT DISTINCT u.empresa_id
  FROM pending_orders po
  JOIN usuarios u ON lower(u.email) = lower(po.email)
  WHERE po.status = 'completed'
)
SELECT
  e.id AS empresa_id,
  e.nome AS empresa_nome,
  e.criado_em,
  u.email AS admin_email,
  u.nome AS admin_nome
FROM empresas e
JOIN usuarios u ON u.empresa_id = e.id
WHERE e.trial_expires_at IS NULL
  AND u.role = 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM empresas_pagas ep
    WHERE ep.empresa_id = e.id
  )
ORDER BY e.criado_em DESC;

-- Repair manual sugerido para falsos vitalicios confirmados:
-- UPDATE empresas
-- SET trial_expires_at = criado_em + interval '7 days'
-- WHERE id IN ('cole-os-ids-confirmados-aqui');
