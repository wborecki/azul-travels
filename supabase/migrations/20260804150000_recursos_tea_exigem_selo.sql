-- Recursos TEA passam a ser editáveis pelo dono - mas só depois do Selo Azul.
--
-- Contexto: até aqui os seis recursos filtráveis (`tem_sala_sensorial`,
-- `tem_concierge_tea`, `tem_checkin_antecipado`, `tem_fila_prioritaria`,
-- `tem_cardapio_visual`, `tem_caa`) e a flag `tem_beneficio_tea` só eram
-- editados pelo admin, em `/admin/estabelecimentos/:id`. Com o painel do dono
-- ganhando a seção "Acolhimento TEA", eles passam a aparecer para o dono.
--
-- Por que travar no banco e não só na tela: estes sete campos são **filtros da
-- busca** (`explorar-search.ts` e `ItensViewFilters`). Uma família que filtra
-- por "sala sensorial" está confiando que a plataforma verificou aquilo - é o
-- que o Selo Azul significa. Um gate só de UI seria contornável por um PATCH
-- direto na API REST, exatamente o buraco que esta trigger foi criada para
-- fechar (ver o comentário da migration 20260706130000).
--
-- Comparações usam OLD.selo_azul/OLD.status porque o bloco acima já garante
-- que um não-admin não consegue alterar nenhum dos dois.

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

  IF NOT (COALESCE(OLD.selo_azul, false) AND OLD.status = 'ativo') THEN
    IF NEW.tem_sala_sensorial     IS DISTINCT FROM OLD.tem_sala_sensorial
       OR NEW.tem_concierge_tea      IS DISTINCT FROM OLD.tem_concierge_tea
       OR NEW.tem_checkin_antecipado IS DISTINCT FROM OLD.tem_checkin_antecipado
       OR NEW.tem_fila_prioritaria   IS DISTINCT FROM OLD.tem_fila_prioritaria
       OR NEW.tem_cardapio_visual    IS DISTINCT FROM OLD.tem_cardapio_visual
       OR NEW.tem_caa                IS DISTINCT FROM OLD.tem_caa
       OR NEW.tem_beneficio_tea      IS DISTINCT FROM OLD.tem_beneficio_tea
    THEN
      RAISE EXCEPTION 'RECURSOS_TEA_EXIGEM_SELO: os recursos TEA são liberados para edição depois que o Selo Azul está ativo';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
