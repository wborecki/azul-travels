-- Base para os campos específicos de cada categoria (passo 3 do plano de
-- personalização): a coluna `detalhes` e o bucket onde o cardápio vai morar.
--
-- POR QUE JSONB E NÃO COLUNAS. A regra do plano (0.4) é "filtro é coluna,
-- descrição é jsonb". Nada aqui é filtrado pela busca - `ofertas_view` e
-- `ItensViewFilters` não olham para isto. São campos que só aparecem na página
-- do local, e cada categoria tem os seus. Como coluna, "tempo médio de espera"
-- custaria uma migration para um dado que só um restaurante preenche.
--
-- POR QUE SÓ AQUI, SEM CÓPIA EM `estabelecimento_profiles`. Diferente de
-- `estrutura`, que existe nas duas tabelas, `detalhes` é público por natureza:
-- `estabelecimentos` já tem leitura pública para `status = 'ativo'`, então a
-- cópia não daria acesso a nada novo - só criaria dois `update()` para manter
-- em sincronia à mão, que é exatamente o que hoje torna `estrutura` frágil.
--
-- POR QUE SEPARADO DE `estrutura`. `estrutura` é `{ [key]: boolean }` - um
-- conjunto de caixas marcadas. `detalhes` guarda valores com tipo (texto,
-- número, hora, sim/não, URL de arquivo). No mesmo bag, nenhum dos dois seria
-- validável: não dá para dizer "todo valor é booleano" nem "todo valor tem o
-- tipo declarado no schema" se as duas coisas convivem.
--
-- A trigger `protect_estabelecimentos_admin_columns` bloqueia uma lista fechada
-- de colunas (owner, status, destaque, selos, recursos TEA). `detalhes` não
-- está nela e é editável pelo dono via a policy `Owner updates own
-- estabelecimento` - que é o comportamento desejado.

ALTER TABLE public.estabelecimentos
  ADD COLUMN detalhes JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.estabelecimentos.detalhes IS
  'Campos específicos da categoria do local (cardápio, duração média, tipo de veículo...). Só exibição - nada aqui é filtrado pela busca; campo filtrável vira coluna. As chaves e os tipos são declarados em src/lib/detalhes-estabelecimento.ts, não no banco. Sem cópia em estabelecimento_profiles: o dado é público e a duplicação só criaria dois updates para sincronizar.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Bucket de documentos
--
-- Leitura pública porque o cardápio é informação pública - é o ponto de existir.
--
-- Escrita no mesmo modelo do bucket de fotos (migration 20260804140000):
-- prefixo `<auth.uid()>/` e gate por `has_role(..., 'estabelecimento')`, e não o
-- modelo antigo de `itens-reservaveis-fotos`, onde as policies só checam
-- `bucket_id` e qualquer dono habilitado alcança o arquivo de qualquer outro.
--
-- `allowed_mime_types` e `file_size_limit` são declarados aqui e não só na tela:
-- sem eles nada impede o upload de um vídeo de 500 MB com a extensão trocada
-- para .pdf, já que a validação do cliente é sugestão, não fronteira.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'estabelecimentos-documentos',
  'estabelecimentos-documentos',
  true,
  10485760, -- 10 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public reads estabelecimentos-documentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'estabelecimentos-documentos');

CREATE POLICY "Owners upload estabelecimentos-documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'estabelecimentos-documentos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'estabelecimento')
);

CREATE POLICY "Owners update estabelecimentos-documentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'estabelecimentos-documentos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'estabelecimento')
);

CREATE POLICY "Owners delete estabelecimentos-documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'estabelecimentos-documentos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'estabelecimento')
);

CREATE POLICY "Admins manage estabelecimentos-documentos"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'estabelecimentos-documentos'
  AND public.has_role(auth.uid(), 'admin')
);
