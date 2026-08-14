-- ============ Pagamento, etapa 2/7 — as tabelas e as colunas de valor ============
-- Ver docs/pagamentos/01-fundacao-de-dados.md
--
-- Até aqui `reservas` não tinha nenhuma noção de dinheiro. O total exibido em
-- /reservar (`item.preco * noites`) era calculado na renderização e jogado
-- fora — não existia coluna que registrasse por quanto a reserva foi feita.
--
-- Três coisas nascem aqui:
--
--   pagamentos                    a cobrança no Asaas, espelhada do nosso lado
--   asaas_webhook_events          o log cru dos eventos, que dá idempotência
--   estabelecimento_recebimentos  os dados financeiros privados do local
--
-- Este arquivo NÃO referencia 'aguardando_pagamento' — o valor foi adicionado
-- ao enum na migration anterior e ainda não pode ser usado numa transação que
-- o Postgres considere próxima demais. Aqui só se cria estrutura.

-- ============================================================================
-- 1) Estados de um pagamento
-- ============================================================================
-- `confirmado` e `recebido` são estados diferentes de propósito, não
-- redundância: o Asaas usa CONFIRMED para "pagamento reconhecido" e RECEIVED
-- para "dinheiro liquidado". Num Pix de pessoa física o CONFIRMED pode ser
-- temporário durante análise de prevenção (até 72h) e evoluir para RECEIVED
-- **ou** para REFUNDED. Colapsar os dois em "pago" apagaria essa diferença
-- justo na janela em que ela importa.
--
-- `estorno_solicitado` cobre a janela entre o nosso POST /refund e a chegada
-- do PAYMENT_REFUNDED. É ele que impede o estorno de ser disparado duas vezes
-- (etapa 3). Nasce aqui porque adicionar valor a enum depois exige migration
-- isolada, pela mesma restrição de transação da migration anterior.

CREATE TYPE public.pagamento_status AS ENUM (
  'pendente',
  'confirmado',
  'recebido',
  'expirado',
  'estorno_solicitado',
  'estornado',
  'cancelado',
  'falhou'
);

-- ============================================================================
-- 2) pagamentos
-- ============================================================================

CREATE TABLE public.pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ON DELETE RESTRICT, diferente do resto do schema (que usa CASCADE ou SET
  -- NULL): registro financeiro não desaparece porque alguém apagou a reserva.
  -- Se um dia for preciso apagar uma reserva com pagamento, a decisão tem que
  -- ser consciente e explícita, não um efeito colateral de FK.
  reserva_id uuid NOT NULL REFERENCES public.reservas(id) ON DELETE RESTRICT,

  asaas_payment_id text NOT NULL UNIQUE,
  asaas_customer_id text,

  -- Sandbox e produção compartilham este banco durante o desenvolvimento.
  -- Sem esta coluna não há como distinguir uma cobrança de teste de uma real
  -- num relatório — e é o tipo de confusão que só aparece na conciliação.
  ambiente text NOT NULL CHECK (ambiente IN ('sandbox', 'producao')),

  valor_total numeric(10,2) NOT NULL CHECK (valor_total > 0),
  valor_comissao numeric(10,2) NOT NULL CHECK (valor_comissao >= 0),
  valor_repasse numeric(10,2) NOT NULL CHECK (valor_repasse >= 0),

  wallet_id_destino text,

  status public.pagamento_status NOT NULL DEFAULT 'pendente',
  billing_type text,
  invoice_url text,
  due_date date,
  pago_em timestamptz,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  -- O split do Asaas é emitido em `fixedValue`: o estabelecimento recebe
  -- exatamente `valor_repasse` e a plataforma fica com o resto. Se a soma não
  -- fecha, o que a família paga e o que as duas pontas recebem divergem — e
  -- divergência de centavo em dinheiro de terceiro é problema, não detalhe.
  CONSTRAINT pagamentos_valores_somam
    CHECK (valor_comissao + valor_repasse = valor_total)
);

COMMENT ON TABLE public.pagamentos IS
  'Espelho local da cobrança no Asaas. Escrita apenas por service role (server functions e webhook); o cliente só lê.';
COMMENT ON COLUMN public.pagamentos.asaas_payment_id IS
  'ID da cobrança no Asaas. É a chave de conciliação: o webhook chega com ele e é por ele que se encontra a reserva.';
COMMENT ON COLUMN public.pagamentos.ambiente IS
  'sandbox | producao. Uma cobrança de sandbox nunca deve ser contada como receita.';
COMMENT ON COLUMN public.pagamentos.valor_repasse IS
  'Parte destinada ao estabelecimento — vira o `fixedValue` do split enviado ao Asaas.';
COMMENT ON COLUMN public.pagamentos.wallet_id_destino IS
  'Carteira do estabelecimento no momento da emissão. Guardado aqui porque a carteira pode mudar depois e a cobrança antiga precisa continuar explicável.';
COMMENT ON COLUMN public.pagamentos.pago_em IS
  'Preenchido pelo webhook quando o Asaas confirma. Nulo enquanto a cobrança está em aberto.';

CREATE INDEX idx_pagamentos_reserva ON public.pagamentos (reserva_id);
CREATE INDEX idx_pagamentos_status ON public.pagamentos (status);

-- Uma reserva não pode ter duas cobranças vivas ao mesmo tempo. Este índice é
-- a rede de segurança da idempotência da etapa 2: se um retry do cliente
-- disparar a criação da cobrança duas vezes, a segunda falha no banco em vez
-- de gerar duas faturas para a mesma família. Estados terminais ficam de fora
-- do predicado — uma cobrança expirada não impede nada.
CREATE UNIQUE INDEX idx_pagamentos_um_vivo_por_reserva
  ON public.pagamentos (reserva_id)
  WHERE status IN ('pendente', 'confirmado', 'recebido', 'estorno_solicitado');

-- ============================================================================
-- 3) asaas_webhook_events
-- ============================================================================
-- O Asaas entrega webhook com garantia "pelo menos uma vez": o mesmo evento
-- pode chegar duas vezes, e chega mesmo quando a nossa resposta se perde. A
-- PK ser o `event.id` que eles enviam é o que torna o processamento idempotente
-- — a segunda entrega colide na PK e é descartada sem reprocessar nada.
--
-- O payload cru fica guardado porque a fila do Asaas apaga eventos com mais de
-- 14 dias: se um bug nosso travar o processamento, é daqui que o reprocessamento
-- sai, não de lá.

CREATE TABLE public.asaas_webhook_events (
  id text PRIMARY KEY,
  evento text NOT NULL,
  asaas_payment_id text,
  payload jsonb NOT NULL,
  recebido_em timestamptz NOT NULL DEFAULT now(),
  processado_em timestamptz,
  erro text,
  tentativas integer NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.asaas_webhook_events IS
  'Log cru dos webhooks do Asaas. A PK é o event.id enviado por eles — é o que dá idempotência ao processamento.';
COMMENT ON COLUMN public.asaas_webhook_events.processado_em IS
  'Nulo = ainda não processado ou falhou. A coluna `erro` diz qual dos dois.';

CREATE INDEX idx_asaas_webhook_events_pendentes
  ON public.asaas_webhook_events (recebido_em)
  WHERE processado_em IS NULL;

CREATE INDEX idx_asaas_webhook_events_payment
  ON public.asaas_webhook_events (asaas_payment_id);

-- ============================================================================
-- 4) estabelecimento_recebimentos
-- ============================================================================
-- Tabela 1:1 com `estabelecimentos`, privada.
--
-- Existe separada porque `estabelecimentos` tem leitura anônima para a vitrine
-- ("Public reads active estabelecimentos", migration 20260422163153). CNPJ,
-- data de nascimento do sócio e endereço fiscal não podem morar numa tabela
-- que o mundo lê.

CREATE TABLE public.estabelecimento_recebimentos (
  estabelecimento_id uuid PRIMARY KEY
    REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,

  asaas_wallet_id text,
  asaas_account_id text,
  origem_conta text CHECK (origem_conta IN ('subconta', 'propria')),

  status_onboarding text NOT NULL DEFAULT 'nao_iniciado'
    CHECK (status_onboarding IN ('nao_iniciado', 'enviado', 'ativo', 'recusado')),

  cpf_cnpj text CHECK (cpf_cnpj IS NULL OR cpf_cnpj ~ '^([0-9]{11}|[0-9]{14})$'),
  company_type text CHECK (company_type IN ('MEI', 'LIMITED', 'INDIVIDUAL', 'ASSOCIATION')),
  data_nascimento date,
  telefone_movel text,

  -- O Asaas exige `addressNumber` como campo próprio na criação de subconta,
  -- e `estabelecimentos.endereco` é uma linha só de texto livre. Sem separar,
  -- não há como montar o payload.
  endereco_numero text,
  complemento text,
  bairro text,

  comissao_percentual numeric(5,2)
    CHECK (comissao_percentual IS NULL OR (comissao_percentual >= 0 AND comissao_percentual < 100)),

  observacao text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),

  -- Onboarding "ativo" sem carteira é um estado que mentiria para /reservar:
  -- a tela ofereceria pagamento online e a emissão da cobrança falharia
  -- depois, com a família já comprometida com o pedido.
  CONSTRAINT estab_receb_ativo_exige_wallet
    CHECK (status_onboarding <> 'ativo' OR asaas_wallet_id IS NOT NULL)
);

COMMENT ON TABLE public.estabelecimento_recebimentos IS
  'Dados financeiros privados do estabelecimento. Separada de `estabelecimentos` porque aquela tem leitura anônima para a vitrine.';
COMMENT ON COLUMN public.estabelecimento_recebimentos.asaas_wallet_id IS
  'Destino do split. Sem ele não existe cobrança para este local.';
COMMENT ON COLUMN public.estabelecimento_recebimentos.origem_conta IS
  'subconta = a plataforma criou a conta via POST /v3/accounts. propria = o local informou o walletId de uma conta Asaas que já tinha.';
COMMENT ON COLUMN public.estabelecimento_recebimentos.comissao_percentual IS
  'Override do percentual padrão da plataforma. Nulo = usa o global (env PLATAFORMA_COMISSAO_PERCENTUAL).';

-- Deliberadamente NÃO existe coluna para a apiKey da subconta. O Asaas a
-- devolve uma única vez na criação, mas o split é emitido pela conta da
-- plataforma e só precisa do walletId. Guardar uma chave que dá controle total
-- sobre a conta de um terceiro é risco sem contrapartida. Registrado aqui para
-- que ninguém "conserte" isso depois achando que foi esquecimento.

-- Duas casas não podem apontar para a mesma carteira: seria dinheiro de um
-- caindo na conta do outro, sem nenhum sinal visível de que aconteceu.
CREATE UNIQUE INDEX idx_estab_receb_wallet_unico
  ON public.estabelecimento_recebimentos (asaas_wallet_id)
  WHERE asaas_wallet_id IS NOT NULL;

-- ============================================================================
-- 5) reservas — o valor congelado
-- ============================================================================
-- Nulo é o normal, não a exceção: visita não é cobrada e toda reserva anterior
-- a esta migration não tem valor. Por isso as colunas nascem anuláveis e a
-- regra é de coerência entre elas, não de obrigatoriedade.

ALTER TABLE public.reservas
  ADD COLUMN valor_total numeric(10,2),
  ADD COLUMN valor_comissao numeric(10,2),
  ADD COLUMN valor_repasse numeric(10,2);

COMMENT ON COLUMN public.reservas.valor_total IS
  'Valor cobrado da família, congelado no instante da criação. Se o estabelecimento mudar o preço do quarto depois, a cobrança já emitida não muda junto. Nulo em visita e em reservas anteriores ao pagamento.';
COMMENT ON COLUMN public.reservas.valor_comissao IS
  'Parte retida pela plataforma. Congelada junto com o total.';
COMMENT ON COLUMN public.reservas.valor_repasse IS
  'Parte destinada ao estabelecimento. Vira o fixedValue do split.';

ALTER TABLE public.reservas
  ADD CONSTRAINT reservas_valores_coerentes CHECK (
    (valor_total IS NULL AND valor_comissao IS NULL AND valor_repasse IS NULL)
    OR (
      valor_total IS NOT NULL
      AND valor_comissao IS NOT NULL
      AND valor_repasse IS NOT NULL
      AND valor_comissao + valor_repasse = valor_total
    )
  );

-- ============================================================================
-- 6) estabelecimentos — a única informação financeira pública
-- ============================================================================
-- /reservar precisa saber se o local cobra online para decidir entre o fluxo
-- pago e o pedido gratuito. Consultar `estabelecimento_recebimentos` para isso
-- exigiria abrir a tabela privada. Esta flag é a projeção pública e mínima:
-- diz "aceita" ou "não aceita", e nada mais.

ALTER TABLE public.estabelecimentos
  ADD COLUMN aceita_pagamento_online boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.estabelecimentos.aceita_pagamento_online IS
  'Derivada de estabelecimento_recebimentos (status ativo + carteira). Nunca escrita à mão: a trigger sincronizar_aceita_pagamento_online mantém.';

-- Sincronização a partir da tabela privada.
--
-- Por que AFTER e por que o `IS DISTINCT FROM` na cláusula WHERE: o dono
-- consegue editar os campos cadastrais da própria linha de recebimentos (ver
-- migration 20260814120200), e cada uma dessas edições dispara esta trigger.
-- Sem o filtro, cada edição viraria um UPDATE em `estabelecimentos` rodando
-- sob o auth.uid() do dono — e `protect_estabelecimentos_admin_columns`
-- (logo abaixo) barraria, porque `aceita_pagamento_online` passa a ser coluna
-- de admin. Com o filtro, o UPDATE só acontece quando o valor derivado
-- realmente muda, e quem muda carteira ou status de onboarding é sempre a
-- service role (auth.uid() nulo), para quem a proteção libera.
CREATE OR REPLACE FUNCTION public.sincronizar_aceita_pagamento_online()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _estabelecimento_id uuid;
  _apto boolean;
BEGIN
  -- Num trigger de DELETE o registro NEW não existe, e num de INSERT o OLD não
  -- existe. Ler o campo do lado errado levanta "record is not assigned yet" —
  -- por isso o TG_OP decide antes, em vez de um COALESCE entre os dois.
  IF TG_OP = 'DELETE' THEN
    _estabelecimento_id := OLD.estabelecimento_id;
    _apto := false;
  ELSE
    _estabelecimento_id := NEW.estabelecimento_id;
    _apto := NEW.status_onboarding = 'ativo' AND NEW.asaas_wallet_id IS NOT NULL;
  END IF;

  UPDATE public.estabelecimentos
     SET aceita_pagamento_online = _apto
   WHERE id = _estabelecimento_id
     AND aceita_pagamento_online IS DISTINCT FROM _apto;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sincronizar_aceita_pagamento_online
  AFTER INSERT OR UPDATE OR DELETE ON public.estabelecimento_recebimentos
  FOR EACH ROW EXECUTE FUNCTION public.sincronizar_aceita_pagamento_online();

REVOKE EXECUTE ON FUNCTION public.sincronizar_aceita_pagamento_online()
  FROM PUBLIC, anon, authenticated;

-- `aceita_pagamento_online` entra na lista de colunas que o dono não escreve.
-- Sem isto, um PATCH direto na API REST deixaria o local anunciando pagamento
-- online sem ter carteira nenhuma — e a cobrança falharia só na hora de emitir,
-- com a família já no meio do fluxo.
--
-- Reproduz a versão de 20260804150000 com a linha nova; o corpo restante é
-- idêntico.
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
     OR NEW.aceita_pagamento_online IS DISTINCT FROM OLD.aceita_pagamento_online
  THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar status, destaque, selos ou o recebimento online de um estabelecimento';
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

-- ============================================================================
-- 7) familia_profiles — CPF e cliente Asaas
-- ============================================================================
-- O Asaas exige `cpfCnpj` para criar um customer; sem ele não há cobrança.
-- O CPF mora aqui, e não numa tabela nova, porque `familia_profiles` já é
-- invisível para anônimos e já concentra o dado sensível da família.

ALTER TABLE public.familia_profiles
  ADD COLUMN cpf text CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$'),
  ADD COLUMN asaas_customer_id text;

COMMENT ON COLUMN public.familia_profiles.cpf IS
  'Só dígitos, sem pontuação. Exigido pelo Asaas para criar o customer da cobrança.';
COMMENT ON COLUMN public.familia_profiles.asaas_customer_id IS
  'Customer já criado no Asaas. Evita criar um cliente novo a cada reserva.';

CREATE INDEX idx_familia_profiles_asaas_customer
  ON public.familia_profiles (asaas_customer_id)
  WHERE asaas_customer_id IS NOT NULL;

-- ============================================================================
-- 8) atualizado_em das tabelas novas
-- ============================================================================
-- Mesmo padrão de `touch_explorar_filtros_padrao` (20260422193618): o banco
-- mantém, o cliente não manda.

CREATE OR REPLACE FUNCTION public.touch_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_pagamentos
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.touch_atualizado_em();

CREATE TRIGGER trg_touch_estabelecimento_recebimentos
  BEFORE UPDATE ON public.estabelecimento_recebimentos
  FOR EACH ROW EXECUTE FUNCTION public.touch_atualizado_em();
