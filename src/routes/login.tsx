import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolvePostLoginPath } from "@/lib/postLoginRedirect";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const r = typeof search.redirect === "string" ? search.redirect : undefined;
    return r ? { redirect: r } : {};
  },
  head: () => ({
    meta: [{ title: "Entrar · Turismo Azul" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) {
      void resolvePostLoginPath(user.id, redirect ?? null).then((path) =>
        navigate({ to: path }),
      );
    }
  }, [user, loading, redirect, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-azul-claro/30">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 flex items-start justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl border shadow-sm p-6 md:p-8 mt-10">
          <h1 className="text-2xl font-display font-bold text-primary text-center">
            Conta da família
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            Entre ou crie sua conta para gerenciar o Perfil TEA e as reservas.
          </p>

          <Tabs defaultValue="entrar" className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="entrar" className="mt-4">
              <SignInForm />
            </TabsContent>
            <TabsContent value="criar" className="mt-4">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
      return;
    }
    toast.success("Bem-vinda de volta!");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label>E-mail</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Senha</Label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-secondary hover:bg-secondary/90 text-white">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Entrando…</> : "Entrar"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/minha-conta`,
        data: { nome_responsavel: nome },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Verifique seu e-mail para confirmar.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label>Seu nome</Label>
        <Input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do responsável" />
      </div>
      <div>
        <Label>E-mail</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Senha</Label>
        <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres.</p>
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-secondary hover:bg-secondary/90 text-white">
        {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando…</> : "Criar conta"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Ao criar conta você aceita os <Link to="/termos" className="underline">Termos</Link> e a{" "}
        <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
      </p>
    </form>
  );
}
