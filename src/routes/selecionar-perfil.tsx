import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Building2, HeartHandshake, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/selecionar-perfil")({
  head: () => ({ meta: [{ title: "Selecionar perfil · Turismo Azul" }] }),
  component: SelecionarPerfilPage,
});

function SelecionarPerfilPage() {
  const { user, loading, roles, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Carregando…
      </div>
    );
  }

  const cards = [
    roles.includes("admin") && {
      key: "admin",
      to: "/admin",
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Painel Admin",
      text: "Gerencie famílias, estabelecimentos e dados do projeto.",
      bg: "#1a2f5e",
      iconBg: "#dbeafe",
      iconColor: "#1d4ed8",
    },
    roles.includes("user") && {
      key: "familia",
      to: "/minha-conta",
      icon: <HeartHandshake className="h-6 w-6" />,
      title: "Área da Família",
      text: "Veja o perfil TEA e acompanhe sua lista de espera.",
      bg: "#1a3666",
      iconBg: "#fce7f3",
      iconColor: "#be185d",
    },
    roles.includes("estabelecimento") && {
      key: "estab",
      to: "/meu-estabelecimento",
      icon: <Building2 className="h-6 w-6" />,
      title: "Área do Estabelecimento",
      text: "Gerencie seu perfil e acompanhe a certificação.",
      bg: "#0f5132",
      iconBg: "#dcfce7",
      iconColor: "#15803d",
    },
  ].filter(Boolean) as Array<{
    key: string; to: string; icon: React.ReactNode; title: string; text: string;
    bg: string; iconBg: string; iconColor: string;
  }>;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Qual área você quer acessar?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Você tem mais de um perfil ativo. Escolha por onde começar.
          </p>
        </div>

        {cards.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Nenhum perfil disponível.
          </div>
        ) : (
          <div className={`grid gap-5 ${cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {cards.map((c) => (
              <Link
                key={c.key}
                to={c.to}
                className="group bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex flex-col"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: c.iconBg, color: c.iconColor }}
                >
                  {c.icon}
                </span>
                <h2 className="mt-4 text-lg font-display font-bold text-foreground">{c.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground flex-1">{c.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Acessar <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
