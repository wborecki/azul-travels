-- ============================================================================
-- Perfil TEA alinhado ao Pré-Check-in (Apostila do Concierge, seções 2 a 10)
--
-- `perfil_sensorial` absorve as colunas de `perfil_tea`, que nunca teve
-- formulário escrevendo nela. As seções 1 e 11 do PDF são por hospedagem e já
-- moram em `reservas` / `familia_profiles` - não entram aqui.
--
-- Os booleans antigos (`sensivel_*`, `apoio_*`, ...) deixam de ser perguntados
-- e passam a ser derivados por trigger das respostas de resolução alta, para a
-- família não responder a mesma coisa duas vezes. Todos os consumidores atuais
-- (matching, chips de resumo, admin) continuam lendo os mesmos campos.
-- ============================================================================

-- ============ 1) Escalas recorrentes ============

CREATE TYPE public.nivel_apoio AS ENUM ('independente', 'apoio_parcial', 'apoio_total');
CREATE TYPE public.intensidade_incomodo AS ENUM ('baixo', 'medio', 'alto', 'depende');
CREATE TYPE public.resposta_parcial AS ENUM ('sim', 'parcialmente', 'nao');
CREATE TYPE public.resposta_com_apoio AS ENUM ('sim', 'nao', 'com_apoio');
CREATE TYPE public.seletividade_nivel AS ENUM ('nao', 'leve', 'moderada', 'severa');
CREATE TYPE public.tempo_acalmar_faixa AS ENUM ('rapido', 'medio', 'longo');
CREATE TYPE public.risco_nivel AS ENUM ('alto', 'medio', 'baixo');
CREATE TYPE public.frequencia_simples AS ENUM ('sim', 'nao', 'as_vezes');

-- ============ 2) Colunas novas ============

ALTER TABLE public.perfil_sensorial
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),

  -- § 2 Comunicação e compreensão
  ADD COLUMN IF NOT EXISTS forma_comunicacao text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS comunicacao_misto_descricao text,
  ADD COLUMN IF NOT EXISTS compreende_instrucoes public.resposta_parcial,
  ADD COLUMN IF NOT EXISTS responde_melhor_a text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recursos_comunicacao text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS observacoes_comunicacao text,

  -- § 3 Necessidades de apoio diário
  ADD COLUMN IF NOT EXISTS apoio_alimentacao_nivel public.nivel_apoio,
  ADD COLUMN IF NOT EXISTS apoio_higiene_nivel public.nivel_apoio,
  ADD COLUMN IF NOT EXISTS apoio_vestir_nivel public.nivel_apoio,
  ADD COLUMN IF NOT EXISTS apoio_deslocamento_nivel public.nivel_apoio,
  ADD COLUMN IF NOT EXISTS apoio_regras_nivel public.nivel_apoio,
  ADD COLUMN IF NOT EXISTS apoio_observacoes text,
  ADD COLUMN IF NOT EXISTS autonomia_espacos public.resposta_parcial,
  ADD COLUMN IF NOT EXISTS supervisao_constante boolean,

  -- § 4 Rotina e horários (acordar/dormir já existem)
  ADD COLUMN IF NOT EXISTS rotina_horario_cafe text,
  ADD COLUMN IF NOT EXISTS rotina_horario_almoco text,
  ADD COLUMN IF NOT EXISTS rotina_horario_lanche text,
  ADD COLUMN IF NOT EXISTS rotina_horario_jantar text,
  ADD COLUMN IF NOT EXISTS tem_rotina_matinal boolean,
  ADD COLUMN IF NOT EXISTS rotina_matinal_descricao text,

  -- § 5 Alimentação
  ADD COLUMN IF NOT EXISTS seletividade public.seletividade_nivel,
  ADD COLUMN IF NOT EXISTS alimentos_aceitos text,
  ADD COLUMN IF NOT EXISTS alimentos_recusados text,
  ADD COLUMN IF NOT EXISTS sensibilidades_alimentares text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS espera_fila_restaurante public.resposta_com_apoio,
  ADD COLUMN IF NOT EXISTS prefere_ambiente_reservado boolean,
  ADD COLUMN IF NOT EXISTS utensilios_especificos boolean,
  ADD COLUMN IF NOT EXISTS marca_favorece_aceitacao text,
  ADD COLUMN IF NOT EXISTS risco_recusa_alimentar public.risco_nivel,

  -- § 6 Perfil sensorial - 14 estímulos
  ADD COLUMN IF NOT EXISTS sensorial_barulho_pessoas public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_musica_ambiente public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_sons_subitos public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_eco public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_cheiros_fortes public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_perfumes public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_iluminacao_intensa public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_luz_piscando public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_calor public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_frio public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_toque_inesperado public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_superficies_molhadas public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_locais_cheios public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS sensorial_movimento_visual public.intensidade_incomodo,
  ADD COLUMN IF NOT EXISTS usa_abafadores boolean,
  ADD COLUMN IF NOT EXISTS abafadores_descricao text,

  -- § 7 Regulação emocional e comportamento
  ADD COLUMN IF NOT EXISTS sinais_desconforto text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tempo_acalmar public.tempo_acalmar_faixa,
  ADD COLUMN IF NOT EXISTS estrategias_funcionam text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS o_que_nao_fazer text,
  ADD COLUMN IF NOT EXISTS risco_fuga boolean,
  ADD COLUMN IF NOT EXISTS preferencia_crise text[] NOT NULL DEFAULT '{}',

  -- § 8 Preferências no quarto
  ADD COLUMN IF NOT EXISTS quarto_localizacao text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sensibilidade_ar_condicionado boolean,
  ADD COLUMN IF NOT EXISTS sensibilidade_iluminacao boolean,
  ADD COLUMN IF NOT EXISTS dorme_melhor_com text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS objetos_adaptacao text,
  ADD COLUMN IF NOT EXISTS preparacao_especial_quarto text,

  -- § 9 Áreas comuns
  ADD COLUMN IF NOT EXISTS areas_usadas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gosta_piscina public.frequencia_simples,
  ADD COLUMN IF NOT EXISTS piscina_muitas_pessoas boolean,
  ADD COLUMN IF NOT EXISTS piscina_temperatura boolean,
  ADD COLUMN IF NOT EXISTS piscina_supervisao boolean,
  ADD COLUMN IF NOT EXISTS piscina_horario_tranquilo boolean,
  ADD COLUMN IF NOT EXISTS recreacao_gosta boolean,
  ADD COLUMN IF NOT EXISTS recreacao_preferencia text,
  ADD COLUMN IF NOT EXISTS recreacao_tolera_som boolean,
  ADD COLUMN IF NOT EXISTS recreacao_interesses text,
  ADD COLUMN IF NOT EXISTS recreacao_evitar text,
  ADD COLUMN IF NOT EXISTS restaurante_fila public.resposta_com_apoio,
  ADD COLUMN IF NOT EXISTS restaurante_reservado boolean,
  ADD COLUMN IF NOT EXISTS restaurante_apoio_visual boolean,
  ADD COLUMN IF NOT EXISTS restaurante_horario_tranquilo boolean,
  ADD COLUMN IF NOT EXISTS checkin_ansiedade boolean,
  ADD COLUMN IF NOT EXISTS checkin_evitar_fila boolean,
  ADD COLUMN IF NOT EXISTS checkin_equipe_saber boolean,

  -- § 10 Interesses e estratégias positivas
  ADD COLUMN IF NOT EXISTS atividades_preferidas text,
  ADD COLUMN IF NOT EXISTS objetos_personagens text,
  ADD COLUMN IF NOT EXISTS o_que_gera_alegria text,
  ADD COLUMN IF NOT EXISTS formas_abordagem text;

COMMENT ON COLUMN public.perfil_sensorial.o_que_nao_fazer IS
  'Pré-Check-in § 7. Informação de segurança: a equipe precisa ler antes da chegada.';
COMMENT ON COLUMN public.perfil_sensorial.risco_fuga IS
  'Pré-Check-in § 7. Informação de segurança: a equipe precisa ler antes da chegada.';
COMMENT ON COLUMN public.perfil_sensorial.areas_usadas IS
  'Triagem de § 9: piscina | recreacao | restaurante. Só os marcados abrem perguntas.';

-- ============ 3) Backfill dos perfis legados ============
-- Os booleans antigos viram respostas de resolução alta ANTES da trigger de
-- derivação passar a valer - senão a primeira gravação os zeraria.

UPDATE public.perfil_sensorial SET
  sensorial_barulho_pessoas = CASE WHEN sensivel_sons THEN 'alto' ELSE 'baixo' END::public.intensidade_incomodo,
  sensorial_sons_subitos    = CASE WHEN sensivel_sons THEN 'alto' ELSE 'baixo' END::public.intensidade_incomodo,
  sensorial_cheiros_fortes  = CASE WHEN sensivel_cheiros THEN 'alto' ELSE 'baixo' END::public.intensidade_incomodo,
  sensorial_perfumes        = CASE WHEN sensivel_cheiros THEN 'alto' ELSE 'baixo' END::public.intensidade_incomodo,
  sensorial_iluminacao_intensa = CASE WHEN sensivel_luz THEN 'alto' ELSE 'baixo' END::public.intensidade_incomodo,
  sensorial_toque_inesperado = CASE WHEN sensivel_texturas THEN 'alto' ELSE 'baixo' END::public.intensidade_incomodo,
  sensorial_locais_cheios   = CASE WHEN sensivel_multidao THEN 'alto' ELSE 'baixo' END::public.intensidade_incomodo,
  apoio_alimentacao_nivel   = CASE WHEN apoio_alimentacao THEN 'apoio_parcial' ELSE 'independente' END::public.nivel_apoio,
  apoio_higiene_nivel       = CASE WHEN apoio_higiene THEN 'apoio_parcial' ELSE 'independente' END::public.nivel_apoio,
  apoio_deslocamento_nivel  = CASE WHEN apoio_mobilidade THEN 'apoio_parcial' ELSE 'independente' END::public.nivel_apoio,
  supervisao_constante      = COALESCE(apoio_seguranca, false),
  seletividade              = CASE WHEN alimentacao_seletiva THEN 'moderada' ELSE 'nao' END::public.seletividade_nivel,
  restaurante_apoio_visual  = COALESCE(precisa_cardapio_visual, false),
  quarto_localizacao        = ARRAY(
    SELECT v FROM (VALUES
      ('andar_terreo', COALESCE(quarto_andar_baixo, false)),
      ('longe_barulho', COALESCE(quarto_longe_elevador, false))
    ) AS t(v, ativo) WHERE ativo
  ),
  dorme_melhor_com          = CASE WHEN quarto_blackout THEN ARRAY['escuro_total'] ELSE '{}'::text[] END,
  forma_comunicacao         = CASE WHEN comunicacao_verbal THEN ARRAY['verbal_fluente'] ELSE '{}'::text[] END,
  recursos_comunicacao      = ARRAY(
    SELECT v FROM (VALUES
      ('prancha', COALESCE(usa_caa, false)),
      ('libras', COALESCE(usa_libras, false))
    ) AS t(v, ativo) WHERE ativo
  );

-- `perfil_tea` nunca recebeu dados reais em produção; se alguma linha existir
-- em ambiente de dev, ela é migrada casando pelo nome dentro da mesma família.
UPDATE public.perfil_sensorial ps SET
  comunicacao_misto_descricao = COALESCE(pt.comunicacao_misto_descricao, ps.comunicacao_misto_descricao),
  observacoes_comunicacao     = COALESCE(pt.observacoes_comunicacao, ps.observacoes_comunicacao),
  rotina_horario_cafe         = COALESCE(pt.horario_cafe::text, ps.rotina_horario_cafe),
  rotina_horario_almoco       = COALESCE(pt.horario_almoco::text, ps.rotina_horario_almoco),
  rotina_horario_lanche       = COALESCE(pt.horario_lanche::text, ps.rotina_horario_lanche),
  rotina_horario_jantar       = COALESCE(pt.horario_jantar::text, ps.rotina_horario_jantar),
  tem_rotina_matinal          = COALESCE(pt.tem_rotina_matinal, ps.tem_rotina_matinal),
  rotina_matinal_descricao    = COALESCE(pt.rotina_matinal_descricao, ps.rotina_matinal_descricao),
  alimentos_aceitos           = COALESCE(pt.alimentos_aceitos, ps.alimentos_aceitos),
  alimentos_recusados         = COALESCE(pt.alimentos_recusados, ps.alimentos_recusados),
  marca_favorece_aceitacao    = COALESCE(pt.marca_favorece_aceitacao, ps.marca_favorece_aceitacao),
  abafadores_descricao        = COALESCE(pt.abafadores_descricao, ps.abafadores_descricao),
  o_que_nao_fazer             = COALESCE(pt.o_que_nao_fazer, ps.o_que_nao_fazer),
  risco_fuga                  = COALESCE(pt.risco_fuga, ps.risco_fuga),
  objetos_adaptacao           = COALESCE(pt.objetos_adaptacao, ps.objetos_adaptacao),
  preparacao_especial_quarto  = COALESCE(pt.preparacao_especial_quarto, ps.preparacao_especial_quarto),
  recreacao_interesses        = COALESCE(pt.recreacao_interesses, ps.recreacao_interesses),
  recreacao_evitar            = COALESCE(pt.recreacao_evitar, ps.recreacao_evitar),
  atividades_preferidas       = COALESCE(pt.atividades_preferidas, ps.atividades_preferidas),
  objetos_personagens         = COALESCE(pt.objetos_personagens, ps.objetos_personagens),
  o_que_gera_alegria          = COALESCE(pt.o_que_gera_alegria, ps.o_que_gera_alegria),
  formas_abordagem            = COALESCE(pt.formas_abordagem, ps.formas_abordagem)
FROM public.perfil_tea pt
WHERE pt.user_id = ps.familia_id
  AND lower(btrim(pt.nome_pessoa)) = lower(btrim(ps.nome_autista));

-- ============ 4) Derivação dos flags legados ============
-- Regra: se todas as fontes de um flag estiverem nulas, o flag é preservado
-- como está (perfil que nunca respondeu a seção não é zerado).

CREATE OR REPLACE FUNCTION public.derivar_flags_perfil_sensorial()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _incomoda public.intensidade_incomodo[] := ARRAY['alto', 'medio']::public.intensidade_incomodo[];
  _precisa_apoio public.nivel_apoio[] := ARRAY['apoio_parcial', 'apoio_total']::public.nivel_apoio[];
BEGIN
  -- § 6 → sensivel_*
  IF NUM_NONNULLS(NEW.sensorial_barulho_pessoas, NEW.sensorial_musica_ambiente,
                  NEW.sensorial_sons_subitos, NEW.sensorial_eco) > 0 THEN
    NEW.sensivel_sons := NEW.sensorial_barulho_pessoas = ANY(_incomoda)
      OR NEW.sensorial_musica_ambiente = ANY(_incomoda)
      OR NEW.sensorial_sons_subitos = ANY(_incomoda)
      OR NEW.sensorial_eco = ANY(_incomoda);
  END IF;

  IF NUM_NONNULLS(NEW.sensorial_cheiros_fortes, NEW.sensorial_perfumes) > 0 THEN
    NEW.sensivel_cheiros := NEW.sensorial_cheiros_fortes = ANY(_incomoda)
      OR NEW.sensorial_perfumes = ANY(_incomoda);
  END IF;

  IF NUM_NONNULLS(NEW.sensorial_iluminacao_intensa, NEW.sensorial_luz_piscando) > 0 THEN
    NEW.sensivel_luz := NEW.sensorial_iluminacao_intensa = ANY(_incomoda)
      OR NEW.sensorial_luz_piscando = ANY(_incomoda);
  END IF;

  IF NUM_NONNULLS(NEW.sensorial_toque_inesperado, NEW.sensorial_superficies_molhadas) > 0 THEN
    NEW.sensivel_texturas := NEW.sensorial_toque_inesperado = ANY(_incomoda)
      OR NEW.sensorial_superficies_molhadas = ANY(_incomoda);
  END IF;

  IF NUM_NONNULLS(NEW.sensorial_locais_cheios, NEW.sensorial_movimento_visual) > 0 THEN
    NEW.sensivel_multidao := NEW.sensorial_locais_cheios = ANY(_incomoda)
      OR NEW.sensorial_movimento_visual = ANY(_incomoda);
  END IF;

  -- § 3 → apoio_*
  IF NEW.apoio_alimentacao_nivel IS NOT NULL THEN
    NEW.apoio_alimentacao := NEW.apoio_alimentacao_nivel = ANY(_precisa_apoio);
  END IF;
  IF NEW.apoio_higiene_nivel IS NOT NULL THEN
    NEW.apoio_higiene := NEW.apoio_higiene_nivel = ANY(_precisa_apoio);
  END IF;
  IF NEW.apoio_deslocamento_nivel IS NOT NULL THEN
    NEW.apoio_mobilidade := NEW.apoio_deslocamento_nivel = ANY(_precisa_apoio);
  END IF;
  IF NEW.supervisao_constante IS NOT NULL THEN
    NEW.apoio_seguranca := NEW.supervisao_constante;
  END IF;

  -- § 2 → comunicacao_*
  IF cardinality(NEW.forma_comunicacao) > 0 THEN
    NEW.comunicacao_verbal := NEW.forma_comunicacao && ARRAY['verbal_fluente', 'frases_curtas'];
  END IF;
  IF cardinality(NEW.recursos_comunicacao) > 0 THEN
    NEW.usa_caa := NEW.recursos_comunicacao && ARRAY['prancha', 'aplicativo', 'pecs'];
    NEW.usa_libras := 'libras' = ANY(NEW.recursos_comunicacao);
  END IF;

  -- § 5 → alimentacao_seletiva / dificuldade_esperar
  IF NEW.seletividade IS NOT NULL THEN
    NEW.alimentacao_seletiva := NEW.seletividade <> 'nao';
  END IF;
  IF NUM_NONNULLS(NEW.espera_fila_restaurante, NEW.restaurante_fila) > 0 THEN
    NEW.dificuldade_esperar := NEW.espera_fila_restaurante IS DISTINCT FROM 'sim'
      OR NEW.restaurante_fila IS DISTINCT FROM 'sim';
  END IF;

  -- § 8 → quarto_*
  IF cardinality(NEW.quarto_localizacao) > 0 THEN
    NEW.quarto_andar_baixo := 'andar_terreo' = ANY(NEW.quarto_localizacao);
    NEW.quarto_longe_elevador := 'longe_barulho' = ANY(NEW.quarto_localizacao);
  END IF;
  IF cardinality(NEW.dorme_melhor_com) > 0 THEN
    NEW.quarto_blackout := 'escuro_total' = ANY(NEW.dorme_melhor_com);
  END IF;

  -- § 9 → precisa_cardapio_visual
  IF NEW.restaurante_apoio_visual IS NOT NULL THEN
    NEW.precisa_cardapio_visual := NEW.restaurante_apoio_visual;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_derivar_flags_perfil_sensorial ON public.perfil_sensorial;
CREATE TRIGGER trg_derivar_flags_perfil_sensorial
  BEFORE INSERT OR UPDATE ON public.perfil_sensorial
  FOR EACH ROW EXECUTE FUNCTION public.derivar_flags_perfil_sensorial();

REVOKE EXECUTE ON FUNCTION public.derivar_flags_perfil_sensorial() FROM PUBLIC, anon, authenticated;
