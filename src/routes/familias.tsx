import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LeadFamiliasForm } from "@/components/leads/LeadFamiliasForm";

export const Route = createFileRoute("/familias")({
  head: () => ({
    meta: [
      { title: "Lista de espera para famílias TEA — Turismo Azul" },
      {
        name: "description",
        content:
          "Seja um dos primeiros a acessar o marketplace de turismo para famílias com autismo no Brasil.",
      },
      {
        property: "og:title",
        content: "Lista de espera para famílias TEA — Turismo Azul",
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
      titulo: "Destinos verificados pela nossa equipe",
      texto: "Só entra na plataforma quem passou pela nossa auditoria.",
    },
    {
      titulo: "Perfil sensorial do seu filho",
      texto:
        "A plataforma aprende o que ele precisa e filtra os lugares certos pra vocês.",
    },
    {
      titulo: "Sem surpresas na chegada",
      texto:
        "O estabelecimento recebe o perfil antes de vocês chegarem.",
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

      <div className="grid lg:grid-cols-[45%_55%] min-h-[calc(100vh-4rem)]">
        {/* Coluna esquerda */}
        <aside className="bg-primary text-primary-foreground p-8 md:p-12 lg:p-16 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto flex flex-col">
          <div className="max-w-md mx-auto lg:mx-0 flex-1">
            <span className="inline-block px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-semibold uppercase tracking-wide">
              Lista de espera
            </span>
            <h1 className="mt-5 text-3xl md:text-4xl font-display font-bold leading-[1.15]">
              Viajar com seu filho autista ficou mais fácil.
            </h1>
            <p className="mt-4 text-base text-white/80 leading-relaxed">
              Estamos construindo o primeiro marketplace brasileiro de turismo para famílias TEA.
              Cadastre-se e seja avisado no lançamento.
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
          </div>
        </aside>

        {/* Coluna direita */}
        <main className="bg-white p-6 md:p-12 flex items-center">
          <div className="w-full max-w-xl mx-auto">
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
