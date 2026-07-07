import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  Loader2,
  Calendar,
  Users,
  Mail,
  Phone,
  MapPin,
  Search,
  MessageSquare,
  MoreVertical,
  ShieldAlert,
  ArrowLeft,
  ExternalLink,
  MessagesSquare,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import logo from "@/assets/logo-turismo-azul.svg";
import { cn } from "@/lib/utils";
import {
  fetchEstabelecimentoDoOwner,
  fetchReservasDoEstabelecimento,
  fetchUltimasMensagensPorReservas,
  fetchContagemNaoLidasPorReservas,
  type ReservaEstabelecimentoRow,
  type ReservaMensagemRow,
} from "@/lib/queries";
import { StatusBadge, STATUS_DOT_CLASS } from "@/components/estabelecimento/StatusBadge";
import { ReservaChat } from "@/components/ReservaChat";

type Filtro = "todas" | "nao_lidas" | "nao_respondidas";

const FILTROS_VALIDOS = new Set<Filtro>(["todas", "nao_lidas", "nao_respondidas"]);

export const Route = createFileRoute("/meu-estabelecimento/mensagens")({
  head: () => ({ meta: [{ title: "Mensagens · Turismo Azul" }] }),
  validateSearch: (s: Record<string, unknown>): { reserva?: string; aba?: Filtro } => {
    const reserva = typeof s.reserva === "string" ? s.reserva : undefined;
    const aba =
      typeof s.aba === "string" && FILTROS_VALIDOS.has(s.aba as Filtro)
        ? (s.aba as Filtro)
        : undefined;
    return { ...(reserva ? { reserva } : {}), ...(aba ? { aba } : {}) };
  },
  component: MeuEstabelecimentoMensagensPage,
});

const ENCERRADA = new Set(["cancelada", "concluida"]);

function formatDataBr(dataIso: string | null): string {
  if (!dataIso) return "-";
  return format(parseISO(dataIso), "dd/MM/yyyy");
}

function iniciais(nome: string | null | undefined): string {
  if (!nome) return "?";
  const partes = nome.trim().split(/\s+/);
  const letras = partes.length > 1 ? [partes[0][0], partes[partes.length - 1][0]] : [partes[0][0]];
  return letras.join("").toUpperCase();
}

function MeuEstabelecimentoMensagensPage() {
  const { user, loading, signOut, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { reserva: reservaIdBusca, aba } = Route.useSearch();

  const [carregando, setCarregando] = useState(true);
  const [reservas, setReservas] = useState<ReservaEstabelecimentoRow[]>([]);
  const [ultimasMensagens, setUltimasMensagens] = useState<Map<string, ReservaMensagemRow>>(
    new Map(),
  );
  const [naoLidas, setNaoLidas] = useState<Map<string, number>>(new Map());
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>(aba ?? "todas");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preSelecionou, setPreSelecionou] = useState(false);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

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
        toast.error("As conversas ficam disponíveis para locais com Selo Azul ativo.");
        navigate({ to: "/meu-estabelecimento" });
        return;
      }

      try {
        const data = await fetchReservasDoEstabelecimento(estabRow.id);
        setReservas(data);

        const ids = data.map((r) => r.id);
        const [ultimas, contagem] = await Promise.all([
          fetchUltimasMensagensPorReservas(ids),
          fetchContagemNaoLidasPorReservas(ids, user.id),
        ]);
        setUltimasMensagens(ultimas);
        setNaoLidas(contagem);
      } catch (err) {
        toast.error("Erro ao carregar conversas", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setCarregando(false);
      }
    })();
  }, [user, loading, role, pathname, navigate]);

  useEffect(() => {
    if (preSelecionou || carregando || !reservaIdBusca) return;
    if (reservas.some((r) => r.id === reservaIdBusca)) setSelectedId(reservaIdBusca);
    setPreSelecionou(true);
  }, [preSelecionou, carregando, reservaIdBusca, reservas]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`estab-reserva-mensagens:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reserva_mensagens" },
        (payload) => {
          const nova = payload.new as ReservaMensagemRow;
          setUltimasMensagens((m) => new Map(m).set(nova.reserva_id, nova));
          if (nova.autor_id !== user.id && selectedIdRef.current !== nova.reserva_id) {
            setNaoLidas((m) => new Map(m).set(nova.reserva_id, (m.get(nova.reserva_id) ?? 0) + 1));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const conversas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return reservas
      .filter((r) =>
        termo ? (r.familia_profiles?.nome_responsavel ?? "").toLowerCase().includes(termo) : true,
      )
      .filter((r) => {
        if (filtro === "nao_lidas") return (naoLidas.get(r.id) ?? 0) > 0;
        if (filtro === "nao_respondidas") {
          return (
            !ENCERRADA.has(r.status ?? "") && ultimasMensagens.get(r.id)?.autor_role === "user"
          );
        }
        return true;
      })
      .slice()
      .sort((a, b) => {
        const ta = ultimasMensagens.get(a.id)?.criado_em ?? a.criado_em;
        const tb = ultimasMensagens.get(b.id)?.criado_em ?? b.criado_em;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
  }, [reservas, busca, filtro, naoLidas, ultimasMensagens]);

  const selected = useMemo(
    () => reservas.find((r) => r.id === selectedId) ?? null,
    [reservas, selectedId],
  );

  if (loading || carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white isolate">
      <header className="bg-white border-b shrink-0 z-30">
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
            <Link
              to="/meu-estabelecimento/reservas"
              className="px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              Reservas
            </Link>
            <span className="px-3 py-2 rounded-lg font-semibold text-primary bg-azul-claro">
              Mensagens
            </span>
            <button
              onClick={() => void signOut().then(() => navigate({ to: "/" }))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </nav>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <aside
          className={cn(
            "w-full md:w-[320px] shrink-0 border-r flex flex-col min-h-0",
            selected && "hidden md:flex",
          )}
        >
          <div className="p-4 space-y-3 border-b shrink-0">
            <h1 className="font-display font-bold text-xl text-primary">Conversas</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por família…"
                className="pl-9 h-9 bg-muted/40 border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFiltro("todas")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition",
                  filtro === "todas"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground/60 hover:bg-muted/70",
                )}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltro("nao_lidas")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition",
                  filtro === "nao_lidas"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground/60 hover:bg-muted/70",
                )}
              >
                Não lidas
              </button>
              <button
                onClick={() => setFiltro("nao_respondidas")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition",
                  filtro === "nao_respondidas"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground/60 hover:bg-muted/70",
                )}
              >
                Não respondidas
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {conversas.length === 0 ? (
              <p className="text-sm text-foreground/50 text-center p-6">
                Nenhuma conversa por aqui ainda.
              </p>
            ) : (
              <ul>
                {conversas.map((r) => {
                  const ultima = ultimasMensagens.get(r.id);
                  const naoLidasCount = naoLidas.get(r.id) ?? 0;
                  const nome = r.familia_profiles?.nome_responsavel ?? "Família não identificada";
                  const status = r.status ?? "pendente";
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => setSelectedId(r.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/60 transition",
                          selectedId === r.id ? "bg-azul-claro/50" : "hover:bg-muted/40",
                        )}
                      >
                        <Avatar className="h-11 w-11 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                            {iniciais(nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "truncate text-sm",
                                naoLidasCount > 0
                                  ? "font-bold text-foreground"
                                  : "font-medium text-foreground/90",
                              )}
                            >
                              {nome}
                            </span>
                            <span className="text-[11px] text-foreground/40 shrink-0">
                              {new Date(ultima?.criado_em ?? r.criado_em).toLocaleDateString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p
                              className={cn(
                                "truncate text-xs",
                                naoLidasCount > 0 ? "text-foreground/80" : "text-foreground/50",
                              )}
                            >
                              {ultima ? ultima.corpo : "Nenhuma mensagem ainda"}
                            </p>
                            {naoLidasCount > 0 && (
                              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white bg-secondary shrink-0">
                                {naoLidasCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span
                              className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT_CLASS[status])}
                            />
                            <span className="text-[10px] uppercase tracking-wide text-foreground/40">
                              {status}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <section
          className={cn(
            "flex-1 min-w-0 flex-col min-h-0 bg-white",
            selected ? "flex" : "hidden md:flex",
          )}
        >
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-foreground/40 gap-2">
              <MessagesSquare className="h-10 w-10" />
              <p className="text-sm">Selecione uma conversa para começar</p>
            </div>
          ) : (
            <>
              <header className="shrink-0 border-b px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="md:hidden text-foreground/60 hover:text-primary shrink-0"
                    aria-label="Voltar para conversas"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {iniciais(selected.familia_profiles?.nome_responsavel)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="font-display font-bold text-foreground truncate">
                      {selected.familia_profiles?.nome_responsavel ?? "Família"}
                    </h2>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="text-foreground/50 hover:text-primary hover:bg-muted rounded-full p-2 transition shrink-0"
                      aria-label="Opções da conversa"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/meu-estabelecimento/reservas" search={{ reserva: selected.id }}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Ver reserva completa
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </header>

              <div className="flex-1 min-h-0">
                {user && (
                  <ReservaChat
                    key={selected.id}
                    reservaId={selected.id}
                    currentUserId={user.id}
                    encerrada={ENCERRADA.has(selected.status ?? "")}
                    onNovaMensagem={(msg) =>
                      setUltimasMensagens((m) => new Map(m).set(selected.id, msg))
                    }
                    onMarcadasComoLidas={() =>
                      setNaoLidas((m) => {
                        if (!m.has(selected.id)) return m;
                        const n = new Map(m);
                        n.delete(selected.id);
                        return n;
                      })
                    }
                  />
                )}
              </div>
            </>
          )}
        </section>

        {selected && (
          <aside className="hidden xl:flex xl:w-[320px] shrink-0 border-l flex-col overflow-y-auto bg-muted/20">
            <ReservaInfoPainel reserva={selected} />
          </aside>
        )}
      </div>
    </div>
  );
}

function ReservaInfoPainel({ reserva }: { reserva: ReservaEstabelecimentoRow }) {
  const fam = reserva.familia_profiles;
  const consentido = reserva.perfil_enviado_ao_estabelecimento;
  const nome = fam?.nome_responsavel ?? "Família não identificada";

  return (
    <div className="p-5 space-y-6">
      <div className="flex flex-col items-center text-center gap-2">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
            {iniciais(nome)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-display font-bold text-foreground">{nome}</h3>
          <div className="mt-1">
            <StatusBadge status={reserva.status} />
          </div>
        </div>
      </div>

      <section className="space-y-2.5">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
          Estadia
        </h4>
        <InfoRow icon={<Calendar className="h-4 w-4" />}>
          {formatDataBr(reserva.data_checkin)} → {formatDataBr(reserva.data_checkout)}
        </InfoRow>
        <InfoRow icon={<Users className="h-4 w-4" />}>
          {reserva.num_adultos ?? 0} adulto(s) · {reserva.num_autistas ?? 0} autista(s)
          {reserva.num_acompanhantes ? ` · ${reserva.num_acompanhantes} acompanhante(s)` : ""}
        </InfoRow>
      </section>

      <section className="space-y-2.5 border-t pt-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
          Contato
        </h4>
        {!consentido || !fam ? (
          <p className="text-xs text-foreground/50 inline-flex items-start gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />A família ainda não autorizou o
            compartilhamento dos dados de contato.
          </p>
        ) : (
          <>
            {fam.email && (
              <InfoRow icon={<Mail className="h-4 w-4" />}>
                <a href={`mailto:${fam.email}`} className="text-primary hover:underline break-all">
                  {fam.email}
                </a>
              </InfoRow>
            )}
            {fam.telefone && <InfoRow icon={<Phone className="h-4 w-4" />}>{fam.telefone}</InfoRow>}
            {(fam.cidade || fam.estado) && (
              <InfoRow icon={<MapPin className="h-4 w-4" />}>
                {[fam.cidade, fam.estado].filter(Boolean).join(" / ")}
              </InfoRow>
            )}
          </>
        )}
      </section>

      {reserva.mensagem && (
        <section className="space-y-2 border-t pt-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
            Observações
          </h4>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap rounded-xl bg-white border p-3">
            {reserva.mensagem}
          </p>
        </section>
      )}

      <div className="border-t pt-4">
        <Link
          to="/meu-estabelecimento/reservas"
          search={{ reserva: reserva.id }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <MessageSquare className="h-4 w-4" /> Ver reserva completa
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-foreground/80">
      {icon && <span className="text-foreground/40 mt-0.5 shrink-0">{icon}</span>}
      <span className="flex-1 break-words">{children}</span>
    </div>
  );
}
