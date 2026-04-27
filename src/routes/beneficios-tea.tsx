import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Construction, Gift, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/beneficios-tea")({
  head: () => ({
    meta: [
      { title: "Benefícios TEA — Turismo Azul" },
      {
        name: "description",
        content:
          "Estabelecimentos com entrada gratuita, descontos e privilégios para pessoas autistas. Tudo verificado pela equipe Turismo Azul.",
      },
    ],
  }),
  component: BeneficiosTeaPage,
});

function BeneficiosTeaPage() {
  return (
    <div className="bg-white">
      {/* Banner topo */}
      <div className="bg-secondary/15 border-b border-secondary/30">
        <div className="container mx-auto px-4 py-3 text-center text-sm text-secondary font-medium flex items-center justify-center gap-2">
          <Construction className="h-4 w-4" />
          <span>
            🚧 Esta funcionalidade estará disponível no lançamento da plataforma.
          </span>
        </div>
      </div>

      <section className="bg-azul-claro py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary text-white flex items-center justify-center mx-auto">
            <Gift className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl md:text-4xl font-display font-extrabold text-primary">
            Benefícios exclusivos para famílias TEA
          </h1>
          <div className="mt-6 text-base md:text-lg text-foreground leading-relaxed text-left space-y-4">
            <p>
              Hotéis, restaurantes e parques parceiros do Turismo Azul vão oferecer
              entrada gratuita, meia-entrada, fila prioritária e descontos exclusivos
              para pessoas autistas.
            </p>
            <p>
              Tudo verificado pela nossa equipe antes de aparecer aqui. Na versão demo
              você já pode ver alguns exemplos de como vai funcionar.
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-white font-semibold"
            >
              <Link to="/demo/explorar">
                Ver na demonstração
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white font-semibold"
            >
              <Link to="/familias">Entrar na lista de espera</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
