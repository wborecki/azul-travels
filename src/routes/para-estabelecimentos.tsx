import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/para-estabelecimentos")({
  beforeLoad: () => {
    throw redirect({ to: "/estabelecimentos" });
  },
  component: () => null,
});
