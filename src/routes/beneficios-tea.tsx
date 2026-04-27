import { createFileRoute } from "@tanstack/react-router";
import { EmBreveBlock } from "@/components/EmBreveBlock";

export const Route = createFileRoute("/beneficios-tea")({
  head: () => ({
    meta: [
      { title: "Benefícios TEA — Turismo Azul" },
      {
        name: "description",
        content:
          "Estabelecimentos com entrada gratuita, descontos e privilégios para pessoas autistas.",
      },
    ],
  }),
  component: () => (
    <EmBreveBlock
      titulo="Benefícios exclusivos para autistas"
      texto="Estamos mapeando estabelecimentos que oferecem entrada gratuita, fila prioritária e descontos para pessoas autistas. Tudo isso estará disponível na plataforma."
      ctaLabel="Quero ser avisado no lançamento"
    />
  ),
});
