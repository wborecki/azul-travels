import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { formatDateBR } from "@/lib/brazil";
import { RESERVA_STATUS_LABEL } from "@/lib/enums";

export const Route = createFileRoute("/minha-conta/reservas/$id")({
  component: ReservaDetalhe,
});

type Reserva = Tables<"reservas"> & {
  estabelecimentos: Pick<
    Tables<"estabelecimentos">,
    "id" | "slug" | "nome" | "cidade" | "estado"
  > | null;
  perfil_sensorial: Tables<"perfil_sensorial"> | null;
};

interface Acomp {
  nome: string;
  idade?: number | null;
  parentesco?: string | null;
}

function ReservaDetalhe() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from("reservas")
      .select(
        "*, estabelecimentos(id, slug, nome, cidade, estado), perfil_sensorial(*)",
      )
      .eq("id", id)
      .eq("familia_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) {
          setReserva(data as Reserva | null);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [id, user]);

  if (loading) {
    return (
      <div className="text-muted-foreground inline-flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="bg-white border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Reserva não encontrada.</p>
        <Button asChild className="mt-4">
          <Link to="/minha-conta/reservas">Voltar</Link>
        </Button>
      </div>
    );
  }

  const acomp = (reserva.acompanhantes ?? []) as unknown as Acomp[];
  const p = reserva.perfil_sensorial;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/minha-conta/reservas"
          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar para reservas
        </Link>
        <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
          <h1 className="text-3xl font-display font-bold text-primary">
            {reserva.estabelecimentos?.nome ?? "Reserva"}
          </h1>
          <span className="text-[11px] uppercase font-semibold px-2 py-1 rounded-full bg-azul-claro text-primary">
            {RESERVA_STATUS_LABEL[reserva.status ?? "pendente"]}
          </span>
        </div>
        {reserva.estabelecimentos && (
          <p className="text-sm text-muted-foreground mt-1">
            {reserva.estabelecimentos.cidade}/{reserva.estabelecimentos.estado}
          </p>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-5 space-y-2">
        <h2 className="font-display font-bold text-primary">Datas</h2>
        <p className="text-sm">
          {reserva.data_checkin ? formatDateBR(reserva.data_checkin) : "—"} →{" "}
          {reserva.data_checkout ? formatDateBR(reserva.data_checkout) : "—"}
        </p>
      </div>

      {reserva.objetivo && (
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-display font-bold text-primary">Objetivo</h2>
          <p className="text-sm mt-1 text-foreground/90">{reserva.objetivo}</p>
        </div>
      )}

      {reserva.mensagem && (
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-display font-bold text-primary">Notas desta estadia</h2>
          <p className="text-sm mt-1 text-foreground/90 whitespace-pre-line">
            {reserva.mensagem}
          </p>
        </div>
      )}

      {acomp.length > 0 && (
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-display font-bold text-primary">Acompanhantes</h2>
          <ul className="mt-2 text-sm space-y-1">
            {acomp.map((a, i) => (
              <li key={i}>
                <strong>{a.nome}</strong>
                {a.idade ? `, ${a.idade} anos` : ""}
                {a.parentesco ? ` · ${a.parentesco}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {p && (
        <div className="bg-azul-claro/40 border border-primary/20 rounded-2xl p-5">
          <h2 className="font-display font-bold text-primary">
            Perfil TEA enviado: {p.nome_autista}
          </h2>
          <p className="text-sm text-foreground/80 mt-1">
            {p.idade ? `${p.idade} anos · ` : ""}
            {p.nivel_tea ? `Nível ${p.nivel_tea}` : ""}
          </p>
          <Link
            to="/minha-conta/perfil"
            className="text-xs text-secondary hover:underline mt-2 inline-block"
          >
            Ver / editar perfil →
          </Link>
        </div>
      )}
    </div>
  );
}
