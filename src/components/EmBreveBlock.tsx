import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export function EmBreveBlock({
  titulo,
  texto,
  scrollTarget = "form-familias",
  ctaLabel = "Entrar na lista de espera",
}: {
  titulo: string;
  texto: string;
  scrollTarget?: "form-familias" | "form-estabelecimentos";
  ctaLabel?: string;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-20">
      <div className="container mx-auto px-4 max-w-xl text-center">
        <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto">
          <Construction className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl md:text-4xl font-display font-bold text-primary">{titulo}</h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed">{texto}</p>
        <Button
          asChild
          size="lg"
          className="mt-8 bg-secondary hover:bg-primary text-white min-h-[48px] px-7"
        >
          <Link to="/" search={{ scroll: scrollTarget } as never}>
            {ctaLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
