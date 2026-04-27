import { createFileRoute } from "@tanstack/react-router";
import { EmBreveBlock } from "@/components/EmBreveBlock";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [{ title: "Cadastro — Em breve" }],
  }),
  component: () => (
    <EmBreveBlock
      titulo="Em breve"
      texto="O login e cadastro completo estarão disponíveis no lançamento."
    />
  ),
});
