CREATE OR REPLACE FUNCTION public.criar_empresa_onboarding(
  p_nome         text,
  p_accent_color text,
  p_logo_url     text,
  p_user_nome    text,
  p_user_email   text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  INSERT INTO empresas (nome, accent_color, logo_url, trial_expires_at)
  VALUES (p_nome, p_accent_color, p_logo_url, now() + interval '7 days')
  RETURNING id INTO v_empresa_id;

  INSERT INTO usuarios (id, empresa_id, nome, email)
  VALUES (auth.uid(), v_empresa_id, p_user_nome, p_user_email);

  RETURN v_empresa_id::text;
END;
$$;
