import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ArrowRight, MapPin, Star, Users, Building2 } from "lucide-react";
import {
  DEMO_ESTABELECIMENTOS,
  DEMO_AVALIACOES,
  DEMO_ARTIGOS,
  DEMO_PERFIL_SENSORIAL,
} from "@/data/demo";
import { DemoEstabCard } from "@/components/demo/DemoEstabCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/")({
  component: DemoHome,
});

function DemoHome() {
  const { view } = useSearch({ from: "/demo" });
  const isFamilia = view === "familia";
  const perfil = isFamilia ? DEMO_PERFIL_SENSORIAL : undefined;

  const estados = new Set(DEMO_ESTABELECIMENTOS.map((e) => e.estado)).size;
  const notaMedia =
    DEMO_ESTABELECIMENTOS.reduce((s, e) => s + e.nota_media, 0) /
    DEMO_ESTABELECIMENTOS.length;

  return (
    <div>
      {/* HERO */}
      <section
        className="py-16 text-white"
        style={{
          background:
            "linear-gradient(135deg, #1B2E4B 0%, #2CA8A0 100%)",
        }}
      >
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-sm font-medium">
            🧪 Você está vendo a demonstração
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl font-display font-bold leading-tight">
            Sua família também
            <br />
            <span className="text-amarelo">merece viajar.</span>
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Esta é uma prévia interativa do Turismo Azul com dados de exemplo.
            Navegue como se a plataforma já estivesse no ar.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-amarelo hover:bg-amarelo/90 text-primary min-h-[52px] px-7 font-semibold"
            >
              <Link to="/demo/explorar" search={{ view }}>
                Explorar destinos da demo
              </Link>
            </Button>
            {isFamilia && (
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90 min-h-[52px] px-7 font-semibold"
              >
                <Link to="/demo/minha-conta">Ver minha conta de exemplo</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* CONTADORES */}
      <section className="py-12 bg-azul-claro">
        <div className="container mx-auto px-4 grid sm:grid-cols-3 gap-6 max-w-4xl">
          {[
            {
              n: `${DEMO_ESTABELECIMENTOS.length}`,
              l: "destinos verificados",
            },
            { n: `${estados}`, l: "estados brasileiros" },
            { n: `${notaMedia.toFixed(1)}★`, l: "nota média das famílias" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl md:text-4xl font-display font-extrabold text-secondary tabular-nums">
                {s.n}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CARD ESPECIAL ESTABELECIMENTO */}
      {!isFamilia && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 text-white text-center">
              <Building2 className="h-10 w-10 mx-auto text-amarelo" />
              <h2 className="mt-3 text-2xl md:text-3xl font-display font-bold">
                Veja como seu estabelecimento apareceria aqui
              </h2>
              <p className="mt-3 text-white/85 max-w-2xl mx-auto">
                Cada destino abaixo recebe filtros automáticos por perfil
                sensorial, badges de Selo Azul, Tour 360° e benefícios TEA. O
                seu pode ser o próximo.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-6 bg-amarelo text-primary hover:bg-amarelo/90 font-semibold"
              >
                <Link to="/estabelecimentos">
                  Quero cadastrar meu estabelecimento
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* DESTINOS */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-primary">
                Destinos verificados
              </h2>
              <p className="mt-1 text-muted-foreground">
                {isFamilia
                  ? `Compatibilidade calculada com o perfil do ${DEMO_PERFIL_SENSORIAL.nome_autista}.`
                  : "6 estabelecimentos de exemplo nesta demonstração."}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/demo/explorar" search={{ view }}>
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMO_ESTABELECIMENTOS.map((e) => (
              <DemoEstabCard key={e.id} estab={e} perfil={perfil} />
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-16 bg-azul-claro">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary text-center mb-10">
            O que as famílias estão dizendo
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {DEMO_AVALIACOES.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl p-6 shadow-sm border"
              >
                <div className="flex items-center gap-1 text-amarelo mb-3">
                  {Array.from({ length: a.nota_geral }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amarelo" />
                  ))}
                </div>
                <p className="text-foreground italic text-[15px] leading-relaxed">
                  “{a.comentario}”
                </p>
                <p className="mt-4 text-sm font-semibold text-primary">
                  {a.nome_responsavel}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {a.cidade}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-8">
            Conteúdo TEA
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {DEMO_ARTIGOS.map((a) => (
              <article
                key={a.id}
                className="bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition"
              >
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  <img
                    src={a.foto_capa}
                    alt={a.titulo}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <span className="text-xs font-semibold text-secondary uppercase">
                    {a.categoria}
                  </span>
                  <h3 className="mt-1 font-display font-bold text-primary text-lg leading-tight">
                    {a.titulo}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                    {a.resumo}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA REAL */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <Users className="h-10 w-10 text-amarelo mx-auto" />
          <h2 className="mt-4 text-2xl md:text-3xl font-display font-bold">
            Gostou do que viu?
          </h2>
          <p className="mt-3 text-white/85">
            Esta é uma demonstração com dados fictícios. A plataforma real
            está em construção. Garanta seu acesso prioritário antes do
            lançamento.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-amarelo text-primary hover:bg-amarelo/90 font-semibold"
            >
              <Link to="/familias">Quero me cadastrar de verdade</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <Link to="/estabelecimentos">Sou um estabelecimento</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
