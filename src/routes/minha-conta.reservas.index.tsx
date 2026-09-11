import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchReservasDaFamilia,
  formatPeriodoReserva,
  perfisDaReserva,
  type ReservaComContexto,
} from "@/lib/queries/reservas";
import { Button } from "@/components/ui/button";
import { PerfisTeaAvatares } from "@/components/reserva/PerfisTeaDaReserva";
import { BedDouble, Calendar, CalendarCheck, Compass, Loader2, MapPin } from "lucide-react";
import { formatDateBR } from "@/lib/brazil";
import { RESERVA_STATUS_LABEL } from "@/lib/enums";

export const Route = createFileRoute("/minha-conta/reservas/")({
  component: ReservasList,
});

/** Primeira foto do item reservado (coluna `imagens` é Json cru). */
function primeiraFoto(imagens: unknown): string | null {
  if (!Array.isArray(imagens)) return null;
  const foto = imagens.find((f): f is string => typeof f === "string" && f.trim().length > 0);
  return foto ?? null;
}

/** Descrição em markdown vira texto corrido para o resumo do card. */
function resumoDescricao(md: string): string {
  return md
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ReservaCard({ r }: { r: ReservaComContexto }) {
  const item = r.itens_reservaveis;
  const estab = r.estabelecimentos;
  const perfis = perfisDaReserva(r);

  const capa = primeiraFoto(item?.imagens) ?? estab?.foto_capa ?? null;
  // Endereço do quarto quando ele tem endereço próprio; senão, o do estabelecimento.
  const cidade = (item?.usa_endereco_proprio ? item.cidade : null) ?? estab?.cidade;
  const estado = (item?.usa_endereco_proprio ? item.estado : null) ?? estab?.estado;
  const descricao = item?.descricao ? resumoDescricao(item.descricao) : "";

  return (
    <li className="bg-white border rounded-2xl overflow-hidden">
      <Link
        to="/minha-conta/reservas/$id"
        params={{ id: r.id }}
        className="flex flex-col sm:flex-row hover:bg-azul-claro/20 transition"
      >
        <div className="sm:w-48 h-36 sm:h-auto shrink-0 bg-muted grid place-items-center">
          {capa ? (
            <img
              src={capa}
              alt={item?.nome ?? estab?.nome ?? "Reserva"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <BedDouble className="h-8 w-8 text-muted-foreground opacity-40" />
          )}
        </div>

        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display font-bold text-primary truncate">
                {item?.nome ?? estab?.nome ?? "-"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {[estab?.nome, [cidade, estado].filter(Boolean).join("/")]
                    .filter(Boolean)
                    .join(" · ") || "-"}
                </span>
              </div>
            </div>
            <span className="text-[11px] uppercase font-semibold px-2 py-1 rounded-full bg-azul-claro text-primary shrink-0">
              {RESERVA_STATUS_LABEL[r.status ?? "pendente"]}
            </span>
          </div>

          {descricao && <p className="mt-2 text-xs text-foreground/60 line-clamp-2">{descricao}</p>}

          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground/80">
              <Calendar className="h-4 w-4 text-foreground/40" />
              {formatPeriodoReserva(r, (d) => (d ? formatDateBR(d) : "-"))}
            </span>
            <PerfisTeaAvatares perfis={perfis} />
          </div>
        </div>
      </Link>
    </li>
  );
}

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
          <Button asChild className="mt-4 bg-secondary hover:bg-secondary/90 text-white">
            <Link to="/explorar">Explorar destinos</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {reservas.map((r) => (
            <ReservaCard key={r.id} r={r} />
          ))}
        </ul>
      )}
    </div>
  );
}
