import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export type AccountType = "familia" | "estabelecimento";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountType: AccountType;
  email: string;
  /** Metadata passed to signUp - consumed by handle_new_user trigger */
  signupMetadata: Record<string, unknown>;
}

const passwordSchema = z
  .string()
  .min(6, "Senha precisa ter no mínimo 6 caracteres")
  .max(72, "Senha muito longa");

export function CreateAccountModal({
  open,
  onOpenChange,
  accountType,
  email,
  signupMetadata,
}: Props) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const destino = accountType === "familia" ? "/minha-conta" : "/meu-estabelecimento";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Senha inválida");
      return;
    }
    if (password !== confirmar) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${destino}`,
        data: { account_type: accountType, ...signupMetadata },
      },
    });
    setLoading(false);

    if (signUpError) {
      const msg = signUpError.message?.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        setError("Este e-mail já tem conta. Faça login.");
      } else {
        setError(signUpError.message || "Erro ao criar conta. Tente novamente.");
      }
      return;
    }

    toast.success("Conta criada! Bem-vindo(a) ao Turismo Azul 💙");
    onOpenChange(false);
    navigate({ to: destino });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">Criar sua conta</DialogTitle>
          <DialogDescription>
            Defina uma senha para acessar sua área no Turismo Azul.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">E-mail</Label>
            <Input value={email} disabled readOnly />
          </div>
          <div>
            <Label className="mb-1.5 block">Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Confirme a senha</Label>
            <Input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary hover:bg-secondary/90 text-white min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando…
              </>
            ) : (
              "Criar conta →"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
