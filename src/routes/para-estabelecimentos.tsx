import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/para-estabelecimentos")({
  beforeLoad: () => {
    throw redirect({ to: "/", search: { scroll: "form-estabelecimentos" } as never });
  },
  component: () => null,
});
