import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  HeartPulse,
  Trophy,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/minha-conta/")({
  component: MinhaContaIndex,
});

function MinhaContaIndex() {
  const { user } = useAuth();
  const [perfilNome, setPerfilNome] = useState<string | null>(null);
  const [perfilExiste, setPerfilExiste] = useState(false);
  const [posicao, setPosicao] = useState<number | null>(null);
  const [totalFila, setTotalFila] = useState<number | null>(null);
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
        const [{ count: ate }, { count: total }] = await Promise.all([
          supabase
            .from("familia_profiles")
            .select("id", { count: "exact", head: true })
            .lte("criado_em", meRes.data.criado_em),
          supabase
            .from("familia_profiles")
            .select("id", { count: "exact", head: true }),
        ]);
        if (alive) {
          setPosicao(ate ?? null);
          setTotalFila(total ?? null);
        }
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

  const primeiroNome =
    (user?.user_metadata?.nome_responsavel as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "família";

  return (
    <div className="space-y-8 pb-2">
      {/* Banner de boas-vindas — compacto e acolhedor */}
      <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/85 text-white p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #d4a84c 0%, transparent 70%)" }}
          aria-hidden
        />
        <div className="relative">
          <h1 className="font-display font-bold text-xl sm:text-2xl">
            Olá, {primeiroNome} 💙
          </h1>
          <p className="mt-2 text-white/90 max-w-2xl text-sm sm:text-[15px] leading-relaxed">
            Sua jornada começa aqui. Enquanto preparamos os destinos, você já
            pode montar o perfil do seu filho para quando lançarmos.
          </p>
        </div>
      </div>

      {/* Grid principal — 3 cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* CARD 1 — Perfil Sensorial */}
        <div className="bg-white border rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-azul-claro flex items-center justify-center text-primary">
              <HeartPulse className="h-6 w-6" />
            </div>
            <h2 className="font-display font-bold text-base text-primary leading-tight">
              Perfil Sensorial do Seu Filho
            </h2>
          </div>

          {perfilExiste ? (
            <>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 self-start px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-4 w-4" /> Perfil completo
              </div>
              <p className="mt-3 text-sm text-foreground/70 flex-1">
                Perfil de <strong>{perfilNome ?? "seu filho"}</strong> salvo.
                Você pode atualizar a qualquer momento.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-4 self-start border-primary text-primary hover:bg-azul-claro"
              >
                <Link to="/minha-conta/perfil">Editar perfil</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-foreground/75 flex-1 leading-relaxed">
                Conte para nós como seu filho percebe o mundo. Assim conseguimos
                indicar destinos que realmente acolhem.
              </p>
              <Button
                asChild
                className="mt-4 self-start bg-secondary hover:bg-secondary/90 text-white"
              >
                <Link to="/minha-conta/perfil">
                  Criar perfil agora <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* CARD 2 — Posição na lista */}
        <div className="bg-gradient-to-br from-azul-claro to-white border border-primary/15 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #d4a84c, #b8852a)" }}
            >
              <Trophy className="h-6 w-6" />
            </div>
            <h2 className="font-display font-bold text-base text-primary leading-tight">
              Sua Posição na Lista
            </h2>
          </div>

          {posicao !== null ? (
            (() => {
              const atras =
                totalFila !== null ? Math.max(0, totalFila - posicao) : null;

              // Estimativa de onda de acesso (lotes de 25 famílias)
              let onda: string;
              let prazo: string;
              let cor: string;
              if (posicao <= 25) {
                onda = "1ª onda de acesso";
                prazo = "nas primeiras 2 semanas após o lançamento";
                cor = "bg-secondary/15 text-secondary border-secondary/30";
              } else if (posicao <= 75) {
                onda = "2ª onda de acesso";
                prazo = "em até ~30 dias após o lançamento";
                cor = "bg-primary/10 text-primary border-primary/25";
              } else if (posicao <= 200) {
                onda = "3ª onda de acesso";
                prazo = "em até ~60 dias após o lançamento";
                cor = "bg-roxo-suave/15 text-roxo-suave-foreground border-roxo-suave/40";
              } else {
                onda = "Onda estendida";
                prazo = "em até ~90 dias após o lançamento";
                cor = "bg-muted text-foreground/80 border-border";
              }

              return (
                <>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display font-bold text-5xl text-primary leading-none">
                      #{posicao}
                    </span>
                    <span className="text-sm text-primary/70 font-medium">
                      {totalFila !== null ? `de ${totalFila}` : "na fila"}
                    </span>
                  </div>

                  <div
                    className={`mt-3 inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full border text-xs font-semibold ${cor}`}
                  >
                    <Sparkles className="h-3 w-3" />
                    {onda}
                  </div>

                  <p className="mt-3 text-sm text-foreground/85 leading-relaxed">
                    Pela sua posição, você deve receber acesso{" "}
                    <strong>{prazo}</strong>.
                  </p>

                  {atras !== null && atras > 0 && (
                    <p className="mt-2 text-xs text-foreground/60">
                      {atras} {atras === 1 ? "família entrou" : "famílias entraram"} depois de você.
                    </p>
                  )}

                  <p className="mt-3 text-xs text-foreground/65 leading-relaxed flex-1">
                    Famílias com perfil sensorial completo entram primeiro em cada onda.
                  </p>
                </>
              );
            })()
          ) : (
            <>
              <div className="mt-4 text-sm text-foreground/70">
                Calculando sua posição…
              </div>
              <p className="mt-3 text-sm text-foreground/75 leading-relaxed flex-1">
                Em instantes mostramos sua previsão de acesso.
              </p>
            </>
          )}
        </div>

        {/* CARD 3 — Benefícios */}
        <div className="bg-white border rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-azul-claro flex items-center justify-center text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="font-display font-bold text-base text-primary leading-tight">
              Benefícios Garantidos
            </h2>
          </div>

          <ul className="mt-4 space-y-3 flex-1">
            {[
              "Acesso antecipado à plataforma",
              "Filtro por perfil sensorial do seu filho",
              "Destinos verificados pela nossa equipe",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
                <CheckCircle2 className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Seção "Enquanto isso..." */}
      <section className="rounded-2xl bg-slate-50/80 border border-slate-200/70 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden />
          <h3 className="font-display font-semibold text-sm uppercase tracking-wide text-primary/80">
            Enquanto isso…
          </h3>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              icon: BookOpen,
              titulo: "O que é o perfil sensorial?",
              desc: "Entenda como ele torna cada viagem mais confortável.",
              to: "/nossa-historia",
            },
            {
              icon: ShieldCheck,
              titulo: "Como funciona o Selo Azul?",
              desc: "Conheça nosso processo de verificação de estabelecimentos.",
              to: "/estabelecimentos",
            },
            {
              icon: Users,
              titulo: "Conheça nossa história",
              desc: "Quem somos e por que criamos a Turismo Azul.",
              to: "/nossa-historia",
            },
          ].map(({ icon: Icon, titulo, desc, to }) => (
            <Link
              key={titulo}
              to={to}
              className="group bg-white rounded-xl border border-slate-200/80 p-4 hover:border-primary/30 hover:shadow-sm transition-all flex flex-col"
            >
              <div className="h-9 w-9 rounded-lg bg-azul-claro flex items-center justify-center text-primary mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm text-primary leading-snug">
                {titulo}
              </h4>
              <p className="mt-1 text-xs text-foreground/65 leading-relaxed flex-1">
                {desc}
              </p>
              <span className="mt-3 inline-flex items-center text-xs font-semibold text-secondary group-hover:gap-1.5 gap-1 transition-all">
                Saber mais <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
