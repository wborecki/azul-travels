import { createFileRoute } from "@tanstack/react-router";
import { EmBreveBlock } from "@/components/EmBreveBlock";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const r = typeof search.redirect === "string" ? search.redirect : undefined;
    return r ? { redirect: r } : {};
  },
  head: () => ({
    meta: [{ title: "Login — Em breve" }],
  }),
  component: () => (
    <EmBreveBlock
      titulo="Em breve"
      texto="O login e cadastro completo estarão disponíveis no lançamento."
    />
  ),
});
