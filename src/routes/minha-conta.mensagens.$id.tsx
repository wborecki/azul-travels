import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/minha-conta/mensagens/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/minha-conta/mensagens", search: { reserva: params.id } });
  },
});
