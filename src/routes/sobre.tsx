import { createFileRoute } from "@tanstack/react-router";
import { PaginaPlaceholder } from "@/components/PaginaPlaceholder";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre nós — Turismo Azul" },
      {
        name: "description",
        content:
          "Quem somos, por que existimos e como queremos transformar o turismo brasileiro para famílias TEA.",
      },
      { property: "og:title", content: "Sobre nós — Turismo Azul" },
      {
        property: "og:description",
        content:
          "A história do Turismo Azul: um marketplace nascido para famílias autistas viajarem com confiança.",
      },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <PaginaPlaceholder
      titulo="Sobre o Turismo Azul"
      descricao="Esta seção está em construção. Em breve: nossa missão, nosso time e a parceria com a Absoluto Educacional que tornou o Selo Azul possível."
    />
  );
}
