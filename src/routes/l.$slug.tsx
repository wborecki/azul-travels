/**
 * Rota de redirect para links curtos: `/l/<slug>` → `/explorar?...`.
 *
 * O loader é isomórfico (roda no servidor para usuários novos vindos
 * de share, e no client em navegação interna). Em ambos os casos:
 *  1. Chama `resolverLinkCurto(slug)` — RPC que atualiza o
 *     `ultimo_acesso_em` (alimenta o expurgo) e devolve o path original.
 *  2. Faz `throw redirect(...)` para o path resolvido. TanStack Router
 *     gera 302 no SSR e navega no client.
 *  3. Slug inexistente ou inválido → `notFound()` (mostra UI específica
 *     em vez de mandar para `/explorar` sem filtros, o que confundiria
 *     o usuário sobre por que o link não funcionou).
 *
 * Não há `component` — o loader sempre redireciona ou lança 404, então
 * só `notFoundComponent` faz sentido.
 */

import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { resolverLinkCurto } from "@/lib/queries";

export const Route = createFileRoute("/l/$slug")({
  loader: async ({ params }) => {
    // Filtro defensivo extra além do CHECK do banco — evita uma ida
    // inútil ao Postgres para slugs claramente fora do alfabeto.
    if (!/^[A-Za-z0-9]{6,16}$/.test(params.slug)) {
      throw notFound();
    }

    const path = await resolverLinkCurto(params.slug);
    if (!path) throw notFound();

    // `to` aceita qualquer string; usamos `params._splat`-like passando
    // o path completo via `href` (preserva query string intacta).
    throw redirect({ href: path });
  },
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-display font-bold text-primary mb-3">
        Link não encontrado
      </h1>
      <p className="text-muted-foreground mb-6">
        Esse link curto pode ter expirado ou nunca existiu. Links sem
        nenhum acesso por mais de 90 dias são removidos automaticamente.
      </p>
      <Link
        to="/explorar"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Ir para Explorar
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-display font-bold text-primary mb-3">
        Erro ao abrir o link
      </h1>
      <p className="text-muted-foreground mb-6">{error.message}</p>
      <Link
        to="/explorar"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Ir para Explorar
      </Link>
    </div>
  ),
});
