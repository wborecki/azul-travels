-- ============ Pagamento, etapa 7/7 — a reserva não paga libera o quarto ============
-- Ver docs/pagamentos/01-fundacao-de-dados.md, US-1.3
--
-- Um checkout abandonado deixa a reserva parada em `aguardando_pagamento`, e
-- desde a migration 20260814120400 esse estado ocupa unidade. Sem alguém para
-- limpar, um pedido desistido bloquearia o quarto para sempre.
--
-- ---------------------------------------------------------------------------
-- POR QUE A EXPIRAÇÃO NÃO PODE VIR DO ASAAS
--
-- O caminho natural seria usar o `dueDate` da cobrança e reagir ao evento
-- PAYMENT_OVERDUE. Não serve: `dueDate` é uma **data**, não um timestamp. O
-- vencimento mais curto que existe é "hoje", e o OVERDUE só chega depois da
-- virada do dia. Confiar nele significaria segurar o quarto por até 24 horas
-- por causa de alguém que fechou a aba.
--
-- Então o prazo é nosso, e ele é curto. A cobrança órfã do lado do Asaas é
-- cancelada pela etapa 3, quando houver quem chame a API — aqui só se resolve
-- o lado que trava a disponibilidade.
-- ---------------------------------------------------------------------------

-- ============================================================================
-- 1) Auditoria precisa aceitar ação sem ator humano
-- ============================================================================
-- `reservas_auditoria.ator_id` nasceu NOT NULL (20260422172250) porque toda
-- mudança de status vinha de alguém clicando em algo. A expiração não tem
-- ninguém: é o relógio.
--
-- Das duas saídas possíveis, a escolhida foi tornar a coluna anulável e
-- marcar a origem. A alternativa — reservar um UUID de sistema constante —
-- economizaria esta migration, mas colocaria um usuário que não existe em
-- todo relatório de auditoria, e alguém acabaria tentando "descobrir quem é".
--
-- `origem` é derivada, nunca recebida: a trigger abaixo a calcula a partir da
-- presença do ator. As policies de INSERT existentes exigem
-- `ator_id = auth.uid()`, então cliente nenhum consegue produzir uma linha de
-- origem 'sistema'.

ALTER TABLE public.reservas_auditoria ALTER COLUMN ator_id DROP NOT NULL;

ALTER TABLE public.reservas_auditoria
  ADD COLUMN origem text NOT NULL DEFAULT 'humano'
    CHECK (origem IN ('humano', 'sistema'));

ALTER TABLE public.reservas_auditoria
  ADD CONSTRAINT reservas_auditoria_ator_quando_humano
    CHECK (origem = 'sistema' OR ator_id IS NOT NULL);

COMMENT ON COLUMN public.reservas_auditoria.ator_id IS
  'Quem fez a mudança. Nulo apenas quando origem = ''sistema'' (jobs automáticos).';
COMMENT ON COLUMN public.reservas_auditoria.origem IS
  'humano | sistema. Derivada pela trigger a partir da presença de ator_id — não é aceita do cliente.';

-- Extensão de `set_reservas_auditoria_ator_role` (20260706140000): mesma
-- lógica de papel, mais a derivação de `origem`. O corpo original não muda —
-- `has_role(NULL, ...)` e os EXISTS com ator nulo já retornavam false, o que
-- deixa `ator_role` nulo, que é o correto para uma ação de sistema.
CREATE OR REPLACE FUNCTION public.set_reservas_auditoria_ator_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.origem := CASE WHEN NEW.ator_id IS NULL THEN 'sistema' ELSE 'humano' END;

  IF public.has_role(NEW.ator_id, 'admin') THEN
    NEW.ator_role := 'admin';
  ELSIF EXISTS (
    SELECT 1
    FROM public.reservas r
    JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
    WHERE r.id = NEW.reserva_id AND e.owner_user_id = NEW.ator_id
  ) THEN
    NEW.ator_role := 'estabelecimento';
  ELSIF EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.id = NEW.reserva_id AND r.familia_id = NEW.ator_id
  ) THEN
    NEW.ator_role := 'user';
  ELSE
    NEW.ator_role := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2) A função de expiração
-- ============================================================================
-- Idempotente por construção: o filtro é o próprio status. Rodar duas vezes
-- seguidas não encontra nada na segunda, porque a primeira já tirou as linhas
-- de `aguardando_pagamento`.
--
-- Concorrência: duas execuções simultâneas do job disputam as mesmas linhas.
-- A segunda bloqueia no lock de linha do UPDATE, e ao ser liberada reavalia o
-- WHERE — encontrando `cancelada`, não atualiza nada. Nenhuma reserva é
-- cancelada duas vezes, nenhuma linha de auditoria é duplicada.
--
-- O prazo é parâmetro, não constante: ajustar não exige migration nova. Quem
-- decide o valor de produção é `RESERVA_PRAZO_PAGAMENTO_MINUTOS` na etapa 2;
-- o agendamento abaixo usa o mesmo número.

CREATE OR REPLACE FUNCTION public.expirar_reservas_aguardando_pagamento(
  p_prazo_minutos integer DEFAULT 30
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _expiradas uuid[];
  _total integer;
BEGIN
  -- Prazo curto demais cancelaria famílias no meio do Pix. O piso é
  -- deliberadamente conservador; quem quiser testar rápido chama a função com
  -- o valor que quiser, mas não por acidente.
  IF p_prazo_minutos IS NULL OR p_prazo_minutos < 5 THEN
    RAISE EXCEPTION 'Prazo de pagamento precisa ser de pelo menos 5 minutos';
  END IF;

  WITH upd AS (
    UPDATE public.reservas
       SET status = 'cancelada'
     WHERE status = 'aguardando_pagamento'
       AND criado_em < now() - make_interval(mins => p_prazo_minutos)
    RETURNING id
  )
  SELECT coalesce(array_agg(id), '{}'::uuid[]) INTO _expiradas FROM upd;

  _total := coalesce(array_length(_expiradas, 1), 0);

  IF _total = 0 THEN
    RETURN 0;
  END IF;

  -- Só o pagamento ainda em aberto vira `expirado`. Se o webhook chegou entre
  -- o UPDATE acima e esta linha, o pagamento já está `confirmado`/`recebido` e
  -- não deve ser mexido — a reconciliação desse caso (dinheiro entrou numa
  -- reserva que acabou de expirar) é da etapa 3, que trata como estorno.
  UPDATE public.pagamentos
     SET status = 'expirado'
   WHERE reserva_id = ANY(_expiradas)
     AND status = 'pendente';

  INSERT INTO public.reservas_auditoria (
    reserva_id, ator_id, ator_email, acao, status_anterior, status_novo, observacao
  )
  SELECT
    r_id,
    NULL,
    NULL,
    'expirar',
    'aguardando_pagamento',
    'cancelada',
    format('Cancelada automaticamente: pagamento não confirmado em %s minutos.', p_prazo_minutos)
  FROM unnest(_expiradas) AS r_id;

  RETURN _total;
END;
$$;

COMMENT ON FUNCTION public.expirar_reservas_aguardando_pagamento(integer) IS
  'Cancela reservas paradas em aguardando_pagamento além do prazo, marca o pagamento como expirado e registra auditoria de origem sistema. Retorna quantas foram expiradas. Idempotente.';

REVOKE ALL ON FUNCTION public.expirar_reservas_aguardando_pagamento(integer)
  FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 3) Agendamento
-- ============================================================================
-- A cada 5 minutos: com prazo de 30, a família tem entre 30 e 35 minutos de
-- fato. Errar para o lado de segurar o quarto um pouco mais é melhor do que
-- cancelar alguém que estava terminando de pagar.
--
-- Mesmo padrão de `publicar-conteudo-agendado-5min` (20260422214956),
-- inclusive o unschedule idempotente.

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expirar-reservas-nao-pagas-5min') THEN
    PERFORM cron.unschedule('expirar-reservas-nao-pagas-5min');
  END IF;
END $$;

SELECT cron.schedule(
  'expirar-reservas-nao-pagas-5min',
  '*/5 * * * *',
  $$ SELECT public.expirar_reservas_aguardando_pagamento(30); $$
);
