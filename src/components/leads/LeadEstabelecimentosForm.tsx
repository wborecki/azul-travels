import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ESTADOS_BR } from "@/lib/brazil";
import { maskWhatsapp } from "@/lib/whatsapp";
import { Building2, Check, Heart, Loader2 } from "lucide-react";
import { ESTAB_TIPOS, ESTAB_TIPO_LABEL } from "@/lib/enums";
import { CreateAccountModal } from "@/components/auth/CreateAccountModal";

const NUM_COL = ["Até 10", "11 a 30", "31 a 60", "61 a 100", "Mais de 100"] as const;

const INTERESSES = [
  "Listar no marketplace e atrair famílias TEA",
  "Obter o Selo Azul (capacitação da equipe)",
  "Oferecer benefícios exclusivos para autistas",
  "Saber mais antes de decidir",
] as const;

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  cargo: z.string().trim().min(2, "Informe seu cargo").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  whatsapp: z.string().trim().min(14, "WhatsApp obrigatório"),
  nome_estabelecimento: z.string().trim().min(2, "Informe o nome").max(200),
  tipo: z.string().min(1, "Selecione o tipo"),
  cidade: z.string().trim().min(2, "Informe a cidade").max(120),
  estado: z.string().length(2, "Selecione um estado"),
  num_colaboradores: z.string().min(1, "Selecione uma opção"),
  iniciativa_atual: z.string().min(1, "Selecione uma opção"),
  como_conheceu: z.string().optional(),
  consentimento: z.literal(true, { message: "Você precisa concordar para se inscrever" }),
});

type FormErrors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export function LeadEstabelecimentosForm({ origem = "home" }: { origem?: string } = {}) {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [emailDup, setEmailDup] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [acceptOnly, setAcceptOnly] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [nomeEstab, setNomeEstab] = useState("");
  const [tipo, setTipo] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [numCol, setNumCol] = useState("");
  const [iniciativa, setIniciativa] = useState("");
  const [interesses, setInteresses] = useState<string[]>([]);
  const [comoConheceu, setComoConheceu] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const timeout = setTimeout(() => {
      if (!cancelado) setLoadingCount(false);
    }, 3000);
    void (async () => {
      try {
        const { count: c, error } = await supabase
          .from("leads_estabelecimentos")
          .select("*", { count: "exact", head: true });
        if (cancelado) return;
        setCount(error ? null : (c ?? 0));
      } catch {
        if (!cancelado) setCount(null);
      } finally {
        if (!cancelado) setLoadingCount(false);
        clearTimeout(timeout);
      }
    })();
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, []);

  async function loadCount() {
    try {
      const { count: c, error } = await supabase
        .from("leads_estabelecimentos")
        .select("*", { count: "exact", head: true });
      if (!error) setCount(c ?? 0);
    } catch {
      /* ignore */
    }
  }

  const toggleInteresse = (i: string) => {
    setInteresses((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  async function checkDuplicate(value: string) {
    // RLS bloqueia SELECT anônimo. Confiamos no índice único (lower(email))
    // e tratamos o erro 23505 no submit.
    const v = value.trim().toLowerCase();
    if (!v || !z.string().email().safeParse(v).success) {
      setEmailDup(false);
      return;
    }
    setEmailDup(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      nome,
      cargo,
      email,
      whatsapp,
      nome_estabelecimento: nomeEstab,
      tipo,
      cidade,
      estado,
      num_colaboradores: numCol,
      iniciativa_atual: iniciativa,
      como_conheceu: comoConheceu,
      consentimento: consent,
    });
    if (!parsed.success) {
      const errs: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormErrors;
        if (!errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setEnviando(true);

    // Salva o lead na waitlist (sem criar conta ainda)
    const { error: insertError } = await supabase.from("leads_estabelecimentos").insert({
      nome: parsed.data.nome,
      cargo: parsed.data.cargo,
      email: parsed.data.email.toLowerCase(),
      whatsapp: parsed.data.whatsapp,
      nome_estabelecimento: parsed.data.nome_estabelecimento,
      tipo: parsed.data.tipo,
      cidade: parsed.data.cidade,
      estado: parsed.data.estado,
      num_colaboradores: parsed.data.num_colaboradores,
      iniciativa_atual: parsed.data.iniciativa_atual,
      interesses,
      como_conheceu: parsed.data.como_conheceu || null,
      origem,
    });

    setEnviando(false);
    if (insertError) {
      if (insertError.code === "23505") {
        setEmailDup(true);
        setErrors({ email: "Este e-mail já está cadastrado na lista." });
        return;
      }
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }
    setEnviado(true);
    void loadCount();
    if (typeof window !== "undefined" && typeof (window as { gtag?: unknown }).gtag === "function") {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
        "event",
        "lead_estabelecimento",
        {
          event_category: "formulario",
          event_label: "lista_espera_estabelecimento",
        },
      );
    }
  }

  if (enviado && !acceptOnly) {
    return (
      <>
        <div className="bg-white rounded-3xl border p-8 md:p-10 max-w-2xl mx-auto shadow-elegant text-center">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-azul-claro flex items-center justify-center">
              <Building2 className="h-10 w-10 text-primary" aria-hidden="true" />
            </div>
          </div>
          <h2 className="mt-6 text-2xl md:text-3xl font-display font-bold text-primary">
            Cadastro recebido 💙
          </h2>
          <p className="mt-3 text-foreground/80">
            Você está na nossa lista. Para agilizar:
          </p>

          <div className="mt-6 rounded-2xl border-2 border-secondary/40 bg-gradient-to-br from-azul-claro/40 to-white p-6 text-left shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary fill-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg text-primary">
                  Criar minha conta agora
                </h3>
                <p className="mt-1 text-sm text-foreground/80">
                  Com uma conta você já pode preencher o perfil do seu estabelecimento e agilizar
                  o processo de certificação.
                </p>
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="mt-4 bg-secondary hover:bg-secondary/90 text-white font-semibold"
                >
                  Criar conta →
                </Button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAcceptOnly(true)}
            className="mt-5 text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
          >
            Só quero a lista de espera por enquanto
          </button>
        </div>

        <CreateAccountModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          accountType="estabelecimento"
          email={email.trim().toLowerCase()}
          signupMetadata={{
            nome_responsavel: nome,
            cargo,
            whatsapp,
            nome_estabelecimento: nomeEstab,
            tipo,
            cidade,
            estado,
            origem: "formulario_parceiro",
          }}
        />
      </>
    );
  }

  if (enviado && acceptOnly) {
    return (
      <div className="bg-white rounded-2xl border p-8 text-center max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-full bg-secondary text-white flex items-center justify-center mx-auto">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-2xl font-display font-bold text-primary">Cadastro recebido!</h3>
        <p className="mt-2 text-muted-foreground">
          Nossa equipe vai entrar em contato pelo WhatsApp informado assim que iniciarmos o
          onboarding dos primeiros parceiros. Você está na fila prioritária.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border p-6 md:p-8 shadow-sm space-y-3">
      {!loadingCount && count !== null && (
        <div className="flex items-center gap-2 text-sm text-secondary font-semibold">
          <Building2 className="h-4 w-4" />
          {count === 0 ? (
            <span>Seja um dos primeiros parceiros</span>
          ) : (
            <span>🏨 {count.toLocaleString("pt-BR")} estabelecimentos já cadastrados</span>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nome do responsável *" error={errors.nome}>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
        </Field>
        <Field label="Cargo / função *" error={errors.cargo}>
          <Input
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Ex: proprietário, gerente"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="E-mail comercial *" error={errors.email}>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailDup(false);
            }}
            onBlur={(e) => void checkDuplicate(e.target.value)}
            placeholder="contato@seuhotel.com.br"
          />
          {emailDup && !errors.email && (
            <p className="mt-1 text-sm text-destructive">Este e-mail já está cadastrado.</p>
          )}
        </Field>
        <Field label="WhatsApp *" error={errors.whatsapp}>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
          />
        </Field>
      </div>

      <Field label="Nome do estabelecimento *" error={errors.nome_estabelecimento}>
        <Input value={nomeEstab} onChange={(e) => setNomeEstab(e.target.value)} />
      </Field>

      <Field label="Tipo do estabelecimento *" error={errors.tipo}>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {ESTAB_TIPOS.map((t) => (
              <SelectItem key={t} value={t}>
                {ESTAB_TIPO_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Cidade *" error={errors.cidade}>
          <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
        </Field>
        <Field label="Estado *" error={errors.estado}>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_BR.map((e) => (
                <SelectItem key={e.sigla} value={e.sigla}>
                  {e.sigla} - {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Número de colaboradores *" error={errors.num_colaboradores}>
        <Select value={numCol} onValueChange={setNumCol}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {NUM_COL.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label="Seu estabelecimento já tem alguma iniciativa de inclusão para autistas?"
        error={errors.iniciativa_atual}
      >
        <RadioGroup value={iniciativa} onValueChange={setIniciativa} className="space-y-2">
          {[
            ["estruturado", "Sim, já temos algo estruturado"],
            ["informal", "Temos algumas adaptações informais"],
            ["queremos_comecar", "Ainda não, mas queremos começar"],
            ["nao_sei", "Não sei por onde começar"],
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value={v} />
              {l}
            </label>
          ))}
        </RadioGroup>
      </Field>

      <Field label="O que te interessa no Turismo Azul?">
        <div className="space-y-2">
          {INTERESSES.map((i) => (
            <label key={i} className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={interesses.includes(i)}
                onCheckedChange={() => toggleInteresse(i)}
              />
              <span>{i}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Como nos conheceu?">
        <Select value={comoConheceu} onValueChange={setComoConheceu}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {["Instagram", "Google", "Indicação", "Evento", "LinkedIn", "Outro"].map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} />
        <span>
          Concordo em receber comunicações do Turismo Azul sobre o lançamento da plataforma.
        </span>
      </label>
      {errors.consentimento && (
        <p className="text-sm text-destructive">{errors.consentimento}</p>
      )}

      <Button
        type="submit"
        disabled={enviando}
        className="w-full bg-primary hover:bg-secondary text-white min-h-[48px] text-base font-semibold"
      >
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando…
          </>
        ) : (
          "Cadastrar meu estabelecimento"
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
