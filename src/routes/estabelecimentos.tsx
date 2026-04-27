import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LeadEstabelecimentosForm } from "@/components/leads/LeadEstabelecimentosForm";

export const Route = createFileRoute("/estabelecimentos")({
  head: () => ({
    meta: [
      { title: "Cadastre seu estabelecimento — Turismo Azul" },
      {
        name: "description",
        content:
          "Liste seu hotel, restaurante ou parque no primeiro marketplace de turismo TEA do Brasil.",
      },
      {
        property: "og:title",
        content: "Cadastre seu estabelecimento — Turismo Azul",
      },
      {
        property: "og:description",
        content:
          "Entre na fila prioritária de parceiros do lançamento e fique no radar de 500 mil famílias TEA.",
      },
    ],
  }),
  component: EstabelecimentosPage,
});

function EstabelecimentosPage() {
  const bullets = [
    {
      titulo: "Tráfego qualificado desde o dia 1",
      texto:
        "Quem busca na plataforma quer exatamente o que você vai oferecer.",
    },
    {
      titulo: "Selo Azul como diferencial real",
      texto:
        "Capacitação pela Absoluto Educacional. Um certificado que a concorrência ainda não tem.",
    },
    {
      titulo: "Fila prioritária de parceiros",
      texto:
        "Quem se cadastra agora entra primeiro no onboarding quando a plataforma abrir.",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] -mt-16 pt-16 bg-white">
      <div className="absolute top-0 left-0 right-0 z-40 h-16 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-[45%_55%] min-h-[calc(100vh-4rem)]">
        <aside className="bg-primary text-primary-foreground p-8 md:p-12 lg:p-16 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto flex flex-col">
          <div className="max-w-md mx-auto lg:mx-0 flex-1">
            <span className="inline-block px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-semibold uppercase tracking-wide">
              Parceiros do lançamento
            </span>
            <h1 className="mt-5 text-3xl md:text-4xl font-display font-bold leading-[1.15]">
              Seu estabelecimento no radar de 500 mil famílias TEA.
            </h1>
            <p className="mt-4 text-base text-white/80 leading-relaxed">
              Essas famílias viajam menos porque não encontram destinos preparados. Seja um dos
              primeiros a estar na plataforma quando ela abrir.
            </p>

            <div className="mt-6 h-0.5 w-16 bg-secondary rounded-full" />

            <ul className="mt-8 space-y-5">
              {bullets.map((b) => (
                <li key={b.titulo} className="flex gap-3">
                  <Check className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white text-sm">{b.titulo}</div>
                    <div className="text-sm text-white/70 mt-1 leading-relaxed">{b.texto}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10 bg-white/10 rounded-xl p-5">
              <p className="text-2xl font-display font-extrabold text-secondary">R$ 1 bilhão</p>
              <p className="mt-1 text-sm text-white/80 leading-relaxed">
                Potencial de mercado estimado no turismo TEA brasileiro por ano.
              </p>
            </div>
          </div>
        </aside>

        <main className="bg-white p-6 md:p-12 flex items-center">
          <div className="w-full max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-primary">
              Cadastre seu estabelecimento
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hotéis, restaurantes, parques e atrações. Onboarding gratuito para os primeiros.
            </p>
            <div className="mt-6">
              <LeadEstabelecimentosForm origem="pagina_estabelecimentos" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
