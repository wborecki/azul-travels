import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchReservasDaFamilia,
  type ReservaComContexto,
} from "@/lib/queries";
import { RESERVA_STATUS, RESERVA_STATUS_LABEL, type ReservaStatus } from "@/lib/enums";
import { formatDateBR, TIPO_LABEL } from "@/lib/brazil";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp, Compass, Star, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/minha-conta/reservas")({
  component: ReservasPage,
});

type FiltroStatus = "todas" | ReservaStatus;
const FILTROS: { v: FiltroStatus; label: string }[] = [
  { v: "todas", label: "Todas" },
  { v: "pendente", label: "Pendentes" },
  { v: "confirmada", label: "Confirmadas" },
  { v: "concluida", label: "Concluídas" },
  { v: "cancelada", label: "Canceladas" },
];

const STATUS_BADGE: Record<ReservaStatus, string> = {
  pendente: "bg-warning text-warning-foreground",
  confirmada: "bg-success text-success-foreground",
  cancelada: "bg-destructive text-destructive-foreground",
  concluida: "bg-primary text-primary-foreground",
};

function ReservasPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ReservaComContexto[]>([]);
  const [filtro, setFiltro] = useState<FiltroStatus>("todas");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<ReservaComContexto | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      const data = await fetchReservasDaFamilia(user.id);
      setRows(data);
    } catch (err) {
      toast.error("Erro ao carregar reservas", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  useEffect(() => {
    void load();
  }, [user]);

  const filtradas = useMemo(() => {
    if (filtro === "todas") return rows;
    return rows.filter((r) => (r.status ?? "pendente") === filtro);
  }, [rows, filtro]);

  const cancelar = async () => {
    if (!confirmCancel) return;
    const { error } = await supabase
      .from("reservas")
      .update({ status: "cancelada" })
      .eq("id", confirmCancel.id);
    if (error) {
      toast.error("Não foi possível cancelar.", { description: error.message });
      return;
    }
    toast.success("Reserva cancelada.");
    setConfirmCancel(null);
    await load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary">Suas reservas</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o status das suas solicitações.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const ativo = filtro === f.v;
          const count = f.v === "todas" ? rows.length : rows.filter((r) => (r.status ?? "pendente") === f.v).length;
          return (
            <button
              key={f.v}
              type="button"
              onClick={() => setFiltro(f.v)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
                ativo
                  ? "border-secondary bg-secondary text-white"
                  : "border-border bg-background text-muted-foreground hover:border-secondary/40"
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs ${ativo ? "opacity-90" : "opacity-60"}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {filtradas.length === 0 ? (
        <EmptyState total={rows.length} />
      ) : (
        <div className="space-y-3">
          {filtradas.map((r) => (
            <ReservaCard
              key={r.id}
              reserva={r}
              expanded={expanded === r.id}
              onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
              onCancelar={() => setConfirmCancel(r)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              O estabelecimento será notificado. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReservaCard({
  reserva,
  expanded,
  onToggle,
  onCancelar,
}: {
  reserva: ReservaComContexto;
  expanded: boolean;
  onToggle: () => void;
  onCancelar: () => void;
}) {
  const status: ReservaStatus = reserva.status ?? "pendente";
  const estab = reserva.estabelecimentos;
  const perfil = reserva.perfil_sensorial;
  const tipoLabel = estab?.tipo ? TIPO_LABEL[estab.tipo] : "";
  const localidade = estab
    ? estab.cidade
      ? estab.estado
        ? `${estab.cidade}, ${estab.estado}`
        : estab.cidade
      : null
    : null;

  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-4 hover:bg-muted/30 transition"
      >
        {/* Foto */}
        <div className="h-16 w-16 rounded-xl bg-azul-claro overflow-hidden shrink-0 flex items-center justify-center">
          {estab?.foto_capa ? (
            <img
              src={estab.foto_capa}
              alt={estab.nome}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Compass className="h-6 w-6 text-secondary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-primary truncate">
                {estab?.nome ?? "Estabelecimento removido"}
              </div>
              <div className="text-xs text-muted-foreground">
                {[tipoLabel, localidade].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${STATUS_BADGE[status]}`}
            >
              {RESERVA_STATUS_LABEL[status]}
            </span>
          </div>

          <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
            {(reserva.data_checkin || reserva.data_checkout) && (
              <div>
                <strong className="text-foreground/80">Datas:</strong>{" "}
                {formatDateBR(reserva.data_checkin)} → {formatDateBR(reserva.data_checkout)}
              </div>
            )}
            {perfil && (
              <div>
                <strong className="text-foreground/80">Perfil enviado:</strong> {perfil.nome_autista}{" "}
                {reserva.perfil_enviado_ao_estabelecimento && (
                  <span className="text-success">✓</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t p-4 space-y-3 bg-muted/20">
          {reserva.mensagem && (
            <div>
              <div className="text-xs font-semibold text-foreground/80 mb-1">
                Mensagem enviada ao estabelecimento
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{reserva.mensagem}</p>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Solicitada em {formatDateBR(reserva.criado_em)}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {estab && (
              <Button asChild size="sm" variant="outline">
                <Link to="/estabelecimento/$slug" params={{ slug: estab.slug }}>
                  Ver estabelecimento
                </Link>
              </Button>
            )}
            {status === "concluida" && (
              <Button asChild size="sm" className="bg-secondary hover:bg-secondary/90">
                <Link
                  to="/minha-conta/avaliacoes"
                  search={{ reserva: reserva.id } as never}
                >
                  <Star className="h-3.5 w-3.5 mr-1" /> Avaliar esta experiência
                </Link>
              </Button>
            )}
            {status === "pendente" && (
              <Button size="sm" variant="outline" onClick={onCancelar} className="text-destructive">
                <X className="h-3.5 w-3.5 mr-1" /> Cancelar reserva
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ total }: { total: number }) {
  if (total === 0) {
    return (
      <div className="bg-azul-claro rounded-2xl p-10 text-center">
        <Compass className="h-12 w-12 text-secondary mx-auto mb-3" />
        <p className="font-display font-semibold text-primary">
          Você ainda não fez nenhuma reserva pela plataforma.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Que tal explorar os destinos disponíveis?
        </p>
        <Button asChild className="mt-4 bg-secondary hover:bg-secondary/90">
          <Link to="/explorar">Explorar destinos</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="bg-muted/30 rounded-2xl p-8 text-center text-sm text-muted-foreground">
      Nenhuma reserva neste filtro.
    </div>
  );
}

// Sentinel para garantir que a lista de status no banco bate com o tipo
void RESERVA_STATUS;
