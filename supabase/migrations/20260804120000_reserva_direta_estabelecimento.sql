-- ============ Reserva direta de estabelecimento (Fase A) ============
-- Até aqui toda reserva passava por um item reservável, que na prática é um
-- quarto de hotel. Um restaurante não tem o que colocar nesse lugar - e não
-- deve ter: mesa é detalhe operacional interno dele, não oferta de vitrine.
--
-- Passam a existir duas naturezas de reserva:
--
--   estadia  item_reservavel_id preenchido, data_checkin -> data_checkout
--   visita   sem item, no estabelecimento, data_checkin + hora_visita
--
-- A natureza é derivada do tipo do estabelecimento (`TIPO_PARA_CATEGORIA` em
-- src/lib/enums.ts): categoria `hospedagem` reserva quarto, o resto reserva
-- a visita. Hospedagem continua exigindo item - um hotel sem quarto escolhido
-- não é uma reserva.
--
-- Não há disponibilidade a calcular na visita: o pedido chega como `pendente`
-- e o estabelecimento confirma ou recusa no painel que já existe. A trigger
-- `checar_disponibilidade_item_reservavel` já retorna cedo quando não há item
-- (migration 20260715220000), então nada muda nela.
--
-- Ver docs/plano-reserva-direta-estabelecimento.md, seção A1.

ALTER TABLE public.reservas ADD COLUMN hora_visita time;

COMMENT ON COLUMN public.reservas.hora_visita IS
  'Horário pedido para a visita. Preenchido apenas quando item_reservavel_id é nulo (visita); sempre nulo em estadia.';

COMMENT ON COLUMN public.reservas.data_checkin IS
  'Estadia: dia do check-in. Visita: o dia da visita. É sempre "a data da reserva", o que mantém os painéis ordenando e filtrando por uma coluna só.';

COMMENT ON COLUMN public.reservas.data_checkout IS
  'Apenas em estadia. `data_checkout IS NULL` numa reserva viva é o marcador de que a reserva é uma visita. (Reservas históricas podem ter perdido o item por ON DELETE SET NULL sem serem visitas - por isso a regra vale na criação, via trigger, e não como CHECK.)';

-- ---- Inversão da derivação do estabelecimento ----
-- Com item, o estabelecimento vem do item (comportamento atual). Sem item, o
-- caminho se inverte: o estabelecimento vem direto do cliente e não há o que
-- derivar - só o que validar.
--
-- O ramo de UPDATE sem item continua intocado: é por ele que passa o UPDATE
-- disparado pelo `ON DELETE SET NULL` quando um quarto com reservas
-- históricas é excluído.

CREATE OR REPLACE FUNCTION public.sincronizar_estabelecimento_id_reserva()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tipo public.estab_tipo;
  _status public.estab_status;
  _selo boolean;
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

    SELECT tipo, status, coalesce(selo_azul, false)
      INTO _tipo, _status, _selo
    FROM public.estabelecimentos
    WHERE id = NEW.estabelecimento_id;

    IF _tipo IS NULL THEN
      RAISE EXCEPTION 'Estabelecimento não encontrado'
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF _tipo IN ('hotel', 'pousada', 'resort') THEN
      RAISE EXCEPTION 'Este tipo de estabelecimento exige a escolha de um quarto'
        USING ERRCODE = 'check_violation', HINT = 'HOSPEDAGEM_EXIGE_ITEM';
    END IF;

    -- Mesmo gate que a hospedagem já tinha de fato: a RLS de
    -- `itens_reservaveis` só expõe itens de local ativo e com Selo Azul, então
    -- nunca houve reserva fora disso. A visita não passa por item nenhum, logo
    -- a regra precisa ser dita aqui - senão o selo deixaria de valer para
    -- restaurante, parque e passeio.
    IF _status <> 'ativo' OR NOT _selo THEN
      RAISE EXCEPTION 'Este estabelecimento não está aberto para reservas'
        USING ERRCODE = 'check_violation', HINT = 'ESTAB_SEM_SELO_ATIVO';
    END IF;

    RETURN NEW;
  END IF;

  SELECT estabelecimento_id INTO NEW.estabelecimento_id
  FROM public.itens_reservaveis
  WHERE id = NEW.item_reservavel_id;

  RETURN NEW;
END;
$$;

-- ---- Um pedido em aberto por família, local e dia ----
-- Sem controle de disponibilidade, nada impediria a mesma família de abrir
-- dez pedidos para o mesmo restaurante no mesmo dia. O índice cobre só as
-- visitas vivas: estadias seguem governadas pela trigger de disponibilidade,
-- e reservas canceladas/concluídas não bloqueiam um novo pedido.
--
-- O predicado usa `hora_visita IS NOT NULL`, não a ausência de item. São
-- coisas diferentes: uma estadia cujo quarto foi excluído fica com
-- `item_reservavel_id` nulo (ON DELETE SET NULL, migration 20260715220000) e
-- continua sendo estadia. Se duas dessas estadias órfãs, ainda pendentes ou
-- confirmadas, coincidirem em família, local e data, um índice baseado só na
-- ausência de item falharia na criação e derrubaria esta migration inteira.
-- `hora_visita` é o mesmo discriminador que `reservaEhVisita` usa no cliente.

CREATE UNIQUE INDEX idx_reservas_visita_unica_por_dia
  ON public.reservas (familia_id, estabelecimento_id, data_checkin)
  WHERE hora_visita IS NOT NULL
    AND status IN ('pendente', 'confirmada');
