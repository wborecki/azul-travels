import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchReservasDaFamilia, type ReservaComContexto } from "@/lib/queries/reservas";
import { Button } from "@/components/ui/button";
import { CalendarCheck, User, Compass, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/minha-conta/")({
  component: MinhaContaIndex,
});

function MinhaContaIndex() {
  const { user } = useAuth();
  const [perfilExiste, setPerfilExiste] = useState<boolean | null>(null);
  const [perfilNome, setPerfilNome] = useState<string | null>(null);
  const [reservas, setReservas] = useState<ReservaComContexto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      supabase
        .from("perfil_sensorial")
        .select("id, nome_autista")
        .eq("familia_id", user.id)
        .maybeSingle(),
      fetchReservasDaFamilia(user.id),
    ])
      .then(([perfilRes, reservasRes]) => {
        if (!alive) return;
        setPerfilExiste(!!perfilRes.data);
        setPerfilNome(perfilRes.data?.nome_autista ?? null);
        setReservas(reservasRes);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="text-muted-foreground inline-flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-bold text-primary">Minha conta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mantenha o Perfil TEA da sua família atualizado e gerencie suas reservas.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-primary">
            <User className="h-5 w-5" />
            <h2 className="font-display font-bold">Perfil TEA</h2>
          </div>
          {perfilExiste ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Perfil de <strong className="text-foreground">{perfilNome}</strong> salvo.
                Será enviado automaticamente em cada reserva.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/minha-conta/perfil">Editar perfil →</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Você ainda não cadastrou o Perfil TEA. Preencha uma vez — será reaproveitado
                em todas as reservas.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-4 bg-secondary hover:bg-secondary/90 text-white"
              >
                <Link to="/minha-conta/perfil">Cadastrar Perfil TEA →</Link>
              </Button>
            </>
          )}
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-primary">
            <CalendarCheck className="h-5 w-5" />
            <h2 className="font-display font-bold">Reservas</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {reservas.length === 0
              ? "Nenhuma reserva ainda."
              : `${reservas.length} reserva${reservas.length === 1 ? "" : "s"}.`}
          </p>
          <div className="mt-4 flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/minha-conta/reservas">Ver reservas</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/explorar">
                <Compass className="h-4 w-4 mr-1" /> Explorar destinos
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {reservas.length > 0 && (
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-display font-bold text-primary mb-3">Últimas reservas</h2>
          <ul className="divide-y">
            {reservas.slice(0, 3).map((r) => (
              <li key={r.id}>
                <Link
                  to="/minha-conta/reservas/$id"
                  params={{ id: r.id }}
                  className="flex items-center justify-between py-3 hover:bg-azul-claro/30 rounded-lg px-2 -mx-2"
                >
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      {r.estabelecimentos?.nome ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.estabelecimentos?.cidade}
                      {r.estabelecimentos?.estado && ` · ${r.estabelecimentos.estado}`}
                      {" · "}
                      <span className="capitalize">{r.status}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
