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
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDataISO, parseDataISO, parseInteiroUrl } from "@/lib/brazil";
import { ArrowLeft, Check, Loader2, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReservarSearch {
  itemId?: string;
  checkIn?: string;
  checkOut?: string;
  adultos?: number;
  criancas?: number;
}

export const Route = createFileRoute("/reservar")({
  head: () => ({ meta: [{ title: "Pedir para reservar · Turismo Azul" }] }),
  validateSearch: (s: Record<string, unknown>): ReservarSearch => {
    const itemId = typeof s.itemId === "string" ? s.itemId : undefined;

    const checkInParsed = typeof s.checkIn === "string" ? parseDataISO(s.checkIn) : null;
    const checkIn = checkInParsed ? (s.checkIn as string) : undefined;
    const checkOutParsed = typeof s.checkOut === "string" ? parseDataISO(s.checkOut) : null;
    const checkOut =
      checkIn && checkInParsed && checkOutParsed && checkOutParsed > checkInParsed
        ? (s.checkOut as string)
        : undefined;

    const adultos = parseInteiroUrl(s.adultos, 1);
    const criancas = parseInteiroUrl(s.criancas, 0);

    return {
      ...(itemId ? { itemId } : {}),
      ...(checkIn ? { checkIn } : {}),
      ...(checkOut ? { checkOut } : {}),
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
 * "Pedir para reservar", inspirado no fluxo do Airbnb: página pública (não
 * fica atrás do gate de login de /minha-conta) para que a família só precise
 * criar conta/entrar neste ponto, sem perder a seleção de quarto/datas feita
 * em /quartos/$id - por isso todo o contexto (itemId, datas, hóspedes) viaja
 * pela URL, igual ao restante do fluxo de reserva.
 */
function ReservarPage() {
  const { itemId, checkIn: checkInStr, checkOut: checkOutStr, adultos: adultosParam, criancas: criancasParam } =
    Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const hrefAtual = useRouterState({ select: (s) => s.location.href });

  const [item, setItem] = useState<ItemReservavel | null>(null);
  const [estab, setEstab] = useState<EstabelecimentoNormalized | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComFamilia[]>([]);
  const [loadingItem, setLoadingItem] = useState(true);

  useEffect(() => {
    if (!itemId) {
      setLoadingItem(false);
      return;
    }
    let alive = true;
    setLoadingItem(true);
    void (async () => {
      try {
        const quarto = await fetchItemReservavelPorId(itemId);
        if (!alive) return;
        if (!quarto) {
          setItem(null);
          return;
        }
        const [estabelecimento, avals] = await Promise.all([
          fetchEstabelecimentoPorId(quarto.estabelecimento_id),
          fetchAvaliacoesPublicasPorEstab(quarto.estabelecimento_id),
        ]);
        if (!alive) return;
        setItem(quarto);
        setEstab(estabelecimento);
        setAvaliacoes(avals);
      } catch (err) {
        if (!alive) return;
        toast.error("Erro ao carregar o quarto", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        if (alive) setLoadingItem(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [itemId]);

  const [perfis, setPerfis] = useState<PerfilOption[]>([]);
  const [perfilSel, setPerfilSel] = useState<string>("");

  useEffect(() => {
    if (!user) {
      setPerfis([]);
      setPerfilSel("");
      return;
    }
    void fetchPerfisDaFamilia(user.id).then((data) => {
      setPerfis(data);
      setPerfilSel((atual) => atual || (data.length > 0 ? data[0].id : ""));
    });
  }, [user]);

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
    const { data, error } = await supabase
      .from("perfil_sensorial")
      .insert({ ...novoPerfil, familia_id: user.id })
      .select("id, nome_autista")
      .single();
    setSalvandoPerfil(false);
    if (error) {
      toast.error("Erro ao salvar perfil", { description: error.message });
      return;
    }
    toast.success(`Perfil de ${data.nome_autista} criado.`);
    setPerfis((p) => [...p, data]);
    setPerfilSel(data.id);
    setPerfilModalOpen(false);
    setNovoPerfil(DEFAULT_PERFIL_DRAFT);
  }

  if (!itemId) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h1 className="text-2xl font-bold text-primary">Nenhum quarto selecionado</h1>
        <p className="mt-2 text-muted-foreground">
          Escolha um quarto antes de pedir para reservar.
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

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h1 className="text-2xl font-bold text-primary">Quarto não encontrado</h1>
        <Button asChild className="mt-4">
          <Link to="/explorar">Explorar estabelecimentos</Link>
        </Button>
      </div>
    );
  }

  const checkIn = parseDataISO(checkInStr);
  const checkOut = parseDataISO(checkOutStr);
  const temDatas = !!checkIn && !!checkOut;
  const noites = checkIn && checkOut ? differenceInCalendarDays(checkOut, checkIn) : 0;

  const maxTotal = item.capacidade_total;
  const maxAdultosCap = item.capacidade_adultos ?? maxTotal;
  const maxCriancasCap = item.capacidade_criancas ?? maxTotal;
  const adultos = clamp(adultosParam ?? 1, 1, Math.max(1, Math.min(maxAdultosCap, maxTotal)));
  const criancas = clamp(criancasParam ?? 0, 0, Math.max(0, Math.min(maxCriancasCap, maxTotal - adultos)));

  const total = item.preco * noites;
  const imagens = Array.isArray(item.imagens) ? (item.imagens as string[]) : [];
  const fotoPrincipal = imagens[0];
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
    if (!user || !item || !checkIn || !checkOut) return;
    setEnviando(true);
    try {
      // O picker de hóspedes só distingue adultos/crianças (idade), não quem
      // é autista - por isso `num_autistas` reflete o perfil sensorial
      // vinculado (1 pessoa conhecida) e `num_acompanhantes` cobre as
      // crianças da viagem, mantendo o schema existente de `reservas`
      // (pensado para o formulário antigo, por estabelecimento).
      const payload = buildReservaPayload({
        familia_id: user.id,
        estabelecimento_id: item.estabelecimento_id,
        item_reservavel_id: item.id,
        perfil_sensorial_id: perfilSel || null,
        data_checkin: formatDataISO(checkIn),
        data_checkout: formatDataISO(checkOut),
        num_adultos: adultos,
        num_autistas: perfilSel ? 1 : 0,
        num_acompanhantes: criancas,
        mensagem,
        perfil_enviado_ao_estabelecimento: !!perfilSel,
      });
      const nova = await criarReserva(payload);
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
        <Link
          to="/quartos/$id"
          params={{ id: item.id }}
          search={searchParaQuarto}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border hover:bg-muted transition"
          aria-label="Voltar para o quarto"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
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
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Perfil sensorial (opcional)
                </Label>
                <div className="mt-1.5 flex gap-2">
                  <Select
                    value={perfilSel || "nenhum"}
                    onValueChange={(v) => setPerfilSel(v === "nenhum" ? "" : v)}
                    disabled={!user}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum selecionado</SelectItem>
                      {perfis.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome_autista}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!user}
                    onClick={() => setPerfilModalOpen(true)}
                    aria-label="Adicionar perfil sensorial"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Compartilhar o perfil ajuda o estabelecimento a se preparar para receber sua
                  família.
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
                disabled={!user || !temDatas || enviando}
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
              {user && !temDatas && (
                <p className="text-xs text-destructive text-center">
                  Volte e selecione as datas de check-in e check-out antes de enviar.
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
                  <img src={fotoPrincipal} alt={item.nome} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{item.nome}</p>
                {estab && (
                  <p className="text-xs text-muted-foreground truncate">
                    {estab.nome} · {estab.cidade}, {estab.estado}
                  </p>
                )}
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
              label="Datas"
              valor={
                checkIn && checkOut
                  ? `${format(checkIn, "d 'de' MMM.", { locale: ptBR })} – ${format(checkOut, "d 'de' MMM. 'de' yyyy", { locale: ptBR })}`
                  : "Não selecionadas"
              }
              itemId={item.id}
              search={searchParaQuarto}
            />

            <LinhaResumo
              label="Hóspedes"
              valor={`${adultos} ${adultos === 1 ? "adulto" : "adultos"}${criancas > 0 ? `, ${criancas} ${criancas === 1 ? "criança" : "crianças"}` : ""}`}
              itemId={item.id}
              search={searchParaQuarto}
            />

            {noites > 0 && (
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

function LinhaResumo({
  label,
  valor,
  itemId,
  search,
}: {
  label: string;
  valor: string;
  itemId: string;
  search: Record<string, string | number>;
}) {
  return (
    <div className="border-t border-border pt-4 flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-sm text-muted-foreground">{valor}</div>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/quartos/$id" params={{ id: itemId }} search={search}>
          Alterar
        </Link>
      </Button>
    </div>
  );
}
