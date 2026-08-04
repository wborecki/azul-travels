import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  fetchItemReservavelPorId,
  fetchEstabelecimentoPorId,
  fetchAvaliacoesPublicasPorEstab,
  type ItemReservavel,
  type EstabelecimentoNormalized,
  type AvaliacaoComFamilia,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill, SELO_BADGES } from "@/components/Badges";
import { MarkdownView } from "@/components/MarkdownView";
import { QuartoGaleria } from "@/components/estabelecimento/QuartoGaleria";
import { QuartoDisponibilidade } from "@/components/estabelecimento/QuartoDisponibilidade";
import { QuartoMapa } from "@/components/estabelecimento/QuartoMapa";
import { QuartoSubNav } from "@/components/estabelecimento/QuartoSubNav";
import { ReservaCard } from "@/components/estabelecimento/ReservaCard";
import { MobileReservaBar } from "@/components/estabelecimento/MobileReservaBar";
import { useDisponibilidadeQuarto } from "@/hooks/useDisponibilidadeQuarto";
import { COMODIDADE_POR_KEY } from "@/lib/itens-comodidades";
import { estruturaDoQuarto } from "@/lib/estrutura-tea";
import { TIPO_LABEL, formatDateBR, parseDataISO, parseInteiroUrl } from "@/lib/brazil";
import {
  Users,
  Baby,
  BedDouble,
  Clock,
  MapPin,
  ArrowLeft,
  Star,
  ChevronDown,
  Gift,
  Home,
  Brain,
  DoorOpen,
  FastForward,
  Utensils,
  MessageSquare,
  Camera,
  Sparkles,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

interface QuartoSearch {
  galeria?: "todas";
  foto?: number;
  checkIn?: string;
  checkOut?: string;
  adultos?: number;
  criancas?: number;
}

export const Route = createFileRoute("/quartos/$id")({
  head: () => ({ meta: [{ title: "Quarto · Turismo Azul" }] }),
  validateSearch: (s: Record<string, unknown>): QuartoSearch => {
    const galeria = s.galeria === "todas" ? ("todas" as const) : undefined;
    const fotoRaw = s.foto;
    const fotoNum =
      typeof fotoRaw === "number"
        ? fotoRaw
        : typeof fotoRaw === "string" && fotoRaw.trim() !== ""
          ? Number(fotoRaw)
          : NaN;
    const foto = Number.isFinite(fotoNum) ? fotoNum : undefined;

    // Só valida a forma (data real, inteiro válido) aqui. As regras de
    // negócio (disponibilidade, capacidade máxima) dependem de dados
    // carregados de forma assíncrona (quarto, datas bloqueadas) e por isso
    // são aplicadas depois, em useDisponibilidadeQuarto/ReservaCard - lá, se
    // o valor da URL não obedecer, ele é corrigido de volta na própria URL.
    const checkIn =
      typeof s.checkIn === "string" && parseDataISO(s.checkIn) ? s.checkIn : undefined;
    const checkOutParseado =
      typeof s.checkOut === "string" ? parseDataISO(s.checkOut) : null;
    const checkOut =
      checkIn && checkOutParseado && checkOutParseado > (parseDataISO(checkIn) as Date)
        ? s.checkOut as string
        : undefined;
    const adultos = parseInteiroUrl(s.adultos, 1);
    const criancas = parseInteiroUrl(s.criancas, 0);

    return {
      ...(galeria ? { galeria } : {}),
      ...(foto !== undefined ? { foto } : {}),
      ...(checkIn ? { checkIn } : {}),
      ...(checkOut ? { checkOut } : {}),
      ...(adultos !== undefined ? { adultos } : {}),
      ...(criancas !== undefined ? { criancas } : {}),
    };
  },
  component: QuartoDetalhePage,
});

const RECURSOS_TEA = [
  { key: "tem_sala_sensorial", icon: Home, label: "Sala Sensorial" },
  { key: "tem_concierge_tea", icon: Brain, label: "Concierge TEA" },
  { key: "tem_checkin_antecipado", icon: DoorOpen, label: "Check-in Antecipado" },
  { key: "tem_fila_prioritaria", icon: FastForward, label: "Fila Prioritária" },
  { key: "tem_cardapio_visual", icon: Utensils, label: "Cardápio Visual" },
  { key: "tem_caa", icon: MessageSquare, label: "Comunicação Alternativa (CAA)" },
] as const;

const MAX_COMODIDADES_VISIVEIS = 8;
const MAX_AVALIACOES_VISIVEIS = 6;

function QuartoDetalhePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState<ItemReservavel | null>(null);
  const [estab, setEstab] = useState<EstabelecimentoNormalized | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComFamilia[]>([]);
  const [loading, setLoading] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [galeriaVisivel, setGaleriaVisivel] = useState(true);
  const galeriaRef = useRef<HTMLDivElement>(null);
  const disponibilidade = useDisponibilidadeQuarto(id);

  useEffect(() => {
    const el = galeriaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setGaleriaVisivel(entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [item?.id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNaoEncontrado(false);
    void (async () => {
      try {
        const quarto = await fetchItemReservavelPorId(id);
        if (!quarto || !quarto.ativo) {
          if (!alive) return;
          setNaoEncontrado(true);
          toast.error("Quarto não encontrado ou não está mais disponível.");
          setTimeout(() => navigate({ to: "/explorar" }), 1500);
          return;
        }
        const [estabelecimento, avaliacoesPublicas] = await Promise.all([
          fetchEstabelecimentoPorId(quarto.estabelecimento_id),
          fetchAvaliacoesPublicasPorEstab(quarto.estabelecimento_id),
        ]);
        if (!alive) return;
        setItem(quarto);
        setEstab(estabelecimento);
        setAvaliacoes(avaliacoesPublicas);
      } catch (err) {
        if (!alive) return;
        toast.error("Erro ao carregar quarto", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, navigate]);

  if (loading || naoEncontrado) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="h-[320px] md:h-[520px] bg-muted animate-pulse rounded-2xl" />
        <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
            <div className="h-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-52 bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-primary">Quarto não encontrado</h1>
        <Button asChild className="mt-4">
          <Link to="/explorar">Explorar estabelecimentos</Link>
        </Button>
      </div>
    );
  }

  const imagens = Array.isArray(item.imagens) ? (item.imagens as string[]) : [];
  const temDetalhePorCategoria =
    item.capacidade_adultos !== null || item.capacidade_criancas !== null;

  const cidade = item.usa_endereco_proprio ? item.cidade : estab?.cidade;
  const estado = item.usa_endereco_proprio ? item.estado : estab?.estado;
  const cidadeUf = cidade && estado ? `${cidade}, ${estado}` : cidade || null;

  const latitude = item.usa_endereco_proprio ? item.latitude : (estab?.latitude ?? null);
  const longitude = item.usa_endereco_proprio ? item.longitude : (estab?.longitude ?? null);
  const enderecoMapa = item.usa_endereco_proprio ? item.endereco || cidadeUf : cidadeUf;

  const totalAvaliacoes = avaliacoes.length;
  const mediaAvaliacoes =
    totalAvaliacoes > 0
      ? avaliacoes.reduce((soma, a) => soma + (a.nota_geral ?? 0), 0) / totalAvaliacoes
      : 0;

  const recursosTeaAtivos = estab
    ? RECURSOS_TEA.filter((r) => estab[r.key as keyof EstabelecimentoNormalized])
    : [];
  const temBeneficio = Boolean(estab?.tem_beneficio_tea && estab?.beneficio_tea_descricao);
  const temSecaoTea =
    recursosTeaAtivos.length > 0 ||
    temBeneficio ||
    Boolean(estab?.descricao_tea) ||
    Boolean(estab?.tour_360_url);

  return (
    <>
      <QuartoSubNav visivel={!galeriaVisivel} temComodidades={item.comodidades.length > 0} />

      <div className="container mx-auto px-4 py-6 pb-28 lg:pb-6">
        {estab && (
          <Link
            to="/estabelecimento/$slug"
            params={{ slug: estab.slug }}
            className="inline-flex items-center gap-1.5 text-sm text-secondary hover:underline mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {estab.nome}
          </Link>
        )}

        {/* Galeria */}
        <div id="galeria" ref={galeriaRef} className="scroll-mt-20">
          <QuartoGaleria imagens={imagens} titulo={item.nome} />
        </div>

        <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-10">
          {/* COLUNA ESQUERDA */}
          <div className="space-y-10 min-w-0">
            {/* Selos + título + tipo/cidade/avaliações */}
            <div>
              {estab && (
                <div className="flex flex-wrap gap-1.5">
                  {estab.selo_azul && <Pill {...SELO_BADGES.selo_azul} size="md" />}
                  {estab.tour_360_url && <Pill {...SELO_BADGES.tour_360} size="md" />}
                  {estab.selo_governamental && (
                    <Pill {...SELO_BADGES.selo_governamental} size="md" />
                  )}
                  {estab.selo_privado && (
                    <Pill
                      {...SELO_BADGES.selo_privado}
                      label={estab.selo_privado_nome || "Selo Privado"}
                      size="md"
                    />
                  )}
                  {estab.tem_beneficio_tea && <Pill {...SELO_BADGES.beneficio_tea} size="md" />}
                </div>
              )}
              <h1 className="mt-3 text-3xl md:text-4xl font-bold text-primary tracking-tight">
                {item.nome}
              </h1>
              <p className="mt-2 text-muted-foreground flex items-center gap-2 flex-wrap">
                {estab && <span className="font-medium">{TIPO_LABEL[estab.tipo]}</span>}
                {estab && cidadeUf && <span>·</span>}
                {cidadeUf && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {cidadeUf}
                  </span>
                )}
                {(estab || cidadeUf) && <span>·</span>}
                {totalAvaliacoes > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 text-amarelo fill-amarelo" />
                    <span className="font-semibold text-foreground">
                      {mediaAvaliacoes.toFixed(1)}
                    </span>
                    <span>
                      ({totalAvaliacoes} {totalAvaliacoes === 1 ? "avaliação" : "avaliações"})
                    </span>
                  </span>
                ) : (
                  <span>Ainda não avaliado</span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground/70 border-y border-border py-4">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Até {item.capacidade_total} pessoa(s)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="h-4 w-4" /> {item.quantidade_camas} cama(s)
              </span>
              {temDetalhePorCategoria && item.capacidade_adultos !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Até {item.capacidade_adultos} adulto(s)
                </span>
              )}
              {temDetalhePorCategoria && item.capacidade_criancas !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Baby className="h-3.5 w-3.5" /> Até {item.capacidade_criancas} criança(s)
                </span>
              )}
              {(item.check_in_padrao || item.check_out_padrao) && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {item.check_in_padrao && `Check-in ${item.check_in_padrao.slice(0, 5)}`}
                  {item.check_in_padrao && item.check_out_padrao && " · "}
                  {item.check_out_padrao && `Check-out ${item.check_out_padrao.slice(0, 5)}`}
                </span>
              )}
            </div>

            {/* Descrição do quarto (colapsável, estilo Airbnb) */}
            <section>
              <h2 className="text-xl font-bold text-primary mb-3">Sobre este quarto</h2>
              {item.descricao?.trim() ? (
                <DescricaoColapsavel source={item.descricao} />
              ) : (
                <p className="text-muted-foreground">Sem descrição disponível.</p>
              )}
            </section>

            {/* O que este quarto oferece */}
            {item.comodidades.length > 0 && (
              <div id="comodidades" className="scroll-mt-36">
                <ComodidadesQuarto comodidades={item.comodidades} nome={item.nome} />
              </div>
            )}

            {/* Estrutura do estabelecimento (destacada, diferenciada do quarto) */}
            {estab && <EstruturaEstabelecimentoSecao estab={estab} />}

            {/* Recursos para famílias TEA no estabelecimento */}
            {estab && temSecaoTea && (
              <RecursosTeaSecao estab={estab} recursosAtivos={recursosTeaAtivos} />
            )}

            {/* Datas disponíveis */}
            <section id="disponibilidade" className="scroll-mt-36">
              <h2 className="text-xl font-bold text-primary mb-3">Datas disponíveis</h2>
              <QuartoDisponibilidade disponibilidade={disponibilidade} />
            </section>

            {/* Avaliações */}
            <section id="avaliacoes" className="scroll-mt-36">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-amarelo fill-amarelo" />
                {totalAvaliacoes > 0
                  ? `${mediaAvaliacoes.toFixed(1)} · ${totalAvaliacoes} ${
                      totalAvaliacoes === 1 ? "avaliação" : "avaliações"
                    }`
                  : "Avaliações"}
              </h2>
              <AvaliacoesResumo avaliacoes={avaliacoes} />
            </section>

            {/* Onde você estará */}
            <section id="localizacao" className="scroll-mt-36">
              <h2 className="text-xl font-bold text-primary mb-3">Onde você estará</h2>
              <QuartoMapa latitude={latitude} longitude={longitude} local={enderecoMapa} />
            </section>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-36 lg:self-start">
            <ReservaCard
              preco={item.preco}
              itemId={item.id}
              capacidadeTotal={item.capacidade_total}
              capacidadeAdultos={item.capacidade_adultos}
              capacidadeCriancas={item.capacidade_criancas}
              disponibilidade={disponibilidade}
            />
          </aside>
        </div>
        {estab && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-primary mb-3">Sobre o estabelecimento</h2>
            <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-bold text-foreground">{estab.nome}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3.5 w-3.5" /> {estab.cidade}, {estab.estado}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/estabelecimento/$slug" params={{ slug: estab.slug }}>
                  Ver estabelecimento
                </Link>
              </Button>
            </div>
          </section>
        )}
      </div>

      <MobileReservaBar
        preco={item.preco}
        itemId={item.id}
        disponibilidade={disponibilidade}
      />
    </>
  );
}

const DESCRICAO_MAX_ALTURA = 260;

function DescricaoColapsavel({ source }: { source: string }) {
  const [aberto, setAberto] = useState(false);
  const [transborda, setTransborda] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = conteudoRef.current;
    if (!el) return;
    setTransborda(el.scrollHeight > DESCRICAO_MAX_ALTURA + 8);
  }, [source]);

  const colapsado = transborda && !aberto;

  return (
    <div>
      <div
        ref={conteudoRef}
        className={
          colapsado
            ? "relative overflow-hidden after:absolute after:inset-x-0 after:bottom-0 after:h-16 after:bg-gradient-to-t after:from-background after:to-transparent"
            : undefined
        }
        style={colapsado ? { maxHeight: DESCRICAO_MAX_ALTURA } : undefined}
      >
        <MarkdownView source={source} />
      </div>
      {transborda && (
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="cursor-pointer mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4"
        >
          {aberto ? "Mostrar menos" : "Mostrar mais"}
          <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

function ComodidadesQuarto({ comodidades, nome }: { comodidades: string[]; nome: string }) {
  const [modalAberto, setModalAberto] = useState(false);
  const validas = comodidades.filter((key) => COMODIDADE_POR_KEY[key]);
  const visiveis = validas.slice(0, MAX_COMODIDADES_VISIVEIS);
  const excedente = validas.length - visiveis.length;

  const ItemComodidade = ({ chave }: { chave: string }) => {
    const c = COMODIDADE_POR_KEY[chave];
    if (!c) return null;
    const Icon = c.icon;
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-foreground">{c.label}</span>
      </div>
    );
  };

  return (
    <section>
      <h2 className="text-xl font-bold text-primary mb-3">O que este quarto oferece</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {visiveis.map((key) => (
          <ItemComodidade key={key} chave={key} />
        ))}
      </div>
      {excedente > 0 && (
        <Button variant="outline" className="mt-4" onClick={() => setModalAberto(true)}>
          Mostrar todas as {validas.length} comodidades
        </Button>
      )}

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>O que {nome} oferece</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {validas.map((key) => (
              <ItemComodidade key={key} chave={key} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EstruturaEstabelecimentoSecao({ estab }: { estab: EstabelecimentoNormalized }) {
  const estrutura = (estab.estrutura ?? {}) as Record<string, boolean>;
  const ativos = estruturaDoQuarto(estab.tipo, estrutura);
  if (ativos.length === 0) return null;

  return (
    <section
      className="rounded-2xl p-[2px]"
      style={{
        background: "linear-gradient(135deg, #E63946 0%, #1D7FBF 33%, #F4B400 66%, #2E9E55 100%)",
      }}
    >
      <div className="rounded-2xl p-5 sm:p-6 bg-background/95">
        <h2 className="text-lg font-bold text-primary mb-1 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-secondary" /> Sobre o estabelecimento
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Estrutura que {estab.nome} oferece para famílias autistas.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {ativos.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecursosTeaSecao({
  estab,
  recursosAtivos,
}: {
  estab: EstabelecimentoNormalized;
  recursosAtivos: ReadonlyArray<{ key: string; icon: typeof Home; label: string }>;
}) {
  return (
    <section className="rounded-2xl border border-secondary/20 bg-secondary/[0.04] p-5 sm:p-6">
      <h2 className="text-xl font-bold text-primary mb-1 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-secondary" /> Acolhimento para famílias TEA
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        Recursos que {estab.nome} oferece para a experiência de pessoas autistas e suas famílias.
      </p>

      {estab.descricao_tea?.trim() && (
        <p className="text-foreground leading-relaxed whitespace-pre-line mb-5">
          {estab.descricao_tea}
        </p>
      )}

      {estab.tem_beneficio_tea && estab.beneficio_tea_descricao && (
        <div className="mb-5 rounded-xl border border-success/30 bg-success/10 p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-success/20 text-success grid place-items-center shrink-0">
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Benefício TEA</h3>
            <p className="mt-0.5 text-sm text-foreground/80">{estab.beneficio_tea_descricao}</p>
          </div>
        </div>
      )}

      {(recursosAtivos.length > 0 || estab.tour_360_url) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {recursosAtivos.map((r) => (
            <div
              key={r.key}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                <r.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-foreground">{r.label}</span>
            </div>
          ))}
          {estab.tour_360_url && (
            <a
              href={estab.tour_360_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-amarelo transition"
            >
              <div className="h-9 w-9 rounded-lg bg-amarelo/20 text-amarelo-foreground grid place-items-center shrink-0">
                <Camera className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-foreground">Tour 360° disponível</span>
            </a>
          )}
        </div>
      )}
    </section>
  );
}

function AvaliacoesResumo({ avaliacoes }: { avaliacoes: AvaliacaoComFamilia[] }) {
  const [expandido, setExpandido] = useState(false);

  const stats = useMemo(() => {
    if (avaliacoes.length === 0) {
      return { total: 0, geral: 0, acolhimento: 0, estrutura: 0, comunicacao: 0 };
    }
    const media = (
      k: "nota_geral" | "nota_acolhimento" | "nota_estrutura" | "nota_comunicacao",
    ) => {
      const vals = avaliacoes.map((a) => a[k]).filter((v): v is number => typeof v === "number");
      return vals.length === 0 ? 0 : vals.reduce((s, v) => s + v, 0) / vals.length;
    };
    return {
      total: avaliacoes.length,
      geral: media("nota_geral"),
      acolhimento: media("nota_acolhimento"),
      estrutura: media("nota_estrutura"),
      comunicacao: media("nota_comunicacao"),
    };
  }, [avaliacoes]);

  if (stats.total === 0) {
    return (
      <div className="bg-muted/40 rounded-xl p-6 text-center text-sm text-muted-foreground">
        Ainda sem avaliações. Seja a primeira família a avaliar após a estadia.
      </div>
    );
  }

  const visiveis = expandido ? avaliacoes : avaliacoes.slice(0, MAX_AVALIACOES_VISIVEIS);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4 bg-card border border-border rounded-2xl p-5">
        <NotaCategoria label="Acolhimento da equipe" valor={stats.acolhimento} />
        <NotaCategoria label="Estrutura para TEA" valor={stats.estrutura} />
        <NotaCategoria label="Comunicação" valor={stats.comunicacao} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {visiveis.map((a) => (
          <AvaliacaoCard key={a.id} avaliacao={a} />
        ))}
      </div>

      {avaliacoes.length > MAX_AVALIACOES_VISIVEIS && (
        <Button variant="outline" onClick={() => setExpandido((v) => !v)}>
          {expandido ? "Mostrar menos" : `Mostrar todas as ${avaliacoes.length} avaliações`}
        </Button>
      )}
    </div>
  );
}

function NotaCategoria({ label, valor }: { label: string; valor: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground font-medium">{valor.toFixed(1)}</span>
      </div>
      <Progress value={(valor / 5) * 100} className="h-2" />
    </div>
  );
}

function AvaliacaoCard({ avaliacao }: { avaliacao: AvaliacaoComFamilia }) {
  const nome = avaliacao.familia_profiles?.nome_responsavel?.split(" ")[0] || "Família";
  const nota = Math.round(avaliacao.nota_geral ?? 0);
  return (
    <article className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-foreground">{nome}</p>
        <div className="flex text-amarelo" aria-label={`Nota ${nota} de 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < nota ? "fill-amarelo" : "opacity-30"}`} />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{formatDateBR(avaliacao.criado_em)}</p>
      {avaliacao.comentario && (
        <p className="mt-2 text-sm text-foreground/90 leading-relaxed">{avaliacao.comentario}</p>
      )}
    </article>
  );
}
