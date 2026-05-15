
-- Estende perfil_sensorial com seções adicionais do Perfil TEA da família
ALTER TABLE public.perfil_sensorial
  -- Necessidades de apoio diário
  ADD COLUMN IF NOT EXISTS apoio_higiene boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS apoio_alimentacao boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS apoio_mobilidade boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS apoio_seguranca boolean DEFAULT false,
  -- Rotina e horários
  ADD COLUMN IF NOT EXISTS rotina_horario_acordar text,
  ADD COLUMN IF NOT EXISTS rotina_horario_dormir text,
  ADD COLUMN IF NOT EXISTS rotina_observacoes text,
  -- Alimentação
  ADD COLUMN IF NOT EXISTS alimentacao_seletiva boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS alimentacao_restricoes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS alimentacao_observacoes text,
  -- Regulação emocional
  ADD COLUMN IF NOT EXISTS gatilhos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS estrategias_acalmar text,
  ADD COLUMN IF NOT EXISTS sinais_sobrecarga text,
  -- Preferências de quarto
  ADD COLUMN IF NOT EXISTS quarto_andar_baixo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quarto_longe_elevador boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quarto_blackout boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quarto_sem_estampas boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quarto_cama_extra boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quarto_observacoes text,
  -- Interesses e estratégias
  ADD COLUMN IF NOT EXISTS interesses_extra text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS estrategias_que_funcionam text;

-- 1 perfil por família (versão atual: 1 filho TEA por conta)
CREATE UNIQUE INDEX IF NOT EXISTS perfil_sensorial_familia_unico
  ON public.perfil_sensorial(familia_id);

-- Estende reservas com objetivo da viagem e acompanhantes
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS objetivo text,
  ADD COLUMN IF NOT EXISTS acompanhantes jsonb DEFAULT '[]'::jsonb;
