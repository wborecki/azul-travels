import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Hotel, Puzzle, BadgeCheck, Map } from "lucide-react";
import restaurante from "@/assets/historia-restaurante.jpeg";
import parqueAquatico from "@/assets/historia-parque-aquatico.jpeg";
import helicoptero from "@/assets/historia-helicoptero.jpeg";
import piscina from "@/assets/historia-piscina.jpeg";
import roar from "@/assets/historia-roar.jpeg";
import miranteCidade from "@/assets/historia-mirante-cidade.jpeg";
import miranteMar from "@/assets/historia-mirante-mar.jpeg";
import paiFilhoRua from "@/assets/historia-pai-filho-rua.jpeg";

export const Route = createFileRoute("/nossa-historia")({
  head: () => ({
    meta: [
      { title: "Nossa História · Turismo Azul Inclusivo" },
      {
        name: "description",
        content:
          "A história por trás do Turismo Azul Inclusivo: a vivência real de um pai e a missão de transformar viagens em experiências acolhedoras para famílias atípicas.",
      },
      { property: "og:title", content: "Nossa História · Turismo Azul Inclusivo" },
      {
        property: "og:description",
        content:
          "Do amor por um filho autista nasceu um projeto que transforma o turismo brasileiro em um lugar acolhedor para famílias neurodivergentes.",
      },
      { property: "og:image", content: paiFilhoRua },
    ],
  }),
  component: NossaHistoriaPage,
});

function NossaHistoriaPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section
        className="relative py-20 md:py-28 text-white"
        style={{
          background:
            "linear-gradient(135deg, #0f2547 0%, #1a3666 50%, #2176c8 100%)",
        }}
      >
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight">
            Nossa História
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/85 leading-relaxed">
            O Turismo Azul Inclusivo nasceu da vivência real de um pai que sentiu
            na pele as dificuldades que milhares de famílias atípicas enfrentam
            todos os dias.
          </p>
        </div>
      </section>

      {/* Quem somos */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <img
                src={restaurante}
                alt="Gustavo Passinato e seu filho Arthur sorrindo em um restaurante"
                className="w-full h-auto rounded-2xl shadow-lg object-cover aspect-[4/5]"
                loading="lazy"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-[#1a3666]">
                Quem somos
              </h2>
              <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-foreground/85">
                <p>
                  Sou <strong>Gustavo Passinato</strong>, pai do{" "}
                  <strong>Arthur</strong>, uma criança autista que completa 10
                  anos este mês. E, ao longo dessa jornada, aprendi que o amor
                  de um pai é capaz de mover o mundo inteiro para ver um filho
                  feliz.
                </p>
                <p>
                  Entre terapias, desafios, crises, descobertas, evolução e
                  pequenas grandes conquistas, sempre existiu um sonho simples:
                  proporcionar ao meu filho momentos leves, felizes e
                  inesquecíveis através das viagens em família.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A Dor que nos moveu */}
      <section className="py-16 md:py-24 bg-azul-claro">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#1a3666]">
              A dor que nos moveu
            </h2>
            <div className="mt-8 space-y-5 text-[17px] md:text-lg leading-relaxed text-foreground/85">
              <p>
                Mas o que deveria ser descanso, muitas vezes se transformava em
                medo, ansiedade e frustração.
              </p>
              <p>
                Hotéis sem preparo. Ambientes com excesso de estímulos. Falta de
                compreensão. Olhares de julgamento. Equipes que não sabiam
                acolher. Lugares que não entendiam que, por trás de uma crise,
                existe uma criança que só precisa ser respeitada.
              </p>
              <p>
                E foi vivendo tudo isso que percebi uma realidade dolorosa:
                muitas famílias atípicas deixam de viajar não por falta de
                vontade, mas por medo do que vão enfrentar.
              </p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { src: parqueAquatico, alt: "Pai e filho em brinquedo de parque aquático" },
              { src: helicoptero, alt: "Filho usando abafador de ouvidos em voo de helicóptero" },
              { src: piscina, alt: "Filho sorrindo na beira da piscina" },
            ].map((img) => (
              <div
                key={img.src}
                className="overflow-hidden rounded-2xl shadow-md bg-white"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full h-64 md:h-72 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O Nascimento do Turismo Azul */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="h-7 w-7" fill="currentColor" />
            </div>
            <h2 className="mt-5 font-display text-3xl md:text-4xl font-bold text-[#1a3666]">
              O nascimento do Turismo Azul
            </h2>
            <div className="mt-6 space-y-5 text-[17px] md:text-lg leading-relaxed text-foreground/85">
              <p>
                Foi dessa dor e do amor imenso pelo meu filho que nasceu o{" "}
                <strong>Turismo Azul Inclusivo</strong>.
              </p>
              <p>
                Nasceu da vontade de transformar sofrimento em acolhimento. De
                transformar insegurança em tranquilidade. E de fazer com que
                nenhuma família se sinta sozinha ao viajar.
              </p>
              <p>
                Mais do que turismo, criamos um projeto com propósito. Queremos
                transformar hotéis, destinos e experiências em ambientes
                verdadeiramente inclusivos, preparados para receber famílias
                neurodivergentes com empatia, respeito, segurança e humanidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Galeria de aventuras */}
      <section className="py-16 md:py-24 bg-azul-claro/40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#1a3666]">
              Momentos que nos inspiraram
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
            {[roar, miranteCidade, miranteMar, paiFilhoRua].map((src, i) => (
              <div
                key={i}
                className="group overflow-hidden rounded-2xl shadow-md bg-white"
              >
                <img
                  src={src}
                  alt="Momento em família"
                  loading="lazy"
                  className="w-full h-56 md:h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nossa Missão */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#1a3666]">
              Nossa missão
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {[
              {
                icon: Hotel,
                text: "Formação especializada de equipes hoteleiras",
              },
              {
                icon: Puzzle,
                text: "Adaptação de ambientes e salas sensoriais",
              },
              {
                icon: BadgeCheck,
                text: "Certificação Inclusiva (Selo Azul)",
              },
              {
                icon: Map,
                text: "Agência TEA — plataforma para famílias encontrarem destinos preparados",
              },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-[15px] font-semibold text-foreground leading-snug">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote final */}
      <section
        className="py-20 md:py-28 text-white"
        style={{
          background:
            "linear-gradient(135deg, #1a3666 0%, #2176c8 100%)",
        }}
      >
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <p className="font-display text-2xl md:text-4xl font-bold leading-snug">
            "Viajar também é descanso. Viajar também é terapia. Viajar também é
            inclusão. Viajar também é pertencimento."
          </p>
          <div className="mt-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 h-12 px-8 font-bold text-[#1a3666] bg-[#f5a623] hover:bg-[#e09415] transition-colors shadow-md"
              style={{ borderRadius: 50 }}
            >
              Conhecer o Projeto
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
