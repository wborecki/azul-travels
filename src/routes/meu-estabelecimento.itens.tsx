import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/meu-estabelecimento/itens")({
  component: () => <Outlet />,
});
