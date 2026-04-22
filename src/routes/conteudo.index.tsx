import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Search, X } from "lucide-react";
import { formatDateBR } from "@/lib/brazil";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  CONTEUDO_CATEGORIAS,
  CONTEUDO_CATEGORIA_LABEL,
  isConteudoCategoria,
  type ConteudoCategoria,
} from "@/lib/enums";

const PAGE_SIZE = 9;

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  cat: fallback(z.string(), "todas").default("todas"),
  page: fallback(z.number().int().min(1), 1).default(1),
});

export const Route = createFileRoute("/conteudo/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Conteúdo TEA — Turismo Azul" },
      {
        name: "description",
        content: "Artigos, dicas e legislação sobre turismo inclusivo para famílias TEA.",
      },
    ],
  }),
  component: ConteudoLista,
});

interface Artigo {
  slug: string;
  titulo: string;
  resumo: string | null;
  foto_capa: string | null;
  categoria: ConteudoCategoria | null;
  criado_em: string;
  autor: string | null;
}

const CATS: ReadonlyArray<{ v: "todas" | ConteudoCategoria; l: string }> = [
  { v: "todas", l: "Todas" },
  ...CONTEUDO_CATEGORIAS.map((v) => ({ v, l: CONTEUDO_CATEGORIA_LABEL[v] })),
];

type ConteudoSearch = { q: string; cat: string; page: number };

function ConteudoLista() {
  const { q, cat, page } = Route.useSearch();
  const navigate = useNavigate({ from: "/conteudo" });

  const [busca, setBusca] = useState(q);
  // Sincroniza input quando URL muda externamente (ex.: voltar/avançar do navegador)
  useEffect(() => {
    setBusca(q);
  }, [q]);
  const buscaDebounced = useDebouncedValue(busca, 350);

  // Quando o input debounced diverge da URL, atualiza search e reseta paginação
  useEffect(() => {
    if (buscaDebounced !== q) {
      void navigate({
        search: (prev: ConteudoSearch) => ({ ...prev, q: buscaDebounced, page: 1 }),
        replace: true,
      });
    }
  }, [buscaDebounced, q, navigate]);

  const catAtual: "todas" | ConteudoCategoria = cat === "todas" || isConteudoCategoria(cat) ? cat : "todas";

  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("conteudo_tea")
        .select("slug,titulo,resumo,foto_capa,categoria,criado_em,autor", { count: "exact" })
        .or(filtroConteudoPublico())
        .order("criado_em", { ascending: false })
        .range(from, to);

      if (catAtual !== "todas") query = query.eq("categoria", catAtual);

      const termo = q.trim();
      if (termo) {
        // Escapa caracteres especiais do operador `or` do PostgREST
        const safe = termo.replace(/[%,()]/g, " ").trim();
        if (safe) {
          query = query.or(`titulo.ilike.%${safe}%,resumo.ilike.%${safe}%`);
        }
      }

      const { data, count } = await query;
      if (cancelado) return;
      setArtigos((data as Artigo[] | null) ?? []);
      setTotal(count ?? 0);
      setLoading(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [catAtual, q, page]);

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginasVisiveis = useMemo(() => buildPageWindow(page, totalPaginas), [page, totalPaginas]);

  // Se a página atual ficou fora do range após filtro, volta pra 1
  useEffect(() => {
    if (!loading && page > totalPaginas) {
      void navigate({
        search: (prev: ConteudoSearch) => ({ ...prev, page: 1 }),
        replace: true,
      });
    }
  }, [loading, page, totalPaginas, navigate]);

  function setCategoria(novo: "todas" | ConteudoCategoria) {
    void navigate({ search: (prev: ConteudoSearch) => ({ ...prev, cat: novo, page: 1 }) });
  }
  function irParaPagina(p: number) {
    void navigate({ search: (prev: ConteudoSearch) => ({ ...prev, page: p }) });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const temFiltro = q.trim().length > 0 || catAtual !== "todas";

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-secondary font-semibold uppercase tracking-wide text-sm">
          Portal Turismo Azul
        </p>
        <h1 className="mt-2 text-4xl md:text-5xl font-display font-bold text-primary">
          Conteúdo TEA
        </h1>
        <p className="mt-3 text-muted-foreground">
          Artigos sobre legislação, dicas de viagem e boas práticas no turismo inclusivo.
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar por título ou resumo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 pr-9"
          aria-label="Buscar artigos"
        />
        {busca && (
          <button
            type="button"
            onClick={() => setBusca("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {CATS.map((c) => (
          <Button
            key={c.v}
            size="sm"
            variant={catAtual === c.v ? "default" : "outline"}
            onClick={() => setCategoria(c.v)}
            className={catAtual === c.v ? "bg-primary hover:bg-primary/90" : ""}
          >
            {c.l}
          </Button>
        ))}
      </div>

      {!loading && (
        <p className="text-center text-sm text-muted-foreground mb-6">
          {total === 0
            ? "Nenhum artigo encontrado."
            : `${total} ${total === 1 ? "artigo" : "artigos"}${temFiltro ? " encontrado" + (total === 1 ? "" : "s") : ""}.`}
        </p>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[16/10] bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : artigos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum artigo encontrado com esses filtros.</p>
          {temFiltro && (
            <Button
              variant="link"
              onClick={() => {
                setBusca("");
                void navigate({ search: () => ({ q: "", cat: "todas", page: 1 }) });
              }}
              className="mt-2"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artigos.map((a) => (
              <Link
                key={a.slug}
                to="/conteudo/$slug"
                params={{ slug: a.slug }}
                className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition border animate-fade-up flex flex-col"
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  {a.foto_capa && (
                    <img
                      src={a.foto_capa}
                      alt={a.titulo}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  {a.categoria && (
                    <span className="inline-block self-start px-2 py-0.5 rounded-full bg-azul-claro text-primary text-[11px] font-semibold uppercase tracking-wide">
                      {CONTEUDO_CATEGORIA_LABEL[a.categoria]}
                    </span>
                  )}
                  <h3 className="mt-2 font-display font-bold text-lg text-primary group-hover:text-secondary transition">
                    {a.titulo}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">
                    {a.resumo}
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDateBR(a.criado_em)}
                    {a.autor && ` · ${a.autor}`}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPaginas > 1 && (
            <nav
              aria-label="Paginação"
              className="mt-10 flex flex-wrap items-center justify-center gap-2"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => irParaPagina(page - 1)}
              >
                Anterior
              </Button>
              {paginasVisiveis.map((p, i) =>
                p === "..." ? (
                  <span key={`gap-${i}`} className="px-2 text-muted-foreground text-sm">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === page ? "default" : "outline"}
                    onClick={() => irParaPagina(p)}
                    className={p === page ? "bg-primary hover:bg-primary/90" : ""}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPaginas}
                onClick={() => irParaPagina(page + 1)}
              >
                Próxima
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

/** Janela de páginas: 1 … (p-1) p (p+1) … N */
function buildPageWindow(current: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | "..."> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}
