import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LogOut,
  Loader2,
  Building2,
  ShieldCheck,
  Save,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-turismo-azul.svg";

export const Route = createFileRoute("/meu-estabelecimento")({
  head: () => ({ meta: [{ title: "Meu estabelecimento · Turismo Azul" }] }),
  component: MeuEstabelecimentoPage,
});

const TIPOS = ["Hotel", "Pousada", "Resort", "Restaurante", "Parque", "Outro"];
const COLAB_OPTS = ["1-5", "6-15", "16-30", "31-50", "50+"];
const ESTRUTURA_ITEMS: Array<[string, string]> = [
  ["quartos_silenciosos", "Quartos silenciosos disponíveis"],
  ["iluminacao_regulavel", "Iluminação regulável nos quartos"],
  ["area_escape_sensorial", "Área de descanso/escape sensorial"],
  ["cardapio_seletividade", "Cardápio com opções para seletividade"],
  ["comunicacao_visual", "Comunicação visual no estabelecimento"],
  ["entrada_sem_filas", "Entrada sem filas disponível"],
  ["piscina_horarios_reservados", "Área de piscina com horários reservados"],
  ["equipe_treinada_tea", "Equipe com algum treinamento em TEA"],
];

type Estrutura = Record<string, boolean>;

interface PerfilDraft {
  // basics → estabelecimentos + estabelecimento_profiles
  nome: string;
  tipo: string;
  endereco: string;
  cidade: string;
  estado: string;
  website: string;
  num_colaboradores: string;
  recebe_grupos_escolares_tea: boolean;
  // section 2
  estrutura: Estrutura;
  // section 3
  iniciativa_atual: string;
  num_capacitacao: string;
  contato_preferido: string;
  observacoes: string;
}

const EMPTY: PerfilDraft = {
  nome: "",
  tipo: "",
  endereco: "",
  cidade: "",
  estado: "",
  website: "",
  num_colaboradores: "",
  recebe_grupos_escolares_tea: false,
  estrutura: {},
  iniciativa_atual: "",
  num_capacitacao: "",
  contato_preferido: "",
  observacoes: "",
};

function MeuEstabelecimentoPage() {
  const { user, loading, signOut, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [draft, setDraft] = useState<PerfilDraft>(EMPTY);
  const [perfilCompleto, setPerfilCompleto] = useState(false);
  const [estabId, setEstabId] = useState<string | null>(null);
  const [nomeResp, setNomeResp] = useState<string | null>(null);
  const [seloAzul, setSeloAzul] = useState(false);
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
      const [profRes, estabRes] = await Promise.all([
        supabase.from("estabelecimento_profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("estabelecimentos").select("*").eq("owner_user_id", user.id).maybeSingle(),
      ]);
      const prof = profRes.data;
      const estab = estabRes.data;
      setEstabId(estab?.id ?? null);
      setNomeResp(prof?.nome_responsavel ?? null);
      setPerfilCompleto(prof?.perfil_completo ?? false);
      setSeloAzul(!!estab?.selo_azul);
      setQuerSelo(!!estab?.quer_selo_azul);
      setQuerSeloEm(estab?.quer_selo_azul_em ?? null);
      setDraft({
        nome: estab?.nome ?? "",
        tipo: (estab?.tipo as string) ?? prof?.tipo ?? "",
        endereco: estab?.endereco ?? prof?.endereco ?? "",
        cidade: estab?.cidade ?? prof?.cidade ?? "",
        estado: estab?.estado ?? prof?.estado ?? "",
        website: estab?.website ?? prof?.website ?? "",
        num_colaboradores: prof?.num_colaboradores ?? "",
        recebe_grupos_escolares_tea: !!estab?.recebe_grupos_escolares_tea,
        estrutura: (prof?.estrutura as Estrutura) ?? {},
        iniciativa_atual: prof?.iniciativa_atual ?? "",
        num_capacitacao: prof?.num_capacitacao ?? "",
        contato_preferido: prof?.contato_preferido ?? "",
        observacoes: prof?.observacoes ?? "",
      });
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

  async function salvar() {
    if (!user) return;
    if (!draft.nome.trim() || !draft.tipo || !draft.cidade.trim() || !draft.estado.trim()) {
      toast.error("Preencha nome, tipo, cidade e estado.");
      return;
    }
    setSalvando(true);

    // 1. Update estabelecimento_profiles
    const { error: profErr } = await supabase
      .from("estabelecimento_profiles")
      .update({
        endereco: draft.endereco || null,
        website: draft.website || null,
        tipo: draft.tipo,
        cidade: draft.cidade,
        estado: draft.estado.toUpperCase(),
        num_colaboradores: draft.num_colaboradores || null,
        iniciativa_atual: draft.iniciativa_atual || null,
        num_capacitacao: draft.num_capacitacao || null,
        contato_preferido: draft.contato_preferido || null,
        observacoes: draft.observacoes || null,
        estrutura: draft.estrutura,
        perfil_completo: true,
      })
      .eq("id", user.id);

    // 2. Sync basics into estabelecimentos when row exists
    if (!profErr && estabId) {
      await supabase
        .from("estabelecimentos")
        .update({
          nome: draft.nome,
          endereco: draft.endereco || null,
          cidade: draft.cidade,
          estado: draft.estado.toUpperCase(),
          website: draft.website || null,
          recebe_grupos_escolares_tea:
            draft.tipo === "passeio_educativo" ? draft.recebe_grupos_escolares_tea : false,
        })
        .eq("id", estabId);
    }

    setSalvando(false);
    if (profErr) {
      toast.error("Erro ao salvar: " + profErr.message);
      return;
    }
    setPerfilCompleto(true);
    setEditando(false);
    toast.success("Perfil salvo!");
  }

  if (loading || carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  const primeiroNome = (nomeResp ?? user?.email?.split("@")[0] ?? "").split(" ")[0];

  return (
    <div className="min-h-screen flex flex-col bg-azul-claro/20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/meu-estabelecimento" className="flex items-center gap-3">
            <img src={logo} alt="Turismo Azul" className="h-8 w-auto" />
            <span className="hidden sm:inline text-sm text-foreground/80">
              Olá, <strong className="text-primary">{primeiroNome || "parceiro"}</strong>
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 text-sm">
            <button
              onClick={() => setEditando(false)}
              className="px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              Meu Perfil
            </button>
            <button
              onClick={() => setEditando(true)}
              className="px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              Meu Estabelecimento
            </button>
            <button
              onClick={() => void signOut().then(() => navigate({ to: "/" }))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {editando ? (
          <FormularioPerfil
            draft={draft}
            set={set}
            onCancel={() => setEditando(false)}
            onSave={salvar}
            salvando={salvando}
          />
        ) : (
          <Dashboard
            perfilCompleto={perfilCompleto}
            draft={draft}
            seloAzul={seloAzul}
            querSelo={querSelo}
            querSeloEm={querSeloEm}
            solicitandoSelo={solicitandoSelo}
            onCompletar={() => setEditando(true)}
            onSolicitarSelo={() => void solicitarSeloAzul()}
          />
        )}
      </main>
      <Footer />
    </div>
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
  onCompletar: () => void;
  onSolicitarSelo: () => void;
}) {
  // Cálculo de progresso do perfil (campos chave)
  const camposChave: Array<[string, boolean]> = [
    ["Nome", !!draft.nome],
    ["Tipo", !!draft.tipo],
    ["Endereço", !!draft.endereco],
    ["Cidade", !!draft.cidade],
    ["Estado", !!draft.estado],
    ["Website", !!draft.website],
    ["Contato preferido", !!draft.contato_preferido],
    ["Iniciativa atual", !!draft.iniciativa_atual],
  ];
  const preenchidos = camposChave.filter(([, v]) => v).length;
  const progresso = Math.round((preenchidos / camposChave.length) * 100);

  const dataSolicitacao = querSeloEm
    ? new Date(querSeloEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Banner compacto */}
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

        {/* Barra de progresso */}
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
      </div>

      {/* Grid de 3 cards principais */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Card 1 - Perfil */}
        <div className="bg-white border rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-azul-claro flex items-center justify-center text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="font-display font-bold text-base text-primary">
              Perfil do local
            </h2>
          </div>
          {perfilCompleto ? (
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
                onClick={onCompletar}
                className="mt-3 self-start border-primary text-primary hover:bg-azul-claro"
              >
                Ver ou editar
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-xs text-foreground/70 flex-1">
                Faltam {camposChave.length - preenchidos} de {camposChave.length} campos-chave.
              </p>
              <Button
                size="sm"
                onClick={onCompletar}
                className="mt-3 self-start bg-secondary hover:bg-secondary/90 text-white"
              >
                Completar perfil <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}
        </div>

        {/* Card 2 - Selo Azul (status atual) */}
        <div className="bg-white border rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-azul-claro flex items-center justify-center text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="font-display font-bold text-base text-primary">
              Selo Azul
            </h2>
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

        {/* Card 3 - Quero o Selo Azul */}
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

      {/* Timeline horizontal - O que vem pela frente */}
      <TimelineFluxo
        perfilCompleto={perfilCompleto}
        querSelo={querSelo}
        seloAzul={seloAzul}
      />
    </div>
  );
}


function FormularioPerfil({
  draft,
  set,
  onCancel,
  onSave,
  salvando,
}: {
  draft: PerfilDraft;
  set: <K extends keyof PerfilDraft>(k: K, v: PerfilDraft[K]) => void;
  onCancel: () => void;
  onSave: () => void;
  salvando: boolean;
}) {
  function togEstrutura(key: string) {
    set("estrutura", { ...draft.estrutura, [key]: !draft.estrutura[key] });
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onCancel}
        className="inline-flex items-center text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </button>

      <div className="bg-white border rounded-2xl p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-display font-bold text-primary">
          Perfil do estabelecimento
        </h1>

        {/* Seção 1 */}
        <Secao titulo="1. Informações básicas">
          <Field label="Nome do estabelecimento" required>
            <Input value={draft.nome} onChange={(e) => set("nome", e.target.value)} maxLength={120} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Tipo" required>
              <select
                value={draft.tipo}
                onChange={(e) => set("tipo", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white h-10"
              >
                <option value="">Selecione…</option>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Número de colaboradores">
              <select
                value={draft.num_colaboradores}
                onChange={(e) => set("num_colaboradores", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white h-10"
              >
                <option value="">Selecione…</option>
                {COLAB_OPTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Endereço completo">
            <Input value={draft.endereco} onChange={(e) => set("endereco", e.target.value)} maxLength={200} />
          </Field>
          <div className="grid sm:grid-cols-[1fr_120px] gap-4">
            <Field label="Cidade" required>
              <Input value={draft.cidade} onChange={(e) => set("cidade", e.target.value)} maxLength={80} />
            </Field>
            <Field label="Estado (UF)" required>
              <Input
                value={draft.estado}
                maxLength={2}
                onChange={(e) => set("estado", e.target.value.toUpperCase())}
              />
            </Field>
          </div>
          <Field label="Website (opcional)">
            <Input
              type="url"
              placeholder="https://"
              value={draft.website}
              onChange={(e) => set("website", e.target.value)}
              maxLength={200}
            />
          </Field>
          {draft.tipo === "passeio_educativo" && (
            <label className="flex items-start gap-3 p-3 border rounded-lg bg-azul-claro/20 cursor-pointer hover:bg-azul-claro/30">
              <Checkbox
                checked={draft.recebe_grupos_escolares_tea}
                onCheckedChange={(v) => set("recebe_grupos_escolares_tea", v === true)}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-medium">Recebe grupos escolares com alunos TEA</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Se marcado, exibimos um selo discreto na sua ficha pública para famílias e escolas.
                </span>
              </span>
            </label>
          )}
        </Secao>

        {/* Seção 2 */}
        <Secao titulo="2. Estrutura física">
          <p className="text-sm text-muted-foreground -mt-2">Marque o que o local já possui.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {ESTRUTURA_ITEMS.map(([k, label]) => (
              <label
                key={k}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-azul-claro/30"
              >
                <Checkbox
                  checked={!!draft.estrutura[k]}
                  onCheckedChange={() => togEstrutura(k)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </Secao>

        {/* Seção 3 */}
        <Secao titulo="3. Disponibilidade para certificação">
          <Field label="Já tem iniciativa de inclusão para autistas?">
            <RadioList
              name="iniciativa"
              value={draft.iniciativa_atual}
              onChange={(v) => set("iniciativa_atual", v)}
              options={[
                ["estruturado", "Sim, temos algo estruturado"],
                ["informal", "Temos adaptações informais"],
                ["queremos_comecar", "Ainda não, mas queremos começar"],
                ["sem_direcao", "Não sei por onde começar"],
              ]}
            />
          </Field>
          <Field label="Quantos colaboradores passariam pela capacitação?">
            <select
              value={draft.num_capacitacao}
              onChange={(e) => set("num_capacitacao", e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-input rounded-md text-sm bg-white h-10"
            >
              <option value="">Selecione…</option>
              {COLAB_OPTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Melhor forma de contato">
            <RadioList
              name="contato"
              value={draft.contato_preferido}
              onChange={(v) => set("contato_preferido", v)}
              options={[
                ["whatsapp", "WhatsApp"],
                ["email", "E-mail"],
                ["ligacao", "Ligação"],
              ]}
              inline
            />
          </Field>
          <Field label="Observações adicionais">
            <Textarea
              rows={3}
              value={draft.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              maxLength={1000}
            />
          </Field>
        </Secao>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onCancel} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={salvando}
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar perfil
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-primary">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display font-bold text-lg text-primary border-b pb-2">{titulo}</h2>
      {children}
    </section>
  );
}

function RadioList({
  name,
  value,
  onChange,
  options,
  inline,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
  inline?: boolean;
}) {
  return (
    <div className={inline ? "flex flex-wrap gap-3" : "space-y-2"}>
      {options.map(([v, label]) => (
        <label
          key={v}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-azul-claro/30"
        >
          <input
            type="radio"
            name={name}
            value={v}
            checked={value === v}
            onChange={() => onChange(v)}
            className="accent-primary"
          />
          <span>{label}</span>
        </label>
      ))}
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

  // current step = first not done; if all done → last
  const currentIdx = steps.findIndex((s) => !s.done);
  const activeIdx = currentIdx === -1 ? steps.length - 1 : currentIdx;

  return (
    <div className="bg-white border rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-lg text-primary">
          O que vem pela frente
        </h3>
        <span className="text-xs text-foreground/60">
          Etapa {activeIdx + 1} de {steps.length}
        </span>
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Linha de fundo */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200" />
          {/* Linha de progresso */}
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
                        isActive ? "text-primary" : isDone ? "text-foreground" : "text-foreground/60",
                      ].join(" ")}
                    >
                      {s.title}
                    </div>
                    <div className="text-xs text-foreground/60 mt-1 leading-snug">
                      {s.desc}
                    </div>
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

      {/* Mobile: vertical */}
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
                  <div className={`w-0.5 flex-1 mt-1 ${isDone ? "bg-[#c9a84c]" : "bg-slate-200"}`} />
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
