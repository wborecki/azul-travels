import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { ESTADOS_BR } from "@/lib/brazil";
import { Logo } from "@/components/Logo";
import {
  Check,
  Heart,
  Volume2,
  Sun,
  Hand,
  Users,
  MessageCircle,
  Home,
  Bell,
  ListChecks,
  Utensils,
  Waves,
  TreePine,
  PawPrint,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastre-se — Turismo Azul" }] }),
  component: Cadastro,
});

interface Step1 {
  nome: string;
  email: string;
  senha: string;
  senha2: string;
  telefone: string;
  cidade: string;
  estado: string;
}
interface Step2 {
  nome_autista: string;
  idade: string;
  nivel_tea: "leve" | "moderado" | "severo" | "";
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
  precisa_sala_sensorial: boolean;
  precisa_checkin_antecipado: boolean;
  precisa_fila_prioritaria: boolean;
  precisa_cardapio_visual: boolean;
  precisa_concierge_tea: boolean;
  dificuldade_esperar: boolean;
  dificuldade_mudanca_rotina: boolean;
  gosta_atividades_agua: boolean;
  gosta_natureza: boolean;
  gosta_animais: boolean;
  notas_adicionais: string;
}

function Cadastro() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [s1, setS1] = useState<Step1>({
    nome: "",
    email: "",
    senha: "",
    senha2: "",
    telefone: "",
    cidade: "",
    estado: "",
  });
  const [s2, setS2] = useState<Step2>({ nome_autista: "", idade: "", nivel_tea: "" });
  const [s3, setS3] = useState<Step3>({
    sensivel_sons: false,
    sensivel_luz: false,
    sensivel_texturas: false,
    sensivel_cheiros: false,
    sensivel_multidao: false,
    comunicacao_verbal: true,
    usa_caa: false,
    usa_libras: false,
    precisa_sala_sensorial: false,
    precisa_checkin_antecipado: false,
    precisa_fila_prioritaria: false,
    precisa_cardapio_visual: false,
    precisa_concierge_tea: false,
    dificuldade_esperar: false,
    dificuldade_mudanca_rotina: false,
    gosta_atividades_agua: false,
    gosta_natureza: false,
    gosta_animais: false,
    notas_adicionais: "",
  });
  const [loading, setLoading] = useState(false);

  const next1 = () => {
    if (!s1.nome || !s1.email || !s1.senha || !s1.estado) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (s1.senha.length < 6) {
      toast.error("Senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (s1.senha !== s1.senha2) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setStep(2);
  };
  const next2 = () => {
    if (!s2.nome_autista || !s2.nivel_tea) {
      toast.error("Informe o nome e nível TEA.");
      return;
    }
    setStep(3);
  };

  const finalizar = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/minha-conta`;
    const { data, error } = await supabase.auth.signUp({
      email: s1.email,
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
    if (error) {
      setLoading(false);
      toast.error(
        error.message.includes("already") ? "Email já cadastrado." : "Erro: " + error.message,
      );
      return;
    }
    if (data.user) {
      // perfil sensorial
      const { error: pErr } = await supabase.from("perfil_sensorial").insert({
        familia_id: data.user.id,
        nome_autista: s2.nome_autista,
        idade: s2.idade ? +s2.idade : null,
        nivel_tea: s2.nivel_tea as "leve" | "moderado" | "severo",
        ...s3,
      });
      if (pErr) console.error(pErr);
    }
    setLoading(false);
    setStep(4);
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="text-center mb-6">
        <Logo />
      </div>

      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex-1 flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full ${n <= step ? "bg-secondary" : "bg-muted"}`} />
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground mb-6">Passo {step} de 4</p>

      <div className="bg-card rounded-2xl border shadow-soft p-8">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h1 className="font-display font-bold text-2xl text-primary">Dados do responsável</h1>
              <p className="text-sm text-muted-foreground">Suas informações de contato.</p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setLoading(true);
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: `${window.location.origin}/minha-conta`,
                });
                if (result.error) {
                  setLoading(false);
                  toast.error("Não foi possível cadastrar com Google");
                  return;
                }
                if (result.redirected) return;
                navigate({ to: "/minha-conta" });
              }}
              disabled={loading}
              className="w-full gap-2"
              aria-label="Cadastrar com Google"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38Z"
                />
              </svg>
              Cadastro rápido com Google
            </Button>
            <p className="text-xs text-muted-foreground text-center -mt-2">
              Você completará o perfil sensorial depois, em "Minha conta".
            </p>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                ou com email
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div>
              <Label>Nome completo *</Label>
              <Input
                value={s1.nome}
                onChange={(e) => setS1({ ...s1, nome: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={s1.email}
                onChange={(e) => setS1({ ...s1, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Senha *</Label>
                <Input
                  type="password"
                  value={s1.senha}
                  onChange={(e) => setS1({ ...s1, senha: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Confirmar *</Label>
                <Input
                  type="password"
                  value={s1.senha2}
                  onChange={(e) => setS1({ ...s1, senha2: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={s1.telefone}
                onChange={(e) => setS1({ ...s1, telefone: e.target.value })}
                className="mt-1"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cidade</Label>
                <Input
                  value={s1.cidade}
                  onChange={(e) => setS1({ ...s1, cidade: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Estado *</Label>
                <Select value={s1.estado} onValueChange={(v) => setS1({ ...s1, estado: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((e) => (
                      <SelectItem key={e.sigla} value={e.sigla}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={next1} className="w-full bg-primary hover:bg-primary/90 mt-2">
              Próximo
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-secondary font-semibold">
                Entre
              </Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h1 className="font-display font-bold text-2xl text-primary">
                Vamos conhecer seu filho/a
              </h1>
              <p className="text-sm text-muted-foreground">
                Essas informações ajudam a recomendar destinos compatíveis.
              </p>
            </div>
            <div>
              <Label>Nome *</Label>
              <Input
                value={s2.nome_autista}
                onChange={(e) => setS2({ ...s2, nome_autista: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Idade</Label>
              <Input
                type="number"
                min={0}
                max={120}
                value={s2.idade}
                onChange={(e) => setS2({ ...s2, idade: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="mb-2 block">Nível do TEA *</Label>
              <div className="grid sm:grid-cols-3 gap-2">
                {[
                  { v: "leve", t: "Leve (Nível 1)", d: "Suporte leve" },
                  { v: "moderado", t: "Moderado (Nível 2)", d: "Suporte substancial" },
                  { v: "severo", t: "Severo (Nível 3)", d: "Suporte muito substancial" },
                ].map((n) => (
                  <button
                    key={n.v}
                    onClick={() =>
                      setS2({ ...s2, nivel_tea: n.v as "leve" | "moderado" | "severo" })
                    }
                    className={`text-left p-3 rounded-xl border-2 transition ${s2.nivel_tea === n.v ? "border-secondary bg-teal-claro" : "border-border hover:border-secondary/50"}`}
                  >
                    <div className="font-semibold text-sm text-primary">{n.t}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{n.d}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={next2} className="flex-1 bg-primary hover:bg-primary/90">
                Próximo
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-primary">
                Sensibilidades e necessidades
              </h1>
              <p className="text-sm text-muted-foreground">
                Marque tudo que se aplica. Você poderá ajustar depois.
              </p>
            </div>
            <Section title="Sensibilidades sensoriais">
              <Toggle
                icon={<Volume2 className="h-4 w-4" />}
                label="Sons altos"
                checked={s3.sensivel_sons}
                onChange={(v) => setS3({ ...s3, sensivel_sons: v })}
              />
              <Toggle
                icon={<Sun className="h-4 w-4" />}
                label="Luz intensa"
                checked={s3.sensivel_luz}
                onChange={(v) => setS3({ ...s3, sensivel_luz: v })}
              />
              <Toggle
                icon={<Hand className="h-4 w-4" />}
                label="Texturas"
                checked={s3.sensivel_texturas}
                onChange={(v) => setS3({ ...s3, sensivel_texturas: v })}
              />
              <Toggle
                icon={<Eye className="h-4 w-4" />}
                label="Cheiros fortes"
                checked={s3.sensivel_cheiros}
                onChange={(v) => setS3({ ...s3, sensivel_cheiros: v })}
              />
              <Toggle
                icon={<Users className="h-4 w-4" />}
                label="Multidão"
                checked={s3.sensivel_multidao}
                onChange={(v) => setS3({ ...s3, sensivel_multidao: v })}
              />
            </Section>
            <Section title="Comunicação">
              <Toggle
                icon={<MessageCircle className="h-4 w-4" />}
                label="Comunicação verbal"
                checked={s3.comunicacao_verbal}
                onChange={(v) => setS3({ ...s3, comunicacao_verbal: v })}
              />
              <Toggle
                icon={<MessageCircle className="h-4 w-4" />}
                label="Usa CAA"
                checked={s3.usa_caa}
                onChange={(v) => setS3({ ...s3, usa_caa: v })}
              />
              <Toggle
                icon={<Hand className="h-4 w-4" />}
                label="Usa Libras"
                checked={s3.usa_libras}
                onChange={(v) => setS3({ ...s3, usa_libras: v })}
              />
            </Section>
            <Section title="Precisa de">
              <Toggle
                icon={<Home className="h-4 w-4" />}
                label="Sala sensorial"
                checked={s3.precisa_sala_sensorial}
                onChange={(v) => setS3({ ...s3, precisa_sala_sensorial: v })}
              />
              <Toggle
                icon={<Bell className="h-4 w-4" />}
                label="Check-in antecipado"
                checked={s3.precisa_checkin_antecipado}
                onChange={(v) => setS3({ ...s3, precisa_checkin_antecipado: v })}
              />
              <Toggle
                icon={<ListChecks className="h-4 w-4" />}
                label="Fila prioritária"
                checked={s3.precisa_fila_prioritaria}
                onChange={(v) => setS3({ ...s3, precisa_fila_prioritaria: v })}
              />
              <Toggle
                icon={<Utensils className="h-4 w-4" />}
                label="Cardápio visual"
                checked={s3.precisa_cardapio_visual}
                onChange={(v) => setS3({ ...s3, precisa_cardapio_visual: v })}
              />
              <Toggle
                icon={<Heart className="h-4 w-4" />}
                label="Concierge TEA"
                checked={s3.precisa_concierge_tea}
                onChange={(v) => setS3({ ...s3, precisa_concierge_tea: v })}
              />
            </Section>
            <Section title="Dificuldades">
              <Toggle
                icon={<ListChecks className="h-4 w-4" />}
                label="Esperar em filas"
                checked={s3.dificuldade_esperar}
                onChange={(v) => setS3({ ...s3, dificuldade_esperar: v })}
              />
              <Toggle
                icon={<Bell className="h-4 w-4" />}
                label="Mudanças de rotina"
                checked={s3.dificuldade_mudanca_rotina}
                onChange={(v) => setS3({ ...s3, dificuldade_mudanca_rotina: v })}
              />
            </Section>
            <Section title="Gosta de">
              <Toggle
                icon={<Waves className="h-4 w-4" />}
                label="Atividades na água"
                checked={s3.gosta_atividades_agua}
                onChange={(v) => setS3({ ...s3, gosta_atividades_agua: v })}
              />
              <Toggle
                icon={<TreePine className="h-4 w-4" />}
                label="Natureza"
                checked={s3.gosta_natureza}
                onChange={(v) => setS3({ ...s3, gosta_natureza: v })}
              />
              <Toggle
                icon={<PawPrint className="h-4 w-4" />}
                label="Animais"
                checked={s3.gosta_animais}
                onChange={(v) => setS3({ ...s3, gosta_animais: v })}
              />
            </Section>
            <div>
              <Label>Alguma informação adicional importante?</Label>
              <Textarea
                rows={3}
                value={s3.notas_adicionais}
                onChange={(e) => setS3({ ...s3, notas_adicionais: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={finalizar}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {loading ? "Criando conta..." : "Finalizar cadastro"}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/15 flex items-center justify-center">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h1 className="font-display font-bold text-2xl text-primary">
              Pronto, {s1.nome.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground">
              Agora você pode explorar destinos compatíveis com o perfil de{" "}
              <strong>{s2.nome_autista}</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/explorar">Explorar estabelecimentos</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/minha-conta">Ir para minha conta</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-display font-bold text-primary mb-2">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function Toggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm text-left transition ${checked ? "border-secondary bg-teal-claro text-primary" : "border-border hover:border-secondary/40"}`}
    >
      <span className={`${checked ? "text-secondary" : "text-muted-foreground"}`}>{icon}</span>
      <span className="font-medium">{label}</span>
      {checked && <Check className="h-4 w-4 ml-auto text-secondary" />}
    </button>
  );
}
