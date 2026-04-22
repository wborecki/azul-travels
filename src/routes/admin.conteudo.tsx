import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/conteudo")({
  component: AdminConteudo,
});

type Conteudo = Pick<
  Tables<"conteudo_tea">,
  "id" | "titulo" | "slug" | "categoria" | "publicado" | "autor" | "criado_em"
>;

function AdminConteudo() {
  const [rows, setRows] = useState<Conteudo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("conteudo_tea")
        .select("id, titulo, slug, categoria, publicado, autor, criado_em")
        .order("criado_em", { ascending: false })
        .limit(200);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Conteúdo TEA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Carregando..." : `${rows.length} artigo(s)`}
        </p>
      </header>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Autor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum conteúdo cadastrado.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{c.titulo}</div>
                      {c.publicado ? (
                        <Link
                          to="/conteudo/$slug"
                          params={{ slug: c.slug }}
                          className="text-xs text-primary hover:underline"
                        >
                          /conteudo/{c.slug}
                        </Link>
                      ) : (
                        <div className="text-xs text-muted-foreground">/{c.slug}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-foreground/80">
                      {c.categoria?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{c.autor ?? "—"}</td>
                    <td className="px-4 py-3">
                      {c.publicado ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Rascunho</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
