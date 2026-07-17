import { List, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vista } from "@/lib/explorar-search";

interface VistaToggleProps {
  vista: Vista | undefined;
  onChange: (vista: Vista | undefined) => void;
}

export function VistaToggle({ vista, onChange }: VistaToggleProps) {
  const noMapa = vista === "mapa";

  return (
    <div
      className="inline-flex rounded-lg border border-border p-0.5"
      role="group"
      aria-label="Modo de visualização"
    >
      <button
        type="button"
        onClick={() => onChange(undefined)}
        aria-pressed={!noMapa}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition",
          noMapa
            ? "text-muted-foreground hover:text-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Lista</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("mapa")}
        aria-pressed={noMapa}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition",
          noMapa
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Map className="h-4 w-4" />
        <span className="hidden sm:inline">Mapa</span>
      </button>
    </div>
  );
}
