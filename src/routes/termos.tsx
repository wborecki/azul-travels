import { createFileRoute } from "@tanstack/react-router";
import { PaginaPlaceholder } from "@/components/PaginaPlaceholder";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Turismo Azul" },
      {
        name: "description",
        content: "Termos de uso da plataforma Turismo Azul para famílias e estabelecimentos.",
      },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <PaginaPlaceholder
      titulo="Termos de Uso"
      descricao="Esta seção está em construção. Em breve: regras de uso da plataforma para famílias e estabelecimentos parceiros."
    />
  );
}
