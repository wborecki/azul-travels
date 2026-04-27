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
import { Check, Copy, Loader2, MessageCircle, Users } from "lucide-react";

const PREOCUPACOES = [
  "Não saber se o local está preparado",
  "Medo de crises em público",
  "Dificuldade com filas e esperas",
  "Falta de cardápio ou comida adequada",
  "Não ter um espaço calmo se precisar",
  "Comunicação com a equipe do local",
  "Outro",
] as const;

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  cidade: z.string().trim().min(2, "Informe sua cidade").max(120),
  estado: z.string().length(2, "Selecione um estado"),
  status_diagnostico: z.string().min(1, "Selecione uma opção"),
  num_filhos_tea: z.string().min(1, "Selecione uma opção"),
  como_conheceu: z.string().optional(),
  consentimento: z.literal(true, { message: "Você precisa concordar para se inscrever" }),
});

type FormErrors = Partial<Record<keyof z.infer<typeof schema>, string>>;

const SHARE_URL = "https://azul-travels.lovable.app";
const SHARE_TEXT =
  "Conheci o Turismo Azul, a primeira plataforma de turismo para famílias com autismo no Brasil. Estou na lista de espera pra quando lançar: " +
  SHARE_URL;

export function LeadFamiliasForm({ origem = "home" }: { origem?: string } = {}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [emailDup, setEmailDup] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [statusDiag, setStatusDiag] = useState("");
  const [numFilhos, setNumFilhos] = useState("");
  const [preocupacoes, setPreocupacoes] = useState<string[]>([]);
  const [comoConheceu, setComoConheceu] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    void loadCount();
  }, []);

  async function loadCount() {
    try {
      const { count: c, error } = await supabase
        .from("leads_familias")
        .select("*", { count: "exact", head: true });
      if (error) {
        setCount(-1);
        return;
      }
      setCount(c ?? 0);
    } catch {
      setCount(-1);
    }
  }

  const togglePreocupacao = (p: string) => {
    setPreocupacoes((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  async function checkDuplicate(value: string) {
    const v = value.trim().toLowerCase();
    if (!v || !z.string().email().safeParse(v).success) {
      setEmailDup(false);
      return;
    }
    const { data } = await supabase
      .from("leads_familias")
      .select("id")
      .ilike("email", v)
      .maybeSingle();
    setEmailDup(!!data);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      nome,
      email,
      whatsapp,
      cidade,
      estado,
      status_diagnostico: statusDiag,
      num_filhos_tea: numFilhos,
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
    if (emailDup) {
      setErrors({ email: "Este e-mail já está na lista." });
      return;
    }
    setErrors({});
    setEnviando(true);
    const { error } = await supabase.from("leads_familias").insert({
      nome: parsed.data.nome,
      email: parsed.data.email.toLowerCase(),
      whatsapp: parsed.data.whatsapp || null,
      cidade: parsed.data.cidade,
      estado: parsed.data.estado,
      status_diagnostico: parsed.data.status_diagnostico,
      num_filhos_tea: parsed.data.num_filhos_tea,
      preocupacoes,
      como_conheceu: parsed.data.como_conheceu || null,
      origem,
    });
    setEnviando(false);
    if (error) {
      if (error.code === "23505") {
        setErrors({ email: "Este e-mail já está na lista." });
        return;
      }
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }
    setEnviado(true);
    void loadCount();
    if (typeof window !== "undefined" && typeof (window as { gtag?: unknown }).gtag === "function") {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "lead_familia", {
        event_category: "formulario",
        event_label: "lista_espera_familia",
      });
    }
  }

  function copyLink() {
    void navigator.clipboard.writeText(SHARE_URL).then(() => toast.success("Link copiado!"));
  }

  if (enviado) {
    return (
      <div className="bg-white rounded-2xl border p-8 text-center max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-full bg-secondary text-white flex items-center justify-center mx-auto">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-2xl font-display font-bold text-primary">Você está na lista!</h3>
        <p className="mt-2 text-muted-foreground">
          Vamos te avisar por e-mail assim que a plataforma abrir. Compartilhe com outras famílias
          TEA que você conhece.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button asChild className="bg-[#25D366] hover:bg-[#1ebe5d] text-white">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Compartilhar no WhatsApp
            </a>
          </Button>
          <Button variant="outline" onClick={copyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border p-6 md:p-8 shadow-sm space-y-5">
      {count !== null && count >= 0 && (
        <div className="flex items-center gap-2 text-sm text-secondary font-semibold">
          <Users className="h-4 w-4" />
          {count === 0 ? (
            <span>Seja um dos primeiros</span>
          ) : (
            <span>
              🧑‍🤝‍🧑 {count.toLocaleString("pt-BR")} famílias já na lista de espera
            </span>
          )}
        </div>
      )}

      <Field label="Nome do responsável *" error={errors.nome}>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
      </Field>

      <Field label="E-mail *" error={errors.email}>
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailDup(false);
          }}
          onBlur={(e) => void checkDuplicate(e.target.value)}
          placeholder="seu@email.com"
        />
        {emailDup && !errors.email && (
          <p className="mt-1 text-sm text-destructive">Este e-mail já está na lista.</p>
        )}
      </Field>

      <Field label="WhatsApp (opcional)">
        <Input
          value={whatsapp}
          onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
          placeholder="(00) 00000-0000"
          inputMode="numeric"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Cidade *" error={errors.cidade}>
          <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Sua cidade" />
        </Field>
        <Field label="Estado *" error={errors.estado}>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_BR.map((e) => (
                <SelectItem key={e.sigla} value={e.sigla}>
                  {e.sigla} — {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Você tem filho(s) com diagnóstico TEA? *" error={errors.status_diagnostico}>
        <RadioGroup value={statusDiag} onValueChange={setStatusDiag} className="space-y-2">
          {[
            ["confirmado", "Sim, diagnóstico confirmado"],
            ["em_processo", "Estamos em processo de diagnóstico"],
            ["suspeita", "Suspeita, ainda sem diagnóstico formal"],
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value={v} />
              {l}
            </label>
          ))}
        </RadioGroup>
      </Field>

      <Field label="Quantos filhos com TEA? *" error={errors.num_filhos_tea}>
        <Select value={numFilhos} onValueChange={setNumFilhos}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4+">4 ou mais</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="O que mais te preocupa numa viagem com seu filho?">
        <div className="space-y-2">
          {PREOCUPACOES.map((p) => (
            <label key={p} className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={preocupacoes.includes(p)}
                onCheckedChange={() => togglePreocupacao(p)}
              />
              <span>{p}</span>
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
            {["Instagram", "Google", "Indicação", "Grupo de WhatsApp/Telegram", "Outro"].map(
              (o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ),
            )}
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
        className="w-full bg-secondary hover:bg-primary text-white min-h-[48px] text-base font-semibold"
      >
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando…
          </>
        ) : (
          "Entrar na lista de espera"
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
