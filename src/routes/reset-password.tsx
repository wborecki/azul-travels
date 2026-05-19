import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { logAuthEvent } from "@/lib/logAuthEvent";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha · Turismo Azul" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  // O link de recuperação cai com `#access_token=...&type=recovery` no hash.
  // O supabase-js detecta automaticamente e cria a sessão temporária.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setHasSession(!!data.session);
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      if (evt === "PASSWORD_RECOVERY" || session) setHasSession(!!session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem.");
      return;
    }
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    void logAuthEvent("password_reset_complete", {
      sucesso: !error,
      email: userData.user?.email ?? null,
      metadata: error ? { reason: error.message } : {},
    });

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha redefinida! Você já está logado.");
    void navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
      <div className="w-full max-w-md bg-white border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-display font-bold" style={{ color: "#1a3666" }}>
          Redefinir senha
        </h1>

        {!ready ? (
          <p className="mt-4 text-sm text-muted-foreground">Validando link...</p>
        ) : !hasSession ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              O link de redefinição expirou ou é inválido. Solicite um novo na tela de login.
            </p>
            <Button
              onClick={() => navigate({ to: "/login" })}
              className="w-full h-11 rounded-lg text-white font-bold"
              style={{ background: "#f5a623" }}
            >
              Voltar para o login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha uma nova senha (mínimo 8 caracteres).
            </p>
            <div>
              <Label className="text-xs font-bold" style={{ color: "#1a3666" }}>Nova senha</Label>
              <Input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-12 rounded-lg"
              />
            </div>
            <div>
              <Label className="text-xs font-bold" style={{ color: "#1a3666" }}>Confirmar senha</Label>
              <Input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1.5 h-12 rounded-lg"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full h-12 rounded-lg text-white font-bold"
              style={{ background: "#f5a623" }}
            >
              {busy ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
