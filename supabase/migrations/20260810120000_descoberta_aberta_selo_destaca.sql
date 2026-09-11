-- ============ Descoberta aberta: o selo destaca, não é mais porteiro ============
--
-- Até aqui o Selo Azul decidia **existência**: sem ele o local não aparecia na
-- busca, não podia receber reserva e nem conversar com a família. A regra
-- passa a ser outra - todo estabelecimento ativo é visível e reservável, e o
-- Selo Azul vira sinal de qualidade (destaque no card e prioridade no ranking,
-- ambos do lado do cliente).
--
-- O que **não** muda: `protect_estabelecimentos_admin_columns`
-- (20260804150000) continua exigindo o selo para editar os sete campos de
-- acolhimento TEA. Eles são filtros da busca - uma família que filtra por
-- "sala sensorial" confia que a plataforma verificou aquilo, e é exatamente
-- isso que o selo significa. Visibilidade abre; a promessa verificada não.
--
-- Esta migration remove `e.selo_azul = true` de cada lugar onde ele barrava
-- descoberta ou operação. São muitos porque a regra foi replicada policy a
-- policy desde a Fase 0; o `status = 'ativo'` continua em todos eles e passa a
-- ser o gate único.

-- ---- 1) A vitrine ----
-- Os dois ramos da view perdem o filtro de selo. `security_invoker = true`
-- segue sendo obrigatório (ver 20260804130000): é ele que faz a RLS de
-- `itens_reservaveis` valer no ramo de estadia.

CREATE OR REPLACE VIEW public.ofertas_view WITH (security_invoker = true) AS

-- ===== Estadia: um card por quarto =====
SELECT
  'estadia'::public.oferta_natureza AS natureza,
  ir.id,
  ir.nome AS item_nome,
  ir.descricao,
  ir.preco,
  ir.quantidade,
  ir.capacidade_total,
  ir.capacidade_adultos,
  ir.capacidade_criancas,
  ir.comodidades,
  ir.quantidade_camas,
  ir.imagens,
  ir.check_in_padrao,
  ir.check_out_padrao,

  CASE WHEN ir.usa_endereco_proprio THEN ir.cidade ELSE e.cidade END AS cidade,
  CASE WHEN ir.usa_endereco_proprio THEN ir.estado ELSE e.estado END AS estado,
  CASE WHEN ir.usa_endereco_proprio THEN ir.endereco ELSE e.endereco END AS endereco,
  CASE WHEN ir.usa_endereco_proprio THEN ir.latitude ELSE e.latitude END AS latitude,
  CASE WHEN ir.usa_endereco_proprio THEN ir.longitude ELSE e.longitude END AS longitude,

  e.id AS estabelecimento_id,
  e.nome AS estabelecimento_nome,
  e.slug AS estabelecimento_slug,
  e.tipo AS estabelecimento_tipo,
  e.foto_capa AS estabelecimento_foto_capa,
  e.tour_360_url AS estabelecimento_tour_360_url,

  e.selo_azul,
  e.selo_azul_validade,
  e.selo_governamental,
  e.selo_privado,
  e.selo_privado_nome,

  e.tem_beneficio_tea,
  e.beneficio_tea_descricao,
  e.tem_sala_sensorial,
  e.tem_concierge_tea,
  e.tem_checkin_antecipado,
  e.tem_fila_prioritaria,
  e.tem_cardapio_visual,
  e.tem_caa,
  e.destaque,
  e.recebe_grupos_escolares_tea,

  av.avaliacao_media,
  av.total_avaliacoes

FROM public.itens_reservaveis ir
JOIN public.estabelecimentos e ON e.id = ir.estabelecimento_id
LEFT JOIN LATERAL (
  SELECT
    AVG(a.nota_geral)::numeric(3,2) AS avaliacao_media,
    COUNT(*)::integer AS total_avaliacoes
  FROM public.avaliacoes a
  WHERE a.estabelecimento_id = e.id
    AND a.publica = true
    AND a.nota_geral IS NOT NULL
) av ON true
WHERE ir.ativo = true
  AND e.status = 'ativo'
  AND public.estab_e_hospedagem(e.tipo)

UNION ALL

-- ===== Visita: um card por estabelecimento =====
SELECT
  'visita'::public.oferta_natureza AS natureza,
  e.id,
  e.nome AS item_nome,
  e.descricao,
  NULL::numeric AS preco,
  NULL::integer AS quantidade,
  NULL::integer AS capacidade_total,
  NULL::integer AS capacidade_adultos,
  NULL::integer AS capacidade_criancas,
  '{}'::text[] AS comodidades,
  NULL::integer AS quantidade_camas,
  CASE
    WHEN jsonb_typeof(e.fotos::jsonb) = 'array' AND jsonb_array_length(e.fotos::jsonb) > 0
      THEN e.fotos::jsonb
    WHEN e.foto_capa IS NOT NULL
      THEN jsonb_build_array(e.foto_capa)
    ELSE '[]'::jsonb
  END AS imagens,
  NULL::time AS check_in_padrao,
  NULL::time AS check_out_padrao,

  e.cidade,
  e.estado,
  e.endereco,
  e.latitude,
  e.longitude,

  e.id AS estabelecimento_id,
  e.nome AS estabelecimento_nome,
  e.slug AS estabelecimento_slug,
  e.tipo AS estabelecimento_tipo,
  e.foto_capa AS estabelecimento_foto_capa,
  e.tour_360_url AS estabelecimento_tour_360_url,

  e.selo_azul,
  e.selo_azul_validade,
  e.selo_governamental,
  e.selo_privado,
  e.selo_privado_nome,

  e.tem_beneficio_tea,
  e.beneficio_tea_descricao,
  e.tem_sala_sensorial,
  e.tem_concierge_tea,
  e.tem_checkin_antecipado,
  e.tem_fila_prioritaria,
  e.tem_cardapio_visual,
  e.tem_caa,
  e.destaque,
  e.recebe_grupos_escolares_tea,

  av.avaliacao_media,
  av.total_avaliacoes

FROM public.estabelecimentos e
LEFT JOIN LATERAL (
  SELECT
    AVG(a.nota_geral)::numeric(3,2) AS avaliacao_media,
    COUNT(*)::integer AS total_avaliacoes
  FROM public.avaliacoes a
  WHERE a.estabelecimento_id = e.id
    AND a.publica = true
    AND a.nota_geral IS NOT NULL
) av ON true
WHERE e.status = 'ativo'
  AND NOT public.estab_e_hospedagem(e.tipo);

-- ---- 2) Quartos de local sem selo passam a ser públicos ----
-- Sem isto o passo 1 não teria efeito nenhum em hospedagem: a view é
-- security_invoker, então um hotel sem selo continuaria com zero quartos
-- legíveis e portanto zero cards na busca.

DROP POLICY IF EXISTS "Public reads itens ativos de estab certificado" ON public.itens_reservaveis;
CREATE POLICY "Public reads itens ativos de estab ativo" ON public.itens_reservaveis
  FOR SELECT TO anon, authenticated
  USING (
    ativo = true
    AND EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = itens_reservaveis.estabelecimento_id
        AND e.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "Owner manages own itens_reservaveis" ON public.itens_reservaveis;
CREATE POLICY "Owner manages own itens_reservaveis" ON public.itens_reservaveis
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = itens_reservaveis.estabelecimento_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = itens_reservaveis.estabelecimento_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "Owner manages own item_reservavel_bloqueios" ON public.item_reservavel_bloqueios;
CREATE POLICY "Owner manages own item_reservavel_bloqueios" ON public.item_reservavel_bloqueios
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.itens_reservaveis i
      JOIN public.estabelecimentos e ON e.id = i.estabelecimento_id
      WHERE i.id = item_reservavel_bloqueios.item_reservavel_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itens_reservaveis i
      JOIN public.estabelecimentos e ON e.id = i.estabelecimento_id
      WHERE i.id = item_reservavel_bloqueios.item_reservavel_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  );

-- ---- 3) A trigger de reserva ----
-- O gate passa a ser só `status = 'ativo'`. A HINT muda junto: quem trata o
-- erro precisa saber o motivo real, e "sem selo" deixou de ser um.

CREATE OR REPLACE FUNCTION public.sincronizar_estabelecimento_id_reserva()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tipo public.estab_tipo;
  _status public.estab_status;
BEGIN
  IF NEW.item_reservavel_id IS NULL THEN
    IF TG_OP <> 'INSERT' THEN
      -- UPDATE do ON DELETE SET NULL: reserva histórica mantém a origem.
      NEW.estabelecimento_id := OLD.estabelecimento_id;
      RETURN NEW;
    END IF;

    IF NEW.estabelecimento_id IS NULL THEN
      RAISE EXCEPTION 'Reserva exige um item reservável ou um estabelecimento'
        USING ERRCODE = 'not_null_violation';
    END IF;

    SELECT tipo, status INTO _tipo, _status
    FROM public.estabelecimentos
    WHERE id = NEW.estabelecimento_id;

    IF _tipo IS NULL THEN
      RAISE EXCEPTION 'Estabelecimento não encontrado'
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF public.estab_e_hospedagem(_tipo) THEN
      RAISE EXCEPTION 'Este tipo de estabelecimento exige a escolha de um quarto'
        USING ERRCODE = 'check_violation', HINT = 'HOSPEDAGEM_EXIGE_ITEM';
    END IF;

    IF _status <> 'ativo' THEN
      RAISE EXCEPTION 'Este estabelecimento não está aberto para reservas'
        USING ERRCODE = 'check_violation', HINT = 'ESTAB_INATIVO';
    END IF;

    RETURN NEW;
  END IF;

  SELECT estabelecimento_id INTO NEW.estabelecimento_id
  FROM public.itens_reservaveis
  WHERE id = NEW.item_reservavel_id;

  RETURN NEW;
END;
$$;

-- ---- 4) O dono opera as reservas do seu local ----

DROP POLICY IF EXISTS "Owner reads reservas of own estab" ON public.reservas;
CREATE POLICY "Owner reads reservas of own estab" ON public.reservas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = reservas.estabelecimento_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "Owner updates status of own estab reservas" ON public.reservas;
CREATE POLICY "Owner updates status of own estab reservas" ON public.reservas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = reservas.estabelecimento_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = reservas.estabelecimento_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "Owner inserts auditoria for own estab reservas" ON public.reservas_auditoria;
CREATE POLICY "Owner inserts auditoria for own estab reservas" ON public.reservas_auditoria
  FOR INSERT TO authenticated
  WITH CHECK (
    ator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.id = reservas_auditoria.reserva_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  );

-- ---- 5) Conversa da reserva ----

DROP POLICY IF EXISTS "Participants read reserva_mensagens" ON public.reserva_mensagens;
CREATE POLICY "Participants read reserva_mensagens" ON public.reserva_mensagens
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = reserva_mensagens.reserva_id AND r.familia_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.id = reserva_mensagens.reserva_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Participants send reserva_mensagens" ON public.reserva_mensagens;
CREATE POLICY "Participants send reserva_mensagens" ON public.reserva_mensagens
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.reservas r
        WHERE r.id = reserva_mensagens.reserva_id
          AND r.familia_id = auth.uid()
          AND r.status NOT IN ('cancelada', 'concluida')
      )
      OR EXISTS (
        SELECT 1
        FROM public.reservas r
        JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
        WHERE r.id = reserva_mensagens.reserva_id
          AND e.owner_user_id = auth.uid()
          AND e.status = 'ativo'
          AND r.status NOT IN ('cancelada', 'concluida')
      )
    )
  );

DROP POLICY IF EXISTS "Participants mark reserva_mensagens as read" ON public.reserva_mensagens;
CREATE POLICY "Participants mark reserva_mensagens as read" ON public.reserva_mensagens
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = reserva_mensagens.reserva_id AND r.familia_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.id = reserva_mensagens.reserva_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = reserva_mensagens.reserva_id AND r.familia_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.id = reserva_mensagens.reserva_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  );

-- ---- 6) LGPD: perfil compartilhado ----
-- O consentimento explícito da família (`perfil_enviado_ao_estabelecimento`)
-- continua sendo a condição - ele nunca dependeu do selo.

DROP POLICY IF EXISTS "Owner reads perfil_tea when reserva consentida" ON public.perfil_tea;
CREATE POLICY "Owner reads perfil_tea when reserva consentida" ON public.perfil_tea
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.perfil_tea_id = perfil_tea.id
        AND r.perfil_enviado_ao_estabelecimento = true
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "Owner reads perfil_sensorial when reserva consentida" ON public.perfil_sensorial;
CREATE POLICY "Owner reads perfil_sensorial when reserva consentida" ON public.perfil_sensorial
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE (
          r.perfil_sensorial_id = perfil_sensorial.id
          OR public.perfil_vinculado_a_reserva(r.id, perfil_sensorial.id)
        )
        AND r.perfil_enviado_ao_estabelecimento = true
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "Owner reads familia_profiles when reserva consentida" ON public.familia_profiles;
CREATE POLICY "Owner reads familia_profiles when reserva consentida" ON public.familia_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.familia_id = familia_profiles.id
        AND r.perfil_enviado_ao_estabelecimento = true
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  );

DROP POLICY IF EXISTS "Owner reads reserva_perfis when consentida" ON public.reserva_perfis;
CREATE POLICY "Owner reads reserva_perfis when consentida" ON public.reserva_perfis
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.id = reserva_perfis.reserva_id
        AND r.perfil_enviado_ao_estabelecimento = true
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  );

-- ---- 7) Fotos dos quartos ----
-- Mesmo motivo do passo 2: sem isto o dono sem selo cadastra o quarto e não
-- consegue subir foto nenhuma para ele.

DROP POLICY IF EXISTS "Owners upload itens-reservaveis-fotos" ON storage.objects;
CREATE POLICY "Owners upload itens-reservaveis-fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'itens-reservaveis-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.status = 'ativo'
  )
);

DROP POLICY IF EXISTS "Owners update itens-reservaveis-fotos" ON storage.objects;
CREATE POLICY "Owners update itens-reservaveis-fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'itens-reservaveis-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.status = 'ativo'
  )
);

DROP POLICY IF EXISTS "Owners delete itens-reservaveis-fotos" ON storage.objects;
CREATE POLICY "Owners delete itens-reservaveis-fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'itens-reservaveis-fotos'
  AND EXISTS (
    SELECT 1 FROM public.estabelecimentos e
    WHERE e.owner_user_id = auth.uid() AND e.status = 'ativo'
  )
);
