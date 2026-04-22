import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, CalendarCheck, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/minha-conta/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ perfis: 0, reservas: 0, primeiroNome: "" });

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [{ count: pc }, { count: rc }, { data: prof }] = await Promise.all([
        supabase
          .from("perfil_sensorial")
          .select("*", { count: "exact", head: true })
          .eq("familia_id", user.id),
        supabase
          .from("reservas")
          .select("*", { count: "exact", head: true })
          .eq("familia_id", user.id),
        supabase
          .from("perfil_sensorial")
          .select("nome_autista")
          .eq("familia_id", user.id)
          .order("criado_em")
          .limit(1)
          .maybeSingle(),
      ]);
      setStats({ perfis: pc ?? 0, reservas: rc ?? 0, primeiroNome: prof?.nome_autista ?? "" });
    })();
  }, [user]);

  const nome = user?.user_metadata?.nome_responsavel?.split(" ")[0] ?? "Família";

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-2xl p-7 shadow-elegant">
        <h1 className="text-2xl md:text-3xl font-display font-bold">Olá, {nome}! 👋</h1>
        <p className="text-primary-foreground/80 mt-1">Bem-vindo ao seu espaço Turismo Azul.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Stat
          icon={<Users className="h-5 w-5" />}
          label="Perfis sensoriais"
          value={stats.perfis}
          link="/minha-conta/perfil-sensorial"
        />
        <Stat
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Reservas"
          value={stats.reservas}
          link="/minha-conta/reservas"
        />
      </div>

      {stats.primeiroNome && (
        <div className="bg-teal-claro border border-secondary/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-display font-semibold text-primary">
              Encontrar destinos para {stats.primeiroNome}
            </p>
            <p className="text-sm text-muted-foreground">
              Veja estabelecimentos compatíveis com o perfil sensorial cadastrado.
            </p>
          </div>
          <Button asChild className="bg-secondary hover:bg-secondary/90">
            <Link to="/explorar">
              Explorar <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {stats.perfis === 0 && (
        <div className="bg-azul-claro rounded-2xl p-6 text-center">
          <p className="font-display font-semibold text-primary">
            Comece criando um perfil sensorial
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            É rápido e ajuda a encontrar destinos compatíveis.
          </p>
          <Button asChild className="mt-3">
            <Link to="/minha-conta/perfil-sensorial">Criar perfil</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  link,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  link: string;
}) {
  return (
    <Link
      to={link}
      className="bg-card border rounded-2xl p-5 hover:shadow-soft transition flex items-center gap-4 group"
    >
      <div className="w-12 h-12 rounded-xl bg-azul-claro text-primary flex items-center justify-center group-hover:bg-secondary group-hover:text-secondary-foreground transition">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-primary">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </Link>
  );
}
