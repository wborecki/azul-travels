import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  fetchEstabelecimentoDetalhe,
  fetchPerfisDaFamilia,
  fetchReservasDaFamiliaPorEstabelecimento,
  fetchItensAtivosDoEstabelecimento,
  criarReserva,
  criarPerfilSensorial,
  buildReservaPayload,
  pickEstabMedia,
  perfisDaReserva,
  type EstabelecimentoNormalized,
  type EstabelecimentoDetalhe,
  type PerfilOption,
  type ReservaComContexto,
  type ReservaFormInput,
  type ItemReservavel,
} from "@/lib/queries";
import { QuartoCard } from "@/components/estabelecimento/QuartoCard";
import { PedidoVisitaCard, MobileVisitaBar } from "@/components/estabelecimento/PedidoVisitaCard";
import { PerfisTeaAvatares } from "@/components/reserva/PerfisTeaDaReserva";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AvaliacoesPublicasSection } from "@/components/AvaliacoesPublicasSection";
import { QuartoMapa } from "@/components/estabelecimento/QuartoMapa";
import { SeloAzul3D } from "@/components/estabelecimento/SeloAzul3D";
import { Pill, SELO_BADGES } from "@/components/Badges";
import {
  PerfilSensorialForm,
  DEFAULT_PERFIL_DRAFT,
  type PerfilSensorialDraft,
} from "@/components/PerfilSensorialForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { TIPO_LABEL, formatDateBR } from "@/lib/brazil";
import { RESERVA_STATUS_LABEL, naturezaDaReserva, type ReservaStatus } from "@/lib/enums";
import { RECURSOS_TEA } from "@/lib/recursos-tea";
import { estruturaAtiva } from "@/lib/estrutura-tea";
import {
  detalhesPreenchidos,
  formatarDetalhe,
  horarioMenorMovimento,
  type DetalhePreenchido,
  type Detalhes,
} from "@/lib/detalhes-estabelecimento";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Camera,
  ExternalLink,
  FileText,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Gift,
  Star,
  Loader2,
  CheckCircle2,
  Clock,
  Calendar,
  Mail,
  CalendarCheck,
  History,
  XCircle,
  Images,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/estabelecimento/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} · Turismo Azul` },
      {
        name: "description",
        content:
          "Detalhes do estabelecimento, recursos para pessoas autistas, avaliações e reserva com perfil sensorial.",
      },
    ],
  }),
  component: EstabPage,
});

type Estab = EstabelecimentoNormalized;

// Declaração única em `@/lib/recursos-tea` - a mesma lista alimenta o painel do
// dono, para rótulo e leitura não divergirem entre as duas telas.
const RECURSO_INFOS = RECURSOS_TEA;

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function EstabPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [detalhe, setDetalhe] = useState<EstabelecimentoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [perfis, setPerfis] = useState<PerfilOption[]>([]);
  const [perfilSel, setPerfilSel] = useState<string>("");
  const [reservasFamilia, setReservasFamilia] = useState<ReservaComContexto[]>([]);
  const [reservaRecemCriadaId, setReservaRecemCriadaId] = useState<string | null>(null);
  const [quartos, setQuartos] = useState<ItemReservavel[]>([]);
  const [quartosCarregando, setQuartosCarregando] = useState(true);

  // Modal "Adicionar novo perfil"
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [galeriaAberta, setGaleriaAberta] = useState(false);
  const [novoPerfil, setNovoPerfil] = useState<PerfilSensorialDraft>(DEFAULT_PERFIL_DRAFT);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setNaoEncontrado(false);
      try {
        const data = await fetchEstabelecimentoDetalhe(slug);
        if (!data) {
          setNaoEncontrado(true);
          toast.error("Estabelecimento não encontrado.");
          setTimeout(() => navigate({ to: "/explorar" }), 1500);
          return;
        }
        setDetalhe(data);
      } catch (err) {
        toast.error("Erro ao carregar estabelecimento", {
          description: err instanceof Error ? err.message : undefined,
        });
        setDetalhe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, navigate]);

  useEffect(() => {
    if (!detalhe?.estabelecimento.id) return;
    setQuartosCarregando(true);
    void (async () => {
      try {
        const data = await fetchItensAtivosDoEstabelecimento(detalhe.estabelecimento.id);
        setQuartos(data);
      } catch (err) {
        toast.error("Erro ao carregar quartos disponíveis", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setQuartosCarregando(false);
      }
    })();
  }, [detalhe?.estabelecimento.id]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const data = await fetchPerfisDaFamilia(user.id);
        setPerfis(data);
        if (data.length > 0 && !perfilSel) setPerfilSel(data[0].id);
      } catch (err) {
        toast.error("Erro ao carregar perfis sensoriais", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Reservas que esta família já fez para este estabelecimento (histórico).
  const recarregarReservasFamilia = async (estabId: string) => {
    if (!user) return [] as ReservaComContexto[];
    try {
      const data = await fetchReservasDaFamiliaPorEstabelecimento(user.id, estabId);
      setReservasFamilia(data);
      return data;
    } catch (err) {
      toast.error("Erro ao carregar suas reservas anteriores", {
        description: err instanceof Error ? err.message : undefined,
      });
      return [] as ReservaComContexto[];
    }
  };

  useEffect(() => {
    if (!user || !detalhe?.estabelecimento.id) return;
    void recarregarReservasFamilia(detalhe.estabelecimento.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, detalhe?.estabelecimento.id]);

  const e: Estab | undefined = detalhe?.estabelecimento;
  const avaliacoes = detalhe?.avaliacoes ?? [];

  // Hospedagem se reserva escolhendo um quarto; o resto se reserva direto no
  // local, com dia e horário.
  const ehVisita = !!e && naturezaDaReserva(e.tipo) === "visita";
  // O gate da reserva é o local estar ativo - o Selo Azul destaca na busca,
  // mas não decide mais quem recebe pedido. A trigger recusa o insert com
  // ESTAB_INATIVO de qualquer forma.
  const aceitaPedidoDeVisita = ehVisita && e?.status === "ativo";

  // Cálculo das médias (geral + sub-categorias)
  const stats = useMemo(() => {
    if (avaliacoes.length === 0) {
      return { total: 0, geral: 0, acolhimento: 0, estrutura: 0, comunicacao: 0 };
    }
    const sum = (k: "nota_geral" | "nota_acolhimento" | "nota_estrutura" | "nota_comunicacao") => {
      const vals = avaliacoes.map((a) => a[k]).filter((v): v is number => typeof v === "number");
      if (vals.length === 0) return 0;
      return vals.reduce((s, v) => s + v, 0) / vals.length;
    };
    return {
      total: avaliacoes.length,
      geral: sum("nota_geral"),
      acolhimento: sum("nota_acolhimento"),
      estrutura: sum("nota_estrutura"),
      comunicacao: sum("nota_comunicacao"),
    };
  }, [avaliacoes]);

  const perfilSelecionado = useMemo(
    () => perfis.find((p) => p.id === perfilSel),
    [perfis, perfilSel],
  );

  if (loading || naoEncontrado) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-12">
          <div className="h-[420px] bg-muted animate-pulse rounded-2xl" />
          <div className="mt-6 grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
              <div className="h-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-96 bg-muted animate-pulse rounded-2xl" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!e) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-primary">Estabelecimento não encontrado</h1>
          <Button asChild className="mt-4">
            <Link to="/explorar">Explorar outros</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const { fotoCapa, fotos, tour360Url } = pickEstabMedia(e);

  // A capa nem sempre está dentro da galeria: o formulário do dono mantém as
  // duas em sincronia (capa = posição 0), mas o do admin grava `foto_capa` e
  // `fotos` como campos independentes.
  const galeria = fotoCapa ? [fotoCapa, ...fotos.filter((f) => f !== fotoCapa)] : fotos;

  // Quantas miniaturas cabem sem deixar buraco no mosaico.
  const nThumbs = galeria.length >= 5 ? 4 : galeria.length >= 3 ? 2 : galeria.length === 2 ? 1 : 0;
  const thumbs = galeria.slice(1, 1 + nThumbs);
  const recursosAtivos = RECURSO_INFOS.filter((r) => e[r.key]);
  // Só as chaves da categoria do local: um restaurante não exibe item de quarto,
  // mesmo que a chave tenha sobrado no jsonb de antes da separação por categoria.
  const estruturaAtivos = estruturaAtiva(e.tipo, (e.estrutura ?? {}) as Record<string, boolean>);
  // Campos da categoria (jsonb `detalhes`), lidos pela declaração e não por
  // chave literal - acrescentar um campo não passa por esta tela.
  const detalhes = detalhesPreenchidos(e.tipo, (e.detalhes ?? {}) as Detalhes);
  const horarioCalmo = horarioMenorMovimento(e.tipo, (e.detalhes ?? {}) as Detalhes);
  const temBeneficio = e.tem_beneficio_tea && e.beneficio_tea_descricao;

  const cidadeUf = `${e.cidade}, ${e.estado}`;
  const enderecoMapa = e.endereco ? `${e.endereco} · ${cidadeUf}` : cidadeUf;
  const temMapa = e.latitude !== null && e.longitude !== null;

  const handleAdicionarPerfil = async () => {
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
      setPerfilSel(data.id);
      setPerfilModalOpen(false);
      setNovoPerfil(DEFAULT_PERFIL_DRAFT);
    } catch (err) {
      toast.error("Erro ao salvar perfil", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSalvandoPerfil(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* SEÇÃO 1 · Galeria full-width + header.
          Sem foto a faixa encolhe: 420px de cinza vazio empurravam a página
          inteira para baixo da dobra sem informar nada. Restaurantes e passeios
          são o caso comum aqui - entraram na vitrine antes de o dono ter como
          subir foto (ver migration 20260804140000). */}
      <div
        className="relative w-full bg-muted"
        style={{ height: galeria.length === 0 ? 200 : 420 }}
      >
        {galeria.length === 0 ? (
          <div
            className="grid h-full w-full place-items-center"
            style={{
              background:
                "linear-gradient(135deg, #E63946 0%, #1D7FBF 33%, #F4B400 66%, #2E9E55 100%)",
            }}
          >
            <div className="rounded-2xl bg-background/90 px-6 py-4 text-center shadow-lg backdrop-blur">
              <Images className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold text-primary">{e.nome}</p>
              <p className="text-xs text-muted-foreground">Fotos em breve</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full gap-1">
            <button
              type="button"
              onClick={() => setGaleriaAberta(true)}
              className="relative flex-1 md:flex-[2] overflow-hidden group"
              aria-label={`Ver as ${galeria.length} fotos de ${e.nome}`}
            >
              <img
                src={galeria[0]}
                alt={e.nome}
                className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </button>
            {thumbs.length > 0 && (
              <div
                className={cn(
                  "hidden md:grid flex-1 gap-1",
                  thumbs.length === 4
                    ? "grid-cols-2 grid-rows-2"
                    : thumbs.length === 2
                      ? "grid-cols-1 grid-rows-2"
                      : "grid-cols-1 grid-rows-1",
                )}
              >
                {thumbs.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() => setGaleriaAberta(true)}
                    className="relative overflow-hidden group"
                    aria-label={`Ver as ${galeria.length} fotos de ${e.nome}`}
                  >
                    <img
                      src={url}
                      alt={`${e.nome} - foto ${i + 2}`}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {galeria.length > 1 && (
          <button
            type="button"
            onClick={() => setGaleriaAberta(true)}
            className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-xl bg-background/95 px-3.5 py-2 text-sm font-semibold text-foreground shadow-lg backdrop-blur transition hover:bg-background"
          >
            <Images className="h-4 w-4" /> Ver todas as {galeria.length} fotos
          </button>
        )}
        {/* Selos flutuando no canto inferior esquerdo */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5 max-w-[60%]">
          {e.selo_azul && <Pill {...SELO_BADGES.selo_azul} />}
          {e.selo_governamental && <Pill {...SELO_BADGES.selo_governamental} />}
          {e.selo_privado && (
            <Pill {...SELO_BADGES.selo_privado} label={e.selo_privado_nome || "Selo Privado"} />
          )}
          {e.tem_beneficio_tea && <Pill {...SELO_BADGES.beneficio_tea} />}
          {e.tipo === "passeio_educativo" && e.recebe_grupos_escolares_tea && (
            <Pill
              icon={null}
              label="✓ Grupos escolares TEA"
              className="bg-azul-claro text-primary"
            />
          )}
        </div>
        {/* Botão Tour 360° */}
        {tour360Url && (
          <button
            type="button"
            onClick={() => setTourModalOpen(true)}
            className="absolute bottom-4 right-4 bg-amarelo text-amarelo-foreground rounded-xl px-4 py-2 font-semibold text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition"
          >
            <Camera className="h-4 w-4" /> Tour 360° dos ambientes
          </button>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header textual. Uma linha só de metadados (tipo · nota · cidade ·
            atalho para o mapa): três linhas empilhadas empurravam o conteúdo
            para baixo sem densidade nenhuma. */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">{e.nome}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{TIPO_LABEL[e.tipo]}</span>
            {stats.total > 0 && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 text-amarelo fill-amarelo" />
                  <span className="font-semibold text-foreground">{stats.geral.toFixed(1)}</span>
                  <span>
                    ({stats.total} {stats.total === 1 ? "avaliação" : "avaliações"})
                  </span>
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {e.cidade}, {e.estado}
            </span>
            {temMapa && (
              <>
                <span aria-hidden>·</span>
                <a
                  href="#localizacao"
                  className="font-semibold text-secondary underline-offset-2 hover:underline"
                >
                  Ver no mapa
                </a>
              </>
            )}
          </div>
        </div>

        {/* Benefício TEA · caixa verde com ícone */}
        {temBeneficio && (
          <div className="mb-8 rounded-2xl border border-success/30 bg-success/10 p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/20 text-success grid place-items-center shrink-0">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Benefício TEA</h2>
                <p className="mt-1 text-sm text-foreground/80">{e.beneficio_tea_descricao}</p>
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT 2 colunas */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* COLUNA ESQUERDA · conteúdo */}
          <div className="space-y-10 min-w-0">
            {/* Quartos disponíveis - só em hospedagem. Num restaurante ou
                parque a família reserva o próprio local (ver PedidoVisitaCard). */}
            {!ehVisita && (
              <section id="quartos" className="scroll-mt-24">
                <h2 className="text-xl font-bold text-primary mb-3">Quartos disponíveis</h2>
                {quartosCarregando ? (
                  <div className="space-y-3">
                    <div className="h-32 bg-muted animate-pulse rounded-2xl" />
                    <div className="h-32 bg-muted animate-pulse rounded-2xl" />
                  </div>
                ) : quartos.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-4">
                    Este estabelecimento ainda não cadastrou quartos disponíveis para reserva.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {quartos.map((quarto) => (
                      <QuartoCard key={quarto.id} item={quarto} estabelecimentoSlug={e.slug} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Descrição. As duas são campos distintos e independentes: uma
                apresenta o local, a outra conta o que ele faz por famílias
                atípicas. Antes um `||` fazia a segunda esconder a primeira, e
                quem preenchia as duas só via uma. */}
            {(e.descricao || e.descricao_tea) && (
              <section className="space-y-6">
                {e.descricao && (
                  <div>
                    <h2 className="text-xl font-bold text-primary mb-3">Sobre o local</h2>
                    <p className="text-foreground leading-relaxed whitespace-pre-line">
                      {e.descricao}
                    </p>
                  </div>
                )}

                {e.descricao_tea && (
                  <div className="rounded-2xl border border-secondary/25 bg-azul-claro/30 p-5">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-primary mb-2">
                      <Heart className="h-4 w-4 text-secondary" /> O que fazemos por famílias
                      atípicas
                    </h2>
                    <p className="text-foreground leading-relaxed whitespace-pre-line">
                      {e.descricao_tea}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Informações práticas - os campos declarados para a categoria.
                Ficam antes de "O que este local oferece" porque respondem o que
                a família precisa decidir primeiro: o cardápio, quanto tempo
                dura, se precisa comprar ingresso antes.

                Cards lado a lado, e cada tipo com o seu tratamento (ver
                `DetalheCard`) - em linhas empilhadas os três viravam texto
                pequeno de peso igual, e um deles nem era informação: era um
                botão disfarçado de linha. */}
            {detalhes.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-primary mb-3">Bom saber</h2>
                <div
                  className={cn(
                    "grid gap-3 sm:grid-cols-2",
                    detalhes.length % 3 === 0 && "lg:grid-cols-3",
                  )}
                >
                  {detalhes.map((d) => (
                    <DetalheCard key={d.campo.key} campo={d.campo} valor={d.valor} />
                  ))}
                </div>
              </section>
            )}

            {/* O que este local oferece.
                Dois grupos, porque as duas listas têm peso diferente: os
                recursos são colunas que a busca filtra e só se editam com o
                Selo Azul ativo (ver migration 20260804150000); a estrutura é
                declaração do próprio dono. Exibi-las com a mesma cara faria a
                família ler como auditado o que ninguém auditou. */}
            {recursosAtivos.length === 0 && estruturaAtivos.length === 0 && !tour360Url && (
              <section>
                <h2 className="text-xl font-bold text-primary mb-3">O que este local oferece</h2>
                <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-4">
                  Este estabelecimento ainda não informou seus recursos detalhados.
                </p>
              </section>
            )}

            {/* Acolhimento verificado. Mesma moldura de `/quartos/$id`
                (`RecursosTeaSecao`): borda secundária e faixa clara. */}
            {recursosAtivos.length > 0 && (
              <section className="rounded-2xl border border-secondary/20 bg-secondary/[0.04] p-5 sm:p-6">
                <h2 className="text-xl font-bold text-primary mb-1 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-secondary" /> Acolhimento para famílias TEA
                </h2>
                <p className="text-sm text-muted-foreground mb-5 flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-secondary shrink-0" />
                  Verificado pela nossa equipe na visita ao local.
                </p>
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
                </div>
              </section>
            )}

            {/* Estrutura informada pelo dono. Mesma moldura de arco-íris de
                `/quartos/$id` (`EstruturaEstabelecimentoSecao`) - a paleta do
                espectro é a temática da casa, e as duas páginas mostram o mesmo
                dado, então mostram do mesmo jeito. */}
            {(estruturaAtivos.length > 0 || tour360Url) && (
              <section
                className="rounded-2xl p-[2px]"
                style={{
                  background:
                    "linear-gradient(135deg, #E63946 0%, #1D7FBF 33%, #F4B400 66%, #2E9E55 100%)",
                }}
              >
                <div className="rounded-2xl p-5 sm:p-6 bg-background/95">
                  <h2 className="text-lg font-bold text-primary mb-1 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-secondary" /> Sobre o estabelecimento
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Estrutura que {e.nome} informa oferecer para famílias autistas.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {estruturaAtivos.map((item) => (
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
                    {tour360Url && (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                        <div className="h-9 w-9 rounded-lg bg-amarelo/20 text-amarelo-foreground grid place-items-center shrink-0">
                          <Camera className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          Tour 360° disponível
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Selos e Certificações. Com Selo Azul a arte oficial vira o
                assunto da seção - é a coisa mais forte que a página tem a
                dizer, e virava uma linha de texto. Os demais certificados
                seguem como cards, que é o peso que eles têm. */}
            {(e.selo_azul || e.selo_governamental || e.selo_privado) && (
              <section>
                <h2 className="text-xl font-bold text-primary mb-3">Selos e certificações</h2>

                {e.selo_azul && (
                  <div className="mb-3 flex flex-col gap-6 sm:flex-row sm:items-center">
                    <SeloAzul3D className="w-36 shrink-0 self-center sm:w-44 sm:self-auto" />
                    <div className="min-w-0">
                      <p className="font-display text-lg font-bold text-primary">Selo Azul</p>
                      <p className="text-sm font-medium text-secondary">
                        {e.selo_azul_validade
                          ? `Válido até ${formatDateBR(e.selo_azul_validade)}`
                          : "Certificação ativa"}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                        Nossa equipe visitou {e.nome}, avaliou a estrutura e capacitou a equipe. É o
                        que separa um local que diz acolher de um que foi verificado.
                      </p>
                      <Link
                        to="/como-funciona-o-selo-azul"
                        className="mt-2 inline-block text-sm font-semibold text-secondary underline-offset-2 hover:underline"
                      >
                        Como funciona o Selo Azul
                      </Link>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {e.selo_governamental && (
                    <SeloCard
                      titulo="Certificado governamental"
                      detalhe="Emitido por órgão público"
                    />
                  )}
                  {e.selo_privado && (
                    <SeloCard
                      titulo={e.selo_privado_nome || "Selo privado"}
                      detalhe="Certificação de terceiros"
                    />
                  )}
                </div>
              </section>
            )}

            {/* Avaliações de famílias TEA */}
            <section>
              <h2 className="text-xl font-bold text-primary mb-4">Avaliações de famílias TEA</h2>

              {stats.total > 0 ? (
                <div className="bg-card border border-border rounded-2xl p-6 mb-4">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="text-4xl font-bold text-primary">{stats.geral.toFixed(1)}</div>
                    <div>
                      <div className="flex text-amarelo">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.round(stats.geral) ? "fill-amarelo" : ""
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Baseado em {stats.total} {stats.total === 1 ? "avaliação" : "avaliações"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <SubMedia label="Acolhimento da equipe" valor={stats.acolhimento} />
                    <SubMedia label="Estrutura para TEA" valor={stats.estrutura} />
                    <SubMedia label="Comunicação" valor={stats.comunicacao} />
                  </div>
                </div>
              ) : (
                <div className="bg-muted/40 rounded-xl p-6 text-center text-sm text-muted-foreground mb-4">
                  Ainda sem avaliações. Seja o primeiro a avaliar após sua visita.
                </div>
              )}

              {/* Reusa o componente existente para listar as cards de avaliação */}
              {stats.total > 0 && <AvaliacoesPublicasSection estabelecimentoId={e.id} titulo="" />}
            </section>

            {/* Onde fica. Mesmo componente e mesma posição de `/quartos/$id` -
                a página do estabelecimento tinha o endereço só como texto no
                cabeçalho, e um restaurante se escolhe também pelo trajeto. */}
            <section id="localizacao" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-primary mb-3">Onde fica</h2>
              <QuartoMapa latitude={e.latitude} longitude={e.longitude} local={enderecoMapa} />
            </section>
          </div>

          {/* COLUNA DIREITA · formulário sticky / confirmação / histórico */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            {ehVisita ? (
              aceitaPedidoDeVisita ? (
                <PedidoVisitaCard estabelecimentoId={e.id} horarioCalmo={horarioCalmo} />
              ) : (
                <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-3">
                  <h3 className="text-lg font-bold text-primary">Solicitar reserva</h3>
                  <p className="text-sm text-muted-foreground">
                    Este local ainda não tem o Selo Azul, então não recebe pedidos de reserva pela
                    plataforma. Você pode falar direto com eles.
                  </p>
                  {e.telefone && (
                    <Button asChild variant="outline" className="w-full">
                      <a href={`tel:${e.telefone}`}>{e.telefone}</a>
                    </Button>
                  )}
                  {e.website && (
                    <Button asChild variant="outline" className="w-full">
                      <a href={e.website} target="_blank" rel="noopener noreferrer">
                        Site do estabelecimento
                      </a>
                    </Button>
                  )}
                </div>
              )
            ) : (
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-4">
                <h3 className="text-lg font-bold text-primary">Solicitar Reserva</h3>
                {quartos.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      A partir de{" "}
                      <span className="font-semibold text-primary">
                        {Math.min(...quartos.map((q) => q.preco)).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>{" "}
                      / noite. Escolha um quarto para enviar o pedido com o perfil sensorial do seu
                      filho.
                    </p>
                    <Button
                      asChild
                      className="w-full bg-secondary hover:bg-secondary/90 text-white"
                      size="lg"
                    >
                      <a href="#quartos">Ver quartos disponíveis</a>
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Este estabelecimento ainda não tem quartos disponíveis para reserva.
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Esta plataforma conecta você ao estabelecimento. O pagamento é feito diretamente
                  com eles.
                </p>
              </div>
            )}

            {/* Histórico desta família neste estabelecimento */}
            {user && reservasFamilia.length > 0 && (
              <HistoricoReservasCard reservas={reservasFamilia} destacarId={reservaRecemCriadaId} />
            )}
          </aside>
        </div>
      </div>

      {aceitaPedidoDeVisita && <MobileVisitaBar />}

      {/* Modal: novo perfil sensorial */}
      <Dialog open={perfilModalOpen} onOpenChange={setPerfilModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar novo perfil sensorial</DialogTitle>
            <DialogDescription></DialogDescription>
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

      {/* Modal: galeria completa */}
      <Dialog open={galeriaAberta} onOpenChange={setGaleriaAberta}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Images className="h-5 w-5 text-primary" />
              Fotos de {e.nome}
            </DialogTitle>
            <DialogDescription>
              {galeria.length} {galeria.length === 1 ? "foto enviada" : "fotos enviadas"} pelo
              estabelecimento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {galeria.map((url, i) => (
              <img
                key={`${url}-${i}`}
                src={url}
                alt={`${e.nome} - foto ${i + 1}`}
                loading={i === 0 ? undefined : "lazy"}
                className="w-full rounded-xl border bg-muted object-cover"
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Tour 360° em iframe */}
      <Dialog open={tourModalOpen} onOpenChange={setTourModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-amarelo" />
              Tour 360° · {e.nome}
            </DialogTitle>
            <DialogDescription>
              Explore os ambientes do estabelecimento sem sair da página. Use o mouse ou o toque
              para navegar.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full bg-black" style={{ aspectRatio: "16 / 9" }}>
            {tour360Url && tourModalOpen && (
              <iframe
                src={tour360Url}
                title={`Tour 360° de ${e.nome}`}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking; fullscreen"
                allowFullScreen
                loading="lazy"
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              O tour é fornecido pelo estabelecimento e abre incorporado nesta página.
            </p>
            {tour360Url && (
              <a
                href={tour360Url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-primary hover:underline"
              >
                Abrir em nova aba
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

/**
 * Um campo de `detalhes` como card, com o tratamento decidido pelo `tipo`
 * declarado - e não pela chave.
 *
 * É o que faz a seção valer para qualquer categoria sem tocar nesta tela: um
 * número novo em passeios nasce com a mesma cara de número, e um arquivo novo
 * nasce como botão. Os três tratamentos existem porque as informações não são
 * do mesmo tipo: o cardápio é uma **ação** (leva a outro lugar), a duração e a
 * espera são **medidas** (o valor é o assunto), o resto é texto.
 */
function DetalheCard({ campo, valor }: DetalhePreenchido) {
  const base = "flex flex-col rounded-2xl border border-border bg-card p-5";
  const cabecalho = (
    <>
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-secondary/10 text-secondary">
        <campo.icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {campo.label}
      </p>
    </>
  );

  // Ação: o único item que leva para fora da página merece peso de botão.
  if (campo.tipo === "arquivo") {
    return (
      <div className={base}>
        {cabecalho}
        <p className="mt-1 text-sm text-foreground/70">Dá para conferir antes de reservar.</p>
        <Button
          asChild
          className="mt-4 w-full bg-secondary text-white hover:bg-secondary/90"
          size="sm"
        >
          <a href={String(valor)} target="_blank" rel="noreferrer">
            <FileText className="mr-1.5 h-4 w-4" />
            Ver {campo.label.toLowerCase()}
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    );
  }

  // Medida: o valor é o assunto, então ele é que fica grande.
  if (campo.tipo === "numero" || campo.tipo === "hora") {
    return (
      <div className={base}>
        {cabecalho}
        <p className="mt-2 flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-bold leading-none text-primary tabular-nums">
            {campo.tipo === "numero" ? valor : formatarDetalhe(campo, valor)}
          </span>
          {campo.tipo === "numero" && (
            <span className="text-sm font-medium text-muted-foreground">{campo.unidade}</span>
          )}
        </p>
      </div>
    );
  }

  if (campo.tipo === "booleano") {
    return (
      <div className={base}>
        {cabecalho}
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 text-sm font-semibold",
            valor ? "text-amarelo-foreground" : "text-success",
          )}
        >
          {valor ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {formatarDetalhe(campo, valor)}
        </p>
      </div>
    );
  }

  return (
    <div className={base}>
      {cabecalho}
      <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
        {formatarDetalhe(campo, valor)}
      </p>
    </div>
  );
}

function SeloCard({
  titulo,
  detalhe,
  destaque,
}: {
  titulo: string;
  detalhe: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3",
        destaque ? "border-secondary/30 bg-azul-claro/30" : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          destaque ? "bg-secondary/15 text-secondary" : "bg-primary/10 text-primary",
        )}
      >
        <ShieldCheck className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        <p className="text-xs text-muted-foreground">{detalhe}</p>
      </div>
    </div>
  );
}

function SubMedia({ label, valor }: { label: string; valor: number }) {
  const pct = (valor / 5) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground font-medium">{valor.toFixed(1)}</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cards: confirmação de reserva + histórico desta família neste estabelecimento
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_BADGE_CLASS: Record<ReservaStatus, string> = {
  aguardando_pagamento: "bg-secondary text-secondary-foreground",
  pendente: "bg-warning text-warning-foreground",
  confirmada: "bg-success text-success-foreground",
  cancelada: "bg-destructive text-destructive-foreground",
  concluida: "bg-primary text-primary-foreground",
};

const STATUS_ICON: Record<ReservaStatus, typeof Clock> = {
  aguardando_pagamento: Clock,
  pendente: Clock,
  confirmada: CheckCircle2,
  cancelada: XCircle,
  concluida: CalendarCheck,
};

function HistoricoReservasCard({
  reservas,
  destacarId,
}: {
  reservas: ReservaComContexto[];
  destacarId: string | null;
}) {
  // Não duplicar a reserva recém-criada que já está em destaque acima
  const lista = destacarId ? reservas.filter((r) => r.id !== destacarId) : reservas;
  if (lista.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-bold text-primary">Suas reservas neste local</h3>
      </div>
      <ul className="space-y-3">
        {lista.map((r) => {
          const item = r.itens_reservaveis;
          const perfis = perfisDaReserva(r);
          const status: ReservaStatus = r.status ?? "pendente";
          const StatusIcon = STATUS_ICON[status];
          return (
            <li key={r.id}>
              <Link
                to="/minha-conta/reservas/$id"
                params={{ id: r.id }}
                className="block p-3 rounded-xl border border-border hover:bg-azul-claro/20 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-primary text-sm truncate">
                      {item?.nome ?? "Reserva"}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-foreground/80 mt-1.5">
                      <Calendar className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
                      <span>
                        {r.data_checkin ? formatDateBR(r.data_checkin) : "-"} →{" "}
                        {r.data_checkout ? formatDateBR(r.data_checkout) : "-"}
                      </span>
                    </div>
                    <div className="mt-2">
                      <PerfisTeaAvatares perfis={perfis} />
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE_CLASS[status]}`}
                  >
                    <StatusIcon className="h-2.5 w-2.5" />
                    {RESERVA_STATUS_LABEL[status]}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 pt-3 border-t border-border">
        <Link to="/" className="text-xs text-secondary hover:underline font-medium">
          Voltar à home →
        </Link>
      </div>
    </div>
  );
}
