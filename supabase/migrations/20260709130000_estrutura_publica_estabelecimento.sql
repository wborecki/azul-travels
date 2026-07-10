-- Espelha `estabelecimento_profiles.estrutura` em `estabelecimentos.estrutura`,
-- para que os itens de estrutura sensorial marcados pelo dono no perfil
-- (ex: área de escape sensorial, cardápio de seletividade) possam ser lidos
-- publicamente na página do quarto - `estabelecimentos` já tem policy de
-- leitura pública para status = 'ativo', então basta adicionar a coluna.
ALTER TABLE public.estabelecimentos
  ADD COLUMN estrutura JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.estabelecimentos e
SET estrutura = p.estrutura
FROM public.estabelecimento_profiles p
WHERE p.estabelecimento_id = e.id
  AND p.estrutura IS NOT NULL;
