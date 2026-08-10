import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Building2, Sparkles, Clock, Award } from "lucide-react";
import { toast } from "sonner";
import { fetchEstabelecimentoProfile, fetchEstabelecimentoFullDoOwner } from "@/lib/queries";
import { isEstabTipo, type EstabTipo } from "@/lib/enums";
import { RECURSOS_TEA } from "@/lib/recursos-tea";
import { limparDetalhes } from "@/lib/detalhes-estabelecimento";
import { pickEstabMedia } from "@/lib/media";
import { ChecklistOnboarding } from "@/components/estabelecimento/ChecklistOnboarding";
import { PainelOperacional } from "@/components/estabelecimento/PainelOperacional";
import { PerfilEstabelecimentoEditor } from "@/components/estabelecimento/PerfilEstabelecimentoEditor";
import {
  EMPTY_DRAFT,
  secoesAplicaveis,
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

const CHECKLIST_OCULTO_KEY = "turismo-azul:checklist-oculto";

// Storage é opcional aqui: se o navegador recusar (Safari privado), a
// preferência só não sobrevive ao reload - nada quebra.
function lerChecklistOculto(userId: string): boolean {
  try {
    return localStorage.getItem(`${CHECKLIST_OCULTO_KEY}:${userId}`) === "1";
  } catch {
    return false;
  }
}

function gravarChecklistOculto(userId: string, oculto: boolean) {
  try {
    const chave = `${CHECKLIST_OCULTO_KEY}:${userId}`;
    if (oculto) localStorage.setItem(chave, "1");
    else localStorage.removeItem(chave);
  } catch {
    /* preferência não persiste - ver acima */
  }
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
  const [estabId, setEstabId] = useState<string | null>(null);
  const [seloAzul, setSeloAzul] = useState(false);
  const [estabAtivo, setEstabAtivo] = useState(false);
  const [querSelo, setQuerSelo] = useState(false);
  const [querSeloEm, setQuerSeloEm] = useState<string | null>(null);
  const [solicitandoSelo, setSolicitandoSelo] = useState(false);
  const [checklistOculto, setChecklistOculto] = useState(false);

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
      setSeloAzul(!!estab?.selo_azul);
      setEstabAtivo(estab?.status === "ativo");
      setQuerSelo(!!estab?.quer_selo_azul);
      setQuerSeloEm(estab?.quer_selo_azul_em ?? null);
      setChecklistOculto(lerChecklistOculto(user.id));

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
        // Só em `estabelecimentos` - `detalhes` não tem cópia no profile (0.4).
        detalhes: (estab?.detalhes as PerfilDraft["detalhes"]) ?? {},
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

  function ocultarChecklist() {
    if (user) gravarChecklistOculto(user.id, true);
    setChecklistOculto(true);
  }

  function reabrirChecklist() {
    if (user) gravarChecklistOculto(user.id, false);
    setChecklistOculto(false);
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
    // O que o salvamento mudou no próprio rascunho. Sem isso, uma seção que
    // normaliza antes de gravar (ver "detalhes") voltaria da gravação marcada
    // como "alterações não salvas", comparando o rascunho cru com o limpo.
    let normalizado: Partial<PerfilDraft> = {};

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
      } else if (secao.id === "detalhes") {
        // `limparDetalhes` descarta campo vazio e valida cada valor contra o
        // tipo declarado, para o jsonb não acumular `""` nem chave de outra
        // categoria - a leitura pública confia nesse formato.
        const detalhes = isEstabTipo(draft.tipo)
          ? limparDetalhes(draft.tipo, draft.detalhes)
          : draft.detalhes;
        const { error } = await supabase
          .from("estabelecimentos")
          .update({ detalhes })
          .eq("id", estabId);
        erro = error?.message ?? null;
        if (!erro) normalizado = { detalhes };
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
    const gravado = { ...draft, ...normalizado };
    if (Object.keys(normalizado).length > 0) {
      setDraft((d) => ({ ...d, ...normalizado }));
    }
    setDraftSalvo((prev) => ({ ...prev, ...pickCampos(gravado, secao.campos) }));
    toast.success(`${secao.label} salva`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  // Uma seção que não vale para este tipo de local não pode contar contra o
  // progresso nem virar atalho para o nada - mesmo recorte do rail do editor.
  const secoes = secoesAplicaveis(draft);
  const pendentesPerfil = secoes.filter((s) => s.pendente(draft));
  const checklistConcluido = pendentesPerfil.length === 0 && estabAtivo && seloAzul;
  const mostrarChecklist = !checklistConcluido && !checklistOculto;

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
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {seloAzul && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">
                <Award className="h-3.5 w-3.5" /> Selo Azul ativo
              </span>
            )}
            {!mostrarChecklist && !checklistConcluido && (
              <button
                onClick={reabrirChecklist}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-white border text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
              >
                <Sparkles className="h-4 w-4" /> Retomar configuração
              </button>
            )}
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-white border text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              <Building2 className="h-4 w-4" /> Editar perfil
            </button>
          </div>

          {mostrarChecklist && (
            <ChecklistOnboarding
              totalSecoes={secoes.length}
              pendentes={pendentesPerfil}
              estabAtivo={estabAtivo}
              seloAzul={seloAzul}
              querSelo={querSelo}
              querSeloEm={querSeloEm}
              solicitandoSelo={solicitandoSelo}
              onCompletar={(secao) => {
                if (secao) setSecaoAtiva(secao);
                setEditando(true);
              }}
              onSolicitarSelo={() => void solicitarSeloAzul()}
              onOcultar={ocultarChecklist}
            />
          )}

          {/* O painel operacional lê reservas, que a RLS só devolve para local
              ativo - antes disso não há o que mostrar, e o checklist acima já
              explica que o cadastro está em análise. */}
          {estabAtivo && estabId ? (
            <PainelOperacional estabId={estabId} />
          ) : (
            <div className="rounded-2xl border border-dashed bg-white px-6 py-12 text-center">
              <Clock className="mx-auto h-8 w-8 text-primary/40" />
              <h2 className="mt-3 font-display font-bold text-lg text-primary">
                Seu painel de reservas abre com a publicação
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-foreground/60">
                {estabId
                  ? "Assim que a análise do cadastro terminar, as reservas e a agenda das famílias aparecem aqui."
                  : "Complete a seção Identidade para criarmos a página do seu local."}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
