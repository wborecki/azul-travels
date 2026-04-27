import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; to?: string };

export function DemoBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      className="container mx-auto px-4 py-3 text-sm text-muted-foreground flex items-center gap-1 flex-wrap"
      aria-label="breadcrumb"
    >
      <Link to="/demo" className="hover:text-primary font-medium">
        Demo
      </Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {it.to ? (
            <Link to={it.to as never} className="hover:text-primary">
              {it.label}
            </Link>
          ) : (
            <span className="text-foreground">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
