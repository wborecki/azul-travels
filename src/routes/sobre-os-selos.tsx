import { createFileRoute } from "@tanstack/react-router";
import { PaginaPlaceholder } from "@/components/PaginaPlaceholder";

export const Route = createFileRoute("/sobre-os-selos")({
  head: () => ({
    meta: [
      { title: "Como auditamos cada estabelecimento — Turismo Azul" },
      {
        name: "description",
        content:
          "Entenda o processo de certificação Turismo Azul: como cada selo é validado e o que muda para a sua família.",
      },
      { property: "og:title", content: "Como auditamos cada estabelecimento — Turismo Azul" },
      {
        property: "og:description",
        content:
          "O processo de auditoria que garante que cada selo represente preparo real para receber famílias TEA.",
      },
    ],
  }),
  component: SobreOsSelosPage,
});

function SobreOsSelosPage() {
  return (
    <PaginaPlaceholder
      titulo="Como auditamos cada estabelecimento"
      descricao="Em breve: detalhes completos do nosso processo de certificação — visitas técnicas, treinamento de equipe, validação por especialistas TEA e renovação anual de cada selo."
    />
  );
}
