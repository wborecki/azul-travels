import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/admin/estabelecimentos")({
  component: AdminEstabelecimentos,
});

type Row = Pick<
  Tables<"estabelecimentos">,
  "id" | "nome" | "slug" | "tipo" | "cidade" | "estado" | "status" | "destaque" | "criado_em"
>;

function AdminEstabelecimentos() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("estabelecimentos")
        .select("id, nome, slug, tipo, cidade, estado, status, destaque, criado_em")
        .order("criado_em", { ascending: false })
        .limit(200);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = q.trim()
    ? rows.filter((r) =>
        [r.nome, r.cidade, r.estado, r.tipo]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q.toLowerCase())),
      )
    : rows;

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Estabelecimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando..." : `${filtered.length} de ${rows.length} registros`}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade, tipo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </header>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Destaque</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum estabelecimento encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{r.nome}</div>
                      <div className="text-xs text-muted-foreground">/{r.slug}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-foreground/80">{r.tipo}</td>
                    <td className="px-4 py-3 text-foreground/80">
                      {[r.cidade, r.estado].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      {r.destaque ? (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                          Destaque
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
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

function StatusBadge({ status }: { status: Row["status"] }) {
  if (status === "ativo")
    return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">Ativo</Badge>;
  if (status === "pendente")
    return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">Pendente</Badge>;
  return <Badge variant="secondary">Inativo</Badge>;
}
