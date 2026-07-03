-- Atualiza conteúdo existente de conteudo_tea para refletir a lógica de marca única:
-- o Selo Azul passa a ser emitido/certificado pelo próprio Turismo Azul Inclusivo,
-- removendo menções à antiga parceira Absoluto Educacional.

UPDATE public.conteudo_tea
SET conteudo = replace(conteudo, 'emitido pela Absoluto Educacional', 'emitido pelo Turismo Azul Inclusivo')
WHERE conteudo LIKE '%emitido pela Absoluto Educacional%';

UPDATE public.conteudo_tea
SET conteudo = replace(conteudo, 'emitido pela **Absoluto Educacional**', 'emitido pelo **Turismo Azul Inclusivo**')
WHERE conteudo LIKE '%emitido pela **Absoluto Educacional**%';

UPDATE public.conteudo_tea
SET conteudo = replace(conteudo, 'A **Absoluto Educacional** oferece', 'O **Turismo Azul Inclusivo** oferece')
WHERE conteudo LIKE '%A **Absoluto Educacional** oferece%';

UPDATE public.conteudo_tea
SET conteudo = replace(conteudo, 'com a Absoluto Educacional.', 'com o Turismo Azul Inclusivo.')
WHERE conteudo LIKE '%com a Absoluto Educacional.%';

-- Rede de segurança para qualquer outra ocorrência remanescente (ex.: conteúdo editado via CMS)
UPDATE public.conteudo_tea
SET conteudo = replace(conteudo, 'Absoluto Educacional', 'Turismo Azul Inclusivo')
WHERE conteudo LIKE '%Absoluto Educacional%';

UPDATE public.conteudo_tea
SET titulo = replace(titulo, 'Absoluto Educacional', 'Turismo Azul Inclusivo'),
    resumo = replace(resumo, 'Absoluto Educacional', 'Turismo Azul Inclusivo')
WHERE titulo LIKE '%Absoluto Educacional%' OR resumo LIKE '%Absoluto Educacional%';
