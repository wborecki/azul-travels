-- Escrita no bucket `estabelecimentos-fotos` para o dono do estabelecimento.
--
-- Antes: INSERT/UPDATE/DELETE exigiam `has_role(auth.uid(), 'admin')`
-- (migration 20260422171855). Só a leitura era pública. Na prática o dono não
-- conseguia subir foto nenhuma do próprio local - e desde que restaurantes,
-- parques e passeios passaram a aparecer na vitrine (`ofertas_view`), isso
-- significa card sem imagem, sem nada que o dono possa fazer a respeito.
--
-- Duas diferenças em relação ao modelo de `itens-reservaveis-fotos`
-- (migration 20260707140000), ambas deliberadas:
--
--  1. ESCOPO POR CAMINHO. Lá as policies só checam `bucket_id`, então qualquer
--     dono habilitado pode sobrescrever ou apagar arquivo de qualquer outro.
--     Aqui o dono alcança apenas objetos sob `<auth.uid()>/`, que é o prefixo
--     que `FotosGaleria` passa a usar. Os arquivos já existentes ficam na raiz
--     e continuam exclusivos de admin - nenhum precisa ser movido, justamente
--     porque até hoje só admin escrevia neste bucket.
--
--  2. SEM EXIGIR SELO AZUL. A linha em `estabelecimentos` nasce com
--     `status = 'pendente'` no primeiro "Salvar perfil"
--     (`meu-estabelecimento.index.tsx`), e o selo só vem depois da auditoria.
--     Exigir `selo_azul = true AND status = 'ativo'` deixaria o upload quebrado
--     exatamente para quem está montando a página pela primeira vez. As fotos
--     de um local sem selo não vazam para lugar nenhum: a busca e a
--     `ofertas_view` filtram `status = 'ativo' AND selo_azul = true`.
--
-- O prefixo é `auth.uid()` e não `estabelecimentos.id` de propósito: no
-- primeiro salvamento a linha em `estabelecimentos` ainda não existe, e um
-- prefixo que só passa a existir depois de salvar tornaria impossível subir
-- foto durante o preenchimento inicial do perfil.
--
-- As policies de admin da migration original permanecem intactas - policies
-- permissivas se somam, então o admin continua com acesso total ao bucket,
-- inclusive aos arquivos na raiz.

CREATE POLICY "Owners upload estabelecimentos-fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'estabelecimentos-fotos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'estabelecimento')
);

CREATE POLICY "Owners update estabelecimentos-fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'estabelecimentos-fotos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'estabelecimento')
);

CREATE POLICY "Owners delete estabelecimentos-fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'estabelecimentos-fotos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'estabelecimento')
);
