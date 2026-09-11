
ALTER TABLE public.reserva_mensagens REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'reserva_mensagens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reserva_mensagens;
  END IF;
END $$;
