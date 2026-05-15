import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/pre-checkin/$slug")({
  head: () => ({
    meta: [
      { title: "Pré-Check-in Inclusivo · Turismo Azul" },
      {
        name: "description",
        content:
          "Envie o perfil completo do seu filho autista para o estabelecimento antes da chegada.",
      },
    ],
  }),
  component: PreCheckinPage,
});

const TOTAL_STEPS = 11;

type Estab = { id: string; nome: string; slug: string } | null;

type Form = {
  // Etapa 1
  nome_autista: string;
  idade: string;
  nome_responsavel: string;
  parentesco: string;
  telefone: string;
  email: string;
  data_checkin: string;
  data_checkout: string;
  num_acompanhantes: string;
  pessoa_referencia: string;
  // Etapa 2
  comunicacao: string[];
  comunicacao_misto_qual: string;
  compreende_instrucoes: string;
  responde_melhor: string;
  responde_melhor_qual: string;
  recursos_comunicacao: string[];
  obs_comunicacao: string;
  // Etapa 3
  apoio: Record<string, string>;
  pode_circular: string;
  supervisao_constante: string;
  // Etapa 4
  horarios: Record<string, string>;
  rotina_matinal: string;
  rotina_matinal_qual: string;
  mudancas_sofrimento: string;
  // Etapa 5
  seletividade: string;
  alimentos_aceita: string;
  alimentos_recusa: string;
  sensibilidades_alim: string[];
  espera_fila: string;
  ambiente_reservado: string;
  utensilios: string;
  marca_favorece: string;
  risco_recusa: string;
  // Etapa 6
  sensorial: Record<string, string>;
  abafadores: string;
  abafadores_qual: string;
  gatilho_evitar: string;
  estimulos_acalmam: string;
  // Etapa 7
  sinais_desconforto: string[];
  desencadeia: string;
  tempo_acalmar: string;
  estrategias_funcionam: string[];
  nao_fazer: string;
  risco_fuga: string;
  preferencia_crise: string[];
  // Etapa 8
  localizacao_quarto: string;
  sensivel_ar: string;
  sensivel_iluminacao: string;
  dorme_melhor: string[];
  objetos_adaptacao: string;
  preparacao_quarto: string;
  // Etapa 9
  area: Record<string, string>;
  recreacao_tipo: string;
  atividades_interesse: string;
  atividades_evitar: string;
  // Etapa 10
  ativ_preferidas: string;
  temas_interesses: string;
  objetos_personagens: string;
  alegria_engajamento: string;
  estrategias_novos_amb: string;
  formas_abordagem: string;
  // Etapa 11
  hospedagem_funciona: string;
  experiencia_negativa: string;
  recomendacao_extra: string;
  objetivo_viagem: string[];
  conversa_previa: string;
  obs_familia: string;
};

function makeInitialForm(): Form {
  return {
    nome_autista: "",
    idade: "",
    nome_responsavel: "",
    parentesco: "",
    telefone: "",
    email: "",
    data_checkin: "",
    data_checkout: "",
    num_acompanhantes: "",
    pessoa_referencia: "",
    comunicacao: [],
    comunicacao_misto_qual: "",
    compreende_instrucoes: "",
    responde_melhor: "",
    responde_melhor_qual: "",
    recursos_comunicacao: [],
    obs_comunicacao: "",
    apoio: {},
    pode_circular: "",
    supervisao_constante: "",
    horarios: {},
    rotina_matinal: "",
    rotina_matinal_qual: "",
    mudancas_sofrimento: "",
    seletividade: "",
    alimentos_aceita: "",
    alimentos_recusa: "",
    sensibilidades_alim: [],
    espera_fila: "",
    ambiente_reservado: "",
    utensilios: "",
    marca_favorece: "",
    risco_recusa: "",
    sensorial: {},
    abafadores: "",
    abafadores_qual: "",
    gatilho_evitar: "",
    estimulos_acalmam: "",
    sinais_desconforto: [],
    desencadeia: "",
    tempo_acalmar: "",
    estrategias_funcionam: [],
    nao_fazer: "",
    risco_fuga: "",
    preferencia_crise: [],
    localizacao_quarto: "",
    sensivel_ar: "",
    sensivel_iluminacao: "",
    dorme_melhor: [],
    objetos_adaptacao: "",
    preparacao_quarto: "",
    area: {},
    recreacao_tipo: "",
    atividades_interesse: "",
    atividades_evitar: "",
    ativ_preferidas: "",
    temas_interesses: "",
    objetos_personagens: "",
    alegria_engajamento: "",
    estrategias_novos_amb: "",
    formas_abordagem: "",
    hospedagem_funciona: "",
    experiencia_negativa: "",
    recomendacao_extra: "",
    objetivo_viagem: [],
    conversa_previa: "",
    obs_familia: "",
  };
}

const step1Schema = z.object({
  nome_autista: z.string().trim().min(1, "Informe o nome").max(120),
  idade: z.string().trim().min(1, "Informe a idade").max(3),
  nome_responsavel: z.string().trim().min(1, "Informe o responsável").max(120),
  telefone: z.string().trim().min(8, "Informe um telefone válido").max(20),
  email: z.string().trim().email("E-mail inválido").max(255),
  data_checkin: z.string().min(1, "Informe a data de check-in"),
  data_checkout: z.string().min(1, "Informe a data de check-out"),
  num_acompanhantes: z.string().min(1, "Informe a quantidade"),
  pessoa_referencia: z.string().trim().min(1, "Informe a pessoa de referência").max(120),
});

function PreCheckinPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [estab, setEstab] = useState<Estab>(null);
  const [estabLoading, setEstabLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(makeInitialForm);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("estabelecimentos")
        .select("id, nome, slug")
        .eq("slug", slug)
        .maybeSingle();
      if (!error && data) setEstab(data);
      setEstabLoading(false);
    })();
  }, [slug]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const setF = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const toggleArr = (k: keyof Form, value: string) => {
    setForm((prev) => {
      const arr = (prev[k] as string[]) ?? [];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...prev, [k]: next as Form[typeof k] };
    });
  };

  const setNested = (k: keyof Form, sub: string, value: string) => {
    setForm((prev) => {
      const obj = { ...((prev[k] as Record<string, string>) ?? {}) };
      obj[sub] = value;
      return { ...prev, [k]: obj as Form[typeof k] };
    });
  };

  const progresso = useMemo(() => Math.round((step / TOTAL_STEPS) * 100), [step]);

  function validateStep1() {
    const parsed = step1Schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const k = i.path[0] as string;
        if (!errs[k]) errs[k] = i.message;
      }
      setStep1Errors(errs);
      return false;
    }
    setStep1Errors({});
    return true;
  }

  async function avancar() {
    if (step === 1 && !validateStep1()) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    // Submit
    if (!estab) return;
    setEnviando(true);
    const { error } = await supabase.from("pre_checkins").insert([
      {
        estabelecimento_id: estab.id,
        estabelecimento_slug: estab.slug,
        nome_autista: form.nome_autista,
        idade: form.idade ? Number(form.idade) : null,
        nome_responsavel: form.nome_responsavel,
        email: form.email.toLowerCase(),
        telefone: form.telefone,
        data_checkin: form.data_checkin || null,
        data_checkout: form.data_checkout || null,
        dados: JSON.parse(JSON.stringify(form)),
        origem: "marketplace",
      },
    ]);
    setEnviando(false);
    if (error) {
      toast.error("Erro ao enviar pré-check-in. Tente novamente.");
      return;
    }
    setEnviado(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function voltar() {
    if (step > 1) setStep(step - 1);
  }

  if (estabLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!estab) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-display font-bold text-primary">
          Estabelecimento não encontrado
        </h1>
        <Button asChild>
          <Link to="/explorar">Voltar para o marketplace</Link>
        </Button>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-white -mt-16 pt-16">
        <div className="absolute top-0 left-0 right-0 z-40 h-16 bg-white border-b">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Logo />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-secondary/20 flex items-center justify-center">
            <Check className="h-10 w-10 text-secondary" />
          </div>
          <h1 className="mt-6 text-3xl md:text-4xl font-display font-bold text-primary">
            Perfil enviado com sucesso!
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            O estabelecimento já recebeu as informações do seu filho. A equipe
            estará preparada antes da sua chegada.
          </p>
          <Button
            className="mt-8"
            size="lg"
            onClick={() =>
              navigate({ to: "/estabelecimento/$slug", params: { slug: estab.slug } })
            }
          >
            Voltar para o estabelecimento <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white -mt-16 pt-16 pb-32">
      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Logo />
            <span className="hidden sm:inline text-sm font-semibold text-primary truncate">
              · Pré-Check-in Inclusivo
            </span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">
            Etapa {step} de {TOTAL_STEPS}
          </span>
        </div>
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-secondary transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        <p className="text-xs text-muted-foreground mb-2">
          {estab.nome}
        </p>
        {step === 1 && <Step1 form={form} setF={setF} errors={step1Errors} />}
        {step === 2 && (
          <Step2 form={form} setF={setF} toggleArr={toggleArr} />
        )}
        {step === 3 && <Step3 form={form} setF={setF} setNested={setNested} />}
        {step === 4 && <Step4 form={form} setF={setF} setNested={setNested} />}
        {step === 5 && (
          <Step5 form={form} setF={setF} toggleArr={toggleArr} />
        )}
        {step === 6 && <Step6 form={form} setF={setF} setNested={setNested} />}
        {step === 7 && (
          <Step7 form={form} setF={setF} toggleArr={toggleArr} />
        )}
        {step === 8 && (
          <Step8 form={form} setF={setF} toggleArr={toggleArr} />
        )}
        {step === 9 && <Step9 form={form} setF={setF} setNested={setNested} />}
        {step === 10 && <Step10 form={form} setF={setF} />}
        {step === 11 && (
          <Step11 form={form} setF={setF} toggleArr={toggleArr} />
        )}
      </main>

      {/* Footer fixo */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={voltar} disabled={step === 1 || enviando}>
            <ArrowLeft className="h-4 w-4" /> Anterior
          </Button>
          <Button
            onClick={avancar}
            disabled={enviando}
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : step === TOTAL_STEPS ? (
              <>
                Enviar perfil <Check className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Próximo <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────── Helpers de UI ───────────────────────── */

function StepHeader({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold text-primary">{titulo}</h1>
      {subtitulo && (
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitulo}</p>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function RadioRow({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-4">
      {options.map(([v, l]) => (
        <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
          <RadioGroupItem value={v} />
          {l}
        </label>
      ))}
    </RadioGroup>
  );
}

function CheckboxList({
  values,
  options,
  onToggle,
}: {
  values: string[];
  options: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {options.map((o) => (
        <label key={o} className="flex items-start gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={values.includes(o)}
            onCheckedChange={() => onToggle(o)}
            className="mt-0.5"
          />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}

function ScaleTable({
  rows,
  columns,
  values,
  onChange,
}: {
  rows: string[];
  columns: string[];
  values: Record<string, string>;
  onChange: (row: string, value: string) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full min-w-[500px] text-sm border border-border rounded-lg">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left p-2 font-semibold text-primary">Item</th>
            {columns.map((c) => (
              <th key={c} className="p-2 font-semibold text-primary text-center">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r} className={i % 2 ? "bg-muted/20" : ""}>
              <td className="p-2 align-middle">{r}</td>
              {columns.map((c) => (
                <td key={c} className="p-2 text-center">
                  <input
                    type="radio"
                    name={r}
                    checked={values[r] === c}
                    onChange={() => onChange(r, c)}
                    className="cursor-pointer accent-secondary h-4 w-4"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────── Etapas ───────────────────────── */

type StepProps = {
  form: Form;
  setF: <K extends keyof Form>(k: K, v: Form[K]) => void;
};
type StepWithToggle = StepProps & { toggleArr: (k: keyof Form, v: string) => void };
type StepWithNested = StepProps & {
  setNested: (k: keyof Form, sub: string, value: string) => void;
};

function Step1({
  form,
  setF,
  errors,
}: StepProps & { errors: Record<string, string> }) {
  return (
    <>
      <StepHeader titulo="Identificação do Hóspede" />
      <Card>
        <Field label="Nome da pessoa autista" required error={errors.nome_autista}>
          <Input value={form.nome_autista} onChange={(e) => setF("nome_autista", e.target.value)} />
        </Field>
        <Field label="Idade" required error={errors.idade}>
          <Input
            type="number"
            min={0}
            max={120}
            value={form.idade}
            onChange={(e) => setF("idade", e.target.value)}
          />
        </Field>
        <Field label="Nome do responsável" required error={errors.nome_responsavel}>
          <Input
            value={form.nome_responsavel}
            onChange={(e) => setF("nome_responsavel", e.target.value)}
          />
        </Field>
        <Field label="Grau de parentesco">
          <Select value={form.parentesco} onValueChange={(v) => setF("parentesco", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mãe">Mãe</SelectItem>
              <SelectItem value="Pai">Pai</SelectItem>
              <SelectItem value="Responsável legal">Responsável legal</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Telefone" required error={errors.telefone}>
          <Input value={form.telefone} onChange={(e) => setF("telefone", e.target.value)} />
        </Field>
        <Field label="E-mail" required error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setF("email", e.target.value)}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Data de check-in" required error={errors.data_checkin}>
            <Input
              type="date"
              value={form.data_checkin}
              onChange={(e) => setF("data_checkin", e.target.value)}
            />
          </Field>
          <Field label="Data de check-out" required error={errors.data_checkout}>
            <Input
              type="date"
              value={form.data_checkout}
              onChange={(e) => setF("data_checkout", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Quantas pessoas acompanharão?" required error={errors.num_acompanhantes}>
          <Input
            type="number"
            min={0}
            value={form.num_acompanhantes}
            onChange={(e) => setF("num_acompanhantes", e.target.value)}
          />
        </Field>
        <Field
          label="Principal pessoa de referência durante a estadia"
          required
          error={errors.pessoa_referencia}
        >
          <Input
            value={form.pessoa_referencia}
            onChange={(e) => setF("pessoa_referencia", e.target.value)}
          />
        </Field>
      </Card>
    </>
  );
}

function Step2({ form, setF, toggleArr }: StepWithToggle) {
  return (
    <>
      <StepHeader titulo="Como ela se comunica?" />
      <Card>
        <Field label="Como se comunica? (marque todas que se aplicam)">
          <CheckboxList
            values={form.comunicacao}
            options={[
              "Verbal fluente",
              "Frases curtas",
              "Palavras isoladas",
              "Gestos e imagens",
              "Misto",
            ]}
            onToggle={(v) => toggleArr("comunicacao", v)}
          />
          {form.comunicacao.includes("Misto") && (
            <Input
              className="mt-3"
              placeholder="Qual combinação?"
              value={form.comunicacao_misto_qual}
              onChange={(e) => setF("comunicacao_misto_qual", e.target.value)}
            />
          )}
        </Field>
        <Field label="Compreende instruções simples?">
          <RadioRow
            value={form.compreende_instrucoes}
            onChange={(v) => setF("compreende_instrucoes", v)}
            options={[
              ["Sim", "Sim"],
              ["Parcialmente", "Parcialmente"],
              ["Não", "Não"],
            ]}
          />
        </Field>
        <Field label="Responde melhor a">
          <RadioGroup
            value={form.responde_melhor}
            onValueChange={(v) => setF("responde_melhor", v)}
            className="space-y-2"
          >
            {[
              "Linguagem verbal",
              "Pistas visuais",
              "Demonstração prática",
              "Combinação",
            ].map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value={o} />
                {o}
              </label>
            ))}
          </RadioGroup>
          {form.responde_melhor === "Combinação" && (
            <Input
              className="mt-3"
              placeholder="Qual combinação?"
              value={form.responde_melhor_qual}
              onChange={(e) => setF("responde_melhor_qual", e.target.value)}
            />
          )}
        </Field>
        <Field label="Usa recursos de comunicação?">
          <CheckboxList
            values={form.recursos_comunicacao}
            options={["Prancha", "Aplicativo", "PECS", "Outro"]}
            onToggle={(v) => toggleArr("recursos_comunicacao", v)}
          />
        </Field>
        <Field label="Observações importantes sobre comunicação">
          <Textarea
            rows={3}
            value={form.obs_comunicacao}
            onChange={(e) => setF("obs_comunicacao", e.target.value)}
          />
        </Field>
      </Card>
    </>
  );
}

function Step3({ form, setF, setNested }: StepWithNested) {
  const atividades = [
    "Alimentação",
    "Higiene pessoal",
    "Vestir-se",
    "Deslocamento",
    "Compreensão de regras",
  ];
  return (
    <>
      <StepHeader
        titulo="Nível de apoio necessário"
        subtitulo="Para cada atividade, indique o nível de apoio que a pessoa necessita."
      />
      <Card>
        <ScaleTable
          rows={atividades}
          columns={["Independente", "Apoio parcial", "Apoio total"]}
          values={form.apoio}
          onChange={(r, v) => setNested("apoio", r, v)}
        />
        <Field label="Pode circular com autonomia em alguns espaços?">
          <RadioRow
            value={form.pode_circular}
            onChange={(v) => setF("pode_circular", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
              ["Parcialmente", "Parcialmente"],
            ]}
          />
        </Field>
        <Field label="Precisa de supervisão constante?">
          <RadioRow
            value={form.supervisao_constante}
            onChange={(v) => setF("supervisao_constante", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
            ]}
          />
        </Field>
      </Card>
    </>
  );
}

function Step4({ form, setF, setNested }: StepWithNested) {
  const horarios = ["Acordar", "Café da manhã", "Almoço", "Lanche", "Jantar", "Dormir"];
  return (
    <>
      <StepHeader
        titulo="Rotina e horários preferidos"
        subtitulo="Isso nos ajuda a preparar o ambiente nos momentos certos."
      />
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          {horarios.map((h) => (
            <Field key={h} label={h}>
              <Input
                type="time"
                value={form.horarios[h] ?? ""}
                onChange={(e) => setNested("horarios", h, e.target.value)}
              />
            </Field>
          ))}
        </div>
        <Field label="Há rotina matinal importante?">
          <RadioRow
            value={form.rotina_matinal}
            onChange={(v) => setF("rotina_matinal", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
            ]}
          />
          {form.rotina_matinal === "Sim" && (
            <Textarea
              className="mt-3"
              placeholder="Qual?"
              rows={3}
              value={form.rotina_matinal_qual}
              onChange={(e) => setF("rotina_matinal_qual", e.target.value)}
            />
          )}
        </Field>
        <Field label="Mudanças de rotina geram sofrimento?">
          <RadioRow
            value={form.mudancas_sofrimento}
            onChange={(v) => setF("mudancas_sofrimento", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
            ]}
          />
        </Field>
      </Card>
    </>
  );
}

function Step5({ form, setF, toggleArr }: StepWithToggle) {
  return (
    <>
      <StepHeader titulo="Perfil alimentar" />
      <Card>
        <Field label="Seletividade alimentar">
          <RadioRow
            value={form.seletividade}
            onChange={(v) => setF("seletividade", v)}
            options={[
              ["Não", "Não"],
              ["Leve", "Leve"],
              ["Moderada", "Moderada"],
              ["Severa", "Severa"],
            ]}
          />
        </Field>
        <Field label="Alimentos que aceita com tranquilidade">
          <Textarea
            rows={3}
            value={form.alimentos_aceita}
            onChange={(e) => setF("alimentos_aceita", e.target.value)}
          />
        </Field>
        <Field label="Alimentos que recusa">
          <Textarea
            rows={3}
            value={form.alimentos_recusa}
            onChange={(e) => setF("alimentos_recusa", e.target.value)}
          />
        </Field>
        <Field label="Sensibilidades">
          <CheckboxList
            values={form.sensibilidades_alim}
            options={[
              "Textura",
              "Temperatura",
              "Cheiro",
              "Cor",
              "Mistura de alimentos",
              "Outro",
            ]}
            onToggle={(v) => toggleArr("sensibilidades_alim", v)}
          />
        </Field>
        <Field label="Consegue esperar em fila para se servir?">
          <RadioRow
            value={form.espera_fila}
            onChange={(v) => setF("espera_fila", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
              ["Com apoio", "Com apoio"],
            ]}
          />
        </Field>
        <Field label="Prefere ambiente mais reservado nas refeições?">
          <RadioRow
            value={form.ambiente_reservado}
            onChange={(v) => setF("ambiente_reservado", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
            ]}
          />
        </Field>
        <Field label="Usa utensílios específicos?">
          <RadioRow
            value={form.utensilios}
            onChange={(v) => setF("utensilios", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
            ]}
          />
        </Field>
        <Field label="Há marca ou preparação que favorece aceitação?">
          <Textarea
            rows={2}
            value={form.marca_favorece}
            onChange={(e) => setF("marca_favorece", e.target.value)}
          />
        </Field>
        <Field label="Risco de recusa alimentar em ambientes novos?">
          <RadioRow
            value={form.risco_recusa}
            onChange={(v) => setF("risco_recusa", v)}
            options={[
              ["Alto", "Alto"],
              ["Médio", "Médio"],
              ["Baixo", "Baixo"],
            ]}
          />
        </Field>
      </Card>
    </>
  );
}

function Step6({ form, setF, setNested }: StepWithNested) {
  const itens = [
    "Barulho de pessoas conversando",
    "Música ambiente",
    "Sons súbitos",
    "Eco em ambientes",
    "Cheiros fortes",
    "Perfumes",
    "Iluminação intensa",
    "Luz piscando",
    "Calor excessivo",
    "Frio excessivo",
    "Toque inesperado",
    "Superfícies molhadas",
    "Locais muito cheios",
    "Muito movimento visual",
  ];
  return (
    <>
      <StepHeader
        titulo="Sensibilidades sensoriais"
        subtitulo="Para cada estímulo, indique o nível de incômodo."
      />
      <Card>
        <ScaleTable
          rows={itens}
          columns={["Baixo", "Médio", "Alto", "Depende"]}
          values={form.sensorial}
          onChange={(r, v) => setNested("sensorial", r, v)}
        />
        <Field label="Usa abafadores ou recursos de regulação?">
          <RadioRow
            value={form.abafadores}
            onChange={(v) => setF("abafadores", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
              ["Às vezes", "Às vezes"],
            ]}
          />
          {form.abafadores === "Sim" && (
            <Input
              className="mt-3"
              placeholder="Qual?"
              value={form.abafadores_qual}
              onChange={(e) => setF("abafadores_qual", e.target.value)}
            />
          )}
        </Field>
        <Field label="Gatilho sensorial importante que o hotel deve evitar">
          <Textarea
            rows={2}
            value={form.gatilho_evitar}
            onChange={(e) => setF("gatilho_evitar", e.target.value)}
          />
        </Field>
        <Field label="Estímulos que ajudam a acalmar">
          <Textarea
            rows={2}
            value={form.estimulos_acalmam}
            onChange={(e) => setF("estimulos_acalmam", e.target.value)}
          />
        </Field>
      </Card>
    </>
  );
}

function Step7({ form, setF, toggleArr }: StepWithToggle) {
  return (
    <>
      <StepHeader titulo="Como ela reage em momentos difíceis?" />
      <Card>
        <Field label="Sinais de desconforto">
          <CheckboxList
            values={form.sinais_desconforto}
            options={[
              "Choro",
              "Irritação",
              "Agitação",
              "Isolamento",
              "Gritos",
              "Fuga",
              "Agressividade",
              "Outro",
            ]}
            onToggle={(v) => toggleArr("sinais_desconforto", v)}
          />
        </Field>
        <Field label="O que geralmente desencadeia?">
          <Textarea
            rows={2}
            value={form.desencadeia}
            onChange={(e) => setF("desencadeia", e.target.value)}
          />
        </Field>
        <Field label="Tempo para se acalmar">
          <RadioGroup
            value={form.tempo_acalmar}
            onValueChange={(v) => setF("tempo_acalmar", v)}
            className="space-y-2"
          >
            {[
              "Rápido (menos de 5 min)",
              "Médio (5 a 15 min)",
              "Longo (mais de 15 min)",
            ].map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value={o} />
                {o}
              </label>
            ))}
          </RadioGroup>
        </Field>
        <Field label="Estratégias que funcionam">
          <CheckboxList
            values={form.estrategias_funcionam}
            options={[
              "Diminuir falas",
              "Retirar do local",
              "Oferecer objeto de conforto",
              "Chamar responsável",
              "Reduzir luz e som",
              "Outro",
            ]}
            onToggle={(v) => toggleArr("estrategias_funcionam", v)}
          />
        </Field>
        <Field label="O que NÃO fazer">
          <Textarea
            rows={2}
            value={form.nao_fazer}
            onChange={(e) => setF("nao_fazer", e.target.value)}
          />
        </Field>
        <Field label="Existe risco de fuga?">
          <RadioRow
            value={form.risco_fuga}
            onChange={(v) => setF("risco_fuga", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
            ]}
          />
        </Field>
        <Field label="Em caso de crise, preferência por">
          <CheckboxList
            values={form.preferencia_crise}
            options={[
              "Diminuir estímulos",
              "Retirar do local",
              "Oferecer objeto de regulação",
              "Chamar responsável",
              "Outro",
            ]}
            onToggle={(v) => toggleArr("preferencia_crise", v)}
          />
        </Field>
      </Card>
    </>
  );
}

function Step8({ form, setF, toggleArr }: StepWithToggle) {
  return (
    <>
      <StepHeader titulo="Como preparar o quarto para ela?" />
      <Card>
        <Field label="Localização preferida">
          <RadioGroup
            value={form.localizacao_quarto}
            onValueChange={(v) => setF("localizacao_quarto", v)}
            className="space-y-2"
          >
            {[
              "Próximo à recepção",
              "Longe de barulho",
              "Andar térreo",
              "Andar mais silencioso",
              "Sem preferência",
            ].map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value={o} />
                {o}
              </label>
            ))}
          </RadioGroup>
        </Field>
        <Field label="Sensibilidade ao ar-condicionado?">
          <RadioRow
            value={form.sensivel_ar}
            onChange={(v) => setF("sensivel_ar", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
            ]}
          />
        </Field>
        <Field label="Sensibilidade à iluminação?">
          <RadioRow
            value={form.sensivel_iluminacao}
            onChange={(v) => setF("sensivel_iluminacao", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
            ]}
          />
        </Field>
        <Field label="Dorme melhor com">
          <CheckboxList
            values={form.dorme_melhor}
            options={["Pouca luz", "Escuro total", "Ruído branco", "Silêncio", "Outro"]}
            onToggle={(v) => toggleArr("dorme_melhor", v)}
          />
        </Field>
        <Field label="Objetos que levará para adaptação">
          <Textarea
            rows={2}
            value={form.objetos_adaptacao}
            onChange={(e) => setF("objetos_adaptacao", e.target.value)}
          />
        </Field>
        <Field label="Preparação especial no quarto">
          <Textarea
            rows={2}
            value={form.preparacao_quarto}
            onChange={(e) => setF("preparacao_quarto", e.target.value)}
          />
        </Field>
      </Card>
    </>
  );
}

function Step9({ form, setF, setNested }: StepWithNested) {
  const SubCard = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
      <h3 className="text-base font-display font-bold text-primary">{title}</h3>
      {children}
    </div>
  );
  const yn = (key: string, label: string, opts = ["Sim", "Não"]) => (
    <Field label={label}>
      <RadioRow
        value={form.area[key] ?? ""}
        onChange={(v) => setNested("area", key, v)}
        options={opts.map((o) => [o, o] as [string, string])}
      />
    </Field>
  );
  return (
    <>
      <StepHeader titulo="Uso das áreas do estabelecimento" />
      <div className="space-y-4">
        <SubCard title="Piscina / Aquático">
          {yn("piscina_gosta", "Gosta de piscina?", ["Sim", "Não", "Às vezes"])}
          {yn("piscina_pessoas", "Tolera ambientes com muitas pessoas?")}
          {yn("piscina_temp", "Sensibilidade à temperatura da água?")}
          {yn("piscina_supervisao", "Precisa de supervisão constante?")}
          {yn("piscina_horario", "Prefere horários mais tranquilos?")}
        </SubCard>

        <SubCard title="Recreação / Jogos">
          {yn("rec_gosta", "Gosta de atividades recreativas?")}
          <Field label="Prefere atividades livres ou mediadas?">
            <RadioRow
              value={form.recreacao_tipo}
              onChange={(v) => setF("recreacao_tipo", v)}
              options={[
                ["Livres", "Livres"],
                ["Mediadas", "Mediadas"],
                ["Ambas", "Ambas"],
              ]}
            />
          </Field>
          {yn("rec_intenso", "Tolera som e movimento intenso?")}
          <Field label="Atividades de maior interesse">
            <Textarea
              rows={2}
              value={form.atividades_interesse}
              onChange={(e) => setF("atividades_interesse", e.target.value)}
            />
          </Field>
          <Field label="Atividades a evitar">
            <Textarea
              rows={2}
              value={form.atividades_evitar}
              onChange={(e) => setF("atividades_evitar", e.target.value)}
            />
          </Field>
        </SubCard>

        <SubCard title="Restaurante">
          {yn("rest_fila", "Tolera filas e espera?", ["Sim", "Não", "Com apoio"])}
          {yn("rest_reservado", "Prefere local mais reservado?")}
          {yn("rest_apoio", "Precisa de apoio visual para escolher?")}
          {yn("rest_horario", "Prefere horários mais tranquilos?")}
        </SubCard>

        <SubCard title="Check-in">
          {yn("ci_ansiedade", "Costuma gerar ansiedade na chegada?")}
          {yn("ci_filas", "Importante evitar filas?")}
          {yn("ci_equipe", "Importante que a equipe saiba previamente?")}
        </SubCard>
      </div>
    </>
  );
}

function Step10({ form, setF }: StepProps) {
  const fields: Array<[keyof Form, string]> = [
    ["ativ_preferidas", "Atividades preferidas"],
    ["temas_interesses", "Temas e interesses específicos"],
    ["objetos_personagens", "Objetos ou personagens que ajudam na adaptação"],
    ["alegria_engajamento", "O que gera alegria e engajamento?"],
    ["estrategias_novos_amb", "Estratégias que funcionam bem em ambientes novos"],
    ["formas_abordagem", "Formas de abordagem que favorecem a interação"],
  ];
  return (
    <>
      <StepHeader titulo="O que ela ama e o que a engaja?" />
      <Card>
        {fields.map(([k, label]) => (
          <Field key={k as string} label={label}>
            <Textarea
              rows={3}
              value={form[k] as string}
              onChange={(e) => setF(k, e.target.value as Form[typeof k])}
            />
          </Field>
        ))}
      </Card>
    </>
  );
}

function Step11({ form, setF, toggleArr }: StepWithToggle) {
  return (
    <>
      <StepHeader titulo="Últimas informações importantes" />
      <Card>
        <Field label="O que faz uma hospedagem funcionar bem para sua família?">
          <Textarea
            rows={3}
            value={form.hospedagem_funciona}
            onChange={(e) => setF("hospedagem_funciona", e.target.value)}
          />
        </Field>
        <Field label="Existe alguma experiência negativa anterior que devemos evitar?">
          <Textarea
            rows={3}
            value={form.experiencia_negativa}
            onChange={(e) => setF("experiencia_negativa", e.target.value)}
          />
        </Field>
        <Field label="Há alguma recomendação não mencionada?">
          <Textarea
            rows={3}
            value={form.recomendacao_extra}
            onChange={(e) => setF("recomendacao_extra", e.target.value)}
          />
        </Field>
        <Field label="Objetivo especial desta viagem">
          <CheckboxList
            values={form.objetivo_viagem}
            options={[
              "Descanso",
              "Primeira viagem",
              "Experiência em família",
              "Treino de autonomia",
              "Socialização",
              "Lazer",
              "Outro",
            ]}
            onToggle={(v) => toggleArr("objetivo_viagem", v)}
          />
        </Field>
        <Field label="Gostaria de conversa prévia com a equipe?">
          <RadioRow
            value={form.conversa_previa}
            onChange={(v) => setF("conversa_previa", v)}
            options={[
              ["Sim", "Sim"],
              ["Não", "Não"],
            ]}
          />
        </Field>
        <Field label="Observações gerais da família">
          <Textarea
            rows={3}
            value={form.obs_familia}
            onChange={(e) => setF("obs_familia", e.target.value)}
          />
        </Field>
      </Card>
    </>
  );
}
