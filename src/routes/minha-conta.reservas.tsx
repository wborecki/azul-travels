import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDateBR } from "@/lib/brazil";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/minha-conta/reservas")({
  component: ReservasPage,
});

interface R {
  id: string;
  status: string;
  data_checkin: string | null;
  data_checkout: string | null;
  estabelecimentos: {
    nome: string;
    slug: string;
    cidade: string | null;
    estado: string | null;
  } | null;
}

const STATUS_COLOR: Record<string, string> = {
  pendente: "bg-warning text-warning-foreground",
  confirmada: "bg-success text-success-foreground",
  cancelada: "bg-destructive text-destructive-foreground",
  concluida: "bg-primary text-primary-foreground",
};

function ReservasPage() {
  const { user } = useAuth();
  const [list, setList] = useState<R[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("reservas")
        .select(
          "id, status, data_checkin, data_checkout, estabelecimentos(nome, slug, cidade, estado)",
        )
        .eq("familia_id", user.id)
        .order("criado_em", { ascending: false });
      setList((data as unknown as R[]) ?? []);
    })();
  }, [user]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary">Minhas reservas</h1>
        <p className="text-sm text-muted-foreground">Acompanhe o status das suas solicitações.</p>
      </div>

      {list.length === 0 ? (
        <div className="bg-azul-claro rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Você ainda não tem reservas.</p>
          <Button asChild className="mt-3">
            <Link to="/explorar">Explorar destinos</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3 font-semibold">Estabelecimento</th>
                <th className="p-3 font-semibold">Datas</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <div className="font-semibold text-primary">{r.estabelecimentos?.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.estabelecimentos?.cidade}, {r.estabelecimentos?.estado}
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    {r.data_checkin && formatDateBR(r.data_checkin)}{" "}
                    {r.data_checkout && `→ ${formatDateBR(r.data_checkout)}`}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {r.estabelecimentos && (
                      <Button size="sm" variant="ghost" asChild>
                        <Link
                          to="/estabelecimento/$slug"
                          params={{ slug: r.estabelecimentos.slug }}
                        >
                          Ver
                        </Link>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
