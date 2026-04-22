import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({ meta: [{ title: "Redefinir senha — Turismo Azul" }] }),
  component: RedefinirSenhaPage,
});

function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // O Supabase processa o token do hash automaticamente (detectSessionInUrl).
    // Verificamos se há sessão ativa de recovery.
    let cancelled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setHasRecoverySession(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setHasRecoverySession(!!session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== senha2) {
      setErro("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) {
      setErro("Não foi possível redefinir a senha. Solicite um novo link.");
      return;
    }
    setDone(true);
    toast.success("Senha redefinida com sucesso!");
    setTimeout(() => navigate({ to: "/minha-conta" }), 1500);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="text-center mb-6">
        <Logo />
      </div>
      <div className="bg-card rounded-2xl border shadow-soft p-8">
        <h1 className="text-2xl font-display font-bold text-primary text-center">
          Redefinir senha
        </h1>

        {hasRecoverySession === false && (
          <div className="mt-6 text-sm text-muted-foreground text-center space-y-3">
            <p>O link de recuperação expirou ou é inválido.</p>
            <Link to="/login" className="text-secondary font-semibold hover:underline">
              Voltar para o login
            </Link>
          </div>
        )}

        {done && (
          <div className="mt-6 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <p className="text-sm text-muted-foreground">
              Senha alterada. Redirecionando...
            </p>
          </div>
        )}

        {hasRecoverySession && !done && (
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div>
              <Label>Nova senha</Label>
              <div className="relative mt-1">
                <Input
                  type={showPwd ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="pr-10"
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
            </div>
            <div>
              <Label>Confirmar nova senha</Label>
              <Input
                type={showPwd ? "text" : "password"}
                required
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
                className="mt-1"
              />
            </div>
            {erro && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{erro}</div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? "Salvando..." : "Redefinir senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
