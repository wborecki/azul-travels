import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  fetchItemReservavelPorId,
  fetchEstabelecimentoPorId,
  fetchAvaliacoesPublicasPorEstab,
  fetchPerfisDaFamilia,
  criarReserva,
  vincularPerfisAReserva,
  criarPerfilSensorial,
  buildReservaPayload,
  type ItemReservavel,
  type EstabelecimentoNormalized,
  type AvaliacaoComFamilia,
  type PerfilOption,
} from "@/lib/queries";
import {
  PerfilSensorialForm,
  DEFAULT_PERFIL_DRAFT,
  type PerfilSensorialDraft,
} from "@/components/PerfilSensorialForm";
import { useAuth } from "@/hooks/useAuth";
import { naturezaDaReserva, ESTAB_TIPO_LABEL } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDataISO, parseDataISO, parseInteiroUrl } from "@/lib/brazil";
import { ArrowLeft, Check, Loader2, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReservarSearch {
  itemId?: string;
  /** Reserva direta do local (visita). Mutuamente exclusivo com `itemId`. */
  estabelecimentoId?: string;
  checkIn?: string;
  checkOut?: string;
  /** "HH:MM" - só na visita. */
  hora?: string;
  adultos?: number;
  criancas?: number;
}

/** "HH:MM" em 24h, o formato que o `<input type="time">` produz. */
const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const Route = createFileRoute("/reservar")({
  head: () => ({ meta: [{ title: "Pedir para reservar · Turismo Azul" }] }),
  validateSearch: (s: Record<string, unknown>): ReservarSearch => {
    // Exatamente um alvo: quarto (estadia) ou estabelecimento (visita). Se
    // vierem os dois, o item vence - é o fluxo mais específico.
    const itemId = typeof s.itemId === "string" ? s.itemId : undefined;
    const estabelecimentoId =
      !itemId && typeof s.estabelecimentoId === "string" ? s.estabelecimentoId : undefined;

    const checkInParsed = typeof s.checkIn === "string" ? parseDataISO(s.checkIn) : null;
    const checkIn = checkInParsed ? (s.checkIn as string) : undefined;
    const checkOutParsed = typeof s.checkOut === "string" ? parseDataISO(s.checkOut) : null;
    const checkOut =
      checkIn && checkInParsed && checkOutParsed && checkOutParsed > checkInParsed
        ? (s.checkOut as string)
        : undefined;

    const hora = typeof s.hora === "string" && HORA_RE.test(s.hora) ? s.hora : undefined;

    const adultos = parseInteiroUrl(s.adultos, 1);
    const criancas = parseInteiroUrl(s.criancas, 0);

    return {
      ...(itemId ? { itemId } : {}),
      ...(estabelecimentoId ? { estabelecimentoId } : {}),
      ...(checkIn ? { checkIn } : {}),
      ...(checkOut ? { checkOut } : {}),
      ...(hora ? { hora } : {}),
      ...(adultos !== undefined ? { adultos } : {}),
      ...(criancas !== undefined ? { criancas } : {}),
    };
  },
  component: ReservarPage,
});

function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function clamp(valor: number, min: number, max: number): number {
  return Math.min(Math.max(valor, min), max);
}

/**
 * Teto de pessoas numa visita. O local não declara capacidade (ele confirma ou
 * recusa o pedido), então isto é só um limite de sanidade do formulário.
 */
const MAX_PESSOAS_VISITA = 20;

/**
 * "Pedir para reservar", inspirado no fluxo do Airbnb: página pública (não
 * fica atrás do gate de login de /minha-conta) para que a família só precise
 * criar conta/entrar neste ponto, sem perder a seleção de quarto/datas feita
 * em /quartos/$id - por isso todo o contexto (itemId, datas, hóspedes) viaja
 * pela URL, igual ao restante do fluxo de reserva.
 */
function ReservarPage() {
  const {
    itemId,
    estabelecimentoId,
    checkIn: checkInStr,
    checkOut: checkOutStr,
    hora: horaParam,
    adultos: adultosParam,
    criancas: criancasParam,
  } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const hrefAtual = useRouterState({ select: (s) => s.location.href });

  const [item, setItem] = useState<ItemReservavel | null>(null);
  const [estab, setEstab] = useState<EstabelecimentoNormalized | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComFamilia[]>([]);
  const [loadingItem, setLoadingItem] = useState(true);

  useEffect(() => {
    if (!itemId && !estabelecimentoId) {
      setLoadingItem(false);
      return;
    }
    let alive = true;
    setLoadingItem(true);
    void (async () => {
      try {
        // Visita: o alvo é o próprio estabelecimento, não há item a buscar.
        const quarto = itemId ? await fetchItemReservavelPorId(itemId) : null;
        if (!alive) return;
        if (itemId && !quarto) {
          setItem(null);
          return;
        }
        const estabId = quarto?.estabelecimento_id ?? estabelecimentoId;
        if (!estabId) return;

        const [estabelecimento, avals] = await Promise.all([
          fetchEstabelecimentoPorId(estabId),
          fetchAvaliacoesPublicasPorEstab(estabId),
        ]);
        if (!alive) return;
        setItem(quarto);
        setEstab(estabelecimento);
        setAvaliacoes(avals);
      } catch (err) {
        if (!alive) return;
        toast.error("Erro ao carregar os dados da reserva", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        if (alive) setLoadingItem(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [itemId, estabelecimentoId]);

  const [perfis, setPerfis] = useState<PerfilOption[]>([]);
  const [perfisSel, setPerfisSel] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setPerfis([]);
      setPerfisSel([]);
      return;
    }
    void fetchPerfisDaFamilia(user.id).then((data) => {
      setPerfis(data);
      // Pré-seleciona todos os filhos; a família desmarca quem não vai viajar.
      setPerfisSel((atual) => (atual.length > 0 ? atual : data.map((p) => p.id)));
    });
  }, [user]);

  function togglePerfil(id: string) {
    setPerfisSel((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  const [perfilModalOpen, setPerfilModalOpen] = useState(false);
  const [novoPerfil, setNovoPerfil] = useState<PerfilSensorialDraft>(DEFAULT_PERFIL_DRAFT);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleAdicionarPerfil() {
    if (!user) return;
    if (!novoPerfil.nome_autista?.trim() || !novoPerfil.idade || !novoPerfil.nivel_tea) {
      toast.error("Preencha nome, idade e nível TEA.");
      return;
    }
    setSalvandoPerfil(true);
    try {
      const data = await criarPerfilSensorial({ ...novoPerfil, familia_id: user.id });
      toast.success(`Perfil de ${data.nome_autista} criado.`);
      setPerfis((p) => [...p, data]);
      setPerfisSel((atual) => [...atual, data.id]);
      setPerfilModalOpen(false);
      setNovoPerfil(DEFAULT_PERFIL_DRAFT);
    } catch (err) {
      toast.error("Erro ao salvar perfil", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSalvandoPerfil(false);
    }
  }

  if (!itemId && !estabelecimentoId) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h1 className="text-2xl font-bold text-primary">Nenhum lugar selecionado</h1>
        <p className="mt-2 text-muted-foreground">
          Escolha um quarto ou um lugar antes de pedir para reservar.
        </p>
        <Button asChild className="mt-4">
          <Link to="/explorar">Explorar estabelecimentos</Link>
        </Button>
      </div>
    );
  }

  if (loadingItem) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-8" />
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-4">
            <div className="h-32 bg-muted animate-pulse rounded-2xl" />
            <div className="h-48 bg-muted animate-pulse rounded-2xl" />
          </div>
          <div className="h-72 bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if ((itemId && !item) || !estab) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h1 className="text-2xl font-bold text-primary">
          {itemId ? "Quarto não encontrado" : "Lugar não encontrado"}
        </h1>
        <Button asChild className="mt-4">
          <Link to="/explorar">Explorar estabelecimentos</Link>
        </Button>
      </div>
    );
  }

  // Estadia escolhe um quarto e um período de noites; visita marca dia e hora
  // no próprio local. A natureza vem do tipo do estabelecimento - a mesma
  // regra que a trigger `sincronizar_estabelecimento_id_reserva` aplica.
  const natureza = item ? "estadia" : naturezaDaReserva(estab.tipo);
  const ehVisita = natureza === "visita";

  // Hospedagem alcançada sem quarto (link com `estabelecimentoId` para um
  // hotel): não há o que reservar aqui. É a mesma regra que a trigger recusa
  // com HOSPEDAGEM_EXIGE_ITEM - melhor dizer isso do que deixar um botão que
  // não faz nada.
  if (!item && !ehVisita) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h1 className="text-2xl font-bold text-primary">Escolha um quarto</h1>
        <p className="mt-2 text-muted-foreground">
          Em {estab.nome} a reserva é feita por quarto. Veja os quartos disponíveis e escolha um
          para enviar o pedido.
        </p>
        <Button asChild className="mt-4">
          <Link to="/estabelecimento/$slug" params={{ slug: estab.slug }}>
            Ver quartos disponíveis
          </Link>
        </Button>
      </div>
    );
  }

  // O Selo Azul é o gate da reserva em toda a plataforma - na hospedagem ele
  // vinha de graça pela RLS de `itens_reservaveis`. A visita precisa dizer a
  // regra; a trigger recusa com ESTAB_SEM_SELO_ATIVO de qualquer forma, mas
  // barrar aqui evita a família preencher tudo para levar um erro no fim.
  if (ehVisita && (!estab.selo_azul || estab.status !== "ativo")) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h1 className="text-2xl font-bold text-primary">Reserva indisponível</h1>
        <p className="mt-2 text-muted-foreground">
          {estab.nome} ainda não tem o Selo Azul, então não recebe pedidos de reserva pela
          plataforma. Na página do local você encontra os canais de contato direto.
        </p>
        <Button asChild className="mt-4">
          <Link to="/estabelecimento/$slug" params={{ slug: estab.slug }}>
            Ver página do local
          </Link>
        </Button>
      </div>
    );
  }

  const checkIn = parseDataISO(checkInStr);
  const checkOut = parseDataISO(checkOutStr);
  const hora = horaParam ?? "";
  const pedidoCompleto = ehVisita ? !!checkIn && !!hora : !!checkIn && !!checkOut;
  const noites = checkIn && checkOut ? differenceInCalendarDays(checkOut, checkIn) : 0;

  // Sem item não há capacidade declarada (decisão: o local confirma ou recusa).
  const maxTotal = item?.capacidade_total ?? MAX_PESSOAS_VISITA;
  const maxAdultosCap = item?.capacidade_adultos ?? maxTotal;
  const maxCriancasCap = item?.capacidade_criancas ?? maxTotal;
  const adultos = clamp(adultosParam ?? 1, 1, Math.max(1, Math.min(maxAdultosCap, maxTotal)));
  const criancas = clamp(
    criancasParam ?? 0,
    0,
    Math.max(0, Math.min(maxCriancasCap, maxTotal - adultos)),
  );

  const total = (item?.preco ?? 0) * noites;
  const imagensItem = item && Array.isArray(item.imagens) ? (item.imagens as string[]) : [];
  const fotoPrincipal = imagensItem[0] ?? estab.foto_capa ?? undefined;
  const tituloAlvo = item ? item.nome : estab.nome;

  const patchSearch = (patch: Partial<ReservarSearch>) =>
    void navigate({
      to: "/reservar",
      search: (prev: ReservarSearch) => ({ ...prev, ...patch }),
      replace: true,
    });
  const totalAvaliacoes = avaliacoes.length;
  const mediaAvaliacoes =
    totalAvaliacoes > 0
      ? avaliacoes.reduce((soma, a) => soma + (a.nota_geral ?? 0), 0) / totalAvaliacoes
      : 0;

  const searchParaQuarto = {
    ...(checkInStr ? { checkIn: checkInStr } : {}),
    ...(checkOutStr ? { checkOut: checkOutStr } : {}),
    ...(adultosParam !== undefined ? { adultos: adultosParam } : {}),
    ...(criancasParam !== undefined ? { criancas: criancasParam } : {}),
  };

  async function handleEnviar() {
    if (!user || !estab || !checkIn) return;
    if (item ? !checkOut : !hora) return;
    setEnviando(true);
    try {
      // O picker de hóspedes só distingue adultos/crianças (idade), não quem
      // é autista - por isso `num_autistas` reflete os perfis sensoriais
      // vinculados e `num_acompanhantes` cobre as crianças da viagem,
      // mantendo o schema existente de `reservas`. A coluna legada
      // `perfil_sensorial_id` guarda o 1º selecionado (compat); os N
      // vínculos vivem em `reserva_perfis`.
      const comum = {
        familia_id: user.id,
        estabelecimento_id: estab.id,
        perfil_sensorial_id: perfisSel[0] ?? null,
        data_checkin: formatDataISO(checkIn),
        num_adultos: adultos,
        num_autistas: perfisSel.length,
        num_acompanhantes: criancas,
        mensagem,
        perfil_enviado_ao_estabelecimento: perfisSel.length > 0,
      } as const;

      const payload = buildReservaPayload(
        item && checkOut
          ? {
              ...comum,
              natureza: "estadia",
              item_reservavel_id: item.id,
              data_checkout: formatDataISO(checkOut),
            }
          : { ...comum, natureza: "visita", hora_visita: hora },
      );
      const nova = await criarReserva(payload);
      await vincularPerfisAReserva(nova.id, perfisSel);
      toast.success("Pedido de reserva enviado!");
      void navigate({ to: "/minha-conta/reservas/$id", params: { id: nova.id } });
    } catch (err) {
      toast.error("Erro ao enviar pedido de reserva", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        {item ? (
          <Link
            to="/quartos/$id"
            params={{ id: item.id }}
            search={searchParaQuarto}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border hover:bg-muted transition"
            aria-label="Voltar para o quarto"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            to="/estabelecimento/$slug"
            params={{ slug: estab.slug }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border hover:bg-muted transition"
            aria-label="Voltar para o estabelecimento"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Pedir para reservar</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* COLUNA ESQUERDA · etapas */}
        <div className="space-y-4 min-w-0">
          <StepCard numero={1} titulo="Entrar ou cadastrar-se" concluido={!!user}>
            {authLoading ? (
              <div className="h-10 bg-muted animate-pulse rounded" />
            ) : user ? (
              <p className="text-sm text-muted-foreground">
                Conectado como <span className="font-medium text-foreground">{user.email}</span>
              </p>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Você precisa de uma conta para enviar o pedido - leva menos de um minuto e sua
                  seleção fica salva.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/login" search={{ redirect: hrefAtual }}>
                      Entrar
                    </Link>
                  </Button>
                  <Button asChild className="flex-1 bg-secondary hover:bg-secondary/90 text-white">
                    <Link to="/cadastro" search={{ redirect: hrefAtual }}>
                      Criar conta
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </StepCard>

          <StepCard numero={2} titulo="Revise seu pedido e envie" ativo={!!user}>
            <div className="space-y-5">
              {/* Na visita a data e a hora são editadas aqui: não há página de
                  quarto para onde voltar e ajustar, e cair em /reservar por
                  link direto não pode virar um beco sem saída. */}
              {ehVisita && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label
                      htmlFor="visitaData"
                      className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
                    >
                      Dia da visita
                    </Label>
                    <Input
                      id="visitaData"
                      type="date"
                      className="mt-1.5"
                      disabled={!user}
                      min={formatDataISO(new Date())}
                      value={checkInStr ?? ""}
                      onChange={(e) => patchSearch({ checkIn: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="visitaHora"
                      className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
                    >
                      Horário
                    </Label>
                    <Input
                      id="visitaHora"
                      type="time"
                      className="mt-1.5"
                      disabled={!user}
                      value={hora}
                      onChange={(e) => patchSearch({ hora: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="visitaAdultos"
                      className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
                    >
                      Adultos
                    </Label>
                    <Input
                      id="visitaAdultos"
                      type="number"
                      min={1}
                      max={MAX_PESSOAS_VISITA}
                      className="mt-1.5"
                      disabled={!user}
                      value={adultos}
                      onChange={(e) => patchSearch({ adultos: Number(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="visitaCriancas"
                      className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
                    >
                      Crianças
                    </Label>
                    <Input
                      id="visitaCriancas"
                      type="number"
                      min={0}
                      max={MAX_PESSOAS_VISITA}
                      className="mt-1.5"
                      disabled={!user}
                      value={criancas}
                      onChange={(e) => patchSearch({ criancas: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Quem vai viajar? Perfis sensoriais (opcional)
                </Label>
                <div className="mt-1.5 space-y-2">
                  {perfis.map((p) => {
                    const ativo = perfisSel.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={!user}
                        onClick={() => togglePerfil(p.id)}
                        aria-pressed={ativo}
                        className={cn(
                          "w-full text-left p-2.5 rounded-xl border-2 transition flex items-center gap-3",
                          ativo
                            ? "border-secondary bg-teal-claro/40"
                            : "border-border bg-muted/30 hover:border-secondary/40",
                        )}
                      >
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-azul-claro grid place-items-center shrink-0 border border-border">
                          {p.foto_url ? (
                            <img
                              src={p.foto_url}
                              alt={`Foto de ${p.nome_autista}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-display font-bold text-primary">
                              {p.nome_autista.trim().charAt(0).toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-primary truncate">
                            {p.nome_autista}
                          </div>
                          {p.idade != null && (
                            <div className="text-xs text-muted-foreground">{p.idade} anos</div>
                          )}
                        </div>
                        <div
                          className={cn(
                            "shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center",
                            ativo ? "border-secondary bg-secondary" : "border-border bg-background",
                          )}
                        >
                          {ativo && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!user}
                    onClick={() => setPerfilModalOpen(true)}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Adicionar perfil de outro filho
                  </Button>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Selecione todos que vão nesta viagem. Compartilhar os perfis ajuda o
                  estabelecimento a se preparar para receber sua família.
                </p>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Mensagem para o estabelecimento (opcional)
                </Label>
                <Textarea
                  className="mt-1.5"
                  rows={4}
                  placeholder="Conte um pouco sobre a viagem, necessidades específicas ou dúvidas..."
                  value={mensagem}
                  disabled={!user}
                  onChange={(e) => setMensagem(e.target.value)}
                />
              </div>

              <p className="text-xs text-muted-foreground leading-snug">
                Esta plataforma conecta você ao estabelecimento - o pagamento é feito diretamente
                com eles. Ao enviar, seu pedido fica pendente até o estabelecimento confirmar.
              </p>

              <Button
                type="button"
                className="w-full bg-secondary hover:bg-secondary/90 text-white"
                size="lg"
                disabled={!user || !pedidoCompleto || enviando}
                onClick={handleEnviar}
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando…
                  </>
                ) : (
                  "Enviar pedido de reserva"
                )}
              </Button>
              {user && !pedidoCompleto && (
                <p className="text-xs text-destructive text-center">
                  {ehVisita
                    ? "Escolha o dia e o horário da visita antes de enviar."
                    : "Volte e selecione as datas de check-in e check-out antes de enviar."}
                </p>
              )}
            </div>
          </StepCard>
        </div>

        {/* COLUNA DIREITA · resumo do pedido */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
            <div className="flex gap-3">
              <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted shrink-0">
                {fotoPrincipal && (
                  <img
                    src={fotoPrincipal}
                    alt={tituloAlvo}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{tituloAlvo}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {item ? `${estab.nome} · ` : `${ESTAB_TIPO_LABEL[estab.tipo]} · `}
                  {estab.cidade}, {estab.estado}
                </p>
                {totalAvaliacoes > 0 && (
                  <p className="mt-0.5 text-xs inline-flex items-center gap-1">
                    <Star className="h-3 w-3 text-amarelo fill-amarelo" />
                    <span className="font-semibold text-foreground">
                      {mediaAvaliacoes.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">({totalAvaliacoes})</span>
                  </p>
                )}
              </div>
            </div>

            <LinhaResumo
              label={ehVisita ? "Quando" : "Datas"}
              valor={
                ehVisita
                  ? checkIn
                    ? `${format(checkIn, "d 'de' MMM. 'de' yyyy", { locale: ptBR })}${hora ? ` às ${hora}` : ""}`
                    : "Não selecionado"
                  : checkIn && checkOut
                    ? `${format(checkIn, "d 'de' MMM.", { locale: ptBR })} – ${format(checkOut, "d 'de' MMM. 'de' yyyy", { locale: ptBR })}`
                    : "Não selecionadas"
              }
              alterarParaItemId={item?.id}
              search={searchParaQuarto}
            />

            <LinhaResumo
              label={ehVisita ? "Pessoas" : "Hóspedes"}
              valor={`${adultos} ${adultos === 1 ? "adulto" : "adultos"}${criancas > 0 ? `, ${criancas} ${criancas === 1 ? "criança" : "crianças"}` : ""}`}
              alterarParaItemId={item?.id}
              search={searchParaQuarto}
            />

            {ehVisita && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground leading-snug">
                  A reserva garante o seu lugar. Não há cobrança pela plataforma - o que for
                  consumido é pago direto no local.
                </p>
              </div>
            )}

            {noites > 0 && item && (
              <div className="border-t border-border pt-4 space-y-2">
                <div className="text-sm font-semibold text-foreground">Informações de preço</div>
                <div className="flex justify-between text-sm text-foreground/80">
                  <span>
                    {noites} {noites === 1 ? "noite" : "noites"} x {formatBRL(item.preco)}
                  </span>
                  <span>{formatBRL(total)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{formatBRL(total)}</span>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <Dialog open={perfilModalOpen} onOpenChange={setPerfilModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar novo perfil sensorial</DialogTitle>
            <DialogDescription>
              Cadastre o perfil de mais uma criança da sua família.
            </DialogDescription>
          </DialogHeader>
          <PerfilSensorialForm
            draft={novoPerfil}
            onChange={setNovoPerfil}
            onSubmit={handleAdicionarPerfil}
            onCancel={() => setPerfilModalOpen(false)}
            submitLabel="Salvar perfil"
            loading={salvandoPerfil}
            compact
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StepCard({
  numero,
  titulo,
  concluido,
  ativo = true,
  children,
}: {
  numero: number;
  titulo: string;
  concluido?: boolean;
  ativo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", !ativo && "opacity-50")}>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold",
            concluido ? "bg-success text-success-foreground" : "bg-muted text-foreground",
          )}
        >
          {concluido ? <Check className="h-4 w-4" /> : numero}
        </span>
        <h2 className="text-base font-bold text-foreground">{titulo}</h2>
      </div>
      <div className={cn("mt-4", !ativo && "pointer-events-none")}>{children}</div>
    </div>
  );
}

/**
 * Linha do resumo lateral. O botão "Alterar" só existe na estadia, onde os
 * dados são escolhidos na página do quarto; na visita eles são editados no
 * próprio passo 2, então não há para onde mandar a família.
 */
function LinhaResumo({
  label,
  valor,
  alterarParaItemId,
  search,
}: {
  label: string;
  valor: string;
  alterarParaItemId?: string;
  search: Record<string, string | number>;
}) {
  return (
    <div className="border-t border-border pt-4 flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-sm text-muted-foreground">{valor}</div>
      </div>
      {alterarParaItemId && (
        <Button asChild variant="outline" size="sm">
          <Link to="/quartos/$id" params={{ id: alterarParaItemId }} search={search}>
            Alterar
          </Link>
        </Button>
      )}
    </div>
  );
}
