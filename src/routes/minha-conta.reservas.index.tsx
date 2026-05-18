import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchReservasDaFamilia, type ReservaComContexto } from "@/lib/queries/reservas";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Compass, Loader2 } from "lucide-react";
import { formatDateBR } from "@/lib/brazil";
import { RESERVA_STATUS_LABEL } from "@/lib/enums";

export const Route = createFileRoute("/minha-conta/reservas/")({
  component: ReservasList,
});

function ReservasList() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<ReservaComContexto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    fetchReservasDaFamilia(user.id)
      .then((d) => alive && setReservas(d))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Reservas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cada reserva envia automaticamente o Perfil TEA da sua família.
          </p>
        </div>
        <Button asChild className="bg-secondary hover:bg-secondary/90 text-white">
          <Link to="/explorar">
            <Compass className="h-4 w-4 mr-1" /> Nova reserva
          </Link>
        </Button>
      </header>

      {loading ? (
        <div className="text-muted-foreground inline-flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
        </div>
      ) : reservas.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center">
          <CalendarCheck className="h-10 w-10 text-primary/40 mx-auto" />
          <p className="mt-3 text-muted-foreground">
            Você ainda não tem reservas. Comece explorando os destinos.
          </p>
          <Button
            asChild
            className="mt-4 bg-secondary hover:bg-secondary/90 text-white"
          >
            <Link to="/explorar">Explorar destinos</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {reservas.map((r) => (
            <li key={r.id} className="bg-white border rounded-2xl">
              <Link
                to="/minha-conta/reservas/$id"
                params={{ id: r.id }}
                className="block p-4 hover:bg-azul-claro/20 rounded-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display font-bold text-primary">
                      {r.estabelecimentos?.nome ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {[r.estabelecimentos?.cidade, r.estabelecimentos?.estado]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <div className="mt-2 text-sm text-foreground/80">
                      {r.data_checkin ? formatDateBR(r.data_checkin) : "-"} →{" "}
                      {r.data_checkout ? formatDateBR(r.data_checkout) : "-"}
                    </div>
                  </div>
                  <span className="text-[11px] uppercase font-semibold px-2 py-1 rounded-full bg-azul-claro text-primary shrink-0">
                    {RESERVA_STATUS_LABEL[r.status ?? "pendente"]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
