import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  fetchEstabelecimentoDetalhe,
  fetchPerfisDaFamilia,
  fetchReservasDaFamiliaPorEstabelecimento,
  criarReserva,
  buildReservaPayload,
  pickEstabMedia,
  type EstabelecimentoNormalized,
  type EstabelecimentoDetalhe,
  type PerfilOption,
  type ReservaComContexto,
  type ReservaFormInput,
} from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
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
      { title: `${params.slug} — Turismo Azul` },
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
  const [checkin, setCheckin] = useState<string>("");
  const [checkout, setCheckout] = useState<string>("");
  const [adultos, setAdultos] = useState(2);
  const [autistas, setAutistas] = useState(1);
  const [mensagem, setMensagem] = useState("");
  const [autoriza, setAutoriza] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [reservaEnviada, setReservaEnviada] = useState(false);
  const [reservasFamilia, setReservasFamilia] = useState<ReservaComContexto[]>([]);
  const [reservaRecemCriadaId, setReservaRecemCriadaId] = useState<string | null>(null);

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
  };

  const enviarReserva = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!perfilSel) {
      toast.error("Selecione ou crie um perfil sensorial antes.");
      return;
    }
    if (!checkin || !checkout) {
      toast.error("Selecione as datas de chegada e saída.");
      return;
    }
    if (new Date(checkout) <= new Date(checkin)) {
      toast.error("A data de saída deve ser depois da chegada.");
      return;
    }
    if (!autoriza) {
      toast.error("É preciso autorizar o envio do perfil sensorial.");
      return;
    }
    const formInput: ReservaFormInput = {
      familia_id: user.id,
      estabelecimento_id: e.id,
      perfil_sensorial_id: perfilSel,
      data_checkin: checkin,
      data_checkout: checkout,
      num_adultos: adultos,
      num_autistas: autistas,
      mensagem,
      perfil_enviado_ao_estabelecimento: true,
    };
    setEnviando(true);
    try {
      const created = await criarReserva(buildReservaPayload(formInput));
      toast.success(
        "Reserva solicitada. O estabelecimento vai retornar por e-mail em até 48 horas.",
      );
      setReservaRecemCriadaId(created.id);
      setReservaEnviada(true);
      await recarregarReservasFamilia(e.id);
    } catch (err) {
      toast.error("Erro ao enviar reserva", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* SEÇÃO 1 — Galeria full-width + header */}
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
        </div>
        {/* Botão Tour 360° */}
        {tour360Url && (
          <a
            href={tour360Url}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-4 right-4 bg-amarelo text-amarelo-foreground rounded-xl px-4 py-2 font-semibold text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition"
          >
            <Camera className="h-4 w-4" /> Tour 360° dos ambientes
          </a>
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

        {/* Benefício TEA — caixa verde com ícone */}
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
          {/* COLUNA ESQUERDA — conteúdo */}
          <div className="space-y-10 min-w-0">
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
                      <span className="font-semibold">Selo Azul (Absoluto Educacional)</span>
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

          {/* COLUNA DIREITA — formulário sticky / confirmação / histórico */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
            {!user ? (
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-4">
                <h3 className="text-lg font-bold text-primary">Solicitar reserva</h3>
                <p className="text-sm text-muted-foreground">
                  Faça login para solicitar uma reserva e enviar o perfil sensorial do seu filho.
                </p>
                <Button asChild className="w-full">
                  <Link to="/login">Entrar ou cadastrar</Link>
                </Button>
              </div>
            ) : reservaEnviada && reservaRecemCriadaId ? (
              <ConfirmacaoReservaCard
                reserva={
                  reservasFamilia.find((r) => r.id === reservaRecemCriadaId) ?? null
                }
                estabNome={e.nome}
                onNovaReserva={() => {
                  setReservaEnviada(false);
                  setReservaRecemCriadaId(null);
                  setMensagem("");
                  setAutoriza(false);
                }}
              />
            ) : (
              <div className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-4">
                <h3 className="text-lg font-bold text-primary">Solicitar reserva</h3>

                {/* Perfil sensorial */}
                <div>
                  <Label>Perfil sensorial</Label>
                  {perfis.length === 0 ? (
                    <Button
                      variant="outline"
                      className="mt-1.5 w-full"
                      onClick={() => setPerfilModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" /> Criar primeiro perfil
                    </Button>
                  ) : (
                    <Select
                      value={perfilSel}
                      onValueChange={(v) => {
                        if (v === "__novo__") {
                          setPerfilModalOpen(true);
                        } else {
                          setPerfilSel(v);
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione um perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {perfis.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome_autista}
                          </SelectItem>
                        ))}
                        <SelectItem value="__novo__">+ Adicionar novo perfil</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    O perfil sensorial será enviado ao estabelecimento ao confirmar a reserva.
                  </p>
                </div>

                {/* Datas */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="checkin">Chegada</Label>
                    <Input
                      id="checkin"
                      type="date"
                      min={todayPlus(1)}
                      value={checkin}
                      onChange={(ev) => setCheckin(ev.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkout">Saída</Label>
                    <Input
                      id="checkout"
                      type="date"
                      min={checkin || todayPlus(2)}
                      value={checkout}
                      onChange={(ev) => setCheckout(ev.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {/* Steppers */}
                <div className="grid grid-cols-2 gap-2">
                  <Stepper
                    label="Adultos"
                    value={adultos}
                    onChange={setAdultos}
                    min={1}
                    max={10}
                  />
                  <Stepper
                    label="Crianças autistas"
                    value={autistas}
                    onChange={setAutistas}
                    min={1}
                    max={5}
                  />
                </div>

                {/* Mensagem */}
                <div>
                  <Label htmlFor="mensagem">Mensagem (opcional)</Label>
                  <Textarea
                    id="mensagem"
                    value={mensagem}
                    onChange={(ev) => setMensagem(ev.target.value)}
                    placeholder="Alguma informação adicional que queira passar ao estabelecimento?"
                    rows={3}
                    className="mt-1.5"
                  />
                </div>

                {/* Autorização */}
                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={autoriza}
                    onCheckedChange={(v) => setAutoriza(!!v)}
                    className="mt-0.5"
                  />
                  <span>
                    Autorizo o envio do perfil sensorial de{" "}
                    <strong>{perfilSelecionado?.nome_autista || "—"}</strong> para este
                    estabelecimento.
                  </span>
                </label>

                <Button
                  onClick={enviarReserva}
                  disabled={enviando || perfis.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    "Solicitar reserva"
                  )}
                </Button>

                <p className="text-[11px] text-muted-foreground leading-snug">
                  Esta plataforma conecta você ao estabelecimento. O pagamento é feito
                  diretamente com eles.
                </p>
              </div>
            )}

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

function ConfirmacaoReservaCard({
  reserva,
  estabNome,
  onNovaReserva,
}: {
  reserva: ReservaComContexto | null;
  estabNome: string;
  onNovaReserva: () => void;
}) {
  const status: ReservaStatus = reserva?.status ?? "pendente";
  const StatusIcon = STATUS_ICON[status];

  return (
    <div className="bg-card rounded-2xl border-2 border-success/30 shadow-lg overflow-hidden">
      {/* Cabeçalho de sucesso */}
      <div className="bg-success/10 p-5 text-center border-b border-success/20">
        <div className="mx-auto h-14 w-14 rounded-full bg-success/20 grid place-items-center mb-3">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-lg font-bold text-primary">Solicitação enviada!</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Sua reserva em <strong className="text-foreground">{estabNome}</strong> foi registrada.
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Status atual */}
        <div className="rounded-xl bg-muted/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Status
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_BADGE_CLASS[status]}`}
            >
              <StatusIcon className="h-3 w-3" />
              {RESERVA_STATUS_LABEL[status]}
            </span>
          </div>

          {reserva && (
            <dl className="text-xs space-y-1.5 text-foreground/80">
              {(reserva.data_checkin || reserva.data_checkout) && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Datas</dt>
                  <dd className="font-medium text-right">
                    {formatDateBR(reserva.data_checkin)} → {formatDateBR(reserva.data_checkout)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Pessoas</dt>
                <dd className="font-medium text-right">
                  {reserva.num_adultos ?? 1} adulto(s)
                  {(reserva.num_autistas ?? 0) > 0 &&
                    ` · ${reserva.num_autistas} criança(s) autista(s)`}
                </dd>
              </div>
              {reserva.perfil_sensorial?.nome_autista && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Perfil enviado</dt>
                  <dd className="font-medium text-right">
                    {reserva.perfil_sensorial.nome_autista} ✓
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Solicitada em</dt>
                <dd className="font-medium text-right">{formatDateBR(reserva.criado_em)}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* Próximos passos */}
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
            Próximos passos
          </h4>
          <ol className="space-y-2 text-xs text-foreground/80">
            <li className="flex gap-2">
              <Mail className="h-3.5 w-3.5 mt-0.5 text-secondary shrink-0" />
              <span>
                O estabelecimento recebeu o perfil sensorial e vai retornar por e-mail em até{" "}
                <strong>48 horas</strong>.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-secondary shrink-0" />
              <span>
                Quando confirmarem, o status muda para <strong>Confirmada</strong> aqui e você
                recebe um e-mail.
              </span>
            </li>
            <li className="flex gap-2">
              <Gift className="h-3.5 w-3.5 mt-0.5 text-secondary shrink-0" />
              <span>O pagamento é feito diretamente com o estabelecimento.</span>
            </li>
          </ol>
        </div>

        {/* CTAs */}
        <div className="space-y-2 pt-1">
          <Button asChild variant="outline" className="w-full">
            <Link to="/minha-conta/reservas">Ver todas as minhas reservas</Link>
          </Button>
          <button
            type="button"
            onClick={onNovaReserva}
            className="w-full text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Solicitar outra reserva neste local
          </button>
        </div>
      </div>
    </div>
  );
}

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
        <Link
          to="/minha-conta/reservas"
          className="text-xs text-secondary hover:underline font-medium"
        >
          Ver detalhes em Minha Conta →
        </Link>
      </div>
    </div>
  );
}
