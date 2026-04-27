import { createFileRoute, Outlet, useSearch } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { DemoBanner } from "@/components/demo/DemoBanner";

const searchSchema = z.object({
  view: fallback(z.enum(["familia", "estabelecimento"]), "familia").default(
    "familia",
  ),
});

export const Route = createFileRoute("/demo")({
  validateSearch: zodValidator(searchSchema),
  component: DemoLayout,
  head: () => ({
    meta: [
      { title: "Demonstração — Turismo Azul" },
      {
        name: "description",
        content:
          "Veja como o Turismo Azul vai funcionar. Demonstração com dados de exemplo do primeiro marketplace de turismo para famílias TEA.",
      },
      { property: "og:title", content: "Demonstração — Turismo Azul" },
      {
        property: "og:description",
        content:
          "Navegue por destinos, perfil sensorial e simule uma reserva. Demonstração interativa.",
      },
    ],
  }),
});

function DemoLayout() {
  const { view } = useSearch({ from: "/demo" });
  const ctaTo = view === "estabelecimento" ? "/estabelecimentos" : "/familias";

  return (
    <>
      <DemoBanner ctaTo={ctaTo} />
      {/* Compensar 36px do banner — o header do site (pt-16) já está acima
          deste container; aqui adicionamos o offset adicional para o banner. */}
      <div style={{ paddingTop: 36 }}>
        <Outlet />
      </div>
    </>
  );
}
