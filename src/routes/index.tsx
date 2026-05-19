import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import gustavoFoto from "@/assets/gustavo-passinato.jpeg";
import giselaFoto from "@/assets/gisela-antoniucci.jpeg";
import heroAeroporto from "@/assets/hero-aeroporto.png";
import arthurPiscinaSplash from "@/assets/arthur-piscina-splash.jpeg";
import arthurConfiante from "@/assets/arthur-confiante.jpeg";
import arthurParque from "@/assets/arthur-parque.jpeg";
import arthurAviao from "@/assets/arthur-aviao.jpeg";
import arthurPraia from "@/assets/arthur-praia.jpeg";
import arthurCharrete from "@/assets/arthur-charrete.jpeg";
import arthurMilkshake from "@/assets/arthur-milkshake.jpeg";

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
  Check,
  
  Quote,
  Headphones,
  MapPinCheck,
  Shield,
  Play,
  Plane,
} from "lucide-react";

const OG_IMAGE = "/og-image.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Turismo Azul · Turismo inclusivo para famílias TEA no Brasil" },
      {
        name: "description",
        content:
          "O primeiro marketplace brasileiro de turismo para famílias com autismo. Destinos verificados, perfil sensorial e selos de qualidade. Em breve.",
      },
      {
        property: "og:title",
        content: "Turismo Azul · Turismo inclusivo para famílias TEA",
      },
      {
        property: "og:description",
        content:
          "Seja um dos primeiros a entrar quando a plataforma abrir. Lista de espera gratuita.",
      },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:url", content: "https://turismoazulinclusivo.com.br" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
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
      <HeroBenefits />
      <DorQueSoQuemViveSabe />
      <PorQueExistimos />
      <ComoFunciona />
      <ParaQuemEhSection />
      <SeloDestaqueSection />
      <SelosImportantes />
      <OQuePlataformaTera />
      <DemoEntrada />
      <BlogTeaser artigos={artigos} />
      <ArthurGaleria />
      <CtaFinal />
    </div>
  );
}

function ArthurGaleria() {
  const fotos = [
    { src: arthurConfiante, alt: "Arthur de braços cruzados em mirante com paisagem ao fundo" },
    { src: arthurParque, alt: "Arthur gargalhando em brinquedo de parque" },
    { src: arthurAviao, alt: "Arthur empolgado no avião à noite" },
    { src: arthurPraia, alt: "Arthur na praia com óculos de sol" },
    { src: arthurCharrete, alt: "Arthur em charrete de madeira em parque temático" },
    { src: arthurMilkshake, alt: "Arthur tomando milkshake com tapa-olho e óculos" },
  ];

  return (
    <section className="py-20" style={{ backgroundColor: "#F2F8FC" }}>
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-[#1a3666] leading-tight">
              Arthur vai a todo lugar.{" "}
              <span className="text-[#2176c8]">O seu filho também pode.</span>
            </h2>
            <p className="mt-5 text-lg text-foreground/75 leading-relaxed">
              Essas são memórias reais de uma família real. É isso que queremos
              para a sua família também.
            </p>
          </div>
        </Reveal>

        {/* Mosaico desktop */}
        <div className="hidden md:grid mt-12 grid-cols-6 auto-rows-[180px] gap-4 max-w-6xl mx-auto">
          <div className="col-span-3 row-span-2 overflow-hidden rounded-2xl shadow-md bg-white">
            <img
              src={arthurPiscinaSplash}
              alt="Arthur na piscina com splash e braços levantados"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          {fotos.map((f) => (
            <div
              key={f.src}
              className="col-span-3 lg:col-span-1 row-span-1 overflow-hidden rounded-2xl shadow-md bg-white"
            >
              <img
                src={f.src}
                alt={f.alt}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Scroll horizontal mobile */}
        <div className="md:hidden mt-10 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-4 snap-x snap-mandatory pb-4">
            <div className="snap-start shrink-0 w-[80vw] aspect-[4/5] overflow-hidden rounded-2xl shadow-md bg-white">
              <img
                src={arthurPiscinaSplash}
                alt="Arthur na piscina com splash e braços levantados"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            {fotos.map((f) => (
              <div
                key={f.src}
                className="snap-start shrink-0 w-[65vw] aspect-[4/5] overflow-hidden rounded-2xl shadow-md bg-white"
              >
                <img
                  src={f.src}
                  alt={f.alt}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
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
                <Link to="/demo/explorar" search={{ view: "familia" }}>
                  Ver demo para famílias
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-transparent border-2 border-white text-white hover:bg-white/15 hover:text-white font-semibold"
              >
                <Link to="/demo/explorar" search={{ view: "estabelecimento" }}>
                  Ver demo para estabelecimentos
                </Link>
              </Button>
            </div>
          </div>

          {/* Coluna direita · preview de card */}
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
  const bullets = [
    { titulo: "Treina", texto: "equipes para acolher famílias atípicas" },
    { titulo: "Adapta", texto: "ambientes e jornadas com perfil sensorial" },
    { titulo: "Certifica", texto: "parceiros com o Selo Azul de inclusão" },
  ];

  const stats = [
    { n: "+500k", l: "famílias TEA no Brasil" },
    { n: "120+", l: "parceiros em onboarding" },
    { n: "27", l: "estados no radar" },
  ];

  return (
    <section
      id="hero"
      className="relative overflow-hidden text-white"
      style={{
        background: "linear-gradient(135deg, #1a3666 0%, #1a6ea8 100%)",
      }}
    >
      <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* ESQUERDA · texto */}
          <div className="animate-fade-in lg:col-span-7">
            {/* Pill badge com dot animado */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/30 bg-white/5 backdrop-blur text-xs font-semibold uppercase tracking-wider text-white/95">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#00b4d8] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00b4d8]" />
              </span>
              Agência TEA · Turismo Inclusivo
            </span>

            <h1 className="mt-6 font-display font-extrabold uppercase leading-[1.05] tracking-tight text-[44px] sm:text-[56px] lg:text-[68px] text-white">
              Turismo que <span className="text-[#00b4d8]">ACOLHE.</span>
            </h1>

            <p className="tagline-italic mt-3 text-2xl md:text-3xl text-[#f5a623]">
              Experiências que transformam!
            </p>

            <p className="mt-6 text-lg md:text-xl text-white font-semibold">
              Sua família também merece viajar.
            </p>

            <p className="mt-3 text-base md:text-[17px] text-white/85 leading-relaxed max-w-xl">
              Preparamos hotéis, restaurantes e atrações para receber famílias
              atípicas com segurança, previsibilidade e acolhimento · do
              planejamento ao check-out.
            </p>

            {/* Bullets com ícone circular ciano */}
            <ul className="mt-7 space-y-3">
              {bullets.map((b) => (
                <li key={b.titulo} className="flex items-start gap-3">
                  <span className="mt-0.5 h-7 w-7 rounded-full bg-[#00b4d8] flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-[#1a3666]" strokeWidth={3} />
                  </span>
                  <span className="text-white/90 text-[15px] leading-snug">
                    <strong className="text-white font-bold">{b.titulo}</strong>{" "}
                    {b.texto}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/familias"
                className="inline-flex items-center justify-center gap-2 h-14 px-7 font-bold text-[#1a3666] bg-[#f5a623] hover:bg-[#e09415] transition-colors shadow-lg"
                style={{ borderRadius: 50 }}
              >
                <span aria-hidden="true">🧡</span> Sou Família Atípica
              </Link>
              <Link
                to="/estabelecimentos"
                className="inline-flex items-center justify-center gap-2 h-14 px-7 font-bold text-white border-2 border-white/80 hover:bg-white/10 transition-colors"
                style={{ borderRadius: 50 }}
              >
                <span aria-hidden="true">🏨</span> Sou Hotel/Parceiro
              </Link>
            </div>
          </div>

          {/* DIREITA · imagem */}
          <div className="lg:col-span-5">
            <div
              className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ border: "1px solid rgba(255,255,255,0.18)" }}
            >
              <img
                src={heroAeroporto}
                alt="Mãe e filho no aeroporto, prontos para viajar"
                className="w-full h-full object-cover aspect-[4/5]"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO BENEFITS · 4 cards
// ─────────────────────────────────────────────────────────────────────────────

function HeroBenefits() {
  const benefits = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <clipPath id="hb-heart">
              <path d="M32 58s-22-13-22-30c0-7 5-12 12-12 5 0 8 3 10 6 2-3 5-6 10-6 7 0 12 5 12 12 0 17-22 30-22 30z" />
            </clipPath>
          </defs>
          <g clipPath="url(#hb-heart)">
            <rect x="0" y="0" width="32" height="32" fill="#E63946" />
            <rect x="32" y="0" width="32" height="32" fill="#1D6FA4" />
            <rect x="0" y="32" width="32" height="32" fill="#F4A623" />
            <rect x="32" y="32" width="32" height="32" fill="#2A9D8F" />
            <line x1="32" y1="0" x2="32" y2="64" stroke="white" strokeWidth="2.5" />
            <line x1="0" y1="32" x2="64" y2="32" stroke="white" strokeWidth="2.5" />
          </g>
        </svg>
      ),
      title: "Planejamento Personalizado",
      desc: "Montamos cada etapa da viagem pensando nas necessidades do seu filho.",
    },
    {
      icon: <HomeIcon className="h-7 w-7 text-[#1B4F5C]" />,
      title: "Ambientes Adaptados",
      desc: "Selecionamos hotéis, transporte e passeios mais confortáveis.",
    },
    {
      icon: <Headphones className="h-7 w-7 text-[#1B4F5C]" />,
      title: "Suporte Especializado",
      desc: "Acompanhamento antes, durante e depois da viagem.",
    },
    {
      icon: <ShieldCheck className="h-7 w-7 text-[#1B4F5C]" />,
      title: "Segurança e Tranquilidade",
      desc: "Você viaja com mais segurança e sua família aproveita mais.",
    },
  ];

  return (
    <section className="py-12 md:py-16" style={{ backgroundColor: "#f0f4ff" }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-center h-12 w-12 mb-4">{b.icon}</div>
              <h3 className="font-display font-bold text-[17px] text-[#1a1a2e] mb-2">
                {b.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// A DOR QUE SÓ QUEM VIVE SABE
// ─────────────────────────────────────────────────────────────────────────────

function DorQueSoQuemViveSabe() {
  const medos = [
    { cor: "#E63946", texto: "E se ele tiver uma crise no aeroporto?" },
    { cor: "#1D7FBF", texto: "E os olhares de julgamento das outras pessoas?" },
    { cor: "#F4B400", texto: "E se o hotel não souber o que fazer?" },
    { cor: "#2E9E55", texto: "E se eu não conseguir regulá-lo longe de casa?" },
    { cor: "#E63946", texto: "E se eu estragar a única viagem que minha família merecia?" },
  ];

  return (
    <section id="depoimentos" className="py-20" style={{ backgroundColor: "#F0F7FF" }}>
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-secondary mb-3">
            A dor que só quem vive sabe
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center max-w-6xl mx-auto">
          {/* Coluna esquerda */}
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary leading-tight">
              A gente sabe o que passa pela sua cabeça antes de cada viagem.
            </h2>
            <p className="mt-5 text-lg text-foreground/80">
              Não é frescura. Não é exagero. É real. Cada mãe e cada pai atípico carrega um peso
              invisível que ninguém de fora consegue entender.
            </p>

            <ul className="mt-6" style={{ lineHeight: 1.8 }}>
              {medos.map((m) => (
                <li
                  key={m.texto}
                  className="flex items-start gap-3 text-foreground/85"
                  style={{ marginBottom: 12, lineHeight: 1.8 }}
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 inline-block h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: m.cor }}
                  />
                  <span className="text-base md:text-lg">{m.texto}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 italic text-lg md:text-xl text-primary font-medium">
              Você já desistiu de viajar por medo. E foi uma dor silenciosa que ninguém viu.
            </p>
          </div>

          {/* Coluna direita */}
          <div>
            <div
              className="rounded-3xl p-[3px]"
              style={{
                background:
                  "linear-gradient(135deg, #E63946 0%, #1D7FBF 33%, #F4B400 66%, #2E9E55 100%)",
              }}
            >
              <div className="bg-white rounded-[calc(1.5rem-2px)] p-8 md:p-10">
                <Quote className="h-8 w-8 text-secondary mb-4" aria-hidden="true" />
                <blockquote className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                  “Antes de sair de casa, eu ligava pra vários hotéis tentando explicar o autismo
                  do meu filho. A maioria não sabia o que fazer. Às vezes eu simplesmente desistia
                  da viagem.”
                </blockquote>
                <p className="mt-5 text-sm text-muted-foreground font-medium">
                  · Relato real de mãe de criança autista
                </p>
              </div>
            </div>
            <p className="mt-5 text-center text-sm text-secondary font-medium">
              Isso não vai mais acontecer com você.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POR QUE A GENTE EXISTE DE VERDADE
// ─────────────────────────────────────────────────────────────────────────────

function PorQueExistimos() {
  const gradienteAutismo =
    "linear-gradient(180deg, #E63946 0%, #1D7FBF 33%, #F4B400 66%, #2E9E55 100%)";

  return (
    <section id="por-que-existimos" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-secondary mb-3">
            Por que a gente existe de verdade
          </span>
        </div>

        {/* Bloco superior - texto corrido, centralizado */}
        <div className="max-w-[720px] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary leading-tight">
            Não foi uma ideia de negócio. Foi uma necessidade real.
          </h2>

          <p className="mt-5 text-lg text-foreground/80">
            O Turismo Azul nasceu da vivência de Gustavo Passinato, pai atípico que tentou
            viajar com o filho e percebeu que o mundo do turismo simplesmente não estava
            preparado para recebê-los. Nenhum hotel sabia o que fazer. Nenhuma agência tinha
            respostas. A viagem virou um campo minado de imprevistos, julgamentos e situações
            que nenhuma família deveria passar sozinha.
          </p>

          <div className="mt-6 rounded-xl p-[3px]" style={{ background: gradienteAutismo }}>
            <div
              className="rounded-[calc(0.75rem-2px)] p-5 md:p-6"
              style={{ backgroundColor: "#F0F7FF" }}
            >
              <p className="text-lg md:text-xl text-primary font-medium italic leading-relaxed">
                Foi aí que surgiu a pergunta: e se existisse um lugar onde as famílias atípicas
                pudessem viajar sem ter que explicar o autismo do filho pra cada recepcionista?
              </p>
            </div>
          </div>

          <p className="mt-6 text-lg text-foreground/80">
            A formação e capacitação dos parceiros é conduzida por Gisela Antoniucci -
            psicopedagoga especialista em autismo e mãe atípica - que traz um olhar técnico
            e humano sobre as necessidades reais de cada família.
          </p>

          <p className="mt-4 text-lg text-foreground/80">
            É disso que o Turismo Azul é feito. Não de especialistas em turismo que estudaram
            TEA. Mas de quem vive o autismo todos os dias e decidiu fazer algo a respeito.
          </p>
        </div>

        {/* Bloco inferior - cards dos fundadores lado a lado */}
        <div className="grid md:grid-cols-2 gap-6 max-w-[864px] mx-auto mt-14 items-stretch">
          <div className="bg-white rounded-3xl shadow-elegant border border-border p-8 text-center">
            <div
              className="mx-auto h-32 w-32 rounded-full p-[4px]"
              style={{
                background:
                  "linear-gradient(135deg, #E63946 0%, #1D7FBF 33%, #F4B400 66%, #2E9E55 100%)",
              }}
            >
              <img
                src={gustavoFoto}
                alt="Gustavo Passinato, fundador do Turismo Azul"
                className="h-full w-full rounded-full object-cover"
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>

            <h3 className="mt-5 text-xl font-display font-bold text-primary">
              Gustavo Passinato
            </h3>
            <p className="text-sm text-secondary font-semibold mt-1">Fundador · Pai Atípico</p>
            <p className="mt-4 text-sm text-foreground/75 leading-relaxed">
              Pai de uma criança autista. Criou o Turismo Azul depois de perceber que o mundo
              do turismo não estava preparado para receber sua família.
            </p>

            <div
              className="mt-6 inline-block rounded-full p-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, #E63946 0%, #1D7FBF 33%, #F4B400 66%, #2E9E55 100%)",
              }}
            >
              <span className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 text-xs font-semibold text-primary">
                🧩 Vive e respira o TEA todos os dias
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-elegant border border-border p-8 text-center">
            <div
              className="mx-auto h-32 w-32 rounded-full p-[4px]"
              style={{
                background:
                  "linear-gradient(135deg, #E63946 0%, #1D7FBF 33%, #F4B400 66%, #2E9E55 100%)",
              }}
            >
              <img
                src={giselaFoto}
                alt="Gisela Antoniucci, co-fundadora do Turismo Azul"
                className="h-full w-full rounded-full object-cover"
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>

            <h3 className="mt-5 text-xl font-display font-bold text-primary">
              Gisela Antoniucci
            </h3>
            <p className="text-sm text-secondary font-semibold mt-1">
              Especialista em Formação · Mãe Atípica
            </p>
            <p className="mt-4 text-sm text-foreground/75 leading-relaxed">
              Psicopedagoga especialista em autismo e palestrante. Vive a maternidade
              atípica todos os dias e transformou esse olhar em conhecimento e acolhimento
              real.
            </p>

            <div
              className="mt-6 inline-block rounded-full p-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, #E63946 0%, #1D7FBF 33%, #F4B400 66%, #2E9E55 100%)",
              }}
            >
              <span className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 text-xs font-semibold text-primary">
                ✦ Especialista em autismo há mais de 10 anos
              </span>
            </div>
          </div>
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
      emoji: "🎓",
      titulo: "Formação",
      texto: "Capacitamos equipes de hotéis, pousadas, restaurantes, fazendas, sítios, museus e espaços educativos em acolhimento de famílias atípicas.",
      bg: "#eaf3ff",
      border: "#5b9bf5",
    },
    {
      n: "2",
      emoji: "🏠",
      titulo: "Adaptação",
      texto: "Orientamos ajustes sensoriais, ambientais e de atendimento para receber bem cada família.",
      bg: "#e6f8ee",
      border: "#3ec46d",
    },
    {
      n: "3",
      emoji: "✅",
      titulo: "Certificação",
      texto: "Estabelecimentos aprovados recebem o **Selo Turismo Azul Inclusivo**, sinal de compromisso real.",
      bg: "#fff3e0",
      border: "#f5a623",
    },
    {
      n: "4",
      emoji: "🌍",
      titulo: "Divulgação",
      texto: "Levamos esses destinos certificados até as famílias que mais precisam encontrá-los.",
      bg: "#fde7f0",
      border: "#f26f9e",
    },
    {
      n: "5",
      emoji: "💙",
      titulo: "Experiência Inclusiva",
      texto: "Famílias atípicas viajam com segurança, acolhimento e a leveza de serem bem recebidas.",
      bg: "#e0f7fb",
      border: "#00b4d8",
    },
  ];

  return (
    <section id="como-funciona" className="py-16" style={{ backgroundColor: "#f7fbff" }}>
      <div className="container mx-auto px-4">
        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: "linear-gradient(90deg, #5b9bf5, #3ec46d, #f5a623, #f26f9e, #00b4d8)",
            maxWidth: 320,
            margin: "0 auto 24px",
          }}
        />
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-display font-extrabold uppercase" style={{ color: "#1a3666", letterSpacing: "0.02em" }}>
            Como funciona nosso projeto
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Cinco etapas para transformar o turismo em uma experiência verdadeiramente inclusiva.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80} className="h-full">
              <div
                className="h-full flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5"
                style={{
                  padding: "28px 20px",
                  borderRadius: 14,
                  background: s.bg,
                  borderTop: `5px solid ${s.border}`,
                  boxShadow: "0 2px 10px rgba(26,54,102,0.06)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 14px 30px rgba(26,54,102,0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(26,54,102,0.06)";
                }}
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
                  style={{ backgroundColor: s.border }}
                >
                  {s.n}
                </span>
                <div className="text-5xl mt-4" aria-hidden>{s.emoji}</div>
                <h3
                  className="mt-4 font-display font-extrabold uppercase text-base"
                  style={{ color: "#1a3666", letterSpacing: "0.03em" }}
                >
                  {s.titulo}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {s.texto.split(/(\*\*[^*]+\*\*)/).map((part, idx) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={idx} style={{ color: "#1a3666" }}>{part.slice(2, -2)}</strong>
                    ) : (
                      <span key={idx}>{part}</span>
                    )
                  )}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Subseção: E se meu filho entrar em crise? · bloco único */}
        <Reveal>
          <div
            style={{
              backgroundColor: "#FFF8F0",
              borderRadius: 16,
              padding: 40,
              width: "100%",
              maxWidth: 1000,
              margin: "48px auto 0",
            }}
          >
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-display font-bold text-primary">
                E se meu filho entrar em crise?
              </h3>
              <p className="mt-2 text-[14px] text-muted-foreground">
                Pergunta que toda mãe atípica faz · e que a gente responde de verdade.
              </p>
            </div>

            <div
              className="mt-8 grid grid-cols-1 md:grid-cols-3"
              style={{ gap: 20 }}
            >
              {[
                {
                  emoji: "🎧",
                  titulo: "Suporte disponível",
                  texto:
                    "Você tem acesso a um canal direto de apoio antes, durante e depois da viagem. Não é um 0800. É alguém que entende de TEA.",
                },
                {
                  emoji: "📍",
                  titulo: "Alguém te esperando",
                  texto:
                    "Ao chegar no destino, a equipe já foi avisada sobre o perfil do seu filho. Não precisa explicar tudo do zero.",
                },
                {
                  emoji: "🏠",
                  titulo: "Sala sensorial disponível",
                  texto:
                    "Estabelecimentos certificados têm espaço de desregulação. Seu filho tem para onde ir quando precisar.",
                },
              ].map((c) => (
                <div
                  key={c.titulo}
                  style={{
                    background: "white",
                    borderRadius: 12,
                    padding: 24,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="text-2xl" aria-hidden="true">
                    {c.emoji}
                  </div>
                  <h4 className="mt-3 font-display font-bold text-primary text-base">
                    {c.titulo}
                  </h4>
                  <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
                    {c.texto}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center italic text-base md:text-lg text-primary/90 max-w-2xl mx-auto">
              Não é só uma viagem diferente. É uma viagem que foi pensada para o seu filho do
              primeiro ao último dia.
            </p>
          </div>
        </Reveal>

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARA QUEM É · dois cards
// ─────────────────────────────────────────────────────────────────────────────

function ParaQuemEhSection() {
  const familias = [
    "Encontre hotéis e destinos preparados para receber sua família",
    "Viaje com mais segurança, conforto e acolhimento",
    "Tenha acesso a informações claras sobre estrutura e suporte oferecido",
  ];
  const parceiros = [
    "Diferencie seu negócio",
    "Seja referência em inclusão",
    "Aumente sua visibilidade e alcance um público em crescimento",
    "Contribua para um turismo mais justo e humano",
  ];

  const Check = ({ color }: { color: string }) => (
    <span
      className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center"
      style={{ backgroundColor: color }}
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );

  return (
    <section className="py-16" style={{ backgroundColor: "#f7fbff" }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-6xl mx-auto">
          <div
            className="h-full flex flex-col p-8 md:p-10 rounded-2xl text-white"
            style={{
              background: "linear-gradient(135deg, #1a3666 0%, #1e4d8c 100%)",
              boxShadow: "0 14px 40px rgba(26,54,102,0.25)",
            }}
          >
            <h3 className="font-display font-extrabold uppercase text-xl md:text-2xl tracking-wide">
              <span aria-hidden>❤️</span> Para famílias atípicas
            </h3>
            <ul className="mt-6 space-y-4 flex-1">
              {familias.map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] leading-relaxed">
                  <Check color="#00b4d8" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="tagline-italic mt-8 text-lg" style={{ color: "#f5a623" }}>
              Você não viaja só. A gente vai com você!
            </p>
          </div>

          <div
            className="h-full flex flex-col p-8 md:p-10 rounded-2xl"
            style={{
              backgroundColor: "#f7fbff",
              border: "2px solid #cfe2f7",
              color: "#1a3666",
              boxShadow: "0 8px 24px rgba(26,54,102,0.08)",
            }}
          >
            <h3 className="font-display font-extrabold uppercase text-xl md:text-2xl tracking-wide" style={{ color: "#1a3666" }}>
              <span aria-hidden>🤝</span> Para hotéis e parceiros
            </h3>
            <p className="mt-4 text-[14px] leading-relaxed text-foreground/80">
              Hotéis, pousadas, restaurantes, parques, atrações, fazendas, sítios, museus e espaços educativos.
            </p>
            <ul className="mt-5 space-y-4 flex-1">
              {parceiros.map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground">
                  <Check color="#3ec46d" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[14px] leading-relaxed text-foreground">
              Espaços educativos como fazendas, sítios e museus recebem grupos escolares com crianças autistas sem nenhum preparo específico. Com o Selo Azul, seu espaço passa a ser encontrado pelas famílias e escolas que mais precisam de você.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELO · DESTAQUE PARCEIRO CERTIFICADO
// ─────────────────────────────────────────────────────────────────────────────

function SeloDestaqueSection() {
  return (
    <section
      className="py-20"
      style={{
        background: "linear-gradient(135deg, #1a3666 0%, #1e4d8c 100%)",
        color: "white",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
          <div>
            <h2 className="font-display font-extrabold uppercase text-3xl md:text-4xl leading-tight tracking-wide">
              Torne-se um Parceiro <span style={{ color: "#00b4d8" }}>Certificado</span>
            </h2>
            <p className="mt-5 text-[15px] md:text-base leading-relaxed text-white/85 max-w-xl">
              O <strong>Selo Turismo Azul Inclusivo</strong> comprova que o seu estabelecimento está preparado para receber famílias atípicas com acolhimento, segurança e respeito. É o reconhecimento de quem investe em formação, adaptação e atendimento humanizado.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/75 max-w-xl">
              Mais do que uma certificação, é o convite para fazer parte de um movimento que transforma o turismo em uma experiência verdadeiramente inclusiva.
            </p>
            <div className="mt-8">
              <Link
                to="/estabelecimentos"
                className="inline-flex items-center gap-2 font-display font-extrabold uppercase tracking-wide text-sm transition-all hover:scale-105"
                style={{
                  backgroundColor: "#f5a623",
                  color: "#1a3666",
                  padding: "16px 28px",
                  borderRadius: 50,
                  boxShadow: "0 10px 24px rgba(245,166,35,0.35)",
                }}
              >
                Quero Receber o Selo →
              </Link>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <SeloBadge size={360} />
          </div>
        </div>
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
              <div className="autismo-border-top relative overflow-hidden bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition border h-full">
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
        "Hotéis, restaurantes, parques, atrações e passeios educativos auditados pela nossa equipe. Nenhum dado não verificado entra na plataforma.",
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
            className="bg-white text-primary hover:bg-secondary hover:text-white min-h-[52px] px-7 text-base font-semibold rounded-full"
          >
            <Link to="/familias">Sou família TEA</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-transparent border-2 border-white text-white hover:bg-white/15 hover:text-white min-h-[52px] px-7 text-base font-semibold rounded-full"
          >
            <Link to="/estabelecimentos">Tenho um estabelecimento</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELO BADGE · componente reutilizável (selo circular premium com fita)
// ─────────────────────────────────────────────────────────────────────────────

function SeloBadge({ size = 320 }: { size?: number }) {
  return (
    <img
      src="/selo-turismo-azul.svg"
      alt="Selo Turismo Azul Inclusivo · Certificação Oficial"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="block"
    />
  );
}
