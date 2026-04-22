import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { resolvePostLoginPath } from "@/lib/postLoginRedirect";
import { Eye, EyeOff, CheckCircle2, Sparkles, Compass } from "lucide-react";

function GoogleIcon() {
  return (
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
  );
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Entrar — Turismo Azul" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [senhaErr, setSenhaErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  // Se já está logado, redireciona inteligente
  useEffect(() => {
    if (!authLoading && user) {
      resolvePostLoginPath(user.id, search.redirect ?? null).then((to) => {
        navigate({ to, replace: true });
      });
    }
  }, [authLoading, user, navigate, search.redirect]);

  const validate = () => {
    let ok = true;
    setEmailErr(null);
    setSenhaErr(null);
    setFormErr(null);
    if (!email.trim()) {
      setEmailErr("Informe seu e-mail.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailErr("E-mail inválido.");
      ok = false;
    }
    if (!senha) {
      setSenhaErr("Informe sua senha.");
      ok = false;
    } else if (senha.length < 6) {
      setSenhaErr("Senha deve ter pelo menos 6 caracteres.");
      ok = false;
    }
    return ok;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) {
      setLoading(false);
      if (error.message.toLowerCase().includes("invalid")) {
        setFormErr("E-mail ou senha incorretos. Tente novamente.");
      } else if (error.message.toLowerCase().includes("not confirmed")) {
        setFormErr("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
      } else {
        setFormErr("Erro ao entrar. Tente novamente.");
      }
      return;
    }
    if (data.user) {
      const to = await resolvePostLoginPath(data.user.id, search.redirect ?? null);
      toast.success("Bem-vindo de volta!");
      navigate({ to, replace: true });
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setFormErr(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
    if (result.error) {
      setLoading(false);
      setFormErr("Não foi possível entrar com Google. Tente novamente.");
      return;
    }
    if (result.redirected) return;
    // tokens recebidos sem redirect — useEffect cuidará do redirect inteligente
  };

  const handleForgotPassword = async () => {
    setFormErr(null);
    if (!email.trim()) {
      setEmailErr("Digite seu e-mail acima primeiro.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailErr("E-mail inválido.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      setFormErr("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }
    setForgotSent(true);
    toast.success("E-mail de recuperação enviado.");
  };

  return (
    <div className="min-h-[calc(100vh-4rem-1px)] grid lg:grid-cols-[55fr_45fr] bg-card">
      {/* COLUNA ESQUERDA — desktop */}
      <aside
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1B2E4B 0%, #1E5F6E 50%, #2CA8A0 100%)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(44,168,160,0.25) 0, transparent 50%)",
          }}
        />
        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <Logo variant="light" />
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display font-bold text-4xl leading-tight">Bem-vindo de volta.</h2>
          <p className="mt-3 text-lg text-white/85">
            Sua família merece cada viagem que planejou e adiou.
          </p>

          <ul className="mt-8 space-y-3 text-white/90">
            {[
              { icon: <CheckCircle2 className="h-5 w-5" />, t: "Destinos verificados para famílias TEA" },
              { icon: <Sparkles className="h-5 w-5" />, t: "Perfil sensorial do seu filho salvo com segurança" },
              { icon: <Compass className="h-5 w-5" />, t: "Compatibilidade automática com cada destino" },
            ].map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 text-teal-claro">{b.icon}</span>
                <span className="text-[15px]">{b.t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <blockquote className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15">
            <p className="text-white/95 italic text-[15px] leading-relaxed">
              “Pela primeira vez em 4 anos conseguimos planejar uma viagem sem ansiedade.”
            </p>
            <footer className="mt-3 text-sm text-white/75">
              — Renata, mãe do Miguel, 8 anos
            </footer>
          </blockquote>
        </div>
      </aside>

      {/* COLUNA DIREITA */}
      <section className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex justify-center">
            <Logo />
          </div>

          <h1 className="text-2xl font-display font-bold text-primary">Entrar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acesse sua conta Turismo Azul
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full mt-6 gap-2 h-11"
            aria-label="Continuar com Google"
          >
            <GoogleIcon />
            Continuar com Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailErr(null);
                  setFormErr(null);
                }}
                placeholder="seu@email.com"
                aria-invalid={!!emailErr}
                className={`mt-1 ${emailErr ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
              />
              {emailErr && (
                <p className="mt-1 text-xs text-destructive">{emailErr}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="login-senha">Senha</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs text-secondary font-medium hover:underline disabled:opacity-50"
                >
                  Esqueci minha senha →
                </button>
              </div>
              <div className="relative mt-1">
                <Input
                  id="login-senha"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setSenhaErr(null);
                    setFormErr(null);
                  }}
                  placeholder="Mínimo 6 caracteres"
                  aria-invalid={!!senhaErr}
                  className={`pr-10 ${senhaErr ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {senhaErr && (
                <p className="mt-1 text-xs text-destructive">{senhaErr}</p>
              )}
            </div>

            {formErr && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                {formErr}
              </div>
            )}

            {forgotSent && (
              <div className="text-sm text-success bg-success/10 rounded-lg p-3">
                E-mail de recuperação enviado para <strong>{email}</strong>. Verifique sua caixa de entrada.
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar com e-mail"
              )}
            </Button>
          </form>

          <div className="my-6 h-px bg-border" />

          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="text-secondary font-semibold hover:underline">
              Cadastre-se grátis →
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ao entrar, você concorda com nossos{" "}
            <Link to="/termos" className="underline hover:text-foreground">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link to="/privacidade" className="underline hover:text-foreground">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
