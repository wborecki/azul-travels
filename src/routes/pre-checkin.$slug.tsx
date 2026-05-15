import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/pre-checkin/$slug")({
  component: PreCheckinRedirect,
});

function PreCheckinRedirect() {
  const { slug } = Route.useParams();
  return (
    <Navigate
      to="/minha-conta/reservas/nova"
      search={{ slug } as never}
      replace
    />
  );
}
