-- ============================================================
-- PENDING ORDERS — pedidos aguardando confirmação de pagamento
-- Execute no Supabase: SQL Editor → New query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS pending_orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_payment_id   text UNIQUE NOT NULL,
  nome               text NOT NULL,
  email              text NOT NULL,
  empresa_nome       text NOT NULL,
  cpf                text NOT NULL,
  senha              text,                  -- apagado após criação da conta
  billing_type       text NOT NULL,         -- PIX | CREDIT_CARD
  status             text NOT NULL DEFAULT 'pending', -- pending | completed | failed
  error_msg          text,
  created_at         timestamptz DEFAULT now(),
  completed_at       timestamptz
);

-- Apenas service_role acessa (nenhuma policy pública)
ALTER TABLE pending_orders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNÇÃO IDEMPOTENTE: cria empresa + usuário após pagamento
-- Chamada pelo webhook handler (server-side, com service_role).
-- ============================================================
CREATE OR REPLACE FUNCTION criar_conta_paga(
  p_auth_user_id  uuid,
  p_nome          text,
  p_email         text,
  p_empresa_nome  text,
  p_payment_id    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  -- Idempotência: pedido já processado → não faz nada
  IF EXISTS (
    SELECT 1 FROM pending_orders
    WHERE asaas_payment_id = p_payment_id AND status = 'completed'
  ) THEN
    RETURN;
  END IF;

  -- Idempotência: usuário já criado pelo trigger auth.users.
  -- Isso acontece no checkout porque admin.createUser dispara handle_new_user()
  -- antes desta função. Neste caso, reaproveita a empresa existente, corrige o
  -- nome informado no checkout e promove para conta paga (trial_expires_at null).
  SELECT empresa_id INTO v_empresa_id
  FROM usuarios
  WHERE id = p_auth_user_id;

  IF v_empresa_id IS NOT NULL THEN
    UPDATE empresas
    SET nome = p_empresa_nome,
        trial_expires_at = NULL
    WHERE id = v_empresa_id;

    UPDATE pending_orders
    SET status = 'completed', completed_at = now(), senha = NULL
    WHERE asaas_payment_id = p_payment_id;
    RETURN;
  END IF;

  -- Cria empresa vitalícia (trial_expires_at = null)
  INSERT INTO empresas (nome, trial_expires_at)
  VALUES (p_empresa_nome, NULL)
  RETURNING id INTO v_empresa_id;

  -- Cria usuário vinculado
  INSERT INTO usuarios (id, empresa_id, nome, email)
  VALUES (p_auth_user_id, v_empresa_id, p_nome, p_email);

  -- Marca pedido completo e apaga senha
  UPDATE pending_orders
  SET status = 'completed', completed_at = now(), senha = NULL
  WHERE asaas_payment_id = p_payment_id;
END;
$$;
