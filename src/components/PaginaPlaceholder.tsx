import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Layout reutilizável para páginas em construção.
 *
 * Usado por rotas que ainda não têm conteúdo final mas são linkadas a partir
 * do Header / Footer / Home. Garante que nenhum link da aplicação leve a 404
 * ou a uma tela vazia.
 */
export function PaginaPlaceholder({
  titulo,
  descricao,
  contato,
}: {
  titulo: string;
  descricao?: string;
  contato?: { label: string; email: string };
}) {
  return (
    <section className="container mx-auto px-4 py-20 max-w-2xl text-center">
      <h1 className="text-3xl md:text-4xl font-display font-extrabold text-primary">{titulo}</h1>
      <p className="mt-5 text-base text-muted-foreground leading-relaxed">
        {descricao ?? "Esta seção está em construção. Volte em breve!"}
      </p>

      {contato && (
        <p className="mt-4 text-sm text-foreground">
          {contato.label}{" "}
          <a
            href={`mailto:${contato.email}`}
            className="text-secondary font-semibold hover:underline"
          >
            {contato.email}
          </a>
        </p>
      )}

      <div className="mt-10">
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
          <Link to="/" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar para o início
          </Link>
        </Button>
      </div>
    </section>
  );
}
