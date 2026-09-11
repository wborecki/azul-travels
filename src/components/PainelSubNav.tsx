import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

export interface PainelTab {
  label: string;
  to: LinkProps["to"];
  exact?: boolean;
}

export function PainelSubNav({ tabs, greeting }: { tabs: PainelTab[]; greeting?: ReactNode }) {
  return (
    <div className="bg-white border-b sticky top-20 z-30">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between gap-4">
        <span className="hidden sm:block text-sm text-foreground/80 truncate">{greeting}</span>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              className="px-3 py-1.5 rounded-lg whitespace-nowrap text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
              activeProps={{ className: "bg-azul-claro text-primary font-semibold" }}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
