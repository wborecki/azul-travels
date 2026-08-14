-- ============ Pagamento, etapa 4/7 — a trava do status pelo lado da família ============
-- Ver docs/pagamentos/01-fundacao-de-dados.md, US-1.4
--
-- `protect_reservas_estab_owner_columns` (20260706140000) tranca as colunas do
-- lado do dono, e tem uma saída explícita logo no começo:
--
--     IF auth.uid() = OLD.familia_id THEN RETURN NEW; END IF;
--     -- família dona da reserva: comportamento pré-existente, sem restrição extra.
--
-- Aquele comentário descrevia a realidade da época: uma reserva era um pedido
-- de contato, o pior que a família podia fazer era bagunçar o próprio pedido.
-- Com dinheiro envolvido, "sem restrição extra" passa a significar que uma
-- família autenticada pode fazer
--
--     PATCH /rest/v1/reservas?id=eq.<id>  { "status": "pendente" }
--
-- e pular o pagamento inteiro — a policy "Family updates own reservas" libera
-- a linha, e `validar_transicao_reserva_status` aceita a transição porque ela
-- é legítima quando quem faz é o webhook.
--
-- A diferença entre as duas não é a transição, é quem está pedindo. É isso que
-- esta trigger checa.
--
-- Escopo: a família não altera NENHUMA coluna de reserva pelo cliente hoje —
-- `src/lib/queries/reservas.ts` só insere e lê. Então travar tudo não quebra
-- nada existente, e é a postura certa: o que a família precisar mudar amanhã
-- (cancelar o próprio pedido, por exemplo) passa a exigir uma decisão
-- explícita aqui, em vez de já estar aberto por omissão.

CREATE OR REPLACE FUNCTION public.protect_reservas_familia_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _key text;
  _old jsonb;
  _new jsonb;
BEGIN
  -- auth.uid() nulo = service role / conexão direta (server functions da etapa
  -- 2, Edge Function do webhook, job de expiração, migrations) → liberado.
  -- É por este caminho que o status legitimamente muda.
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Não é a família dona: quem trata é a trigger do dono.
  IF auth.uid() IS DISTINCT FROM OLD.familia_id THEN
    RETURN NEW;
  END IF;

  _old := to_jsonb(OLD);
  _new := to_jsonb(NEW);

  FOR _key IN SELECT jsonb_object_keys(_new) LOOP
    IF (_old -> _key) IS DISTINCT FROM (_new -> _key) THEN
      RAISE EXCEPTION 'A reserva não pode ser alterada por aqui — fale com o estabelecimento'
        USING ERRCODE = 'check_violation', HINT = 'RESERVA_SOMENTE_LEITURA_FAMILIA';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Nome ordenado depois de `trg_protect_reservas_estab_owner_columns`: o
-- Postgres dispara triggers BEFORE em ordem alfabética de nome. Aqui a ordem
-- é indiferente (as duas saem cedo para o papel da outra), mas deixar
-- previsível ajuda quem for depurar.
DROP TRIGGER IF EXISTS trg_protect_reservas_familia_columns ON public.reservas;
CREATE TRIGGER trg_protect_reservas_familia_columns
  BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.protect_reservas_familia_columns();

REVOKE EXECUTE ON FUNCTION public.protect_reservas_familia_columns()
  FROM PUBLIC, anon, authenticated;
