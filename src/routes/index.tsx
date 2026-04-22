import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EstabCard, type Estab } from "@/components/EstabCard";
import { Search, MapPin, ShieldCheck, Award, Camera, Heart, Gift, Star, ArrowRight, Sparkles, Calendar } from "lucide-react";
import heroImg from "@/assets/hero-familia.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Turismo Azul — Viajar com autismo, com confiança" },
      {
        name: "description",
        content:
          "Marketplace que conecta famílias TEA a hotéis, restaurantes e parques realmente preparados. Selo Azul, Tour 360°, benefícios exclusivos.",
      },
      { property: "og:title", content: "Turismo Azul" },
      { property: "og:description", content: "Viajar com autismo. Com confiança, com conforto, com alegria." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [destaques, setDestaques] = useState<Estab[]>([]);
  const [beneficios, setBeneficios] = useState<Estab[]>([]);
  const [artigos, setArtigos] = useState<{ slug: string; titulo: string; resumo: string; foto_capa: string | null; categoria: string | null; criado_em: string }[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    void (async () => {
      const { data: d } = await supabase
        .from("estabelecimentos")
        .select("*")
        .eq("status", "ativo")
        .eq("destaque", true)
        .limit(6);
      setDestaques((d as Estab[]) ?? []);

      const { data: b } = await supabase
        .from("estabelecimentos")
        .select("*")
        .eq("status", "ativo")
        .eq("tem_beneficio_tea", true)
        .limit(3);
      setBeneficios((b as Estab[]) ?? []);

      const { data: a } = await supabase
        .from("conteudo_tea")
        .select("slug,titulo,resumo,foto_capa,categoria,criado_em")
        .eq("publicado", true)
        .order("criado_em", { ascending: false })
        .limit(3);
      setArtigos(a ?? []);
    })();
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/40 to-primary/80" />

        <div className="relative container mx-auto px-4 pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="max-w-3xl mx-auto text-center text-white animate-fade-up">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-amarelo" />
              Marketplace pioneiro de turismo inclusivo TEA
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-display font-extrabold leading-[1.05] text-shadow-soft">
              Viajar com autismo.
              <br />
              <span className="text-secondary">Com confiança, com conforto, com alegria.</span>
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/85 max-w-2xl mx-auto">
              O primeiro marketplace brasileiro que conecta famílias TEA a destinos
              realmente preparados.
            </p>

            {/* Busca */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `/explorar?q=${encodeURIComponent(busca)}`;
              }}
              className="mt-8 bg-white rounded-2xl p-2 shadow-elegant flex items-center gap-2 max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Destino, cidade ou tipo de estabelecimento..."
                  className="border-0 shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-xl bg-primary hover:bg-primary/90 px-6">
                Buscar
              </Button>
            </form>

            {/* Chips */}
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {[
                { label: "🏨 Hotéis", q: "hotel" },
                { label: "🍽️ Restaurantes", q: "restaurante" },
                { label: "🎡 Parques", q: "parque" },
                { label: "🌊 Resorts", q: "resort" },
                { label: "🌳 Pousadas", q: "pousada" },
              ].map((c) => (
                <Link
                  key={c.q}
                  to="/explorar"
                  search={{ tipo: c.q }}
                  className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-medium border border-white/20 transition"
                >
                  {c.label}
                </Link>
              ))}
            </div>

            {/* Indicadores */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl mx-auto text-center">
              <div>
                <div className="text-2xl md:text-3xl font-display font-bold text-secondary">247</div>
                <div className="text-xs text-white/70">Estabelecimentos certificados</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-display font-bold text-secondary">12</div>
                <div className="text-xs text-white/70">Estados cobertos</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-display font-bold text-secondary">4.8★</div>
                <div className="text-xs text-white/70">Satisfação das famílias</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-secondary font-semibold uppercase tracking-wide text-sm">Simples e seguro</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold text-primary">Como funciona</h2>
            <p className="mt-3 text-muted-foreground">Em 3 passos você encontra o destino certo para sua família.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "1", t: "Crie o perfil sensorial", d: "Cadastre as necessidades específicas do seu filho — sensibilidades, comunicação e preferências." },
              { n: "2", t: "Explore destinos compatíveis", d: "Veja estabelecimentos certificados e priorizados pelas necessidades do perfil." },
              { n: "3", t: "Reserve com confiança", d: "Solicite a reserva com o perfil sensorial enviado automaticamente ao estabelecimento." },
            ].map((s) => (
              <div key={s.n} className="relative bg-azul-claro rounded-2xl p-7 text-center shadow-soft">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg mb-4">
                  {s.n}
                </div>
                <h3 className="font-display font-bold text-primary text-lg">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SELOS */}
      <section className="py-20 bg-azul-claro">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-secondary font-semibold uppercase tracking-wide text-sm">Confiança</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold text-primary">Selos que importam</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { i: ShieldCheck, c: "bg-primary text-primary-foreground", t: "Selo Azul", d: "Certificação Absoluto Educacional. O padrão-ouro de turismo inclusivo TEA no Brasil." },
              { i: Award, c: "bg-success text-success-foreground", t: "Certificado Governamental", d: "Estabelecimentos reconhecidos por órgãos públicos como acessíveis a pessoas com TEA." },
              { i: Star, c: "bg-amarelo text-amarelo-foreground", t: "Selos Privados", d: "Certificações independentes de organizações especializadas em inclusão." },
              { i: Camera, c: "bg-amarelo text-amarelo-foreground", t: "Tour 360°", d: "Visite o ambiente virtualmente antes de chegar — preparação visual essencial." },
            ].map((b) => (
              <div key={b.t} className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-elegant transition">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${b.c}`}>
                  <b.i className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display font-bold text-primary">{b.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-secondary font-semibold uppercase tracking-wide text-sm">Recomendados</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold text-primary">
                Estabelecimentos em destaque
              </h2>
            </div>
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link to="/explorar">Ver todos <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          {destaques.length === 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destaques.map((e) => (
                <EstabCard key={e.id} e={e} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BENEFICIOS TEA */}
      <section className="py-20 gradient-teal text-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold">
                <Gift className="h-3.5 w-3.5" />
                Benefícios exclusivos
              </span>
              <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold">
                Entrada grátis e descontos para famílias TEA
              </h2>
              <p className="mt-4 text-white/85 text-lg">
                Estabelecimentos parceiros oferecem benefícios exclusivos para pessoas autistas
                e seus acompanhantes — basta apresentar a CIPTEA.
              </p>
              <Button asChild size="lg" className="mt-6 bg-white text-secondary hover:bg-white/90">
                <Link to="/beneficios-tea">Ver todos os benefícios <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="space-y-3">
              {beneficios.slice(0, 3).map((b) => (
                <Link
                  key={b.id}
                  to="/estabelecimento/$slug"
                  params={{ slug: b.slug }}
                  className="block bg-white/10 backdrop-blur hover:bg-white/15 rounded-2xl p-5 transition border border-white/15"
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-amarelo">
                    <Gift className="h-3.5 w-3.5" /> Benefício TEA
                  </div>
                  <h3 className="mt-1 font-display font-bold text-lg">{b.nome}</h3>
                  <p className="text-sm text-white/75 flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5" /> {b.cidade}, {b.estado}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTEUDO */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-secondary font-semibold uppercase tracking-wide text-sm">Aprenda mais</p>
              <h2 className="mt-2 text-3xl md:text-4xl font-display font-bold text-primary">Do blog Turismo Azul</h2>
            </div>
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link to="/conteudo">Todos os artigos <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {artigos.map((a) => (
              <Link
                key={a.slug}
                to="/conteudo/$slug"
                params={{ slug: a.slug }}
                className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition border border-border/50 animate-fade-up"
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  {a.foto_capa && (
                    <img
                      src={a.foto_capa}
                      alt={a.titulo}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="p-5">
                  {a.categoria && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-azul-claro text-primary text-[11px] font-semibold uppercase tracking-wide">
                      {a.categoria.replace("_", " ")}
                    </span>
                  )}
                  <h3 className="mt-2 font-display font-bold text-lg text-primary group-hover:text-secondary transition">
                    {a.titulo}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.resumo}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 bg-azul-claro">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <Heart className="h-10 w-10 mx-auto text-secondary" />
          <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-primary">
            Pronto para a próxima viagem?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Crie o perfil sensorial da sua família e descubra destinos preparados para receber vocês.
          </p>
          <Button asChild size="lg" className="mt-6 bg-primary hover:bg-primary/90">
            <Link to="/cadastro">Criar perfil gratuito</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
