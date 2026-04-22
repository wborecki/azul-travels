import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ESTADOS_BR } from "@/lib/brazil";
import { Logo } from "@/components/Logo";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  VolumeX,
  Lightbulb,
  Shirt,
  Wind,
  UsersRound,
  MessageSquare,
  Image as ImageIcon,
  Hand,
  DoorOpen,
  FastForward,
  Utensils,
  Home,
  Brain,
  Waves,
  Trees,
  PawPrint,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastre-se — Turismo Azul" }] }),
  component: Cadastro,
});

// ──────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────

interface Step1 {
  nome: string;
  email: string;
  senha: string;
  senha2: string;
  telefone: string;
  cidade: string;
  estado: string;
  aceiteTermos: boolean;
}

type Genero = "menino" | "menina" | "nao_dizer" | "";
interface Step2 {
  nome_autista: string;
  idade: string;
  genero: Genero;
  nivel_tea: "leve" | "moderado" | "severo" | "";
  diagnostico_formal: boolean | null;
}

interface Step3 {
  sensivel_sons: boolean;
  sensivel_luz: boolean;
  sensivel_texturas: boolean;
  sensivel_cheiros: boolean;
  sensivel_multidao: boolean;
  comunicacao_verbal: boolean;
  usa_caa: boolean;
  usa_libras: boolean;
  precisa_checkin_antecipado: boolean;
  precisa_fila_prioritaria: boolean;
  precisa_cardapio_visual: boolean;
  precisa_sala_sensorial: boolean;
  precisa_concierge_tea: boolean;
  gosta_atividades_agua: boolean;
  gosta_natureza: boolean;
  gosta_animais: boolean;
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE = /^\(\d{2}\) \d{4,5}-\d{4}$/;

function maskTelefone(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

type ForcaSenha = { score: 0 | 1 | 2 | 3; label: string; cor: string };

function avaliarSenha(senha: string): ForcaSenha {
  if (!senha) return { score: 0, label: "", cor: "bg-muted" };
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (/\d/.test(senha) && /[a-zA-Z]/.test(senha)) pontos++;
  if (senha.length >= 12 || /[^a-zA-Z0-9]/.test(senha)) pontos++;
  if (pontos <= 1) return { score: 1, label: "Fraca", cor: "bg-red-500" };
  if (pontos === 2) return { score: 2, label: "Média", cor: "bg-amber-500" };
  return { score: 3, label: "Forte", cor: "bg-emerald-600" };
}

const ESTADOS_ORDENADOS = [...ESTADOS_BR].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

// ──────────────────────────────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────────────────────────────

function Cadastro() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [emailDuplicado, setEmailDuplicado] = useState(false);
  const [checandoEmail, setChecandoEmail] = useState(false);

  const [s1, setS1] = useState<Step1>({
    nome: "",
    email: "",
    senha: "",
    senha2: "",
    telefone: "",
    cidade: "",
    estado: "",
    aceiteTermos: false,
  });
  const [s2, setS2] = useState<Step2>({
    nome_autista: "",
    idade: "",
    genero: "",
    nivel_tea: "",
    diagnostico_formal: null,
  });
  const [s3, setS3] = useState<Step3>({
    sensivel_sons: false,
    sensivel_luz: false,
    sensivel_texturas: false,
    sensivel_cheiros: false,
    sensivel_multidao: false,
    comunicacao_verbal: false,
    usa_caa: false,
    usa_libras: false,
    precisa_checkin_antecipado: false,
    precisa_fila_prioritaria: false,
    precisa_cardapio_visual: false,
    precisa_sala_sensorial: false,
    precisa_concierge_tea: false,
    gosta_atividades_agua: false,
    gosta_natureza: false,
    gosta_animais: false,
  });
  const [notasAdicionais, setNotasAdicionais] = useState("");

  const forca = useMemo(() => avaliarSenha(s1.senha), [s1.senha]);

  // Validação Step 1
  const s1Valido = useMemo(() => {
    if (s1.nome.trim().length < 3) return false;
    if (!EMAIL_RE.test(s1.email.trim())) return false;
    if (s1.senha.length < 8 || !/\d/.test(s1.senha)) return false;
    if (s1.senha !== s1.senha2) return false;
    if (s1.telefone && !TEL_RE.test(s1.telefone)) return false;
    if (!s1.cidade.trim()) return false;
    if (!s1.estado) return false;
    if (!s1.aceiteTermos) return false;
    return true;
  }, [s1]);

  const s2Valido =
    s2.nome_autista.trim().length > 0 &&
    !!s2.idade &&
    Number(s2.idade) >= 1 &&
    Number(s2.idade) <= 30 &&
    !!s2.nivel_tea;

  // ── Step 1 → 2: cria usuário no Supabase Auth ────────────────────
  const submeterStep1 = async () => {
    if (!s1Valido) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    setEmailDuplicado(false);
    const redirectUrl = `${window.location.origin}/minha-conta`;
    const { data, error } = await supabase.auth.signUp({
      email: s1.email.trim(),
      password: s1.senha,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome_responsavel: s1.nome,
          telefone: s1.telefone,
          cidade: s1.cidade,
          estado: s1.estado,
        },
      },
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        setEmailDuplicado(true);
        toast.error("Este e-mail já tem cadastro.");
        return;
      }
      toast.error(error.message);
      return;
    }
    if (!data.user) {
      toast.error("Não foi possível criar a conta. Tente novamente.");
      return;
    }
    setStep(2);
  };

  const checarEmailDuplicado = async () => {
    if (!EMAIL_RE.test(s1.email.trim())) return;
    setChecandoEmail(true);
    // Heurística: tenta resetPassword. Se retornar sucesso, e-mail existe.
    // (Supabase não expõe endpoint público de "exists?" sem service role.)
    // Como fallback, deixamos a validação real para o submit do step 1.
    setChecandoEmail(false);
  };

  // ── Step 4: salvar perfil sensorial ─────────────────────────────
  const finalizar = async () => {
    setLoading(true);
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id;
    if (!userId) {
      setLoading(false);
      toast.error("Sessão expirou. Entre novamente.");
      navigate({ to: "/login" });
      return;
    }
    // garantir cidade/estado no perfil (caso fluxo Google)
    await supabase
      .from("familia_profiles")
      .update({ cidade: s1.cidade || null, estado: s1.estado || null })
      .eq("id", userId);

    const { error } = await supabase.from("perfil_sensorial").insert({
      familia_id: userId,
      nome_autista: s2.nome_autista,
      idade: s2.idade ? Number(s2.idade) : null,
      nivel_tea: s2.nivel_tea as "leve" | "moderado" | "severo",
      sensivel_sons: s3.sensivel_sons,
      sensivel_luz: s3.sensivel_luz,
      sensivel_texturas: s3.sensivel_texturas,
      sensivel_cheiros: s3.sensivel_cheiros,
      sensivel_multidao: s3.sensivel_multidao,
      comunicacao_verbal: s3.comunicacao_verbal,
      usa_caa: s3.usa_caa,
      usa_libras: s3.usa_libras,
      precisa_checkin_antecipado: s3.precisa_checkin_antecipado,
      precisa_fila_prioritaria: s3.precisa_fila_prioritaria,
      precisa_cardapio_visual: s3.precisa_cardapio_visual,
      precisa_sala_sensorial: s3.precisa_sala_sensorial,
      precisa_concierge_tea: s3.precisa_concierge_tea,
      gosta_atividades_agua: s3.gosta_atividades_agua,
      gosta_natureza: s3.gosta_natureza,
      gosta_animais: s3.gosta_animais,
      notas_adicionais: notasAdicionais.trim() || null,
    });
    setLoading(false);
    if (error) {
      console.error(error);
      toast.error("Não foi possível salvar o perfil. Tente de novo.");
      return;
    }
    setStep(4);
  };

  // ── Filtros pré-aplicados para /explorar baseado no perfil ───────
  const recursosParaFiltro = useMemo(() => {
    const r: string[] = [];
    if (s3.precisa_sala_sensorial) r.push("tem_sala_sensorial");
    if (s3.precisa_concierge_tea) r.push("tem_concierge_tea");
    if (s3.precisa_checkin_antecipado) r.push("tem_checkin_antecipado");
    if (s3.precisa_fila_prioritaria) r.push("tem_fila_prioritaria");
    if (s3.precisa_cardapio_visual) r.push("tem_cardapio_visual");
    if (s3.usa_caa) r.push("tem_caa");
    return r;
  }, [s3]);

  // ── Render shell (logo + barra de progresso) ────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <div className="mx-auto max-w-[560px] px-4 py-8 sm:py-12">
        <div className="flex justify-center mb-8">
          <Link to="/" aria-label="Turismo Azul">
            <Logo />
          </Link>
        </div>

        {/* Barra de progresso */}
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          {step > 1 && step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, (s - 1) as 1 | 2 | 3))}
              className="inline-flex items-center gap-1 hover:text-primary transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
          ) : (
            <span />
          )}
          <span>Passo {step} de 4</span>
        </div>
        <ProgressBar step={step} />

        <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          {step === 1 && (
            <Step1View
              s1={s1}
              setS1={setS1}
              loading={loading}
              showSenha={showSenha}
              setShowSenha={setShowSenha}
              forca={forca}
              emailDuplicado={emailDuplicado}
              setEmailDuplicado={setEmailDuplicado}
              checandoEmail={checandoEmail}
              checarEmailDuplicado={checarEmailDuplicado}
              s1Valido={s1Valido}
              onSubmit={submeterStep1}
              onGoogle={async () => {
                setLoading(true);
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: `${window.location.origin}/cadastro`,
                });
                if (result.error) {
                  setLoading(false);
                  toast.error("Não foi possível cadastrar com Google.");
                  return;
                }
                if (result.redirected) return;
                setLoading(false);
                setStep(2);
              }}
            />
          )}

          {step === 2 && (
            <Step2View s2={s2} setS2={setS2} valido={s2Valido} onNext={() => setStep(3)} />
          )}

          {step === 3 && (
            <Step3View
              s3={s3}
              setS3={setS3}
              loading={loading}
              onNext={finalizar}
            />
          )}

          {step === 4 && (
            <Step4View
              nomeResponsavel={s1.nome.split(" ")[0] || "você"}
              s2={s2}
              s3={s3}
              notas={notasAdicionais}
              setNotas={setNotasAdicionais}
              onSalvarNotas={async () => {
                if (!notasAdicionais.trim()) return;
                const { data: sess } = await supabase.auth.getSession();
                const uid = sess.session?.user.id;
                if (!uid) return;
                await supabase
                  .from("perfil_sensorial")
                  .update({ notas_adicionais: notasAdicionais.trim() })
                  .eq("familia_id", uid);
              }}
              recursosParaFiltro={recursosParaFiltro}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Barra de progresso
// ──────────────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4].map((n, i) => {
        const concluido = n < step;
        const ativo = n === step;
        return (
          <div key={n} className="flex-1 flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                concluido ? "bg-primary" : ativo ? "bg-secondary ring-4 ring-secondary/20" : "bg-gray-300"
              }`}
            />
            {i < 3 && (
              <div
                className={`flex-1 h-0.5 ${n < step ? "bg-primary" : "bg-gray-300"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// STEP 1
// ──────────────────────────────────────────────────────────────────────

function Step1View({
  s1,
  setS1,
  loading,
  showSenha,
  setShowSenha,
  forca,
  emailDuplicado,
  setEmailDuplicado,
  checandoEmail,
  checarEmailDuplicado,
  s1Valido,
  onSubmit,
  onGoogle,
}: {
  s1: Step1;
  setS1: (s: Step1) => void;
  loading: boolean;
  showSenha: boolean;
  setShowSenha: (v: boolean) => void;
  forca: ForcaSenha;
  emailDuplicado: boolean;
  setEmailDuplicado: (v: boolean) => void;
  checandoEmail: boolean;
  checarEmailDuplicado: () => void;
  s1Valido: boolean;
  onSubmit: () => void;
  onGoogle: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary">Vamos começar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seus dados de contato. Leva menos de 2 minutos.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onGoogle}
        disabled={loading}
        className="w-full gap-2 bg-white border-gray-300 text-[#374151] hover:bg-gray-50 h-11"
      >
        <GoogleIcon />
        Cadastrar com Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou com e-mail</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {emailDuplicado && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          <span className="font-semibold text-amber-900">Este e-mail já tem cadastro.</span>{" "}
          <Link to="/login" className="text-secondary font-semibold hover:underline">
            Quer entrar? →
          </Link>
        </div>
      )}

      <Field label="Nome completo" required>
        <Input
          value={s1.nome}
          onChange={(e) => setS1({ ...s1, nome: e.target.value })}
          placeholder="Como você se chama?"
          autoComplete="name"
        />
      </Field>

      <Field label="E-mail" required>
        <Input
          type="email"
          value={s1.email}
          onChange={(e) => {
            setEmailDuplicado(false);
            setS1({ ...s1, email: e.target.value });
          }}
          onBlur={checarEmailDuplicado}
          placeholder="seu@email.com"
          autoComplete="email"
        />
        {checandoEmail && (
          <p className="text-xs text-muted-foreground mt-1">Conferindo…</p>
        )}
      </Field>

      <Field label="Senha" required>
        <div className="relative">
          <Input
            type={showSenha ? "text" : "password"}
            value={s1.senha}
            onChange={(e) => setS1({ ...s1, senha: e.target.value })}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowSenha(!showSenha)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1"
            aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {s1.senha && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${forca.cor}`}
                style={{ width: `${(forca.score / 3) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-12 text-right">{forca.label}</span>
          </div>
        )}
      </Field>

      <Field label="Confirmar senha" required>
        <Input
          type={showSenha ? "text" : "password"}
          value={s1.senha2}
          onChange={(e) => setS1({ ...s1, senha2: e.target.value })}
          placeholder="Repita a senha"
          autoComplete="new-password"
        />
        {s1.senha2 && s1.senha !== s1.senha2 && (
          <p className="text-xs text-destructive mt-1">As senhas não conferem.</p>
        )}
      </Field>

      <Field label="Telefone (opcional)">
        <Input
          value={s1.telefone}
          onChange={(e) => setS1({ ...s1, telefone: maskTelefone(e.target.value) })}
          placeholder="(00) 00000-0000"
          inputMode="tel"
          autoComplete="tel"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Cidade" required>
          <Input
            value={s1.cidade}
            onChange={(e) => setS1({ ...s1, cidade: e.target.value })}
            placeholder="Sua cidade"
            autoComplete="address-level2"
          />
        </Field>
        <Field label="Estado" required>
          <Select value={s1.estado} onValueChange={(v) => setS1({ ...s1, estado: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_ORDENADOS.map((e) => (
                <SelectItem key={e.sigla} value={e.sigla}>
                  {e.sigla} — {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <label className="flex items-start gap-3 text-sm pt-1">
        <Checkbox
          checked={s1.aceiteTermos}
          onCheckedChange={(v) => setS1({ ...s1, aceiteTermos: v === true })}
          className="mt-0.5"
        />
        <span className="text-muted-foreground">
          Concordo com os{" "}
          <Link to="/termos" target="_blank" className="text-secondary font-medium hover:underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link
            to="/privacidade"
            target="_blank"
            className="text-secondary font-medium hover:underline"
          >
            Política de Privacidade
          </Link>{" "}
          do Turismo Azul.
        </span>
      </label>

      <Button
        onClick={onSubmit}
        disabled={!s1Valido || loading}
        className="w-full bg-secondary hover:bg-secondary/90 text-white h-11"
      >
        {loading ? "Criando conta…" : "Próximo"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link to="/login" className="text-secondary font-semibold hover:underline">
          Entrar →
        </Link>
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// STEP 2
// ──────────────────────────────────────────────────────────────────────

const NIVEIS = [
  {
    v: "leve" as const,
    t: "Leve (Nível 1)",
    d: "Fala bem, é independente na maioria das situações, mas pode ter dificuldades sociais e sensoriais.",
  },
  {
    v: "moderado" as const,
    t: "Moderado (Nível 2)",
    d: "Precisa de apoio em várias situações do dia a dia. Pode ter fala limitada ou dificuldades mais intensas.",
  },
  {
    v: "severo" as const,
    t: "Severo (Nível 3)",
    d: "Precisa de suporte constante. Comunicação pode ser não verbal ou muito limitada.",
  },
];

function Step2View({
  s2,
  setS2,
  valido,
  onNext,
}: {
  s2: Step2;
  setS2: (s: Step2) => void;
  valido: boolean;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary">Fale sobre o seu filho</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Essas informações ajudam a encontrar os lugares certos pra ele. Você pode editar depois.
        </p>
      </div>

      <div className="rounded-lg bg-teal-claro/60 border border-secondary/20 p-3 text-sm text-primary">
        Você pode cadastrar mais de uma criança depois, na área Minha Conta. Aqui vamos começar com
        uma.
      </div>

      <Field label="Nome (como a família chama)" required>
        <Input
          value={s2.nome_autista}
          onChange={(e) => setS2({ ...s2, nome_autista: e.target.value })}
          placeholder="Como vocês chamam ele ou ela?"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Pode ser apelido. Só usamos aqui dentro.
        </p>
      </Field>

      <Field label="Idade" required>
        <Input
          type="number"
          min={1}
          max={30}
          value={s2.idade}
          onChange={(e) => setS2({ ...s2, idade: e.target.value })}
          placeholder="Quantos anos tem?"
        />
      </Field>

      <Field label="É menino ou menina?">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { v: "menino", t: "Menino" },
              { v: "menina", t: "Menina" },
              { v: "nao_dizer", t: "Prefiro não dizer" },
            ] as const
          ).map((g) => (
            <button
              key={g.v}
              type="button"
              onClick={() => setS2({ ...s2, genero: g.v })}
              className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
                s2.genero === g.v
                  ? "border-secondary bg-teal-claro text-primary"
                  : "border-border hover:border-secondary/50 text-muted-foreground"
              }`}
            >
              {g.t}
            </button>
          ))}
        </div>
      </Field>

      <div>
        <Label className="text-sm font-medium">
          Nível do diagnóstico TEA <span className="text-destructive">*</span>
        </Label>
        <div className="mt-2 space-y-2">
          {NIVEIS.map((n) => (
            <button
              key={n.v}
              type="button"
              onClick={() => setS2({ ...s2, nivel_tea: n.v })}
              className={`w-full text-left p-4 rounded-xl border-2 transition ${
                s2.nivel_tea === n.v
                  ? "border-secondary bg-teal-claro/40"
                  : "border-border hover:border-secondary/40 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    s2.nivel_tea === n.v ? "border-secondary bg-secondary" : "border-gray-300"
                  }`}
                >
                  {s2.nivel_tea === n.v && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <div className="font-semibold text-primary">{n.t}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{n.d}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="mt-2 text-sm text-secondary hover:underline"
            >
              O que são os níveis TEA?
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Níveis de suporte do TEA</DialogTitle>
              <DialogDescription>
                A classificação por níveis (1, 2 e 3) indica o grau de suporte que a pessoa
                autista precisa no dia a dia, não a "intensidade" do autismo. É a forma usada
                pelo DSM-5, principal manual diagnóstico.
              </DialogDescription>
            </DialogHeader>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>
                <strong className="text-primary">Nível 1:</strong> requer suporte. Em geral é
                independente, mas pode ter dificuldade com mudanças e interações sociais.
              </li>
              <li>
                <strong className="text-primary">Nível 2:</strong> requer suporte substancial.
                Comunicação verbal e não-verbal limitadas, comportamentos repetitivos visíveis.
              </li>
              <li>
                <strong className="text-primary">Nível 3:</strong> requer suporte muito
                substancial. Comunicação severamente limitada, grande dificuldade com mudanças.
              </li>
            </ul>
          </DialogContent>
        </Dialog>
      </div>

      <Field label="Tem diagnóstico formal? (opcional)">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { v: true, t: "Sim, tem laudo" },
              { v: false, t: "Ainda não" },
            ] as const
          ).map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => setS2({ ...s2, diagnostico_formal: o.v })}
              className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
                s2.diagnostico_formal === o.v
                  ? "border-secondary bg-teal-claro text-primary"
                  : "border-border hover:border-secondary/50 text-muted-foreground"
              }`}
            >
              {o.t}
            </button>
          ))}
        </div>
      </Field>

      <Button
        onClick={onNext}
        disabled={!valido}
        className="w-full bg-secondary hover:bg-secondary/90 text-white h-11"
      >
        Próximo
      </Button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// STEP 3 — Sensibilidades e necessidades
// ──────────────────────────────────────────────────────────────────────

interface OpcaoCard {
  key: keyof Step3;
  Icon: typeof VolumeX;
  titulo: string;
  desc: string;
}

const GRUPO_SENSIBILIDADES: OpcaoCard[] = [
  { key: "sensivel_sons", Icon: VolumeX, titulo: "É sensível a barulho", desc: "Evitar lugares com música alta, gritos ou ruídos inesperados." },
  { key: "sensivel_luz", Icon: Lightbulb, titulo: "É sensível a luz intensa", desc: "Sol forte, flash, luzes de discoteca ou neon." },
  { key: "sensivel_texturas", Icon: Shirt, titulo: "É sensível a texturas", desc: "Roupas, superfícies, areia, tapetes." },
  { key: "sensivel_cheiros", Icon: Wind, titulo: "É sensível a cheiros fortes", desc: "Produtos de limpeza, perfumes, comida com cheiro intenso." },
  { key: "sensivel_multidao", Icon: UsersRound, titulo: "Fica agitado em lugares cheios", desc: "Praias lotadas, shoppings, filas longas." },
];

const GRUPO_COMUNICACAO: OpcaoCard[] = [
  { key: "comunicacao_verbal", Icon: MessageSquare, titulo: "Comunica verbalmente", desc: "Fala e entende bem." },
  { key: "usa_caa", Icon: ImageIcon, titulo: "Usa comunicação alternativa (CAA)", desc: "Usa pranchas, aplicativo ou fichas para se comunicar." },
  { key: "usa_libras", Icon: Hand, titulo: "Usa Libras", desc: "A comunicação principal é pela Língua Brasileira de Sinais." },
];

const GRUPO_PRECISA: OpcaoCard[] = [
  { key: "precisa_checkin_antecipado", Icon: DoorOpen, titulo: "Check-in antecipado ou silencioso", desc: "Entrar no quarto antes da chegada, sem fila na recepção." },
  { key: "precisa_fila_prioritaria", Icon: FastForward, titulo: "Fila prioritária", desc: "Não consegue esperar longos períodos em fila." },
  { key: "precisa_cardapio_visual", Icon: Utensils, titulo: "Cardápio visual disponível", desc: "Imagens dos pratos ajudam na hora de pedir." },
  { key: "precisa_sala_sensorial", Icon: Home, titulo: "Sala sensorial no local", desc: "Um espaço calmo pra se reequilibrar quando precisar." },
  { key: "precisa_concierge_tea", Icon: Brain, titulo: "Concierge TEA no local", desc: "Um profissional especializado presente durante a estadia." },
];

const GRUPO_GOSTA: OpcaoCard[] = [
  { key: "gosta_atividades_agua", Icon: Waves, titulo: "Atividades com água", desc: "Piscina, praia, cachoeira." },
  { key: "gosta_natureza", Icon: Trees, titulo: "Natureza e ambientes abertos", desc: "Trilhas, fazendas, jardins." },
  { key: "gosta_animais", Icon: PawPrint, titulo: "Animais", desc: "Pets, cavalos, aquários, zoológicos." },
];

function Step3View({
  s3,
  setS3,
  loading,
  onNext,
}: {
  s3: Step3;
  setS3: (s: Step3) => void;
  loading: boolean;
  onNext: () => void;
}) {
  const toggle = (k: keyof Step3) => setS3({ ...s3, [k]: !s3[k] });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary">
          O que ele precisa numa viagem?
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Marque o que se aplica. Quanto mais você contar, melhor a gente consegue filtrar os
          destinos.
        </p>
        <p className="text-xs text-muted-foreground mt-2">Pode marcar quantos quiser.</p>
      </div>

      <Grupo titulo="Sensibilidades">
        {GRUPO_SENSIBILIDADES.map((o) => (
          <CardOpcao key={o.key} opcao={o} ativo={s3[o.key]} onToggle={() => toggle(o.key)} />
        ))}
      </Grupo>

      <Grupo titulo="Comunicação">
        {GRUPO_COMUNICACAO.map((o) => (
          <CardOpcao key={o.key} opcao={o} ativo={s3[o.key]} onToggle={() => toggle(o.key)} />
        ))}
      </Grupo>

      <Grupo titulo="Precisa de estrutura">
        {GRUPO_PRECISA.map((o) => (
          <CardOpcao key={o.key} opcao={o} ativo={s3[o.key]} onToggle={() => toggle(o.key)} />
        ))}
      </Grupo>

      <Grupo titulo="Gosta de">
        {GRUPO_GOSTA.map((o) => (
          <CardOpcao key={o.key} opcao={o} ativo={s3[o.key]} onToggle={() => toggle(o.key)} />
        ))}
      </Grupo>

      <Button
        onClick={onNext}
        disabled={loading}
        className="w-full bg-secondary hover:bg-secondary/90 text-white h-11"
      >
        {loading ? "Salvando…" : "Próximo"}
      </Button>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display font-bold text-primary text-base mb-3">{titulo}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CardOpcao({
  opcao,
  ativo,
  onToggle,
}: {
  opcao: OpcaoCard;
  ativo: boolean;
  onToggle: () => void;
}) {
  const { Icon, titulo, desc } = opcao;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={ativo}
      className={`w-full text-left p-3.5 rounded-xl border-2 transition flex items-start gap-3 ${
        ativo
          ? "border-secondary bg-teal-claro/40"
          : "border-border bg-gray-50 hover:border-secondary/40"
      }`}
    >
      <div
        className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${
          ativo ? "bg-secondary text-white" : "bg-white text-secondary border border-border"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-primary">{titulo}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div
        className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center mt-0.5 ${
          ativo ? "border-secondary bg-secondary" : "border-gray-300 bg-white"
        }`}
      >
        {ativo && <Check className="h-3 w-3 text-white" />}
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────
// STEP 4 — Confirmação
// ──────────────────────────────────────────────────────────────────────

const RESUMO_LABELS: Partial<Record<keyof Step3, string>> = {
  sensivel_sons: "Sensível a barulho",
  sensivel_luz: "Sensível a luz",
  sensivel_texturas: "Sensível a texturas",
  sensivel_cheiros: "Sensível a cheiros",
  sensivel_multidao: "Multidões",
  comunicacao_verbal: "Verbal",
  usa_caa: "Usa CAA",
  usa_libras: "Libras",
  precisa_checkin_antecipado: "Check-in antecipado",
  precisa_fila_prioritaria: "Fila prioritária",
  precisa_cardapio_visual: "Cardápio visual",
  precisa_sala_sensorial: "Sala sensorial",
  precisa_concierge_tea: "Concierge TEA",
  gosta_atividades_agua: "Gosta de água",
  gosta_natureza: "Natureza",
  gosta_animais: "Animais",
};

function Step4View({
  nomeResponsavel,
  s2,
  s3,
  notas,
  setNotas,
  onSalvarNotas,
  recursosParaFiltro,
}: {
  nomeResponsavel: string;
  s2: Step2;
  s3: Step3;
  notas: string;
  setNotas: (v: string) => void;
  onSalvarNotas: () => Promise<void>;
  recursosParaFiltro: string[];
}) {
  const navigate = useNavigate();
  const itensMarcados = (Object.keys(RESUMO_LABELS) as Array<keyof Step3>).filter(
    (k) => s3[k] === true,
  );
  const visiveis = itensMarcados.slice(0, 5);
  const restantes = itensMarcados.length - visiveis.length;

  const nivelTxt = s2.nivel_tea
    ? s2.nivel_tea === "leve"
      ? "Leve"
      : s2.nivel_tea === "moderado"
        ? "Moderado"
        : "Severo"
    : "";

  const irParaExplorar = async () => {
    await onSalvarNotas();
    navigate({
      to: "/explorar",
      search: recursosParaFiltro.length
        ? // Cast: search schema de /explorar aceita recursos como string[]
          ({ recursos: recursosParaFiltro } as never)
        : ({} as never),
    });
  };

  return (
    <div className="text-center space-y-5">
      <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
        <Check className="h-8 w-8 text-white" strokeWidth={3} />
      </div>

      <div>
        <h1 className="font-display font-bold text-2xl text-primary">
          Perfil criado, {nomeResponsavel}!
        </h1>
        <p className="text-muted-foreground mt-2">
          O perfil do <strong className="text-primary">{s2.nome_autista}</strong> está salvo. Agora
          a plataforma sabe o que ele precisa pra ter uma viagem tranquila.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-left">
        <div className="text-sm font-semibold text-primary">
          {s2.nome_autista}
          {s2.idade ? `, ${s2.idade} anos` : ""}
          {nivelTxt ? ` — Nível ${nivelTxt}` : ""}
        </div>
        {itensMarcados.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visiveis.map((k) => (
              <span
                key={k}
                className="px-2 py-1 rounded-full bg-white border border-border text-xs text-primary"
              >
                {RESUMO_LABELS[k]}
              </span>
            ))}
            {restantes > 0 && (
              <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                +{restantes} mais
              </span>
            )}
          </div>
        )}
      </div>

      <Field label="Alguma coisa importante que a gente não perguntou?">
        <Textarea
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ex: tem medo de elevador, precisa de horário fixo de comida, não toca em comida molhada…"
        />
      </Field>

      <div className="flex flex-col gap-2 pt-2">
        <Button
          onClick={irParaExplorar}
          className="w-full bg-secondary hover:bg-secondary/90 text-white h-11"
        >
          Ver destinos compatíveis
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link to="/minha-conta">Ir para Minha Conta</Link>
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Field wrapper
// ──────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────
// Google icon
// ──────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
