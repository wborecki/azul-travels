import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { formatDateBR } from "@/lib/brazil";

export const Route = createFileRoute("/conteudo/")({
  head: () => ({
    meta: [
      { title: "Conteúdo TEA — Turismo Azul" },
      { name: "description", content: "Artigos, dicas e legislação sobre turismo inclusivo para famílias TEA." },
    ],
  }),
  component: ConteudoLista,
});

const CATS = [
  { v: "todas", l: "Todas" },
  { v: "legislacao", l: "Legislação" },
  { v: "dicas_viagem", l: "Dicas de Viagem" },
  { v: "boas_praticas", l: "Boas Práticas" },
  { v: "novidades", l: "Novidades" },
  { v: "destinos", l: "Destinos" },
];

interface Artigo { slug: string; titulo: string; resumo: string | null; foto_capa: string | null; categoria: string | null; criado_em: string; autor: string | null }

function ConteudoLista() {
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [cat, setCat] = useState("todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      let q = supabase.from("conteudo_tea").select("*").eq("publicado", true).order("criado_em", { ascending: false });
      if (cat !== "todas") q = q.eq("categoria", cat as "legislacao" | "dicas_viagem" | "boas_praticas" | "novidades" | "destinos");
      const { data } = await q;
      setArtigos((data as Artigo[]) ?? []);
      setLoading(false);
    })();
  }, [cat]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-secondary font-semibold uppercase tracking-wide text-sm">Portal Turismo Azul</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-display font-bold text-primary">Conteúdo TEA</h1>
        <p className="mt-3 text-muted-foreground">Artigos sobre legislação, dicas de viagem e boas práticas no turismo inclusivo.</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {CATS.map((c) => (
          <Button
            key={c.v}
            size="sm"
            variant={cat === c.v ? "default" : "outline"}
            onClick={() => setCat(c.v)}
            className={cat === c.v ? "bg-primary hover:bg-primary/90" : ""}
          >
            {c.l}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="aspect-[16/10] bg-muted animate-pulse rounded-2xl" />)}</div>
      ) : artigos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum artigo nesta categoria.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artigos.map((a) => (
            <Link key={a.slug} to="/conteudo/$slug" params={{ slug: a.slug }} className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition border animate-fade-up">
              <div className="aspect-[16/10] bg-muted overflow-hidden">
                {a.foto_capa && <img src={a.foto_capa} alt={a.titulo} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
              </div>
              <div className="p-5">
                {a.categoria && <span className="inline-block px-2 py-0.5 rounded-full bg-azul-claro text-primary text-[11px] font-semibold uppercase tracking-wide">{a.categoria.replace("_"," ")}</span>}
                <h3 className="mt-2 font-display font-bold text-lg text-primary group-hover:text-secondary transition">{a.titulo}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{a.resumo}</p>
                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDateBR(a.criado_em)}{a.autor && ` · ${a.autor}`}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
