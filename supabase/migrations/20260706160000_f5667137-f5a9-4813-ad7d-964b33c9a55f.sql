

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
          AND e.selo_azul = true
          AND e.status = 'ativo'
          AND r.status NOT IN ('cancelada', 'concluida')
      )
    )
  );
