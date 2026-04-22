/**
 * Filtro PostgREST que considera um artigo público quando:
 *  - `publicado = true`, OU
 *  - `publicar_em` está preenchido E já chegou (`<= now()`).
 *
 * Use em conjunto com o builder do supabase-js:
 *
 *   query.or(filtroConteudoPublico())
 *
 * O filtro espelha a política RLS "Public reads published or due conteudo".
 * Necessário no client porque, antes do cron rodar (a cada 5min),
 * `publicado` ainda é `false` para artigos agendados que já venceram.
 */
export function filtroConteudoPublico(now: Date = new Date()): string {
  // ISO 8601 em UTC — PostgREST aceita e o Postgres compara timestamptz corretamente.
  const iso = now.toISOString();
  return `publicado.eq.true,publicar_em.lte.${iso}`;
}
