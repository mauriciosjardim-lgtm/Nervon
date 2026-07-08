-- FIX DEFINITIVO do bug "convidado vira admin de empresa nova" (2026-07-08).
--
-- Causa raiz: handle_new_user() (trigger em auth.users) criava empresa nova
-- para TODO signup, inclusive convidados — rodando antes de qualquer código
-- de frontend (aceitar-convite/onboarding), o que tornava as "redes de
-- segurança" client-side inúteis. Confirmação de e-mail está desligada no
-- Supabase, então o signup é instantâneo e o trigger dispara na hora.
--
-- Agora: se existe convite pendente para o e-mail, o trigger vincula o novo
-- usuário à empresa que convidou (role/permissões do convite) e marca o
-- convite como aceito. Só cria empresa própria quando NÃO há convite.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_empresa_id uuid;
  v_convite equipe_convites%rowtype;
BEGIN
  -- Convidado? Convite pendente mais recente para este e-mail.
  SELECT * INTO v_convite FROM equipe_convites
   WHERE lower(email) = lower(NEW.email)
     AND status = 'pendente'
     AND expira_em > now()
   ORDER BY criado_em DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND THEN
    -- Operação interna legítima → libera o trigger anti-escalonamento
    PERFORM set_config('app.bypass_guard', 'on', true);

    INSERT INTO usuarios (id, empresa_id, nome, email, role, permissoes)
    VALUES (
      NEW.id,
      v_convite.empresa_id,
      COALESCE(NEW.raw_user_meta_data->>'nome', v_convite.nome, split_part(NEW.email, '@', 1)),
      NEW.email,
      v_convite.role,
      v_convite.permissoes
    );

    UPDATE equipe_convites SET status = 'aceito' WHERE id = v_convite.id;
    RETURN NEW;
  END IF;

  -- Sem convite: fluxo normal — cria empresa própria como admin.
  INSERT INTO empresas (nome, accent_color)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'oklch(0.88 0.22 130)'
  )
  RETURNING id INTO v_empresa_id;

  INSERT INTO usuarios (id, empresa_id, nome, email)
  VALUES (
    NEW.id,
    v_empresa_id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$function$;
