import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/reservas")({
  component: AdminReservas,
});

type ReservaAdmin = Tables<"reservas"> & {
  estabelecimentos: Pick<Tables<"estabelecimentos">, "nome" | "cidade" | "estado"> | null;
  familia_profiles: Pick<Tables<"familia_profiles">, "nome_responsavel" | "email"> | null;
};

const FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "pendente", label: "Pendentes" },
  { key: "confirmada", label: "Confirmadas" },
  { key: "cancelada", label: "Canceladas" },
  { key: "concluida", label: "Concluídas" },
] as const;

function AdminReservas() {
  const [rows, setRows] = useState<ReservaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("todas");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("reservas")
        .select(
          `*, estabelecimentos(nome, cidade, estado), familia_profiles(nome_responsavel, email)`,
        )
        .order("criado_em", { ascending: false })
        .limit(200)
        .returns<ReservaAdmin[]>();
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => (filter === "todas" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Reservas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Carregando..." : `${filtered.length} reserva(s)`}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-sm rounded-full border transition ${
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground/70 border-border hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Estabelecimento</th>
                <th className="px-4 py-3">Família</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Pessoas</th>
                <th className="px-4 py-3">Status</th>
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
                    Nenhuma reserva encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {r.estabelecimentos?.nome ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[r.estabelecimentos?.cidade, r.estabelecimentos?.estado]
                          .filter(Boolean)
                          .join(" / ") || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {r.familia_profiles?.nome_responsavel ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.familia_profiles?.email ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      {r.data_checkin
                        ? new Date(r.data_checkin).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      {(r.num_adultos ?? 0)} adulto(s) · {(r.num_autistas ?? 0)} autista(s)
                    </td>
                    <td className="px-4 py-3">
                      <ReservaStatusBadge status={r.status} />
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

function ReservaStatusBadge({ status }: { status: Tables<"reservas">["status"] }) {
  switch (status) {
    case "confirmada":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
          Confirmada
        </Badge>
      );
    case "pendente":
      return (
        <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">Pendente</Badge>
      );
    case "cancelada":
      return (
        <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/15">
          Cancelada
        </Badge>
      );
    case "concluida":
      return <Badge variant="secondary">Concluída</Badge>;
    default:
      return <Badge variant="secondary">—</Badge>;
  }
}
