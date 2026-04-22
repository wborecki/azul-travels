import { createFileRoute } from "@tanstack/react-router";
import { PaginaPlaceholder } from "@/components/PaginaPlaceholder";

export const Route = createFileRoute("/para-estabelecimentos")({
  head: () => ({
    meta: [
      { title: "Certificação para Estabelecimentos — Turismo Azul" },
      {
        name: "description",
        content:
          "Listar seu hotel, restaurante ou parque no Turismo Azul e obter a certificação Selo Azul.",
      },
      { property: "og:title", content: "Certificação para Estabelecimentos — Turismo Azul" },
      {
        property: "og:description",
        content:
          "Faça parte do primeiro marketplace brasileiro de turismo TEA. Certificação, listagem e capacitação da equipe.",
      },
    ],
  }),
  component: ParaEstabelecimentosPage,
});

function ParaEstabelecimentosPage() {
  return (
    <PaginaPlaceholder
      titulo="Certificação para Estabelecimentos"
      descricao="Em breve. Quer listar seu hotel, restaurante ou parque, obter o Selo Azul ou conhecer nosso programa de capacitação? Fale com a gente."
      contato={{ label: "Entre em contato:", email: "contato@turismoazul.com.br" }}
    />
  );
}
