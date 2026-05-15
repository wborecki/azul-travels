import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolvePostLoginPath } from "@/lib/postLoginRedirect";
import { Logo } from "@/components/Logo";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const r = typeof search.redirect === "string" ? search.redirect : undefined;
    return r ? { redirect: r } : {};
  },
  head: () => ({ meta: [{ title: "Entrar · Turismo Azul" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      void resolvePostLoginPath(user.id, redirect ?? null).then((path) =>
        navigate({ to: path }),
      );
    }
  }, [user, loading, redirect, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
      );
      return;
    }
    toast.success("Bem-vindo de volta!");
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error("Digite seu e-mail acima primeiro.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Enviamos um link de redefinição para o seu e-mail.");
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[45fr_55fr]">
      {/* Left panel */}
      <div
        className="hidden md:flex flex-col items-center justify-center p-10 text-white"
        style={{ background: "#1a3666" }}
      >
        <div className="max-w-sm text-center flex flex-col items-center">
          <div className="flex justify-center" style={{ height: 48 }}>
            <Logo variant="dark" showTagline={false} className="h-12" />
          </div>
          <div
            style={{
              width: 60,
              height: 2,
              background: "#f5a623",
              marginTop: 24,
              marginBottom: 24,
            }}
          />
          <h1 className="font-display font-bold" style={{ fontSize: 28 }}>
            Bem-vindo de volta.
          </h1>
          <p className="mt-3 italic font-thin text-white" style={{ opacity: 0.7 }}>
            Acesse sua conta para continuar.
          </p>

          <ul
            className="text-white text-left"
            style={{ marginTop: 48, opacity: 0.5, fontSize: 11, lineHeight: 1.4 }}
          >
            <li style={{ marginBottom: 8 }}>💙 Famílias TEA</li>
            <li style={{ marginBottom: 8 }}>🏨 Estabelecimentos parceiros</li>
            <li>🛡️ Administradores do projeto</li>
          </ul>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center bg-white p-6 md:p-10 min-h-screen">
        <div className="w-full" style={{ maxWidth: 380 }}>
          <div className="md:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          <h2 className="font-display font-bold" style={{ fontSize: 24, color: "#1a3666" }}>
            Entrar na sua conta
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use seu e-mail e senha cadastrados.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label className="text-xs font-bold" style={{ color: "#1a3666" }}>E-mail</Label>
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-12 rounded-lg border-[1.5px] border-[#e5e7eb] focus-visible:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/20"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold" style={{ color: "#1a3666" }}>Senha</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-12 rounded-lg border-[1.5px] border-[#e5e7eb] focus-visible:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/20"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full h-12 rounded-lg text-white font-bold hover:brightness-95 transition"
              style={{ background: "#f5a623" }}
            >
              {busy ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Entrando…</>
              ) : (
                <>Entrar <ArrowRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground" style={{ marginTop: 20, marginBottom: 20 }}>
            <div className="flex-1 h-px bg-border" />
            <span>ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="font-bold no-underline hover:underline" style={{ color: "#2563eb" }}>
              Cadastre-se
            </Link>
          </p>

          <div style={{ marginTop: 32 }}>
            <div className="h-px bg-border" />
            <p className="text-center text-muted-foreground" style={{ fontSize: 11, marginTop: 12 }}>
              🔒 Seus dados estão protegidos com criptografia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
