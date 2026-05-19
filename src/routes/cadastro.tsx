import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { ArrowLeft, ArrowRight, Building2, HeartHandshake, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logAuthEvent } from "@/lib/audit/logAuthEvent";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta · Turismo Azul" }] }),
  component: CadastroPage,
});

type AccountType = "familia" | "estabelecimento";

function CadastroPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user) navigate({ to: "/minha-conta" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col items-center justify-center p-10 text-white" style={{ background: "#1a3666" }}>
        <div className="max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <Logo variant="dark" showTagline={false} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Junte-se a nós. 💙</h1>
            <p className="mt-2 text-white/75 text-sm">
              Cadastre-se para acessar a Turismo Azul.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8 flex justify-center">
            <Logo />
          </div>

          {step === 1 && (
            <StepType
              selected={accountType}
              onSelect={setAccountType}
              onContinue={() => accountType && setStep(2)}
            />
          )}

          {step === 2 && accountType && (
            <StepData
              accountType={accountType}
              onBack={() => setStep(1)}
            />
          )}

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function StepType({
  selected,
  onSelect,
  onContinue,
}: {
  selected: AccountType | null;
  onSelect: (t: AccountType) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-foreground">
        Como você quer se cadastrar?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Escolha o tipo de perfil que melhor representa você.
      </p>

      <div className="mt-6 grid gap-3">
        <TypeCard
          active={selected === "familia"}
          onClick={() => onSelect("familia")}
          icon={<HeartHandshake className="h-5 w-5" />}
          title="Sou família com membro TEA"
          text="Encontre destinos preparados para o seu filho e cadastre o perfil sensorial dele."
        />
        <TypeCard
          active={selected === "estabelecimento"}
          onClick={() => onSelect("estabelecimento")}
          icon={<Building2 className="h-5 w-5" />}
          title="Sou hotel ou estabelecimento"
          text="Cadastre seu local, obtenha o Selo Azul e apareça para famílias TEA."
        />
      </div>

      <Button
        className="mt-6 w-full h-11 text-white font-bold"
        style={{ background: "#f5a623" }}
        disabled={!selected}
        onClick={onContinue}
      >
        Continuar <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

function TypeCard({
  active,
  onClick,
  icon,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition ${
        active
          ? "border-primary bg-azul-claro/40 ring-2 ring-primary/20"
          : "border-border hover:border-primary/40 hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
          active ? "bg-primary text-white" : "bg-muted text-foreground/70"
        }`}>
          {icon}
        </span>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
    </button>
  );
}

function StepData({ accountType, onBack }: { accountType: AccountType; onBack: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }
    setBusy(true);
    const destino = accountType === "estabelecimento" ? "/meu-estabelecimento" : "/minha-conta";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${destino}`,
        data: {
          account_type: accountType,
          nome_responsavel: nome,
          whatsapp,
          telefone: whatsapp,
          origem: accountType === "estabelecimento" ? "cadastro_site" : "cadastro_site",
        },
      },
    });
    setBusy(false);
    if (error) {
      void logAuthEvent("signup_failure", {
        sucesso: false,
        email,
        metadata: { account_type: accountType, reason: error.message },
      });
      toast.error(error.message);
      return;
    }
    void logAuthEvent("signup_success", {
      userId: data.user?.id ?? null,
      email,
      metadata: { account_type: accountType },
    });
    toast.success("Conta criada! Verifique seu e-mail para confirmar.");
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h2 className="text-2xl font-display font-bold text-foreground">
        Seus dados
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {accountType === "estabelecimento"
          ? "Conta de Hotel/Estabelecimento."
          : "Conta de Família TEA."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label>Nome completo *</Label>
          <Input required value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
        </div>
        <div>
          <Label>E-mail *</Label>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label>WhatsApp (opcional)</Label>
          <Input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div>
          <Label>Senha *</Label>
          <Input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres.</p>
        </div>
        <div>
          <Label>Confirmar senha *</Label>
          <Input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="w-full h-11 text-white font-bold"
          style={{ background: "#f5a623" }}
        >
          {busy ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando…</>
          ) : (
            <>Criar minha conta <ArrowRight className="h-4 w-4 ml-1" /></>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Ao criar conta você aceita os{" "}
          <Link to="/termos" className="underline">Termos</Link> e a{" "}
          <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
        </p>
      </form>
    </div>
  );
}
