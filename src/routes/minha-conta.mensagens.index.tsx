import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchReservasDaFamilia, type ReservaComContexto } from "@/lib/queries/reservas";
import {
  fetchUltimasMensagensPorReservas,
  fetchContagemNaoLidasPorReservas,
  type ReservaMensagemRow,
} from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Search,
  MessageSquare,
  MessagesSquare,
  MoreVertical,
  ArrowLeft,
  ExternalLink,
  Calendar,
  Users,
  MapPin,
  Phone,
} from "lucide-react";
import { formatDateBR } from "@/lib/brazil";
import { RESERVA_STATUS_LABEL, type ReservaStatus } from "@/lib/enums";
import { STATUS_DOT_CLASS, STATUS_CHIP_CLASS } from "@/components/estabelecimento/StatusBadge";
import { ReservaChat } from "@/components/ReservaChat";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/minha-conta/mensagens/")({
  validateSearch: (s: Record<string, unknown>): { reserva?: string } => {
    const reserva = typeof s.reserva === "string" ? s.reserva : undefined;
    return reserva ? { reserva } : {};
  },
  component: MensagensWorkspace,
});

const ENCERRADA = new Set(["cancelada", "concluida"]);

function iniciais(nome: string | null | undefined): string {
  if (!nome) return "?";
  const partes = nome.trim().split(/\s+/);
  const letras = partes.length > 1 ? [partes[0][0], partes[partes.length - 1][0]] : [partes[0][0]];
  return letras.join("").toUpperCase();
}

function MensagensWorkspace() {
  const { user } = useAuth();
  const { reserva: reservaIdBusca } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [reservas, setReservas] = useState<ReservaComContexto[]>([]);
  const [ultimas, setUltimas] = useState<Map<string, ReservaMensagemRow>>(new Map());
  const [naoLidas, setNaoLidas] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(reservaIdBusca ?? null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    void (async () => {
      const data = await fetchReservasDaFamilia(user.id);
      if (!alive) return;
      setReservas(data);

      const ids = data.map((r) => r.id);
      const [u, n] = await Promise.all([
        fetchUltimasMensagensPorReservas(ids),
        fetchContagemNaoLidasPorReservas(ids, user.id),
      ]);
      if (!alive) return;
      setUltimas(u);
      setNaoLidas(n);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`familia-reserva-mensagens:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reserva_mensagens" },
        (payload) => {
          const nova = payload.new as ReservaMensagemRow;
          setUltimas((m) => new Map(m).set(nova.reserva_id, nova));
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
        termo ? (r.estabelecimentos?.nome ?? "").toLowerCase().includes(termo) : true,
      )
      .filter((r) => (apenasNaoLidas ? (naoLidas.get(r.id) ?? 0) > 0 : true))
      .slice()
      .sort((a, b) => {
        const ta = ultimas.get(a.id)?.criado_em ?? a.criado_em;
        const tb = ultimas.get(b.id)?.criado_em ?? b.criado_em;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
  }, [reservas, busca, apenasNaoLidas, naoLidas, ultimas]);

  const selected = useMemo(
    () => reservas.find((r) => r.id === selectedId) ?? null,
    [reservas, selectedId],
  );

  const selecionar = (id: string | null) => {
    setSelectedId(id);
    void navigate({ search: id ? { reserva: id } : {}, replace: true });
  };

  return (
    <div className="fixed inset-x-0 top-32 bottom-0 z-20 flex bg-white">
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
              placeholder="Buscar por estabelecimento…"
              className="pl-9 h-9 bg-muted/40 border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setApenasNaoLidas(false)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition",
                !apenasNaoLidas
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground/60 hover:bg-muted/70",
              )}
            >
              Todas
            </button>
            <button
              onClick={() => setApenasNaoLidas(true)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition",
                apenasNaoLidas
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground/60 hover:bg-muted/70",
              )}
            >
              Não lidas
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="text-sm text-muted-foreground inline-flex items-center gap-2 p-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          ) : conversas.length === 0 ? (
            <div className="text-center p-6">
              <MessageSquare className="h-8 w-8 text-primary/30 mx-auto" />
              <p className="mt-2 text-sm text-foreground/50">
                Você ainda não tem reservas para conversar com um estabelecimento.
              </p>
            </div>
          ) : (
            <ul>
              {conversas.map((r) => {
                const ultima = ultimas.get(r.id);
                const naoLidasCount = naoLidas.get(r.id) ?? 0;
                const nome = r.estabelecimentos?.nome ?? "-";
                const status: ReservaStatus = r.status ?? "pendente";
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => selecionar(r.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/60 transition",
                        selectedId === r.id ? "bg-azul-claro/50" : "hover:bg-muted/40",
                      )}
                    >
                      <Avatar className="h-11 w-11 shrink-0">
                        {r.estabelecimentos?.foto_capa && (
                          <AvatarImage src={r.estabelecimentos.foto_capa} alt={nome} />
                        )}
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
                            {RESERVA_STATUS_LABEL[status]}
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
                  onClick={() => selecionar(null)}
                  className="md:hidden text-foreground/60 hover:text-primary shrink-0"
                  aria-label="Voltar para conversas"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar className="h-9 w-9 shrink-0">
                  {selected.estabelecimentos?.foto_capa && (
                    <AvatarImage
                      src={selected.estabelecimentos.foto_capa}
                      alt={selected.estabelecimentos?.nome ?? ""}
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {iniciais(selected.estabelecimentos?.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="font-display font-bold text-foreground truncate">
                    {selected.estabelecimentos?.nome ?? "Reserva"}
                  </h2>
                </div>
                <span
                  className={cn(
                    "text-[11px] uppercase font-semibold px-2 py-1 rounded-full shrink-0",
                    STATUS_CHIP_CLASS[selected.status ?? "pendente"],
                  )}
                >
                  {RESERVA_STATUS_LABEL[selected.status ?? "pendente"]}
                </span>
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
                    <Link to="/minha-conta/reservas/$id" params={{ id: selected.id }}>
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
                  onNovaMensagem={(msg) => setUltimas((m) => new Map(m).set(selected.id, msg))}
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
  );
}

function ReservaInfoPainel({ reserva }: { reserva: ReservaComContexto }) {
  const estab = reserva.estabelecimentos;

  return (
    <div className="space-y-6">
      <div
        className="h-36 w-full bg-cover bg-center bg-primary/10"
        style={estab?.foto_capa ? { backgroundImage: `url(${estab.foto_capa})` } : undefined}
      />
      <div className="px-5 space-y-6 pb-5">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">{estab?.nome ?? "-"}</h3>
          {(estab?.cidade || estab?.estado) && (
            <p className="text-sm text-foreground/50 mt-0.5">
              {[estab?.cidade, estab?.estado].filter(Boolean).join(" / ")}
            </p>
          )}
        </div>

        <section className="space-y-2.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
            Reserva
          </h4>
          <InfoRow icon={<Calendar className="h-4 w-4" />}>
            {reserva.data_checkin ? formatDateBR(reserva.data_checkin) : "-"} →{" "}
            {reserva.data_checkout ? formatDateBR(reserva.data_checkout) : "-"}
          </InfoRow>
          <InfoRow icon={<Users className="h-4 w-4" />}>
            {reserva.num_adultos ?? 0} adulto(s) · {reserva.num_autistas ?? 0} autista(s)
            {reserva.num_acompanhantes ? ` · ${reserva.num_acompanhantes} acompanhante(s)` : ""}
          </InfoRow>
        </section>

        <section className="space-y-2.5 border-t pt-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
            Local
          </h4>
          {estab?.endereco && (
            <InfoRow icon={<MapPin className="h-4 w-4" />}>{estab.endereco}</InfoRow>
          )}
          {estab?.telefone && (
            <InfoRow icon={<Phone className="h-4 w-4" />}>{estab.telefone}</InfoRow>
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
            to="/minha-conta/reservas/$id"
            params={{ id: reserva.id }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <MessageSquare className="h-4 w-4" /> Ver reserva completa
          </Link>
        </div>
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
