-- =========================================
-- Tabela: perfil_tea
-- =========================================
CREATE TABLE public.perfil_tea (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome_pessoa text NOT NULL,
  idade integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Comunicação
  forma_comunicacao text[] NOT NULL DEFAULT '{}',
  comunicacao_misto_descricao text,
  compreende_instrucoes text,
  responde_melhor_a text,
  recursos_comunicacao text[] NOT NULL DEFAULT '{}',
  observacoes_comunicacao text,

  -- Apoio diário
  apoio_alimentacao text,
  apoio_higiene text,
  apoio_vestir text,
  apoio_deslocamento text,
  apoio_regras text,
  autonomia_espacos text,
  supervisao_constante boolean DEFAULT false,

  -- Rotina
  horario_acordar time,
  horario_cafe time,
  horario_almoco time,
  horario_lanche time,
  horario_jantar time,
  horario_dormir time,
  tem_rotina_matinal boolean DEFAULT false,
  rotina_matinal_descricao text,
  mudanca_rotina_sofrimento boolean DEFAULT false,

  -- Alimentação
  seletividade text,
  alimentos_aceitos text,
  alimentos_recusados text,
  sensibilidades_alimentares text[] NOT NULL DEFAULT '{}',
  espera_fila_restaurante text,
  prefere_ambiente_reservado boolean DEFAULT false,
  utensilios_especificos boolean DEFAULT false,
  marca_favorece_aceitacao text,
  risco_recusa_alimentar text,

  -- Perfil sensorial (14 itens)
  sensorial_barulho_pessoas text,
  sensorial_musica_ambiente text,
  sensorial_sons_subitos text,
  sensorial_eco text,
  sensorial_cheiros_fortes text,
  sensorial_perfumes text,
  sensorial_iluminacao_intensa text,
  sensorial_luz_piscando text,
  sensorial_calor text,
  sensorial_frio text,
  sensorial_toque_inesperado text,
  sensorial_superficies_molhadas text,
  sensorial_locais_cheios text,
  sensorial_movimento_visual text,
  usa_abafadores text,
  abafadores_descricao text,
  gatilho_sensorial text,
  estimulos_acalmam text,

  -- Regulação emocional
  sinais_desconforto text[] NOT NULL DEFAULT '{}',
  desencadeadores text,
  tempo_acalmar text,
  estrategias_funcionam text[] NOT NULL DEFAULT '{}',
  o_que_nao_fazer text,
  risco_fuga boolean DEFAULT false,
  preferencia_crise text[] NOT NULL DEFAULT '{}',

  -- Quarto
  preferencia_localizacao text,
  sensibilidade_ar_condicionado boolean DEFAULT false,
  sensibilidade_iluminacao boolean DEFAULT false,
  dorme_melhor_com text[] NOT NULL DEFAULT '{}',
  objetos_adaptacao text,
  preparacao_especial_quarto text,

  -- Áreas comuns
  gosta_piscina text,
  piscina_muitas_pessoas boolean DEFAULT false,
  piscina_temperatura boolean DEFAULT false,
  piscina_supervisao boolean DEFAULT false,
  piscina_horario_tranquilo boolean DEFAULT false,
  recreacao_gosta boolean DEFAULT false,
  recreacao_preferencia text,
  recreacao_tolera_som boolean DEFAULT false,
  recreacao_interesses text,
  recreacao_evitar text,
  restaurante_fila text,
  restaurante_reservado boolean DEFAULT false,
  restaurante_apoio_visual boolean DEFAULT false,
  restaurante_horario_tranquilo boolean DEFAULT false,
  checkin_ansiedade boolean DEFAULT false,
  checkin_evitar_fila boolean DEFAULT false,
  checkin_equipe_saber boolean DEFAULT false,

  -- Interesses
  atividades_preferidas text,
  temas_interesses text,
  objetos_personagens text,
  o_que_gera_alegria text,
  estrategias_ambientes_novos text,
  formas_abordagem text
);

CREATE INDEX idx_perfil_tea_user_id ON public.perfil_tea(user_id);

ALTER TABLE public.perfil_tea ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family selects own perfil_tea"
  ON public.perfil_tea FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Family inserts own perfil_tea"
  ON public.perfil_tea FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family updates own perfil_tea"
  ON public.perfil_tea FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family deletes own perfil_tea"
  ON public.perfil_tea FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all perfil_tea"
  ON public.perfil_tea FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.touch_perfil_tea_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_perfil_tea_updated_at
  BEFORE UPDATE ON public.perfil_tea
  FOR EACH ROW EXECUTE FUNCTION public.touch_perfil_tea_updated_at();

-- =========================================
-- Estende reservas com novos campos
-- =========================================
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS perfil_tea_id uuid REFERENCES public.perfil_tea(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS num_acompanhantes integer,
  ADD COLUMN IF NOT EXISTS pessoa_referencia text,
  ADD COLUMN IF NOT EXISTS objetivo_viagem text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notas_especificas text,
  ADD COLUMN IF NOT EXISTS historico_negativo text,
  ADD COLUMN IF NOT EXISTS recomendacoes_adicionais text,
  ADD COLUMN IF NOT EXISTS conversa_previa_equipe boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_reservas_perfil_tea_id ON public.reservas(perfil_tea_id);