-- Verificação automática de integridade referencial.
-- Esta migration NÃO altera schema: apenas valida que as foreign keys
-- críticas para o join /estabelecimento/:slug (avaliações ↔ família ↔
-- estabelecimento) existem. Se alguma estiver ausente, o deploy falha
-- com mensagem clara — evitando que o frontend regrida silenciosamente
-- para payloads `unknown` no PostgREST/Supabase.
--
-- FKs verificadas:
--   1. avaliacoes.familia_id          -> familia_profiles.id
--   2. avaliacoes.estabelecimento_id  -> estabelecimentos.id
--   3. reservas.familia_id            -> familia_profiles.id
--   4. reservas.estabelecimento_id    -> estabelecimentos.id
--   5. reservas.perfil_sensorial_id   -> perfil_sensorial.id
--   6. perfil_sensorial.familia_id    -> familia_profiles.id

DO $$
DECLARE
  expected RECORD;
  found_count INT;
  missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR expected IN
    SELECT * FROM (VALUES
      ('avaliacoes',       'familia_id',          'familia_profiles', 'id'),
      ('avaliacoes',       'estabelecimento_id',  'estabelecimentos', 'id'),
      ('reservas',         'familia_id',          'familia_profiles', 'id'),
      ('reservas',         'estabelecimento_id',  'estabelecimentos', 'id'),
      ('reservas',         'perfil_sensorial_id', 'perfil_sensorial', 'id'),
      ('perfil_sensorial', 'familia_id',          'familia_profiles', 'id')
    ) AS t(src_table, src_col, ref_table, ref_col)
  LOOP
    SELECT COUNT(*) INTO found_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema    = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema    = 'public'
      AND tc.table_name      = expected.src_table
      AND kcu.column_name    = expected.src_col
      AND ccu.table_name     = expected.ref_table
      AND ccu.column_name    = expected.ref_col;

    IF found_count = 0 THEN
      missing := array_append(
        missing,
        format('%s.%s -> %s.%s',
               expected.src_table, expected.src_col,
               expected.ref_table, expected.ref_col)
      );
    END IF;
  END LOOP;

  IF array_length(missing, 1) > 0 THEN
    RAISE EXCEPTION
      E'Foreign keys ausentes — Supabase types vão regredir para `unknown` em joins:\n  - %',
      array_to_string(missing, E'\n  - ');
  END IF;
END
$$;