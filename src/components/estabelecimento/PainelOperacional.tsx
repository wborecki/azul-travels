import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Clock, CalendarClock, CheckCircle2, MessageSquare, Users, Loader2 } from "lucide-react";
import {
  fetchReservasDoEstabelecimento,
  fetchUltimasMensagensPorReservas,
  type ReservaEstabelecimentoRow,
  type ReservaMensagemRow,
} from "@/lib/queries";
import { StatusBadge } from "./StatusBadge";

const ReservasCalendario = lazy(() =>
  import("./ReservasCalendario").then((m) => ({ default: m.ReservasCalendario })),
);

const ENCERRADA = new Set(["cancelada", "concluida"]);

function formatDataBr(dataIso: string | null): string {
  if (!dataIso) return "-";
  return format(parseISO(dataIso), "dd/MM/yyyy");
}

function hojeISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

interface PainelOperacionalProps {
  estabId: string;
}

export function PainelOperacional({ estabId }: PainelOperacionalProps) {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [reservas, setReservas] = useState<ReservaEstabelecimentoRow[]>([]);
  const [ultimasMensagens, setUltimasMensagens] = useState<Map<string, ReservaMensagemRow>>(
    new Map(),
  );

  useEffect(() => {
    let alive = true;
    void fetchReservasDoEstabelecimento(estabId).then(async (data) => {
      if (!alive) return;
      setReservas(data);
      const ultimas = await fetchUltimasMensagensPorReservas(data.map((r) => r.id));
      if (alive) {
        setUltimasMensagens(ultimas);
        setCarregando(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [estabId]);

  const hoje = useMemo(() => hojeISO(), []);
  const inicioMes = useMemo(() => format(new Date(), "yyyy-MM"), []);

  const pendentes = useMemo(() => reservas.filter((r) => r.status === "pendente"), [reservas]);

  const confirmadas = useMemo(() => reservas.filter((r) => r.status === "confirmada"), [reservas]);

  const proximasVisitas = useMemo(
    () =>
      confirmadas
        .filter((r) => !!r.data_checkin && r.data_checkin >= hoje)
        .sort((a, b) => (a.data_checkin ?? "").localeCompare(b.data_checkin ?? "")),
    [confirmadas, hoje],
  );

  const concluidasNoMes = useMemo(
    () =>
      reservas.filter(
        (r) =>
          r.status === "concluida" && !!r.data_checkout && r.data_checkout.startsWith(inicioMes),
      ),
    [reservas, inicioMes],
  );

  const naoRespondidas = useMemo(
    () =>
      reservas.filter(
        (r) => !ENCERRADA.has(r.status ?? "") && ultimasMensagens.get(r.id)?.autor_role === "user",
      ),
    [reservas, ultimasMensagens],
  );

  const abrirReserva = (reserva: ReservaEstabelecimentoRow) => {
    void navigate({ to: "/meu-estabelecimento/reservas", search: { reserva: reserva.id } });
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando painel…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Clock className="h-5 w-5" />}
          label="Pendentes"
          valor={pendentes.length}
          onClick={() => void navigate({ to: "/meu-estabelecimento/reservas" })}
        />
        <KpiCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Próximas visitas"
          valor={proximasVisitas.length}
          onClick={() => void navigate({ to: "/meu-estabelecimento/reservas" })}
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Concluídas no mês"
          valor={concluidasNoMes.length}
          onClick={() => void navigate({ to: "/meu-estabelecimento/reservas" })}
        />
        <KpiCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="Não respondidas"
          valor={naoRespondidas.length}
          onClick={() =>
            void navigate({
              to: "/meu-estabelecimento/mensagens",
              search: { aba: "nao_respondidas" },
            })
          }
        />
      </div>

      <div className="bg-white border rounded-2xl p-5 sm:p-6">
        <h2 className="font-display font-bold text-lg text-primary mb-4">Próximas chegadas</h2>
        {proximasVisitas.length === 0 ? (
          <p className="text-sm text-foreground/60">Nenhuma chegada confirmada por enquanto.</p>
        ) : (
          <ul className="divide-y">
            {proximasVisitas.slice(0, 5).map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => abrirReserva(r)}
                  className="w-full text-left py-3 flex items-center justify-between gap-3 hover:bg-azul-claro/20 -mx-2 px-2 rounded-lg transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {r.familia_profiles?.nome_responsavel ?? "Família não identificada"}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="mt-1 text-xs text-foreground/60 inline-flex items-center gap-3">
                      <span>{formatDataBr(r.data_checkin)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {r.num_adultos ?? 0} adulto(s) · {r.num_autistas ?? 0} autista(s)
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="font-display font-bold text-lg text-primary mb-4">Agenda</h2>
        <Suspense
          fallback={
            <div className="bg-white border rounded-2xl p-8 text-center text-foreground/60">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando agenda…
            </div>
          }
        >
          <ReservasCalendario reservas={confirmadas} onSelecionar={abrirReserva} />
        </Suspense>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  valor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  valor: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition"
    >
      <div className="h-11 w-11 rounded-xl bg-azul-claro flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-primary">{valor}</div>
        <div className="text-xs text-foreground/60">{label}</div>
      </div>
    </button>
  );
}
