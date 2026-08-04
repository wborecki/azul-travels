import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Building2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { fetchEstabelecimentoProfile, fetchEstabelecimentoFullDoOwner } from "@/lib/queries";
import { type EstabTipo } from "@/lib/enums";
import { RECURSOS_TEA } from "@/lib/recursos-tea";
import { pickEstabMedia } from "@/lib/media";
import { PainelOperacional } from "@/components/estabelecimento/PainelOperacional";
import { PerfilEstabelecimentoEditor } from "@/components/estabelecimento/PerfilEstabelecimentoEditor";
import {
  EMPTY_DRAFT,
  SECOES,
  type PerfilDraft,
  type RecursosTea,
  type SecaoId,
  type SecaoInfo,
} from "@/lib/perfil-estabelecimento";

export const Route = createFileRoute("/meu-estabelecimento/")({
  head: () => ({ meta: [{ title: "Meu estabelecimento · Turismo Azul" }] }),
  component: MeuEstabelecimentoPage,
});

const DIACRITICOS_RE = new RegExp(String.fromCharCode(0x5b, 0x300, 0x2d, 0x36f, 0x5d), "g");

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICOS_RE, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Copia de `origem` apenas os campos de uma seção. */
function pickCampos(origem: PerfilDraft, campos: ReadonlyArray<keyof PerfilDraft>) {
  return Object.fromEntries(campos.map((c) => [c, origem[c]])) as Partial<PerfilDraft>;
}

function mensagemErroSalvar(msg: string): string {
  if (msg.includes("RECURSOS_TEA_EXIGEM_SELO")) {
    return "Os recursos verificados são liberados quando o Selo Azul fica ativo.";
  }
  return msg;
}

function MeuEstabelecimentoPage() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState<SecaoId | null>(null);
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoId>("identidade");
  const [draft, setDraft] = useState<PerfilDraft>(EMPTY_DRAFT);
  const [draftSalvo, setDraftSalvo] = useState<PerfilDraft>(EMPTY_DRAFT);
  const [perfilCompleto, setPerfilCompleto] = useState(false);
  const [estabId, setEstabId] = useState<string | null>(null);
  const [seloAzul, setSeloAzul] = useState(false);
  const [estabAtivo, setEstabAtivo] = useState(false);
  const [querSelo, setQuerSelo] = useState(false);
  const [querSeloEm, setQuerSeloEm] = useState<string | null>(null);
  const [solicitandoSelo, setSolicitandoSelo] = useState(false);

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
      const [prof, estab] = await Promise.all([
        fetchEstabelecimentoProfile(user.id),
        fetchEstabelecimentoFullDoOwner(user.id),
      ]).catch((err: unknown) => {
        toast.error("Erro ao carregar seus dados", {
          description: err instanceof Error ? err.message : undefined,
        });
        return [null, null] as const;
      });
      setEstabId(estab?.id ?? null);
      setPerfilCompleto(prof?.perfil_completo ?? false);
      setSeloAzul(!!estab?.selo_azul);
      setEstabAtivo(estab?.status === "ativo");
      setQuerSelo(!!estab?.quer_selo_azul);
      setQuerSeloEm(estab?.quer_selo_azul_em ?? null);

      // A capa pode ter sido definida pelo admin sem estar na galeria (o form
      // do admin grava `foto_capa` e `fotos` separadamente). Trazê-la para a
      // frente do array evita que salvar as fotos apague a capa existente.
      const media = estab ? pickEstabMedia(estab) : null;
      const fotosIniciais =
        media?.fotoCapa && !media.fotos.includes(media.fotoCapa)
          ? [media.fotoCapa, ...media.fotos]
          : (media?.fotos ?? []);

      const recursos = Object.fromEntries(
        RECURSOS_TEA.map((r) => [r.key, estab ? !!estab[r.key] : false]),
      ) as RecursosTea;

      const inicial: PerfilDraft = {
        nome: estab?.nome ?? "",
        tipo: (estab?.tipo as string) ?? prof?.tipo ?? "",
        endereco: estab?.endereco ?? prof?.endereco ?? "",
        cidade: estab?.cidade ?? prof?.cidade ?? "",
        estado: estab?.estado ?? prof?.estado ?? "",
        latitude: estab?.latitude != null ? String(estab.latitude) : "",
        longitude: estab?.longitude != null ? String(estab.longitude) : "",
        website: estab?.website ?? prof?.website ?? "",
        num_colaboradores: prof?.num_colaboradores ?? "",
        descricao: estab?.descricao ?? "",
        descricao_tea: estab?.descricao_tea ?? "",
        telefone: estab?.telefone ?? "",
        email: estab?.email ?? "",
        tour_360_url: estab?.tour_360_url ?? "",
        recebe_grupos_escolares_tea: !!estab?.recebe_grupos_escolares_tea,
        fotos: fotosIniciais,
        estrutura: (prof?.estrutura as PerfilDraft["estrutura"]) ?? {},
        recursos,
        tem_beneficio_tea: !!estab?.tem_beneficio_tea,
        beneficio_tea_descricao: estab?.beneficio_tea_descricao ?? "",
        iniciativa_atual: prof?.iniciativa_atual ?? "",
        num_capacitacao: prof?.num_capacitacao ?? "",
        contato_preferido: prof?.contato_preferido ?? "",
        observacoes: prof?.observacoes ?? "",
      };
      setDraft(inicial);
      setDraftSalvo(inicial);
      setCarregando(false);
    })();
  }, [user, loading, role, pathname, navigate]);

  async function solicitarSeloAzul() {
    if (!estabId || querSelo) return;
    setSolicitandoSelo(true);
    const agora = new Date().toISOString();
    const { error } = await supabase
      .from("estabelecimentos")
      .update({ quer_selo_azul: true, quer_selo_azul_em: agora })
      .eq("id", estabId);
    setSolicitandoSelo(false);
    if (error) {
      toast.error("Não foi possível registrar a solicitação", { description: error.message });
      return;
    }
    setQuerSelo(true);
    setQuerSeloEm(agora);
    toast.success("Interesse registrado! Nossa equipe entrará em contato.");
  }

  function set<K extends keyof PerfilDraft>(k: K, v: PerfilDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  /**
   * Grava uma seção por vez. Cada uma sabe em qual tabela mora: o questionário
   * do Selo Azul fica em `estabelecimento_profiles`, o conteúdo público em
   * `estabelecimentos`, e "Identidade" escreve nas duas - além de ser a única
   * que cria a linha em `estabelecimentos`, no primeiro salvamento.
   */
  async function salvarSecao(secao: SecaoInfo) {
    if (!user) return;
    setSalvando(secao.id);
    let erro: string | null = null;

    try {
      if (secao.id === "identidade") {
        if (
          !draft.nome.trim() ||
          !draft.tipo ||
          !draft.endereco.trim() ||
          !draft.cidade.trim() ||
          !draft.estado.trim()
        ) {
          toast.error("Preencha nome, tipo, endereço completo, cidade e estado.");
          return;
        }
        if (!draft.latitude.trim() || !draft.longitude.trim()) {
          toast.error("Posicione o pino no mapa para definir a localização do estabelecimento.");
          return;
        }

        const { error: profErr } = await supabase
          .from("estabelecimento_profiles")
          .update({
            tipo: draft.tipo,
            endereco: draft.endereco || null,
            cidade: draft.cidade,
            estado: draft.estado.toUpperCase(),
            website: draft.website || null,
            num_colaboradores: draft.num_colaboradores || null,
            perfil_completo: true,
          })
          .eq("id", user.id);
        if (profErr) {
          erro = profErr.message;
        } else {
          const dadosEstab = {
            nome: draft.nome,
            endereco: draft.endereco || null,
            cidade: draft.cidade,
            estado: draft.estado.toUpperCase(),
            latitude: draft.latitude.trim() ? Number(draft.latitude) : null,
            longitude: draft.longitude.trim() ? Number(draft.longitude) : null,
            website: draft.website || null,
          };

          if (estabId) {
            // `tipo` não entra no UPDATE de propósito: ele decide se o local
            // recebe reserva de quarto ou de visita, e trocá-lo deixaria
            // quartos e reservas existentes órfãos. A tela informa isso.
            const { error } = await supabase
              .from("estabelecimentos")
              .update(dadosEstab)
              .eq("id", estabId);
            erro = error?.message ?? null;
          } else {
            // Cadastro via /cadastro não cria a linha em `estabelecimentos` (só
            // `estabelecimento_profiles`) - é aqui, no primeiro salvamento da
            // Identidade, que o estabelecimento é efetivamente criado.
            const slug = `${slugify(draft.nome)}-${user.id.slice(0, 8)}`;
            const { data: novoEstab, error } = await supabase
              .from("estabelecimentos")
              .insert({
                ...dadosEstab,
                tipo: draft.tipo as EstabTipo,
                slug,
                owner_user_id: user.id,
                status: "pendente",
              })
              .select("id")
              .single();
            erro = error?.message ?? null;
            if (!error && novoEstab) {
              const { error: linkErr } = await supabase
                .from("estabelecimento_profiles")
                .update({ estabelecimento_id: novoEstab.id })
                .eq("id", user.id);
              if (!linkErr) setEstabId(novoEstab.id);
            }
          }
          if (!erro) setPerfilCompleto(true);
        }
      } else if (!estabId) {
        // Toda seção fora da Identidade grava em `estabelecimentos`, e a linha
        // só passa a existir quando a Identidade é salva pela primeira vez.
        toast.error("Salve a Identidade primeiro.");
        setSecaoAtiva("identidade");
        return;
      } else if (secao.id === "descricao") {
        const { error } = await supabase
          .from("estabelecimentos")
          .update({
            descricao: draft.descricao || null,
            descricao_tea: draft.descricao_tea || null,
          })
          .eq("id", estabId);
        erro = error?.message ?? null;
      } else if (secao.id === "fotos") {
        const { error } = await supabase
          .from("estabelecimentos")
          .update({
            // A capa é sempre a primeira da galeria - `FotosGaleria` trata a
            // posição 0 como capa, então não há um segundo controle para isso.
            fotos: draft.fotos,
            foto_capa: draft.fotos[0] ?? null,
            tour_360_url: draft.tour_360_url || null,
          })
          .eq("id", estabId);
        erro = error?.message ?? null;
      } else if (secao.id === "contato") {
        const { error } = await supabase
          .from("estabelecimentos")
          .update({
            telefone: draft.telefone || null,
            email: draft.email || null,
          })
          .eq("id", estabId);
        erro = error?.message ?? null;
        if (!erro) {
          const { error: profErr } = await supabase
            .from("estabelecimento_profiles")
            .update({ contato_preferido: draft.contato_preferido || null })
            .eq("id", user.id);
          erro = profErr?.message ?? null;
        }
      } else if (secao.id === "acolhimento") {
        // Os recursos só entram no payload quando editáveis. A trigger
        // `protect_estabelecimentos_admin_columns` recusaria a alteração, e
        // mandá-los sem necessidade só criaria uma forma de falhar.
        const podeRecursos = seloAzul && estabAtivo;
        const { error } = await supabase
          .from("estabelecimentos")
          .update({
            estrutura: draft.estrutura,
            recebe_grupos_escolares_tea:
              draft.tipo === "passeio_educativo" ? draft.recebe_grupos_escolares_tea : false,
            ...(podeRecursos
              ? {
                  ...draft.recursos,
                  tem_beneficio_tea: draft.tem_beneficio_tea,
                  beneficio_tea_descricao: draft.beneficio_tea_descricao || null,
                }
              : {}),
          })
          .eq("id", estabId);
        erro = error?.message ?? null;
        if (!erro) {
          const { error: profErr } = await supabase
            .from("estabelecimento_profiles")
            .update({ estrutura: draft.estrutura })
            .eq("id", user.id);
          erro = profErr?.message ?? null;
        }
      } else {
        const { error } = await supabase
          .from("estabelecimento_profiles")
          .update({
            iniciativa_atual: draft.iniciativa_atual || null,
            num_capacitacao: draft.num_capacitacao || null,
            observacoes: draft.observacoes || null,
          })
          .eq("id", user.id);
        erro = error?.message ?? null;
      }
    } finally {
      setSalvando(null);
    }

    if (erro) {
      toast.error("Erro ao salvar", { description: mensagemErroSalvar(erro) });
      return;
    }
    setDraftSalvo((prev) => ({ ...prev, ...pickCampos(draft, secao.campos) }));
    toast.success(`${secao.label} salva`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
      {carregando ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
        </div>
      ) : editando ? (
        <PerfilEstabelecimentoEditor
          draft={draft}
          draftSalvo={draftSalvo}
          set={set}
          secaoAtiva={secaoAtiva}
          onSelecionarSecao={setSecaoAtiva}
          onSalvar={(s) => void salvarSecao(s)}
          salvando={salvando}
          onFechar={() => setEditando(false)}
          estabId={estabId}
          podeEditarRecursos={seloAzul && estabAtivo}
          uploadPrefixo={user?.id}
        />
      ) : seloAzul && estabAtivo && estabId ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-white border text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              <Building2 className="h-4 w-4" /> Editar perfil
            </button>
          </div>
          <PainelOperacional estabId={estabId} />
        </div>
      ) : (
        <Dashboard
          perfilCompleto={perfilCompleto}
          draft={draft}
          seloAzul={seloAzul}
          querSelo={querSelo}
          querSeloEm={querSeloEm}
          solicitandoSelo={solicitandoSelo}
          onCompletar={(secao) => {
            if (secao) setSecaoAtiva(secao);
            setEditando(true);
          }}
          onSolicitarSelo={() => void solicitarSeloAzul()}
        />
      )}
    </main>
  );
}

function Dashboard({
  perfilCompleto,
  draft,
  seloAzul,
  querSelo,
  querSeloEm,
  solicitandoSelo,
  onCompletar,
  onSolicitarSelo,
}: {
  perfilCompleto: boolean;
  draft: PerfilDraft;
  seloAzul: boolean;
  querSelo: boolean;
  querSeloEm: string | null;
  solicitandoSelo: boolean;
  onCompletar: (secao?: SecaoId) => void;
  onSolicitarSelo: () => void;
}) {
  const pendentes = SECOES.filter((s) => s.pendente(draft));
  const progresso = Math.round(((SECOES.length - pendentes.length) / SECOES.length) * 100);

  const dataSolicitacao = querSeloEm
    ? new Date(querSeloEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-[#1a2f5e] via-primary to-[#1a2f5e] text-white p-6 sm:p-8 shadow-md">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl">
              Bem-vindo ao seu painel 💙
            </h1>
            <p className="mt-2 text-white/90 max-w-2xl text-sm sm:text-base">
              Acompanhe o status do seu cadastro, complete seu perfil e avance rumo ao Selo Azul.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-xs sm:text-sm border border-white/20">
            <Clock className="h-4 w-4 text-[#c9a84c]" />
            Cadastro em análise
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-white/80 mb-1.5">
            <span>Progresso do perfil</span>
            <span className="font-semibold text-[#c9a84c]">{progresso}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c9a84c] to-[#e6c97a] transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {pendentes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {pendentes.map((s) => (
              <button
                key={s.id}
                onClick={() => onCompletar(s.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-white"
              >
                {s.label} <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-azul-claro flex items-center justify-center text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="font-display font-bold text-base text-primary">Perfil do local</h2>
          </div>
          {perfilCompleto && pendentes.length === 0 ? (
            <>
              <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Completo
              </div>
              <p className="mt-2 text-xs text-foreground/70 flex-1">
                Dados salvos e disponíveis para auditoria.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCompletar()}
                className="mt-3 self-start border-primary text-primary hover:bg-azul-claro"
              >
                Ver ou editar
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-xs text-foreground/70 flex-1">
                {pendentes.length === 1
                  ? "Falta 1 seção para o perfil ficar completo."
                  : `Faltam ${pendentes.length} de ${SECOES.length} seções.`}
              </p>
              <Button
                size="sm"
                onClick={() => onCompletar(pendentes[0]?.id)}
                className="mt-3 self-start bg-secondary hover:bg-secondary/90 text-white"
              >
                Completar perfil <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}
        </div>

        <div className="bg-white border rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-azul-claro flex items-center justify-center text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="font-display font-bold text-base text-primary">Selo Azul</h2>
          </div>
          {seloAzul ? (
            <>
              <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <Award className="h-4 w-4" /> Certificado
              </div>
              <p className="mt-2 text-xs text-foreground/70 flex-1">
                Seu local já exibe o Selo Azul nas buscas.
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-xs text-foreground/70 flex-1">
                Local ainda não certificado. Demonstre interesse e nossa equipe avalia o processo.
              </p>
              <span className="mt-3 self-start inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-azul-claro text-primary">
                Não certificado
              </span>
            </>
          )}
        </div>

        <div
          className={`relative border rounded-2xl p-5 flex flex-col shadow-sm transition overflow-hidden ${
            querSelo
              ? "bg-gradient-to-br from-[#fff8e6] to-white border-[#c9a84c]/40"
              : "bg-gradient-to-br from-[#1a2f5e] to-primary text-white border-transparent hover:shadow-lg"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                querSelo ? "bg-[#c9a84c]/15 text-[#8a7028]" : "bg-white/15 text-[#c9a84c]"
              }`}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <h2
              className={`font-display font-bold text-base ${
                querSelo ? "text-[#8a7028]" : "text-white"
              }`}
            >
              {querSelo ? "Interesse registrado" : "Quero o Selo Azul"}
            </h2>
          </div>
          {querSelo ? (
            <>
              <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Solicitação enviada
              </div>
              <p className="mt-2 text-xs text-foreground/70 flex-1">
                {dataSolicitacao
                  ? `Recebemos seu interesse em ${dataSolicitacao}.`
                  : "Recebemos seu interesse."}{" "}
                Nossa equipe entrará em contato em breve.
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-xs text-white/85 flex-1">
                Sinalize seu interesse para iniciarmos a avaliação do processo de certificação.
              </p>
              <Button
                size="sm"
                onClick={onSolicitarSelo}
                disabled={solicitandoSelo || seloAzul}
                className="mt-3 self-start bg-[#c9a84c] hover:bg-[#b9962e] text-[#1a2f5e] font-semibold"
              >
                {solicitandoSelo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    Quero participar <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <TimelineFluxo perfilCompleto={perfilCompleto} querSelo={querSelo} seloAzul={seloAzul} />
    </div>
  );
}

function TimelineFluxo({
  perfilCompleto,
  querSelo,
  seloAzul,
}: {
  perfilCompleto: boolean;
  querSelo: boolean;
  seloAzul: boolean;
}) {
  const steps = [
    {
      title: "Cadastro criado",
      desc: "Sua conta está ativa na plataforma.",
      done: true,
    },
    {
      title: "Perfil completo",
      desc: "Preencha as informações do estabelecimento.",
      done: perfilCompleto,
    },
    {
      title: "Interesse no Selo Azul",
      desc: "Sinalize que quer participar do programa.",
      done: querSelo || seloAzul,
    },
    {
      title: "Auditoria e capacitação",
      desc: "Nossa equipe entra em contato e treina sua equipe.",
      done: seloAzul,
    },
    {
      title: "Selo Azul concedido",
      desc: "Destaque nas buscas das famílias TEA.",
      done: seloAzul,
    },
  ];

  const currentIdx = steps.findIndex((s) => !s.done);
  const activeIdx = currentIdx === -1 ? steps.length - 1 : currentIdx;

  return (
    <div className="bg-white border rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-lg text-primary">O que vem pela frente</h3>
        <span className="text-xs text-foreground/60">
          Etapa {activeIdx + 1} de {steps.length}
        </span>
      </div>

      <div className="hidden md:block">
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-[#c9a84c] transition-all"
            style={{
              width: `${(activeIdx / (steps.length - 1)) * 100}%`,
            }}
          />
          <ol className="relative grid grid-cols-5 gap-2">
            {steps.map((s, i) => {
              const isDone = s.done;
              const isActive = i === activeIdx && !isDone;
              return (
                <li key={s.title} className="flex flex-col items-center text-center px-1">
                  <div
                    className={[
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white z-10 transition-colors",
                      isDone
                        ? "border-[#c9a84c] bg-[#c9a84c] text-white"
                        : isActive
                          ? "border-primary text-primary ring-4 ring-primary/15"
                          : "border-slate-300 text-slate-400",
                    ].join(" ")}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isActive ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{i + 1}</span>
                    )}
                  </div>
                  <div className="mt-3">
                    <div
                      className={[
                        "text-sm font-semibold",
                        isActive
                          ? "text-primary"
                          : isDone
                            ? "text-foreground"
                            : "text-foreground/60",
                      ].join(" ")}
                    >
                      {s.title}
                    </div>
                    <div className="text-xs text-foreground/60 mt-1 leading-snug">{s.desc}</div>
                    {isActive && (
                      <span className="inline-block mt-2 text-[10px] uppercase tracking-wide font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Etapa atual
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <ol className="md:hidden space-y-4">
        {steps.map((s, i) => {
          const isDone = s.done;
          const isActive = i === activeIdx && !isDone;
          return (
            <li key={s.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors",
                    isDone
                      ? "border-[#c9a84c] bg-[#c9a84c] text-white"
                      : isActive
                        ? "border-primary text-primary ring-4 ring-primary/15"
                        : "border-slate-300 text-slate-400 bg-white",
                  ].join(" ")}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isActive ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-bold">{i + 1}</span>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 mt-1 ${isDone ? "bg-[#c9a84c]" : "bg-slate-200"}`}
                  />
                )}
              </div>
              <div className="pb-2">
                <div
                  className={[
                    "text-sm font-semibold",
                    isActive ? "text-primary" : isDone ? "text-foreground" : "text-foreground/60",
                  ].join(" ")}
                >
                  {s.title}
                  {isActive && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Atual
                    </span>
                  )}
                </div>
                <div className="text-xs text-foreground/60 mt-1">{s.desc}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
