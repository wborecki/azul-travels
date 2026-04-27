import { createFileRoute } from "@tanstack/react-router";
import { EmBreveBlock } from "@/components/EmBreveBlock";

export const Route = createFileRoute("/explorar")({
  head: () => ({
    meta: [
      { title: "Explorar destinos — Em breve" },
      {
        name: "description",
        content:
          "A busca de destinos do Turismo Azul estará disponível no lançamento da plataforma.",
      },
    ],
  }),
  component: () => (
    <EmBreveBlock
      titulo="Em breve"
      texto="A busca de destinos estará disponível no lançamento da plataforma."
    />
  ),
});
