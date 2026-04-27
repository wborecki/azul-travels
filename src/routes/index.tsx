import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { filtroConteudoPublico } from "@/lib/conteudoPublico";
import {
  ShieldCheck,
  Award,
  Home as HomeIcon,
  Heart,
  ArrowRight,
  ChevronDown,
  UserPlus,
  MapPinned,
  HeartHandshake,
  Lock,
  Map,
  Puzzle,
  Gift,
  CircleDot,
  Construction,
  Users,
  Building2,
} from "lucide-react";

const OG_IMAGE = "/og-image.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Turismo Azul — Turismo inclusivo para famílias TEA no Brasil" },
      {
        name: "description",
        content:
          "O primeiro marketplace brasileiro de turismo para famílias com autismo. Destinos verificados, perfil sensorial e selos de qualidade. Em breve.",
      },
      {
        property: "og:title",
        content: "Turismo Azul — Turismo inclusivo para famílias TEA",
      },
      {
        property: "og:description",
        content:
          "Seja um dos primeiros a entrar quando a plataforma abrir. Lista de espera gratuita.",
      },
      { property: "og:image", content: HERO_IMAGE },
      { property: "og:url", content: "https://azul-travels.lovable.app" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: HERO_IMAGE },
    ],
  }),
  component: Landing,
});

interface ArtigoCard {
  slug: string;
  titulo: string;
  resumo: string | null;
  foto_capa: string | null;
  categoria: string | null;
  criado_em: string;
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Landing() {
  const [artigos, setArtigos] = useState<ArtigoCard[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("scroll");
    if (target) {
      setTimeout(() => scrollToId(target), 200);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("conteudo_tea")
        .select("slug,titulo,resumo,foto_capa,categoria,criado_em")
        .or(filtroConteudoPublico())
        .order("criado_em", { ascending: false })
        .limit(3);
      setArtigos(data ?? []);
    })();
  }, []);

  return (
    <div>
      <Hero />
      <ComoFunciona />
      <SelosImportantes />
      <OQuePlataformaTera />
      <DemoEntrada />
      <FamiliasTeaser />
      <Citacao />
      <MercadoSection />
      <EstabelecimentosTeaser />
      <BlogTeaser artigos={artigos} />
      <CtaFinal />
    </div>
  );
}

function DemoEntrada() {
  return (
    <section className="py-16" style={{ backgroundColor: "#1B2E4B" }}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-[55%_45%] gap-10 items-center max-w-6xl mx-auto">
          {/* Coluna esquerda */}
          <div className="text-white">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "rgba(44,168,160,0.2)", color: "#2CA8A0" }}
            >
              Demonstração interativa
            </span>
            <h2
              className="mt-4 font-display font-bold text-white"
              style={{ fontSize: 30, lineHeight: 1.15 }}
            >
              Quer ver a plataforma funcionando de verdade?
            </h2>
            <p className="mt-4 text-white/80" style={{ fontSize: 15 }}>
              Preparamos uma demonstração completa com dados de exemplo. Navegue pela busca,
              explore perfis sensoriais, veja como é a página de um estabelecimento certificado
              e simule uma reserva.
            </p>

            <ul className="mt-6 space-y-2.5 text-white">
              {[
                "Busca com filtros por recursos sensoriais",
                "Compatibilidade calculada pelo perfil do filho",
                "Reserva simulada com envio de perfil sensorial",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="text-secondary font-bold mt-0.5">✓</span>
                  <span style={{ fontSize: 15 }}>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-white font-semibold"
              >
                <Link to="/demo" search={{ view: "familia" }}>
                  Ver demo para famílias
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 font-semibold"
              >
                <Link to="/demo" search={{ view: "estabelecimento" }}>
                  Ver demo para estabelecimentos
                </Link>
              </Button>
            </div>
          </div>

          {/* Coluna direita — preview de card */}
          <div>
            <div
              className="rounded-2xl overflow-hidden border-2 shadow-xl"
              style={{ backgroundColor: "#243a5e", borderColor: "rgba(44,168,160,0.4)" }}
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80"
                  alt="Preview Resort Praia Azul"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 text-white">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary text-white">
                    🛡️ Selo Azul
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-secondary text-white">
                    Sala Sensorial
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amarelo text-primary">
                    Concierge TEA
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg">Resort Praia Azul</h3>
                <p className="text-white/70 text-xs">Florianópolis, SC</p>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/80">Compatibilidade com perfil</span>
                    <span className="font-bold text-secondary">95%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: "95%" }}
                    />
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="mt-4 w-full bg-secondary hover:bg-secondary/90 text-white"
                >
                  <Link
                    to="/demo/estabelecimento/$slug"
                    params={{ slug: "resort-praia-azul" }}
                  >
                    Ver detalhes
                  </Link>
                </Button>
              </div>
            </div>
            <p className="mt-3 text-center text-white/50 text-xs italic">
              Dados de exemplo
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(27,46,75,0.55) 0%, rgba(27,46,75,0.40) 40%, rgba(27,46,75,0.68) 100%), url('${HERO_IMAGE}'), url('${HERO_FALLBACK}'), linear-gradient(135deg, #1B2E4B 0%, #1E5F6E 55%, #2CA8A0 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
        }}
      />

      <div className="relative container mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-3xl mx-auto text-center text-white animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-sm font-medium backdrop-blur">
            🚀 Plataforma em construção. Garanta seu lugar.
          </span>

          <h1 className="mt-6 text-4xl md:text-5xl font-display font-bold leading-[1.1] text-shadow-soft">
            Sua família também
            <br />
            <span className="text-secondary">merece viajar.</span>
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/85 max-w-2xl mx-auto">
            Estamos construindo o primeiro marketplace brasileiro de turismo para famílias TEA.
            Seja um dos primeiros a entrar quando a plataforma abrir.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-white min-h-[52px] px-7 text-base font-semibold"
            >
              <Link to="/familias">Sou uma família TEA</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 border border-white min-h-[52px] px-7 text-base font-semibold"
            >
              <Link to="/estabelecimentos">Tenho um estabelecimento</Link>
            </Button>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/20 rounded-full px-6 py-3 text-sm font-medium">
            <Lock className="h-4 w-4 text-amarelo" />
            Vagas limitadas na lista de espera do lançamento
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => scrollToId("como-funciona")}
            className="inline-flex flex-col items-center gap-1 text-white/70 hover:text-white cursor-pointer animate-bounce"
            style={{ fontSize: "13px" }}
            aria-label="Ir para Como funciona"
          >
            <span>Como funciona</span>
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMO FUNCIONA
// ─────────────────────────────────────────────────────────────────────────────

function ComoFunciona() {
  const steps = [
    {
      n: "1",
      Icon: UserPlus,
      titulo: "Fale sobre o seu filho",
      texto:
        "Sensibilidades, preferências, o que funciona pra ele e o que não funciona. Leva 3 minutos e muda completamente como você planeja viagens.",
    },
    {
      n: "2",
      Icon: MapPinned,
      titulo: "Encontre lugares prontos pra ele",
      texto:
        "Nada de ligar pra dezenas de hotéis explicando o autismo. A plataforma filtra e sugere só os lugares prontos pra receber vocês.",
    },
    {
      n: "3",
      Icon: HeartHandshake,
      titulo: "Chegue. A equipe já foi avisada.",
      texto:
        "Ao confirmar a reserva, o estabelecimento recebe o perfil sensorial do seu filho e assume o compromisso de cuidar de cada detalhe.",
    },
  ];

  return (
    <section id="como-funciona" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary">
            É assim que vai funcionar.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Três passos e sua família estará pronta pra viajar.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="relative bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition border h-full">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {s.n}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <s.Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 font-display font-bold text-primary text-lg">{s.titulo}</h3>
                <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">{s.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Banner em breve */}
        <Reveal className="mt-10">
          <div className="bg-primary text-primary-foreground rounded-2xl p-6 md:p-8 text-center max-w-3xl mx-auto">
            <p className="text-base md:text-lg font-medium">
              A plataforma completa com busca, perfil sensorial e reservas estará disponível em
              breve.
              <br className="hidden sm:inline" /> Cadastre-se agora e seja notificado no dia do
              lançamento.
            </p>
            <Button
              asChild
              className="mt-5 bg-secondary hover:bg-secondary/90 text-white"
              size="lg"
            >
              <Link to="/familias">Quero ser avisado</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELOS QUE IMPORTAM
// ─────────────────────────────────────────────────────────────────────────────

function SelosImportantes() {
  const selos = [
    {
      Icon: ShieldCheck,
      cor: "bg-primary text-primary-foreground",
      nome: "Selo Azul",
      descricao:
        "Emitido pela Absoluto Educacional. Exige que no mínimo 70% da equipe seja treinada em TEA/ABA com metodologia validada. O mais rigoroso do mercado.",
    },
    {
      Icon: Award,
      cor: "bg-success text-success-foreground",
      nome: "Certificação Governamental",
      descricao:
        "Certificação pública federal. Passa a valer após a aprovação do PL 4108/2024, com auditoria por órgão governamental independente.",
    },
    {
      Icon: HomeIcon,
      cor: "bg-roxo-suave text-roxo-suave-foreground",
      nome: "Sala Sensorial",
      descricao:
        "Espaço físico dedicado com controle de luz, volume e estímulos. Projeto validado por especialista em TEA. Seu filho tem para onde ir quando precisar.",
    },
    {
      Icon: Heart,
      cor: "bg-secondary text-secondary-foreground",
      nome: "Concierge TEA",
      descricao:
        "Profissional especializado em autismo presente durante toda a sua estadia. Não é apenas um funcionário treinado. É alguém que entende de autismo de verdade.",
    },
  ];

  return (
    <section className="py-16 bg-azul-claro">
      <div className="container mx-auto px-4">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary">
            O que está por trás de cada certificação
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Qualquer hotel pode se dizer inclusivo. A gente exige prova.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {selos.map((s, i) => (
            <Reveal key={s.nome} delay={i * 80}>
              <div className="relative bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition border h-full">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${s.cor} flex items-center justify-center shrink-0`}
                  >
                    <s.Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-primary text-lg">{s.nome}</h3>
                </div>
                <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
                  {s.descricao}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center">
          <Link
            to="/sobre-os-selos"
            className="inline-flex items-center gap-1 text-secondary font-semibold hover:text-primary transition"
          >
            Entenda como vamos auditar cada estabelecimento <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// O QUE A PLATAFORMA VAI TER
// ─────────────────────────────────────────────────────────────────────────────

function OQuePlataformaTera() {
  const items = [
    {
      Icon: Map,
      titulo: "Destinos verificados em todo o Brasil",
      texto:
        "Hotéis, restaurantes, parques e atrações auditados pela nossa equipe. Nenhum dado não verificado entra na plataforma.",
    },
    {
      Icon: Puzzle,
      titulo: "Perfil sensorial do seu filho",
      texto:
        "Você conta o que seu filho precisa. A plataforma filtra só os lugares prontos para receber sua família.",
    },
    {
      Icon: Gift,
      titulo: "Benefícios exclusivos TEA",
      texto:
        "Entrada gratuita, meia-entrada e fila prioritária em estabelecimentos parceiros.",
    },
    {
      Icon: CircleDot,
      titulo: "Selo Azul em destaque",
      texto:
        "Estabelecimentos certificados pela Absoluto Educacional aparecem com badge de destaque nos resultados.",
    },
  ];
  return (
    <section id="explorar" className="py-16 bg-azul-claro">
      <div className="container mx-auto px-4">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary">
            O que a plataforma vai ter
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Em breve disponível para todas as famílias TEA do Brasil.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {items.map((it, i) => (
            <Reveal key={it.titulo} delay={i * 80}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border h-full flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <it.Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-primary text-lg">{it.titulo}</h3>
                  <p className="mt-1.5 text-[15px] text-muted-foreground leading-relaxed">
                    {it.texto}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEASER FAMÍLIAS
// ─────────────────────────────────────────────────────────────────────────────

function FamiliasTeaser() {
  return (
    <section id="form-familias" className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-semibold uppercase tracking-wide">
            <Users className="h-3.5 w-3.5" />
            Para famílias TEA
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-white">
            Entre na lista de espera
          </h2>
          <p className="mt-4 text-white/80 text-base md:text-lg">
            Cadastre sua família e seja avisado em primeira mão quando a plataforma abrir. Acesso
            gratuito e prioritário.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-secondary hover:bg-secondary/90 text-white min-h-[52px] px-8 text-base font-semibold"
          >
            <Link to="/familias">Ir para o formulário de famílias</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CITAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

function Citacao() {
  return (
    <section className="py-16 bg-azul-claro">
      <div className="container mx-auto px-4 max-w-3xl">
        <Reveal className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary">
            Por que isso importa
          </h2>
        </Reveal>

        <Reveal>
          <blockquote className="border-l-4 border-secondary pl-6 italic text-foreground text-xl leading-relaxed">
            “Antes de sair de casa, eu ligava para vários hotéis tentando explicar o autismo do meu
            filho. A maioria não sabia o que fazer. Às vezes eu simplesmente desistia da viagem.”
            <footer className="mt-4 not-italic text-sm text-muted-foreground">
              Relato real de mãe de criança autista, coletado pela nossa equipe durante a pesquisa
              do produto.
            </footer>
          </blockquote>

          <p className="mt-8 text-center text-muted-foreground text-[15px]">
            O Turismo Azul foi criado para que nenhuma família precise desistir de viajar por falta
            de informação.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MERCADO
// ─────────────────────────────────────────────────────────────────────────────

function MercadoSection() {
  const stats = [
    { numero: "2.000.000", label: "pessoas autistas no Brasil" },
    { numero: "500.000", label: "famílias que precisam de destinos adaptados" },
    { numero: "R$ 1 bilhão", label: "potencial de mercado por ano estimado" },
  ];
  return (
    <section className="py-16" style={{ backgroundColor: "#E0F5F4" }}>
      <div className="container mx-auto px-4">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary">
            O mercado que ninguém atendia
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-display font-extrabold text-secondary tabular-nums">
                  {s.numero}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-12 text-center text-muted-foreground max-w-2xl mx-auto text-[15px]">
            Nenhuma plataforma digital no Brasil conectava essas famílias a destinos preparados. Até
            a gente decidir construir.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEASER ESTABELECIMENTOS
// ─────────────────────────────────────────────────────────────────────────────

function EstabelecimentosTeaser() {
  return (
    <section id="form-estabelecimentos" className="py-20" style={{ backgroundColor: "#F8FAFB" }}>
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
            <Building2 className="h-3.5 w-3.5" />
            Para estabelecimentos
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-primary">
            Cadastre seu estabelecimento
          </h2>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Hotéis, restaurantes, parques e atrações: entre na fila prioritária de parceiros do
            lançamento e fique no radar de 500 mil famílias TEA.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-primary hover:bg-secondary text-white min-h-[52px] px-8 text-base font-semibold"
          >
            <Link to="/estabelecimentos">Ir para o formulário de estabelecimentos</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG
// ─────────────────────────────────────────────────────────────────────────────

function BlogTeaser({ artigos }: { artigos: ArtigoCard[] | null }) {
  if (artigos === null) return null;
  if (artigos.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <Reveal className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-primary">
              Conteúdo TEA
            </h2>
            <p className="mt-2 text-muted-foreground">
              Boas práticas, dicas de viagem e novidades.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/conteudo">
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {artigos.map((a, i) => (
            <Reveal key={a.slug} delay={i * 80}>
              <Link
                to="/conteudo/$slug"
                params={{ slug: a.slug }}
                className="block bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border h-full"
              >
                {a.foto_capa && (
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    <img
                      src={a.foto_capa}
                      alt={a.titulo}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-display font-bold text-primary text-lg leading-tight">
                    {a.titulo}
                  </h3>
                  {a.resumo && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{a.resumo}</p>
                  )}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA FINAL
// ─────────────────────────────────────────────────────────────────────────────

function CtaFinal() {
  return (
    <section
      className="py-20"
      style={{ background: "linear-gradient(135deg, #1B2E4B 0%, #2CA8A0 100%)" }}
    >
      <div className="container mx-auto px-4 text-center text-white">
        <Reveal>
          <Construction className="h-10 w-10 text-amarelo mx-auto" />
          <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold">
            O lançamento está chegando.
          </h2>
          <p className="mt-3 text-white/80 text-lg">
            Garanta seu lugar na lista antes da abertura.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 min-h-[52px] px-7 text-base font-semibold"
            >
              <Link to="/familias">Sou família TEA</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 min-h-[52px] px-7 text-base font-semibold"
            >
              <Link to="/estabelecimentos">Tenho um estabelecimento</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
