-- ============================================================================
-- Fix: recursão infinita (42P17) entre policies de reserva_perfis e
-- perfil_sensorial.
--
-- O WITH CHECK de "Family manages own reserva_perfis" consulta
-- perfil_sensorial, e a policy "Owner reads perfil_sensorial when reserva
-- consentida" consulta reserva_perfis de volta. Como policies também se
-- aplicam às subqueries dentro de outras policies, o Postgres detecta o ciclo.
-- Quebramos as duas arestas com funções SECURITY DEFINER (mesmo padrão do
-- has_role), que fazem o lookup sem reavaliar RLS.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.perfil_pertence_a_familia(_perfil_id uuid, _familia_id uuid)
RETURNS boolean
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfil_sensorial
    WHERE id = _perfil_id AND familia_id = _familia_id
  );
$$;

CREATE OR REPLACE FUNCTION public.perfil_vinculado_a_reserva(_reserva_id uuid, _perfil_id uuid)
RETURNS boolean
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reserva_perfis
    WHERE reserva_id = _reserva_id AND perfil_sensorial_id = _perfil_id
  );
$$;

DROP POLICY IF EXISTS "Family manages own reserva_perfis" ON public.reserva_perfis;
CREATE POLICY "Family manages own reserva_perfis" ON public.reserva_perfis
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = reserva_perfis.reserva_id AND r.familia_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = reserva_perfis.reserva_id AND r.familia_id = auth.uid()
    )
    AND public.perfil_pertence_a_familia(reserva_perfis.perfil_sensorial_id, auth.uid())
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
        AND e.selo_azul = true
        AND e.status = 'ativo'
    )
  );
