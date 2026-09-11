import { cn } from "@/lib/utils";

const BASE =
  "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2";

export function chipClasses(ativo: boolean, extra?: string): string {
  return cn(
    BASE,
    ativo
      ? "border-primary bg-primary text-primary-foreground shadow-sm"
      : "border-border bg-white text-foreground/80 hover:border-primary/40 hover:text-primary",
    extra,
  );
}

export function chipSeloClasses(ativo: boolean): string {
  return cn(
    BASE,
    ativo
      ? "border-secondary bg-secondary text-secondary-foreground shadow-sm"
      : "border-border bg-white text-foreground/80 hover:border-secondary hover:text-primary",
  );
}
