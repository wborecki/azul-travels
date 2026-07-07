import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  LogOut,
  Loader2,
  Calendar,
  Users,
  Mail,
  Phone,
  MapPin,
  FileDown,
  ShieldAlert,
  Search,
  List,
  CalendarDays,
  Check,
  X,
  CheckCheck,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import logo from "@/assets/logo-turismo-azul.svg";
import {
  RESERVA_STATUS,
  RESERVA_STATUS_LABEL,
  podeTransicionarReserva,
  mensagemTransicaoInvalida,
  toReservaStatus,
  type ReservaStatus,
} from "@/lib/enums";
import {
  fetchEstabelecimentoDoOwner,
  fetchReservasDoEstabelecimento,
  atualizarStatusReservaEstabelecimento,
  registrarAuditoriaReservaEstabelecimento,
  type EstabelecimentoDoOwner,
  type ReservaEstabelecimentoRow,
} from "@/lib/queries";
import { StatusBadge } from "@/components/estabelecimento/StatusBadge";

// FullCalendar é pesado (~400kB) - carregado só quando o usuário abre a aba Calendário.
const ReservasCalendario = lazy(() =>
  import("@/components/estabelecimento/ReservasCalendario").then((m) => ({
    default: m.ReservasCalendario,
  })),
);

export const Route = createFileRoute("/meu-estabelecimento/reservas")({
  head: () => ({ meta: [{ title: "Reservas · Turismo Azul" }] }),
  validateSearch: (s: Record<string, unknown>): { reserva?: string } => {
    const reserva = typeof s.reserva === "string" ? s.reserva : undefined;
    return reserva ? { reserva } : {};
  },
  component: MeuEstabelecimentoReservasPage,
});

const FILTERS = [
  { key: "todas", label: "Todas" } as const,
  ...RESERVA_STATUS.map((s) => ({ key: s, label: `${RESERVA_STATUS_LABEL[s]}s` }) as const),
] as ReadonlyArray<{ readonly key: "todas" | ReservaStatus; readonly label: string }>;

type FilterKey = (typeof FILTERS)[number]["key"];

/**
 * Formata uma coluna DATE (ex: "2026-07-16") sem o bug clássico de fuso:
 * `new Date("2026-07-16")` interpreta a string como UTC meia-noite, que ao
 * converter para o fuso local (ex: America/Sao_Paulo, UTC-3) vira o dia
 * anterior às 21h - exibindo a data errada. `parseISO` interpreta a mesma
 * string como meia-noite **local**, evitando o deslocamento.
 */
function formatDataBr(dataIso: string | null): string {
  if (!dataIso) return "-";
  return format(parseISO(dataIso), "dd/MM/yyyy");
}

function MeuEstabelecimentoReservasPage() {
  const { user, loading, signOut, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { reserva: reservaIdBusca } = Route.useSearch();

  const [carregando, setCarregando] = useState(true);
  const [estab, setEstab] = useState<EstabelecimentoDoOwner | null>(null);
  const [reservas, setReservas] = useState<ReservaEstabelecimentoRow[]>([]);
  const [filtro, setFiltro] = useState<FilterKey>("pendente");
  const [busca, setBusca] = useState("");
  const [visualizacao, setVisualizacao] = useState<"lista" | "calendario">("lista");
  const [selected, setSelected] = useState<ReservaEstabelecimentoRow | null>(null);
  const [preSelecionou, setPreSelecionou] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    reserva: ReservaEstabelecimentoRow;
    next: ReservaStatus;
  } | null>(null);
  const [observacao, setObservacao] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: pathname } });
      return;
    }
    if (role && role !== "estabelecimento" && role !== "admin") {
      navigate({ to: "/minha-conta" });
      return;
    }
    void (async () => {
      const estabRow = await fetchEstabelecimentoDoOwner(user.id);

      if (!estabRow || !estabRow.selo_azul || estabRow.status !== "ativo") {
        toast.error("O painel de reservas fica disponível para locais com Selo Azul ativo.");
        navigate({ to: "/meu-estabelecimento" });
        return;
      }
      setEstab(estabRow);

      try {
        const data = await fetchReservasDoEstabelecimento(estabRow.id);
        setReservas(data);
      } catch (err) {
        toast.error("Erro ao carregar reservas", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setCarregando(false);
      }
    })();
  }, [user, loading, role, pathname, navigate]);

  // Deep link (?reserva=id) vindo da tela de Mensagens - abre o detalhe direto.
  useEffect(() => {
    if (preSelecionou || carregando || !reservaIdBusca) return;
    const alvo = reservas.find((r) => r.id === reservaIdBusca);
    if (alvo) setSelected(alvo);
    setPreSelecionou(true);
  }, [preSelecionou, carregando, reservaIdBusca, reservas]);

  const reservasComBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return reservas;
    return reservas.filter((r) =>
      (r.familia_profiles?.nome_responsavel ?? "").toLowerCase().includes(termo),
    );
  }, [reservas, busca]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: reservasComBusca.length };
    for (const s of RESERVA_STATUS) c[s] = 0;
    for (const r of reservasComBusca) {
      if (r.status) c[r.status] = (c[r.status] ?? 0) + 1;
    }
    return c;
  }, [reservasComBusca]);

  const listaFiltrada = useMemo(() => {
    if (filtro === "todas") return reservasComBusca;
    return reservasComBusca.filter((r) => r.status === filtro);
  }, [reservasComBusca, filtro]);

  const askAction = (reserva: ReservaEstabelecimentoRow, next: ReservaStatus) => {
    setObservacao("");
    setConfirmAction({ reserva, next });
  };

  const applyAction = async () => {
    if (!confirmAction || !user) return;
    const { reserva, next } = confirmAction;
    const previous = toReservaStatus(reserva.status, "pendente");

    if (next === "cancelada" && !observacao.trim()) return;

    // Guarda no cliente - espelha a regra do banco e evita ida desnecessária.
    if (!podeTransicionarReserva(previous, next)) {
      const msg =
        mensagemTransicaoInvalida({ message: "INVALID_STATUS_TRANSITION" }, previous, next) ??
        "Transição de status inválida.";
      toast.error("Transição não permitida", { description: msg });
      return;
    }

    setSavingAction(true);
    try {
      await atualizarStatusReservaEstabelecimento(reserva.id, next);
    } catch (err) {
      setSavingAction(false);
      const errObj = err as { message?: string; hint?: string; details?: string } | null;
      const friendly = mensagemTransicaoInvalida(errObj, previous, next);
      toast.error(friendly ? "Transição não permitida" : "Não foi possível atualizar", {
        description: friendly ?? errObj?.message ?? undefined,
      });
      return;
    }

    const acaoLabel =
      next === "confirmada"
        ? "confirmar"
        : next === "cancelada"
          ? "recusar"
          : next === "concluida"
            ? "concluir"
            : "atualizar";

    try {
      await registrarAuditoriaReservaEstabelecimento({
        reservaId: reserva.id,
        atorId: user.id,
        atorEmail: user.email ?? null,
        acao: acaoLabel,
        statusAnterior: previous,
        statusNovo: next,
        observacao: observacao.trim() || null,
      });
      toast.success(`Reserva ${RESERVA_STATUS_LABEL[next].toLowerCase()}`);
    } catch (err) {
      toast.warning("Status atualizado, mas o log falhou", {
        description: err instanceof Error ? err.message : undefined,
      });
    }

    setSavingAction(false);
    setReservas((rs) => rs.map((r) => (r.id === reserva.id ? { ...r, status: next } : r)));
    setSelected((s) => (s && s.id === reserva.id ? { ...s, status: next } : s));
    setConfirmAction(null);
  };

  if (loading || carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-azul-claro/20 isolate">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/meu-estabelecimento" className="flex items-center gap-3">
            <img src={logo} alt="Turismo Azul" className="h-8 w-auto" />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 text-sm">
            <Link
              to="/meu-estabelecimento"
              className="px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              Meu Estabelecimento
            </Link>
            <span className="px-3 py-2 rounded-lg font-semibold text-primary bg-azul-claro">
              Reservas
            </span>
            <Link
              to="/meu-estabelecimento/mensagens"
              className="px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              Mensagens
            </Link>
            <button
              onClick={() => void signOut().then(() => navigate({ to: "/" }))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-primary">Reservas recebidas</h1>
            <p className="text-sm text-foreground/70 mt-1">
              Solicitações de famílias para {estab?.nome ?? "o seu local"}.
            </p>
          </div>
          <Tabs
            value={visualizacao}
            onValueChange={(v) => setVisualizacao(v as typeof visualizacao)}
          >
            <TabsList>
              <TabsTrigger value="lista" className="gap-1.5">
                <List className="h-4 w-4" /> Lista
              </TabsTrigger>
              <TabsTrigger value="calendario" className="gap-1.5">
                <CalendarDays className="h-4 w-4" /> Calendário
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome da família…"
            className="pl-9 bg-white"
          />
        </div>

        {visualizacao === "calendario" ? (
          <Suspense
            fallback={
              <div className="bg-white border rounded-2xl p-8 text-center text-foreground/60">
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando calendário…
              </div>
            }
          >
            <ReservasCalendario reservas={reservasComBusca} onSelecionar={setSelected} />
          </Suspense>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFiltro(f.key)}
                  className={[
                    "px-3 py-1.5 rounded-full text-sm font-medium transition inline-flex items-center gap-1.5",
                    filtro === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-white border text-foreground/70 hover:bg-azul-claro",
                  ].join(" ")}
                >
                  {f.label}
                  <span
                    className={[
                      "inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-xs font-bold",
                      filtro === f.key ? "bg-white/20" : "bg-azul-claro text-primary",
                    ].join(" ")}
                  >
                    {counts[f.key] ?? 0}
                  </span>
                </button>
              ))}
            </div>

            {listaFiltrada.length === 0 ? (
              <div className="bg-white border rounded-2xl p-8 text-center text-foreground/60">
                Nenhuma reserva{" "}
                {filtro !== "todas" ? RESERVA_STATUS_LABEL[filtro].toLowerCase() : ""} por aqui
                ainda.
              </div>
            ) : (
              <ul className="space-y-3">
                {listaFiltrada.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => setSelected(r)}
                      className="w-full text-left bg-white border rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">
                            {r.familia_profiles?.nome_responsavel ?? "Família não identificada"}
                          </span>
                          <StatusBadge status={r.status} />
                        </div>
                        <div className="mt-1 text-sm text-foreground/60 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDataBr(r.data_checkin)}
                            {" → "}
                            {formatDataBr(r.data_checkout)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {r.num_adultos ?? 0} adulto(s) · {r.num_autistas ?? 0} autista(s)
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-foreground/50 shrink-0">
                        {new Date(r.criado_em).toLocaleDateString("pt-BR")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <Footer />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <DetalheReserva
              reserva={selected}
              estab={estab}
              onAction={(next) => askAction(selected, next)}
            />
          )}
        </SheetContent>
      </Sheet>

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
                  histórico da reserva.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="obs" className="text-sm">
              {confirmAction?.next === "cancelada"
                ? "Motivo da recusa (obrigatório)"
                : "Observação (opcional)"}
            </Label>
            <Textarea
              id="obs"
              rows={3}
              placeholder={
                confirmAction?.next === "cancelada"
                  ? "Explique à família por que não será possível receber a visita…"
                  : "Ex: confirmado por telefone com a família…"
              }
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
              disabled={savingAction || (confirmAction?.next === "cancelada" && !observacao.trim())}
              className={
                confirmAction?.next === "cancelada"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {savingAction ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Aplicando…
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

function verboLabel(s: ReservaStatus) {
  switch (s) {
    case "confirmada":
      return "Confirmar";
    case "cancelada":
      return "Recusar";
    case "concluida":
      return "Concluir";
    default:
      return "Atualizar";
  }
}

function DetalheReserva({
  reserva,
  estab,
  onAction,
}: {
  reserva: ReservaEstabelecimentoRow;
  estab: EstabelecimentoDoOwner | null;
  onAction: (next: ReservaStatus) => void;
}) {
  const fam = reserva.familia_profiles;
  const perfilTea = reserva.perfil_tea;
  const perfilSensorial = reserva.perfil_sensorial;
  const consentido = reserva.perfil_enviado_ao_estabelecimento;

  return (
    <>
      <SheetHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <SheetTitle className="text-xl font-display">
            {fam?.nome_responsavel ?? "Reserva"}
          </SheetTitle>
          <StatusBadge status={reserva.status} />
        </div>
        <SheetDescription>
          Recebida em{" "}
          {new Date(reserva.criado_em).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-5">
        {(reserva.status === "pendente" || reserva.status === "confirmada") && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ações
            </h3>
            <div className="flex flex-wrap gap-2">
              {reserva.status === "pendente" && (
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
                    <X className="h-4 w-4 mr-1" /> Recusar
                  </Button>
                </>
              )}
              {reserva.status === "confirmada" && (
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
                    <X className="h-4 w-4 mr-1" /> Recusar
                  </Button>
                </>
              )}
            </div>
          </section>
        )}

        <section
          className={
            reserva.status === "pendente" || reserva.status === "confirmada"
              ? "space-y-2 border-t pt-4"
              : "space-y-2"
          }
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Estadia
          </h3>
          <InfoLine icon={<Calendar className="h-4 w-4" />} label="Check-in">
            {formatDataBr(reserva.data_checkin)}
          </InfoLine>
          <InfoLine icon={<Calendar className="h-4 w-4" />} label="Check-out">
            {formatDataBr(reserva.data_checkout)}
          </InfoLine>
          <InfoLine icon={<Users className="h-4 w-4" />} label="Pessoas">
            {reserva.num_adultos ?? 0} adulto(s) · {reserva.num_autistas ?? 0} autista(s)
            {reserva.num_acompanhantes ? ` · ${reserva.num_acompanhantes} acompanhante(s)` : ""}
          </InfoLine>
          {reserva.pessoa_referencia && (
            <InfoLine icon={<Users className="h-4 w-4" />} label="Referência">
              {reserva.pessoa_referencia}
            </InfoLine>
          )}
        </section>

        <section className="space-y-2 border-t pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Família
          </h3>
          {fam ? (
            <>
              <div className="font-medium text-foreground">{fam.nome_responsavel ?? "-"}</div>
              {fam.email && (
                <InfoLine icon={<Mail className="h-4 w-4" />} label="E-mail">
                  <a href={`mailto:${fam.email}`} className="text-primary hover:underline">
                    {fam.email}
                  </a>
                </InfoLine>
              )}
              {fam.telefone && (
                <InfoLine icon={<Phone className="h-4 w-4" />} label="Telefone">
                  {fam.telefone}
                </InfoLine>
              )}
              {(fam.cidade || fam.estado) && (
                <InfoLine icon={<MapPin className="h-4 w-4" />} label="Local">
                  {[fam.cidade, fam.estado].filter(Boolean).join(" / ")}
                </InfoLine>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground inline-flex items-start gap-1.5">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />A família ainda não autorizou o
              compartilhamento dos dados de contato.
            </p>
          )}
        </section>

        {(reserva.objetivo_viagem?.length ||
          reserva.notas_especificas ||
          reserva.historico_negativo ||
          reserva.recomendacoes_adicionais ||
          reserva.conversa_previa_equipe) && (
          <section className="space-y-2 border-t pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pré-checkin
            </h3>
            {!!reserva.objetivo_viagem?.length && (
              <InfoLine label="Objetivo da viagem">{reserva.objetivo_viagem.join(", ")}</InfoLine>
            )}
            {reserva.notas_especificas && (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap rounded-lg bg-muted/40 p-3">
                <span className="font-medium">Notas específicas: </span>
                {reserva.notas_especificas}
              </p>
            )}
            {reserva.historico_negativo && (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap rounded-lg bg-destructive/5 p-3">
                <span className="font-medium">Histórico negativo (atenção): </span>
                {reserva.historico_negativo}
              </p>
            )}
            {reserva.recomendacoes_adicionais && (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap rounded-lg bg-muted/40 p-3">
                <span className="font-medium">Recomendações adicionais: </span>
                {reserva.recomendacoes_adicionais}
              </p>
            )}
            {reserva.conversa_previa_equipe && (
              <p className="text-sm text-primary italic">
                → A família solicita conversa prévia com a equipe.
              </p>
            )}
          </section>
        )}

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

        <section className="space-y-3 border-t pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Perfil sensorial / TEA
          </h3>
          {!consentido ? (
            <p className="text-sm text-muted-foreground inline-flex items-start gap-1.5">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />A família ainda não autorizou o
              compartilhamento do perfil sensorial para esta reserva.
            </p>
          ) : perfilTea ? (
            <>
              <PerfilTeaDestaques perfil={perfilTea} />
              <Button
                size="sm"
                variant="outline"
                className="border-primary text-primary hover:bg-azul-claro"
                onClick={() =>
                  void import("@/lib/pdf/perfilTeaPdf").then(({ baixarPerfilTeaPdf }) =>
                    baixarPerfilTeaPdf({ perfil: perfilTea, reserva, estabelecimento: estab }),
                  )
                }
              >
                <FileDown className="h-4 w-4 mr-1.5" /> Baixar perfil completo em PDF
              </Button>
            </>
          ) : perfilSensorial ? (
            <PerfilSensorialDestaques perfil={perfilSensorial} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum perfil sensorial vinculado a esta reserva.
            </p>
          )}
        </section>

        <section className="border-t pt-4">
          <Link
            to="/meu-estabelecimento/mensagens"
            search={{ reserva: reserva.id }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <MessageSquare className="h-4 w-4" /> Ver conversa com a família
          </Link>
        </section>
      </div>
    </>
  );
}

/** Destaques operacionais do Perfil TEA - o documento completo vai no PDF. */
function PerfilTeaDestaques({
  perfil,
}: {
  perfil: NonNullable<ReservaEstabelecimentoRow["perfil_tea"]>;
}) {
  const todos: Array<[string, string]> = [
    ["Idade", perfil.idade != null ? `${perfil.idade} anos` : ""],
    ["Gatilho sensorial principal", perfil.gatilho_sensorial ?? ""],
    ["Estímulos que acalmam", perfil.estimulos_acalmam ?? ""],
    ["O que NÃO fazer", perfil.o_que_nao_fazer ?? ""],
    ["Sensibilidades alimentares", (perfil.sensibilidades_alimentares ?? []).join(", ")],
    ["Risco de fuga", perfil.risco_fuga ? "Sim" : ""],
    ["Ansiedade no check-in", perfil.checkin_ansiedade ? "Sim, evitar fila" : ""],
    ["Equipe deve ser avisada antes", perfil.checkin_equipe_saber ? "Sim" : ""],
  ];
  const destaques = todos.filter(([, v]) => v);

  if (destaques.length === 0) return null;

  return (
    <dl className="grid sm:grid-cols-2 gap-2 text-sm">
      {destaques.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-muted/40 px-3 py-2">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-foreground/90">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Fallback para o perfil sensorial legado (sem o PDF do Perfil TEA). */
function PerfilSensorialDestaques({
  perfil,
}: {
  perfil: NonNullable<ReservaEstabelecimentoRow["perfil_sensorial"]>;
}) {
  const todasFlags: Array<[string, boolean | null]> = [
    ["Sensível a sons", perfil.sensivel_sons],
    ["Sensível à luz", perfil.sensivel_luz],
    ["Sensível a texturas", perfil.sensivel_texturas],
    ["Sensível a cheiros", perfil.sensivel_cheiros],
    ["Sensível a multidões", perfil.sensivel_multidao],
    ["Precisa de sala sensorial", perfil.precisa_sala_sensorial],
    ["Precisa de check-in antecipado", perfil.precisa_checkin_antecipado],
    ["Precisa de fila prioritária", perfil.precisa_fila_prioritaria],
    ["Precisa de cardápio visual", perfil.precisa_cardapio_visual],
    ["Dificuldade em esperar", perfil.dificuldade_esperar],
    ["Dificuldade com mudança de rotina", perfil.dificuldade_mudanca_rotina],
  ];
  const flags = todasFlags.filter(([, v]) => v === true);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {flags.map(([label]) => (
          <span
            key={label}
            className="text-xs font-medium bg-azul-claro text-primary px-2.5 py-1 rounded-full"
          >
            {label}
          </span>
        ))}
      </div>
      {perfil.notas_adicionais && (
        <p className="text-sm text-foreground/80 whitespace-pre-wrap rounded-lg bg-muted/40 p-3">
          {perfil.notas_adicionais}
        </p>
      )}
    </div>
  );
}

function InfoLine({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-foreground/90 flex-1 break-words">{children}</span>
    </div>
  );
}
