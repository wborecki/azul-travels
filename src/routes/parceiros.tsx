import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/parceiros")({
  head: () => ({
    meta: [
      { title: "Parceiros institucionais · Turismo Azul Inclusivo" },
      {
        name: "description",
        content:
          "Conheça as instituições que apoiam o Turismo Azul Inclusivo: IDT-Cema, Abrajet e São Paulo Convention & Visitors Bureau.",
      },
      { property: "og:title", content: "Parceiros institucionais · Turismo Azul Inclusivo" },
      {
        property: "og:description",
        content:
          "As entidades do turismo brasileiro que caminham com o movimento por um turismo mais acolhedor para famílias atípicas.",
      },
    ],
  }),
  component: ParceirosPage,
});

interface Parceiro {
  nome: string;
  nomeCompleto: string;
  logo: string;
  alturaLogo: number;
  site: string;
  siteRotulo: string;
  natureza: string;
  abrangencia: string;
  resumo: string;
}

const parceiros: Parceiro[] = [
  {
    nome: "IDT-Cema",
    nomeCompleto: "Instituto de Desenvolvimento, Turismo, Cultura, Esporte e Meio Ambiente",
    logo: "/parceiros/idt-cema.png",
    alturaLogo: 84,
    site: "https://www.idtcema.com.br/",
    siteRotulo: "idtcema.com.br",
    natureza: "Organização Social",
    abrangencia: "Nacional",
    resumo:
      "Promove e desenvolve atividades ligadas a turismo, cultura, esporte, educação, saúde e meio ambiente, articulando projetos entre entidades, governo, empresas e comunidades. Mantém uma diretoria setorial dedicada exclusivamente à acessibilidade.",
  },
  {
    nome: "Abrajet",
    nomeCompleto: "Associação Brasileira de Jornalistas de Turismo",
    logo: "/parceiros/abrajet.png",
    alturaLogo: 58,
    site: "https://abrajetnacional.com.br/",
    siteRotulo: "abrajetnacional.com.br",
    natureza: "Associação de classe",
    abrangencia: "Nacional",
    resumo:
      "Reúne desde 1957 os jornalistas especializados em turismo de todo o Brasil, atuando em TV, jornais, revistas e veículos digitais. Trabalha na divulgação e na valorização dos destinos brasileiros junto à imprensa do setor.",
  },
  {
    nome: "Visite São Paulo",
    nomeCompleto: "São Paulo Convention & Visitors Bureau",
    logo: "/parceiros/visite-sao-paulo.png",
    alturaLogo: 88,
    site: "https://visitesaopaulo.com/",
    siteRotulo: "visitesaopaulo.com",
    natureza: "Entidade sem fins lucrativos",
    abrangencia: "Cidade de São Paulo",
    resumo:
      "Primeiro Convention & Visitors Bureau da América do Sul, busca ampliar o volume de negócios e o mercado de consumo da cidade por meio da atividade turística. Apoia a melhoria dos serviços e do atendimento prestado aos visitantes.",
  },
];

function ParceirosPage() {
  return (
    <div className="bg-white">
      <section className="bg-azul-claro pt-12 pb-10 md:pt-16 md:pb-14">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="font-display font-extrabold uppercase text-xs tracking-[0.18em] text-secondary">
            Parceiros institucionais
          </p>
          <h1 className="mt-4 text-3xl md:text-4xl font-display font-extrabold text-primary leading-tight">
            Quem caminha com o Turismo Azul Inclusivo
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            Transformar o turismo brasileiro em algo acolhedor para famílias atípicas não é trabalho
            de uma empresa só. Estas são as instituições que somam força ao movimento.
          </p>
        </div>
      </section>

      <section className="py-6 md:py-10">
        <div className="container mx-auto px-4 max-w-4xl divide-y">
          {parceiros.map((p) => (
            <article
              key={p.nome}
              className="grid gap-6 py-10 md:gap-12 md:py-14 md:grid-cols-[200px_1fr]"
            >
              <div className="flex items-start justify-center md:justify-start">
                <img
                  src={p.logo}
                  alt={`Logotipo ${p.nomeCompleto}`}
                  style={{ height: p.alturaLogo }}
                  className="w-auto object-contain"
                  loading="lazy"
                />
              </div>

              <div>
                <h2 className="font-display font-bold text-primary text-xl md:text-2xl">
                  {p.nome}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.nomeCompleto}</p>

                <p className="mt-4 text-[15px] leading-relaxed text-foreground/85">{p.resumo}</p>

                <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Natureza
                    </dt>
                    <dd className="mt-1 text-[15px] text-foreground">{p.natureza}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Abrangência
                    </dt>
                    <dd className="mt-1 text-[15px] text-foreground">{p.abrangencia}</dd>
                  </div>
                </dl>

                <Button asChild variant="outline" size="sm" className="mt-6">
                  <a href={p.site} target="_blank" rel="noopener noreferrer">
                    Visitar {p.siteRotulo}
                    <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="py-16 text-white" style={{ backgroundColor: "#1A2A6B" }}>
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-display font-extrabold">
            Sua instituição também quer somar?
          </h2>
          <p className="mt-4 text-white/80 leading-relaxed">
            Associações, institutos, bureaus e entidades do turismo que queiram apoiar o movimento
            por um turismo mais acolhedor para famílias atípicas podem falar com a gente.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/contato">Falar com a equipe</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white"
            >
              <Link to="/estabelecimentos">Quero o Selo Azul</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
