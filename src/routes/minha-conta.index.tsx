import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { HeartPulse, Plane, Loader2 } from "lucide-react";

export const Route = createFileRoute("/minha-conta/")({
  component: MinhaContaIndex,
});

function MinhaContaIndex() {
  const { user } = useAuth();
  const [perfilNome, setPerfilNome] = useState<string | null>(null);
  const [perfilExiste, setPerfilExiste] = useState(false);
  const [posicao, setPosicao] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);

    Promise.all([
      supabase
        .from("perfil_sensorial")
        .select("id, nome_autista")
        .eq("familia_id", user.id)
        .maybeSingle(),
      supabase
        .from("familia_profiles")
        .select("criado_em")
        .eq("id", user.id)
        .maybeSingle(),
    ]).then(async ([perfilRes, meRes]) => {
      if (!alive) return;
      setPerfilExiste(!!perfilRes.data);
      setPerfilNome(perfilRes.data?.nome_autista ?? null);

      if (meRes.data?.criado_em) {
        const { count } = await supabase
          .from("familia_profiles")
          .select("id", { count: "exact", head: true })
          .lte("criado_em", meRes.data.criado_em);
        if (alive) setPosicao(count ?? null);
      }
      if (alive) setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="text-muted-foreground inline-flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de boas-vindas */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white p-6 sm:p-8 shadow-sm">
        <h1 className="font-display font-bold text-2xl sm:text-3xl">
          Bem-vinda à Turismo Azul 💙
        </h1>
        <p className="mt-2 text-white/90 max-w-2xl">
          A plataforma está em construção. Você será avisada assim que lançarmos.
        </p>
      </div>

      {/* Dois cards de ação */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* CARD 1 — Perfil TEA */}
        <div className="bg-white border rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-azul-claro flex items-center justify-center text-primary">
              <HeartPulse className="h-6 w-6" />
            </div>
            <h2 className="font-display font-bold text-lg text-primary">
              Perfil Sensorial do seu filho
            </h2>
          </div>

          {perfilExiste ? (
            <>
              <p className="mt-3 text-sm text-foreground/80 flex-1">
                Perfil de <strong>{perfilNome ?? "seu filho"}</strong> completo ✓
              </p>
              <Button asChild variant="outline" className="mt-4 self-start border-primary text-primary hover:bg-azul-claro">
                <Link to="/minha-conta/perfil">Ver ou atualizar →</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-foreground/80 flex-1">
                Preencha uma vez agora. Na hora da reserva, ele já vem pronto.
              </p>
              <Button
                asChild
                className="mt-4 self-start bg-secondary hover:bg-secondary/90 text-white"
              >
                <Link to="/minha-conta/perfil">Criar perfil agora →</Link>
              </Button>
            </>
          )}
        </div>

        {/* CARD 2 — Lista de espera */}
        <div className="bg-white border rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-azul-claro flex items-center justify-center text-primary">
              <Plane className="h-6 w-6" />
            </div>
            <h2 className="font-display font-bold text-lg text-primary">
              Você está na lista
            </h2>
          </div>
          <p className="mt-3 text-sm text-foreground/80 flex-1">
            Avisaremos você assim que a plataforma abrir na sua região.
          </p>
          {posicao !== null && (
            <span className="mt-4 self-start inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-azul-claro text-primary">
              Posição #{posicao} na fila
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
