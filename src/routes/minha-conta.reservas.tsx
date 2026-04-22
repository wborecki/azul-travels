import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchReservasDaFamilia,
  mapReservas,
  type ReservaComContexto,
  type ReservaVM,
} from "@/lib/queries";
import { type ReservaStatus } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/minha-conta/reservas")({
  component: ReservasPage,
});

const STATUS_COLOR: Record<ReservaStatus, string> = {
  pendente: "bg-warning text-warning-foreground",
  confirmada: "bg-success text-success-foreground",
  cancelada: "bg-destructive text-destructive-foreground",
  concluida: "bg-primary text-primary-foreground",
};

function ReservasPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ReservaComContexto[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const data = await fetchReservasDaFamilia(user.id);
        setRows(data);
      } catch (err) {
        toast.error("Erro ao carregar reservas", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    })();
  }, [user]);

  // Row → ViewModel — fallback de status, datas formatadas, localidade
  // já resolvidos uma única vez (não por render).
  const list: ReservaVM[] = useMemo(() => mapReservas(rows), [rows]);

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
                    <div className="font-semibold text-primary">
                      {r.estabelecimento?.nome ?? "—"}
                    </div>
                    {r.estabelecimento?.localidade && (
                      <div className="text-xs text-muted-foreground">
                        {r.estabelecimento.localidade}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-xs">{r.periodoFormatado}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[r.status]}`}
                    >
                      {r.statusLabel}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {r.estabelecimento && (
                      <Button size="sm" variant="ghost" asChild>
                        <Link to="/estabelecimento/$slug" params={{ slug: r.estabelecimento.slug }}>
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
