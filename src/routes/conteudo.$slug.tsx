import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateBR } from "@/lib/brazil";
import { MarkdownView } from "@/components/MarkdownView";
import { filtroConteudoPublico } from "@/lib/conteudoPublico";
import { registrarView, registrarClick } from "@/lib/analyticsConteudo";

export const Route = createFileRoute("/conteudo/$slug")({
  component: Artigo,
});

interface ArtigoT {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  foto_capa: string | null;
  categoria: string | null;
  criado_em: string;
  autor: string | null;
}

function Artigo() {
  const { slug } = Route.useParams();
  const [a, setA] = useState<ArtigoT | null>(null);
  const [rel, setRel] = useState<ArtigoT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("conteudo_tea")
        .select("*")
        .eq("slug", slug)
        .or(filtroConteudoPublico())
        .maybeSingle();
      setA(data as ArtigoT | null);
      if (data?.categoria) {
        const { data: r } = await supabase
          .from("conteudo_tea")
          .select("*")
          .or(filtroConteudoPublico())
          .eq("categoria", data.categoria)
          .neq("slug", slug)
          .limit(3);
        setRel((r as ArtigoT[]) ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading)
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="aspect-[16/9] bg-muted animate-pulse rounded-2xl max-w-4xl mx-auto" />
      </div>
    );
  if (!a)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Artigo não encontrado</h1>
      </div>
    );

  return (
    <article>
      {a.foto_capa && (
        <div className="aspect-[21/9] max-h-[420px] bg-muted overflow-hidden">
          <img src={a.foto_capa} alt={a.titulo} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-10 max-w-6xl">
        <div className="lg:col-span-2">
          <nav className="text-xs text-muted-foreground mb-3">
            <Link to="/conteudo" className="hover:text-secondary">
              Conteúdo
            </Link>
            {a.categoria && (
              <>
                {" "}
                {" › "} <span className="capitalize">{a.categoria.replace("_", " ")}</span>
              </>
            )}
          </nav>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-primary leading-tight">
            {a.titulo}
          </h1>
          <div className="mt-3 text-sm text-muted-foreground">
            {a.autor && <span>{a.autor} · </span>}
            {formatDateBR(a.criado_em)}
          </div>
          {a.resumo && (
            <p className="mt-6 text-lg text-foreground italic border-l-4 border-secondary pl-4">
              {a.resumo}
            </p>
          )}
          <div className="mt-8">
            {a.conteudo ? (
              <MarkdownView source={a.conteudo} />
            ) : (
              <p className="text-muted-foreground italic">Sem conteúdo.</p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <h3 className="font-display font-bold text-primary">Artigos relacionados</h3>
          {rel.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum por enquanto.</p>
          )}
          {rel.map((r) => (
            <Link
              key={r.slug}
              to="/conteudo/$slug"
              params={{ slug: r.slug }}
              className="block bg-card border rounded-xl p-4 hover:shadow-soft transition"
            >
              <h4 className="font-display font-semibold text-primary text-sm">{r.titulo}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.resumo}</p>
            </Link>
          ))}
        </aside>
      </div>
    </article>
  );
}
