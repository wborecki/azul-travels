import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LeadFamiliasForm } from "@/components/leads/LeadFamiliasForm";


export const Route = createFileRoute("/familias")({
  head: () => ({
    meta: [
      { title: "Lista de espera para famílias TEA · Turismo Azul" },
      {
        name: "description",
        content:
          "Seja um dos primeiros a acessar o marketplace de turismo para famílias com autismo no Brasil.",
      },
      {
        property: "og:title",
        content: "Lista de espera para famílias TEA · Turismo Azul",
      },
      {
        property: "og:description",
        content:
          "Cadastre-se gratuitamente e seja avisado em primeira mão quando a plataforma abrir.",
      },
    ],
  }),
  component: FamiliasPage,
});

function FamiliasPage() {
  const bullets = [
    {
      titulo: "O destino já sabe quem é seu filho",
      texto:
        "O estabelecimento recebe o perfil antes da chegada. Sem ter que explicar tudo de novo na recepção.",
    },
    {
      titulo: "Ambientes verificados por quem entende de TEA",
      texto:
        "Só entra na plataforma quem passou pela nossa auditoria. Nada de surpresa na chegada.",
    },
    {
      titulo: "Apoio 24h durante toda a estadia",
      texto:
        "Nossa equipe está disponível a qualquer hora. Porque imprevistos não escolhem horário.",
    },
  ];



  return (
    <div className="min-h-[calc(100vh-4rem)] -mt-16 pt-16 bg-white">
      {/* Header simples */}
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

      <div className="grid lg:grid-cols-2">
        {/* Coluna esquerda */}
        <aside className="bg-primary text-primary-foreground p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="max-w-lg mx-auto lg:ml-auto lg:mr-12 w-full">
            <span className="inline-block px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-semibold uppercase tracking-wide">
              Lista de espera
            </span>
            <h1 className="mt-5 text-3xl md:text-4xl font-display font-bold leading-[1.15]">
              Sua família também merece viajar.
            </h1>
            <p className="mt-4 text-base text-white/80 leading-relaxed">
              Estamos construindo o primeiro marketplace brasileiro de turismo para famílias TEA.
              Cadastre-se e seja avisada no lançamento.
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
              <p className="text-sm italic text-white leading-relaxed">
                “Antes eu desistia da viagem. Com uma plataforma assim, a gente teria ido.”
              </p>
              <p className="mt-2 text-xs text-secondary">
                Mãe de criança autista, São Paulo
              </p>
            </div>

            <div className="mt-4 bg-white/10 rounded-xl p-5">
              <p className="text-sm italic text-white leading-relaxed">
                “Finalmente sinto que alguém entende o medo que a gente sente antes de cada viagem.”
              </p>
              <p className="mt-2 text-xs text-secondary">
                Mãe TEA, Curitiba/PR
              </p>
            </div>

            <div className="mt-8 rounded-xl p-6 md:p-8 bg-black/25">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl md:text-3xl font-display font-bold text-white">500 mil</div>
                  <div className="mt-2 text-xs text-white/80 leading-snug">Famílias TEA no Brasil</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-display font-bold text-white">R$ 1 bi</div>
                  <div className="mt-2 text-xs text-white/80 leading-snug">Potencial de mercado/ano</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-display font-bold text-white">1 em 36</div>
                  <div className="mt-2 text-xs text-white/80 leading-snug">crianças no Brasil é autista</div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-sm italic text-white/70 text-center leading-relaxed">
              “O turismo inclusivo não é tendência. É uma necessidade urgente.”
            </p>
          </div>
        </aside>

        {/* Coluna direita */}
        <main className="bg-white p-6 md:p-12 lg:p-16 flex items-center justify-center">
          <div className="w-full max-w-xl">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-primary">
              Entre na lista de espera
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Leva menos de 2 minutos. Você pode sair da lista quando quiser.
            </p>




            <div className="mt-6">
              <LeadFamiliasForm origem="pagina_familias" />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
