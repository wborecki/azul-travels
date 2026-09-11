
-- A policy "Owner updates own estabelecimento" permite UPDATE em qualquer coluna,
-- então um dono poderia se autoconceder selo_azul, mudar status para 'ativo' etc.
-- via API REST. Este trigger restringe as colunas sensíveis a administradores.
CREATE OR REPLACE FUNCTION public.protect_estabelecimentos_admin_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- auth.uid() nulo = service role / conexão direta (migrations, jobs) → liberado.
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.owner_user_id       IS DISTINCT FROM OLD.owner_user_id
     OR NEW.status              IS DISTINCT FROM OLD.status
     OR NEW.destaque            IS DISTINCT FROM OLD.destaque
     OR NEW.selo_azul           IS DISTINCT FROM OLD.selo_azul
     OR NEW.selo_azul_validade  IS DISTINCT FROM OLD.selo_azul_validade
     OR NEW.selo_governamental  IS DISTINCT FROM OLD.selo_governamental
     OR NEW.selo_privado        IS DISTINCT FROM OLD.selo_privado
     OR NEW.selo_privado_nome   IS DISTINCT FROM OLD.selo_privado_nome
  THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar status, destaque ou selos de um estabelecimento';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_estab_admin_columns ON public.estabelecimentos;
CREATE TRIGGER trg_protect_estab_admin_columns
  BEFORE UPDATE ON public.estabelecimentos
  FOR EACH ROW EXECUTE FUNCTION public.protect_estabelecimentos_admin_columns();
