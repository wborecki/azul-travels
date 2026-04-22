import { createFileRoute } from "@tanstack/react-router";
import { PaginaPlaceholder } from "@/components/PaginaPlaceholder";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade (LGPD) — Turismo Azul" },
      {
        name: "description",
        content:
          "Como coletamos, armazenamos e protegemos os dados das famílias usuárias do Turismo Azul, em conformidade com a LGPD.",
      },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <PaginaPlaceholder
      titulo="Política de Privacidade (LGPD)"
      descricao="Esta seção está em construção. Em breve: detalhes completos sobre tratamento de dados pessoais e sensíveis, retenção, compartilhamento com estabelecimentos e direitos do titular conforme a LGPD."
      contato={{ label: "Encarregado de dados (DPO):", email: "dpo@turismoazul.com.br" }}
    />
  );
}
