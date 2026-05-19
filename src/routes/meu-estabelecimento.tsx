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
import { LogOut, Loader2, Building2, ShieldCheck, Save, ArrowLeft } from "lucide-react";
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
      setDraft({
        nome: estab?.nome ?? "",
        tipo: (estab?.tipo as string) ?? prof?.tipo ?? "",
        endereco: estab?.endereco ?? prof?.endereco ?? "",
        cidade: estab?.cidade ?? prof?.cidade ?? "",
        estado: estab?.estado ?? prof?.estado ?? "",
        website: estab?.website ?? prof?.website ?? "",
        num_colaboradores: prof?.num_colaboradores ?? "",
        estrutura: (prof?.estrutura as Estrutura) ?? {},
        iniciativa_atual: prof?.iniciativa_atual ?? "",
        num_capacitacao: prof?.num_capacitacao ?? "",
        contato_preferido: prof?.contato_preferido ?? "",
        observacoes: prof?.observacoes ?? "",
      });
      setCarregando(false);
    })();
  }, [user, loading, role, pathname, navigate]);

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
            onCompletar={() => setEditando(true)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

function Dashboard({
  perfilCompleto,
  onCompletar,
}: {
  perfilCompleto: boolean;
  onCompletar: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white p-6 sm:p-8 shadow-sm">
        <h1 className="font-display font-bold text-2xl sm:text-3xl">
          Seu cadastro está em análise 💙
        </h1>
        <p className="mt-2 text-white/90 max-w-2xl">
          Em breve nossa equipe entrará em contato.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Card 1 - Perfil */}
        <div className="bg-white border rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-azul-claro flex items-center justify-center text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="font-display font-bold text-lg text-primary">
              {perfilCompleto ? "Perfil completo ✓" : "Complete o perfil do seu local"}
            </h2>
          </div>
          {perfilCompleto ? (
            <>
              <p className="mt-3 text-sm text-foreground/80 flex-1">
                Suas informações foram salvas e estão disponíveis para a equipe de auditoria.
              </p>
              <Button
                variant="outline"
                onClick={onCompletar}
                className="mt-4 self-start border-primary text-primary hover:bg-azul-claro"
              >
                Ver ou editar →
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-foreground/80 flex-1">
                Quanto mais informações, mais rápido passamos pela auditoria.
              </p>
              <Button
                onClick={onCompletar}
                className="mt-4 self-start bg-secondary hover:bg-secondary/90 text-white"
              >
                Completar perfil →
              </Button>
            </>
          )}
        </div>

        {/* Card 2 - Selo Azul */}
        <div className="bg-white border rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-azul-claro flex items-center justify-center text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="font-display font-bold text-lg text-primary">
              Certificação Selo Azul
            </h2>
          </div>
          <p className="mt-3 text-sm text-foreground/80 flex-1">
            Nossa equipe avaliará seu estabelecimento e entrará em contato sobre o processo
            de certificação.
          </p>
          <span className="mt-4 self-start inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-azul-claro text-primary">
            Aguardando contato
          </span>
        </div>
      </div>
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
