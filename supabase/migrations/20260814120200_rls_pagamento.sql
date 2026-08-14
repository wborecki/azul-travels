-- ============ Pagamento, etapa 3/7 — RLS ============
-- Ver docs/pagamentos/01-fundacao-de-dados.md, US-1.4 e US-1.5
--
-- Regra geral das tabelas de dinheiro: **ninguém escreve pelo cliente.**
-- `pagamentos` e `asaas_webhook_events` só recebem escrita da service role
-- (server functions da etapa 2 e Edge Function do webhook na etapa 3), que
-- passa por cima da RLS. Não ter policy de INSERT/UPDATE/DELETE não é
-- esquecimento: é o mecanismo.
--
-- `estabelecimento_recebimentos` é a exceção parcial — o dono preenche os
-- próprios dados cadastrais lá. As colunas que decidem para onde o dinheiro
-- vai continuam fora do alcance dele, via trigger no fim deste arquivo.
--
-- Este arquivo também corrige um buraco que já existia antes do pagamento
-- (seção 4).

-- ============================================================================
-- 1) pagamentos — leitura por quem tem interesse legítimo
-- ============================================================================

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family reads own pagamentos" ON public.pagamentos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = pagamentos.reserva_id
        AND r.familia_id = auth.uid()
    )
  );

-- O dono precisa ver quanto entrou e quando, mas pelo caminho da reserva —
-- nunca por acesso direto à tabela. Mesmo gate de `status = 'ativo'` das
-- policies de reservas do dono (20260810120000).
CREATE POLICY "Owner reads pagamentos of own estab" ON public.pagamentos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reservas r
      JOIN public.estabelecimentos e ON e.id = r.estabelecimento_id
      WHERE r.id = pagamentos.reserva_id
        AND e.owner_user_id = auth.uid()
        AND e.status = 'ativo'
    )
  );

CREATE POLICY "Admins read all pagamentos" ON public.pagamentos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 2) asaas_webhook_events — só admin lê
-- ============================================================================
-- Log de infraestrutura, com payload cru de terceiro dentro. Não há caso de
-- uso de família nem de dono aqui.

ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read asaas_webhook_events" ON public.asaas_webhook_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 3) estabelecimento_recebimentos — o dono cuida da própria linha
-- ============================================================================

ALTER TABLE public.estabelecimento_recebimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own recebimentos" ON public.estabelecimento_recebimentos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = estabelecimento_recebimentos.estabelecimento_id
        AND e.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Owner creates own recebimentos" ON public.estabelecimento_recebimentos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = estabelecimento_recebimentos.estabelecimento_id
        AND e.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Owner updates own recebimentos" ON public.estabelecimento_recebimentos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = estabelecimento_recebimentos.estabelecimento_id
        AND e.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.estabelecimentos e
      WHERE e.id = estabelecimento_recebimentos.estabelecimento_id
        AND e.owner_user_id = auth.uid()
    )
  );

-- Sem policy de DELETE de propósito: apagar a linha derruba
-- `aceita_pagamento_online` e desliga o recebimento do local. Se isso um dia
-- for um fluxo de produto, vira botão explícito passando por server function.

CREATE POLICY "Admins manage recebimentos" ON public.estabelecimento_recebimentos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---- O dono escreve o cadastro, não a decisão financeira ----
-- A policy acima libera a linha inteira. Quatro colunas não podem estar nesse
-- pacote:
--
--   asaas_wallet_id      é para onde o dinheiro vai
--   asaas_account_id     é a identidade da subconta no Asaas
--   status_onboarding    é o que liga `aceita_pagamento_online`
--   comissao_percentual  é quanto a plataforma cobra
--
-- Um dono que pudesse escrever as três primeiras se autoaprovaria e passaria
-- a receber cobranças sem nenhuma validação; a quarta é acordo comercial, não
-- campo de formulário. Todas passam por service role (etapa 4) ou por admin.
--
-- Mesmo padrão de `protect_reservas_estab_owner_columns` (20260706140000).
CREATE OR REPLACE FUNCTION public.protect_recebimentos_colunas_financeiras()
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

  IF TG_OP = 'INSERT' THEN
    IF NEW.asaas_wallet_id IS NOT NULL
       OR NEW.asaas_account_id IS NOT NULL
       OR NEW.status_onboarding <> 'nao_iniciado'
       OR NEW.comissao_percentual IS NOT NULL
    THEN
      RAISE EXCEPTION 'Carteira, conta Asaas, status de onboarding e comissão são definidos pela plataforma'
        USING ERRCODE = 'check_violation', HINT = 'RECEBIMENTO_COLUNA_RESERVADA';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.asaas_wallet_id     IS DISTINCT FROM OLD.asaas_wallet_id
     OR NEW.asaas_account_id   IS DISTINCT FROM OLD.asaas_account_id
     OR NEW.status_onboarding  IS DISTINCT FROM OLD.status_onboarding
     OR NEW.comissao_percentual IS DISTINCT FROM OLD.comissao_percentual
  THEN
    RAISE EXCEPTION 'Carteira, conta Asaas, status de onboarding e comissão são definidos pela plataforma'
      USING ERRCODE = 'check_violation', HINT = 'RECEBIMENTO_COLUNA_RESERVADA';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_recebimentos_colunas_financeiras
  BEFORE INSERT OR UPDATE ON public.estabelecimento_recebimentos
  FOR EACH ROW EXECUTE FUNCTION public.protect_recebimentos_colunas_financeiras();

REVOKE EXECUTE ON FUNCTION public.protect_recebimentos_colunas_financeiras()
  FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 4) Correção: "Family updates own reservas" nunca teve WITH CHECK
-- ============================================================================
-- A policy foi criada em 20260422163153 com USING e sem WITH CHECK. Numa
-- policy de UPDATE, `USING` decide quais linhas podem ser alcançadas e
-- `WITH CHECK` decide como a linha pode ficar depois. Sem o segundo, o
-- Postgres reaproveita o primeiro para a linha nova — o que aqui até funciona
-- (a família continuaria dona), mas deixa a intenção implícita e frágil a
-- qualquer edição futura da policy.
--
-- O buraco de verdade nunca foi a policy: era não haver nada impedindo a
-- família de escrever `status` direto pela API REST. Enquanto reserva era
-- pedido gratuito, isso era mau comportamento; com pagamento, vira
-- "confirmar a reserva sem pagar". A trava está na migration seguinte
-- (20260814120300); aqui fica a higiene.

DROP POLICY IF EXISTS "Family updates own reservas" ON public.reservas;

CREATE POLICY "Family updates own reservas" ON public.reservas
  FOR UPDATE TO authenticated
  USING (auth.uid() = familia_id)
  WITH CHECK (auth.uid() = familia_id);
