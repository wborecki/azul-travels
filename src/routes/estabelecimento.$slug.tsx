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
  type EstabelecimentoNormalized,
  type EstabelecimentoDetalhe,
  type PerfilOption,
  type ReservaComContexto,
  type ReservaFormInput,
  type ItemReservavel,
} from "@/lib/queries";
import { QuartoCard } from "@/components/estabelecimento/QuartoCard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AvaliacoesPublicasSection } from "@/components/AvaliacoesPublicasSection";
import { Pill, SELO_BADGES } from "@/components/Badges";
import {
  PerfilSensorialForm,
  DEFAULT_PERFIL_DRAFT,
  type PerfilSensorialDraft,
} from "@/components/PerfilSensorialForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { TIPO_LABEL, formatDateBR } from "@/lib/brazil";
import { RESERVA_STATUS_LABEL, type ReservaStatus } from "@/lib/enums";
import {
  Camera,
  MapPin,
  Gift,
  Star,
  Home,
  Brain,
  DoorOpen,
  FastForward,
  Utensils,
  MessageSquare,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  Mail,
  CalendarCheck,
  History,
  XCircle,
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

const RECURSO_INFOS = [
  { key: "tem_sala_sensorial", icon: Home, label: "Sala Sensorial" },
  { key: "tem_concierge_tea", icon: Brain, label: "Concierge TEA" },
  { key: "tem_checkin_antecipado", icon: DoorOpen, label: "Check-in Antecipado" },
  { key: "tem_fila_prioritaria", icon: FastForward, label: "Fila Prioritária" },
  { key: "tem_cardapio_visual", icon: Utensils, label: "Cardápio Visual" },
  { key: "tem_caa", icon: MessageSquare, label: "Comunicação Alternativa (CAA)" },
] as const;

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

  const { fotoCapa, tour360Url } = pickEstabMedia(e);
  const recursosAtivos = RECURSO_INFOS.filter((r) => e[r.key]);
  const temBeneficio = e.tem_beneficio_tea && e.beneficio_tea_descricao;

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

      {/* SEÇÃO 1 · Galeria full-width + header */}
      <div className="relative w-full bg-muted" style={{ height: 420 }}>
        {fotoCapa ? (
          <img src={fotoCapa} alt={e.nome} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground">
            Sem foto disponível
          </div>
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
        {/* Header textual */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">{e.nome}</h1>
          <p className="mt-2 text-muted-foreground flex items-center gap-2 flex-wrap">
            <span className="font-medium">{TIPO_LABEL[e.tipo]}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {e.cidade}, {e.estado}
            </span>
          </p>
          {stats.total > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 text-amarelo fill-amarelo" />
              <span className="font-semibold">{stats.geral.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({stats.total} {stats.total === 1 ? "avaliação" : "avaliações"})
              </span>
            </div>
          )}
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
            {/* Quartos disponíveis */}
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

            {/* Sobre o local para famílias TEA */}
            <section>
              <h2 className="text-xl font-bold text-primary mb-3">
                Sobre o local para famílias TEA
              </h2>
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {e.descricao_tea || e.descricao || "Sem descrição disponível."}
              </p>
            </section>

            {/* O que este local oferece */}
            <section>
              <h2 className="text-xl font-bold text-primary mb-3">O que este local oferece</h2>
              {recursosAtivos.length === 0 && !tour360Url ? (
                <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-4">
                  Este estabelecimento ainda não informou seus recursos detalhados.
                </p>
              ) : (
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
                  {tour360Url && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className="h-9 w-9 rounded-lg bg-amarelo/20 text-amarelo-foreground grid place-items-center shrink-0">
                        <Camera className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        Tour 360° disponível
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Selos e Certificações */}
            {(e.selo_azul || e.selo_governamental || e.selo_privado) && (
              <section>
                <h2 className="text-xl font-bold text-primary mb-3">Selos e Certificações</h2>
                <ul className="space-y-2 text-sm">
                  {e.selo_azul && (
                    <li className="flex justify-between py-2 border-b border-border">
                      <span className="font-semibold">Selo Azul</span>
                      {e.selo_azul_validade && (
                        <span className="text-muted-foreground">
                          Válido até {formatDateBR(e.selo_azul_validade)}
                        </span>
                      )}
                    </li>
                  )}
                  {e.selo_governamental && (
                    <li className="py-2 border-b border-border font-semibold">
                      Certificado Governamental
                    </li>
                  )}
                  {e.selo_privado && (
                    <li className="py-2 border-b border-border font-semibold">
                      {e.selo_privado_nome || "Selo Privado"}
                    </li>
                  )}
                </ul>
              </section>
            )}

            {/* Avaliações de famílias TEA */}
            <section>
              <h2 className="text-xl font-bold text-primary mb-4">Avaliações de famílias TEA</h2>

              {stats.total > 0 ? (
                <div className="bg-card border border-border rounded-2xl p-6 mb-4">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="text-4xl font-bold text-primary">
                      {stats.geral.toFixed(1)}
                    </div>
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
              {stats.total > 0 && (
                <AvaliacoesPublicasSection estabelecimentoId={e.id} titulo="" />
              )}
            </section>
          </div>

          {/* COLUNA DIREITA · formulário sticky / confirmação / histórico */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
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
                  <Button asChild className="w-full bg-secondary hover:bg-secondary/90 text-white" size="lg">
                    <a href="#quartos">Ver quartos disponíveis</a>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este estabelecimento ainda não tem quartos disponíveis para reserva.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground leading-snug">
                Esta plataforma conecta você ao estabelecimento. O pagamento é
                feito diretamente com eles.
              </p>
            </div>

            {/* Histórico desta família neste estabelecimento */}
            {user && reservasFamilia.length > 0 && (
              <HistoricoReservasCard
                reservas={reservasFamilia}
                destacarId={reservaRecemCriadaId}
              />
            )}
          </aside>
        </div>
      </div>

      {/* Modal: novo perfil sensorial */}
      <Dialog open={perfilModalOpen} onOpenChange={setPerfilModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar novo perfil sensorial</DialogTitle>
            <DialogDescription>
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

      {/* Modal: Tour 360° em iframe */}
      <Dialog open={tourModalOpen} onOpenChange={setTourModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-amarelo" />
              Tour 360° · {e.nome}
            </DialogTitle>
            <DialogDescription>
              Explore os ambientes do estabelecimento sem sair da página. Use o mouse ou o toque para navegar.
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

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex items-center border border-input rounded-md h-9">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="h-full px-2 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 text-center text-sm font-semibold tabular-nums">{value}</div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="h-full px-2 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cards: confirmação de reserva + histórico desta família neste estabelecimento
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_BADGE_CLASS: Record<ReservaStatus, string> = {
  pendente: "bg-warning text-warning-foreground",
  confirmada: "bg-success text-success-foreground",
  cancelada: "bg-destructive text-destructive-foreground",
  concluida: "bg-primary text-primary-foreground",
};

const STATUS_ICON: Record<ReservaStatus, typeof Clock> = {
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
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-bold text-primary">Suas reservas neste local</h3>
      </div>
      <ul className="space-y-2">
        {lista.map((r) => {
          const status: ReservaStatus = r.status ?? "pendente";
          const StatusIcon = STATUS_ICON[status];
          return (
            <li
              key={r.id}
              className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-b-0"
            >
              <div className="min-w-0 text-xs">
                <div className="text-foreground font-medium">
                  {r.data_checkin || r.data_checkout
                    ? `${formatDateBR(r.data_checkin)} → ${formatDateBR(r.data_checkout)}`
                    : "Sem datas definidas"}
                </div>
                <div className="text-muted-foreground mt-0.5">
                  Solicitada em {formatDateBR(r.criado_em)}
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE_CLASS[status]}`}
              >
                <StatusIcon className="h-2.5 w-2.5" />
                {RESERVA_STATUS_LABEL[status]}
              </span>
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
