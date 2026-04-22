import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import {
  fetchReservasAdmin,
  fetchAuditoriaPorReserva,
  type ReservaAdminRow,
  type AuditoriaRow,
} from "@/lib/queries";
import {
  RESERVA_STATUS,
  RESERVA_STATUS_LABEL,
  toReservaStatus,
  type ReservaStatus,
} from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Check,
  X,
  CheckCheck,
  History,
  Loader2,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reservas")({
  component: AdminReservas,
});

// Aliases locais — payloads sempre vêm de `@/lib/queries`.
type ReservaAdmin = ReservaAdminRow;
type Auditoria = AuditoriaRow;

/**
 * Filtros derivados do enum `reserva_status` — labels vêm de
 * `RESERVA_STATUS_LABEL` (exhaustive). Adicionar valor novo no banco
 * inclui o filtro automaticamente.
 */
const FILTERS = [
  { key: "todas", label: "Todas" } as const,
  ...RESERVA_STATUS.map((s) => ({ key: s, label: `${RESERVA_STATUS_LABEL[s]}s` }) as const),
] as ReadonlyArray<{ readonly key: "todas" | ReservaStatus; readonly label: string }>;

type FilterKey = (typeof FILTERS)[number]["key"];

function AdminReservas() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ReservaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("todas");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<ReservaAdmin | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    reserva: ReservaAdmin;
    next: ReservaStatus;
  } | null>(null);
  const [observacao, setObservacao] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  // Seleção em lote
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<{
    next: ReservaStatus;
    ids: string[];
  } | null>(null);
  const [bulkObservacao, setBulkObservacao] = useState("");
  const [savingBulk, setSavingBulk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReservasAdmin();
      setRows(data);
    } catch (err) {
      toast.error("Erro ao carregar reservas", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const byStatus = filter === "todas" ? rows : rows.filter((r) => r.status === filter);
    const term = q.trim().toLowerCase();
    if (!term) return byStatus;
    return byStatus.filter((r) =>
      [
        r.estabelecimentos?.nome,
        r.estabelecimentos?.cidade,
        r.familia_profiles?.nome_responsavel,
        r.familia_profiles?.email,
        r.mensagem,
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term)),
    );
  }, [rows, filter, q]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { todas: rows.length };
    for (const r of rows) {
      const k = r.status ?? "pendente";
      acc[k] = (acc[k] ?? 0) + 1;
    }
    return acc;
  }, [rows]);

  const askAction = (reserva: ReservaAdmin, next: ReservaStatus) => {
    setObservacao("");
    setConfirmAction({ reserva, next });
  };

  const applyAction = async () => {
    if (!confirmAction || !user) return;
    const { reserva, next } = confirmAction;
    const previous = toReservaStatus(reserva.status, "pendente");

    setSavingAction(true);
    const { error: updErr } = await supabase
      .from("reservas")
      .update({ status: next })
      .eq("id", reserva.id);

    if (updErr) {
      setSavingAction(false);
      toast.error("Não foi possível atualizar", { description: updErr.message });
      return;
    }

    const acaoLabel =
      next === "confirmada"
        ? "confirmar"
        : next === "cancelada"
          ? "cancelar"
          : next === "concluida"
            ? "concluir"
            : "atualizar";

    const { error: logErr } = await supabase.from("reservas_auditoria").insert({
      reserva_id: reserva.id,
      ator_id: user.id,
      ator_email: user.email ?? null,
      acao: acaoLabel,
      status_anterior: previous,
      status_novo: next,
      observacao: observacao.trim() || null,
    });

    setSavingAction(false);

    if (logErr) {
      toast.warning("Status atualizado, mas o log falhou", { description: logErr.message });
    } else {
      toast.success(`Reserva ${RESERVA_STATUS_LABEL[next].toLowerCase()}`);
    }

    // Atualiza estado local sem refetch completo
    setRows((rs) => rs.map((r) => (r.id === reserva.id ? { ...r, status: next } : r)));
    if (selected?.id === reserva.id) {
      setSelected({ ...reserva, status: next });
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Reservas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando..." : `${filtered.length} de ${rows.length} reserva(s)`}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por estabelecimento, família ou e-mail..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const n = counts[f.key] ?? 0;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-sm rounded-full border transition inline-flex items-center gap-2 ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground/70 border-border hover:border-primary/40"
              }`}
            >
              {f.label}
              <span
                className={`text-xs px-1.5 rounded-full ${
                  active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                }`}
              >
                {n}
              </span>
            </button>
          );
        })}
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
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando reservas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma reserva encontrada para este filtro.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
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
                      {r.data_checkin ? new Date(r.data_checkin).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">
                      {r.num_adultos ?? 0} adulto(s) · {r.num_autistas ?? 0} autista(s)
                    </td>
                    <td className="px-4 py-3">
                      <ReservaStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <RowActions reserva={r} onAction={askAction} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer de detalhes + auditoria */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <DetalheReserva reserva={selected} onAction={(next) => askAction(selected, next)} />
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmação de ação */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(o) => !o && !savingAction && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction ? `${verboLabel(confirmAction.next)} reserva?` : "Confirmar ação"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction && (
                <>
                  Esta ação atualizará o status para{" "}
                  <strong>{RESERVA_STATUS_LABEL[confirmAction.next]}</strong> e ficará registrada no
                  log de auditoria.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="obs" className="text-sm">
              Observação (opcional)
            </Label>
            <Textarea
              id="obs"
              rows={3}
              placeholder="Ex: confirmado por telefone com a família..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void applyAction();
              }}
              disabled={savingAction}
              className={
                confirmAction?.next === "cancelada"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {savingAction ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Aplicando...
                </>
              ) : (
                confirmAction && verboLabel(confirmAction.next)
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* -------------------- Subcomponentes -------------------- */

function RowActions({
  reserva,
  onAction,
}: {
  reserva: ReservaAdmin;
  onAction: (r: ReservaAdmin, next: ReservaStatus) => void;
}) {
  const status = reserva.status ?? "pendente";
  return (
    <div className="flex items-center justify-end gap-1">
      {status === "pendente" && (
        <>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-success hover:text-success hover:bg-success/10"
            onClick={() => onAction(reserva, "confirmada")}
          >
            <Check className="h-4 w-4 mr-1" /> Confirmar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onAction(reserva, "cancelada")}
          >
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
        </>
      )}
      {status === "confirmada" && (
        <>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => onAction(reserva, "concluida")}
          >
            <CheckCheck className="h-4 w-4 mr-1" /> Concluir
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onAction(reserva, "cancelada")}
          >
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
        </>
      )}
      {(status === "cancelada" || status === "concluida") && (
        <span className="text-xs text-muted-foreground pr-2">Sem ações</span>
      )}
    </div>
  );
}

function DetalheReserva({
  reserva,
  onAction,
}: {
  reserva: ReservaAdmin;
  onAction: (next: ReservaStatus) => void;
}) {
  const [logs, setLogs] = useState<Auditoria[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoadingLogs(true);
    void (async () => {
      try {
        const data = await fetchAuditoriaPorReserva(reserva.id);
        if (cancel) return;
        setLogs(data);
      } catch (err) {
        if (cancel) return;
        toast.error("Erro ao carregar histórico", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        if (!cancel) setLoadingLogs(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [reserva.id]);

  const status = reserva.status ?? "pendente";
  const fam = reserva.familia_profiles;
  const est = reserva.estabelecimentos;

  return (
    <>
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <SheetTitle className="text-xl font-display">{est?.nome ?? "Reserva"}</SheetTitle>
          <ReservaStatusBadge status={reserva.status} />
        </div>
        <SheetDescription>
          Criada em{" "}
          {new Date(reserva.criado_em).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-5">
        {/* Dados da estadia */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Estadia
          </h3>
          <InfoLine icon={<Calendar className="h-4 w-4" />} label="Check-in">
            {reserva.data_checkin
              ? new Date(reserva.data_checkin).toLocaleDateString("pt-BR")
              : "—"}
          </InfoLine>
          <InfoLine icon={<Calendar className="h-4 w-4" />} label="Check-out">
            {reserva.data_checkout
              ? new Date(reserva.data_checkout).toLocaleDateString("pt-BR")
              : "—"}
          </InfoLine>
          <InfoLine icon={<Users className="h-4 w-4" />} label="Pessoas">
            {reserva.num_adultos ?? 0} adulto(s) · {reserva.num_autistas ?? 0} autista(s)
          </InfoLine>
        </section>

        {/* Família */}
        <section className="space-y-2 border-t pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Família
          </h3>
          <div className="font-medium text-foreground">{fam?.nome_responsavel ?? "—"}</div>
          {fam?.email && (
            <InfoLine icon={<Mail className="h-4 w-4" />} label="E-mail">
              <a href={`mailto:${fam.email}`} className="text-primary hover:underline">
                {fam.email}
              </a>
            </InfoLine>
          )}
          {fam?.telefone && (
            <InfoLine icon={<Phone className="h-4 w-4" />} label="Telefone">
              {fam.telefone}
            </InfoLine>
          )}
          {(fam?.cidade || fam?.estado) && (
            <InfoLine icon={<MapPin className="h-4 w-4" />} label="Local">
              {[fam.cidade, fam.estado].filter(Boolean).join(" / ")}
            </InfoLine>
          )}
        </section>

        {/* Mensagem */}
        {reserva.mensagem && (
          <section className="space-y-2 border-t pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mensagem da família
            </h3>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap rounded-lg bg-muted/40 p-3">
              {reserva.mensagem}
            </p>
          </section>
        )}

        {/* Ações */}
        <section className="border-t pt-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ações
          </h3>
          <div className="flex flex-wrap gap-2">
            {status === "pendente" && (
              <>
                <Button
                  size="sm"
                  className="bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => onAction("confirmada")}
                >
                  <Check className="h-4 w-4 mr-1" /> Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => onAction("cancelada")}
                >
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              </>
            )}
            {status === "confirmada" && (
              <>
                <Button size="sm" onClick={() => onAction("concluida")}>
                  <CheckCheck className="h-4 w-4 mr-1" /> Marcar como concluída
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => onAction("cancelada")}
                >
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              </>
            )}
            {(status === "cancelada" || status === "concluida") && (
              <p className="text-sm text-muted-foreground">
                Esta reserva está finalizada e não pode ser alterada.
              </p>
            )}
          </div>
        </section>

        {/* Auditoria */}
        <section className="border-t pt-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" /> Histórico de alterações
          </h3>
          {loadingLogs ? (
            <p className="text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Carregando...
            </p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
          ) : (
            <ol className="space-y-3">
              {logs.map((log) => (
                <li key={log.id} className="rounded-lg border bg-card px-3 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground capitalize">{log.acao}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.criado_em).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {log.status_anterior ?? "—"} → {log.status_novo ?? "—"}
                  </div>
                  {log.ator_email && (
                    <div className="text-xs text-muted-foreground mt-0.5">por {log.ator_email}</div>
                  )}
                  {log.observacao && (
                    <p className="text-sm text-foreground/80 mt-2 rounded bg-muted/40 px-2 py-1.5">
                      {log.observacao}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

function InfoLine({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="text-foreground/90 flex-1 break-words">{children}</span>
    </div>
  );
}

function ReservaStatusBadge({ status }: { status: Tables<"reservas">["status"] }) {
  switch (status) {
    case "confirmada":
      return <Badge className="bg-success/15 text-success hover:bg-success/15">Confirmada</Badge>;
    case "pendente":
      return <Badge className="bg-warning/15 text-warning hover:bg-warning/15">Pendente</Badge>;
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

function verboLabel(s: ReservaStatus) {
  switch (s) {
    case "confirmada":
      return "Confirmar";
    case "cancelada":
      return "Cancelar";
    case "concluida":
      return "Concluir";
    default:
      return "Atualizar";
  }
}
