interface QuartoSubNavProps {
  visivel: boolean;
  temComodidades: boolean;
}

const ITEMS = [
  { label: "Fotos", href: "#galeria" },
  { label: "Comodidades", href: "#comodidades" },
  { label: "Avaliações", href: "#avaliacoes" },
  { label: "Localização", href: "#localizacao" },
] as const;

/**
 * Sub-navbar que aparece assim que a galeria de fotos sai completamente de
 * vista (controlado pelo pai via IntersectionObserver). Estilo neutro
 * (branco), diferente da navbar principal, para não competir com ela.
 */
export function QuartoSubNav({ visivel, temComodidades }: QuartoSubNavProps) {
  const items = ITEMS.filter((item) => item.href !== "#comodidades" || temComodidades);

  return (
    <nav
      className={`fixed inset-x-0 top-20 z-40 h-14 border-b border-border bg-white shadow-sm transition-transform duration-200 ${
        visivel ? "translate-y-0" : "-translate-y-full"
      }`}
      aria-hidden={!visivel}
    >
      <div className="container mx-auto flex h-full items-center gap-6 overflow-x-auto px-4">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            tabIndex={visivel ? 0 : -1}
            className="whitespace-nowrap text-sm font-semibold text-foreground/70 transition-colors hover:text-primary"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
