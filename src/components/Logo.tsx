import { Link } from "@tanstack/react-router";

type LogoVariant = "light" | "dark";

/**
 * Logo do Turismo Azul.
 *
 * Símbolo: coração formado por 4 quadrantes coloridos (cores do autismo)
 * com linhas brancas estilo quebra-cabeça.
 *
 * `variant="dark"` é usada em fundos escuros (Header navy / Footer).
 * Em ambos os contextos o título e a etiqueta superior aparecem em branco
 * e a tagline "Inclusivo" sai em ciano.
 */
export function Logo({
  variant = "dark",
  light,
  showTagline = true,
}: {
  variant?: LogoVariant;
  light?: boolean;
  showTagline?: boolean;
} = {}) {
  const resolvedVariant: LogoVariant = light ? "dark" : variant;
  const titleColor = resolvedVariant === "dark" ? "text-white" : "text-primary";
  const subColor =
    resolvedVariant === "dark" ? "text-white/70" : "text-muted-foreground";

  return (
    <Link to="/" className="flex items-center gap-3 group" aria-label="Turismo Azul — início">
      {/* Coração quebra-cabeça (azul, laranja, verde, rosa) */}
      <svg
        width="44"
        height="44"
        viewBox="0 0 64 64"
        className="shrink-0"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="heart-clip-logo">
            <path d="M32 58s-22-13-22-30c0-7 5-12 12-12 5 0 8 3 10 6 2-3 5-6 10-6 7 0 12 5 12 12 0 17-22 30-22 30z" />
          </clipPath>
        </defs>
        <g clipPath="url(#heart-clip-logo)">
          <rect x="0" y="0" width="32" height="32" fill="#2176c8" />
          <rect x="32" y="0" width="32" height="32" fill="#f5a623" />
          <rect x="0" y="32" width="32" height="32" fill="#ec4899" />
          <rect x="32" y="32" width="32" height="32" fill="#10b981" />
          <line x1="32" y1="0" x2="32" y2="64" stroke="white" strokeWidth="2.5" />
          <line x1="0" y1="32" x2="64" y2="32" stroke="white" strokeWidth="2.5" />
          {/* Bolinhas centrais reforçam visual de quebra-cabeça */}
          <circle cx="32" cy="20" r="3" fill="white" />
          <circle cx="44" cy="32" r="3" fill="white" />
          <circle cx="32" cy="44" r="3" fill="white" />
          <circle cx="20" cy="32" r="3" fill="white" />
        </g>
      </svg>

      <div className="flex flex-col leading-tight">
        <span className={`text-[10px] uppercase tracking-[0.18em] font-semibold ${subColor}`}>
          Agência TEA
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className={`font-display font-extrabold text-xl tracking-wide ${titleColor}`}>
            TURISMO AZUL
          </span>
          {showTagline && (
            <span className="tagline-italic text-sm text-[#00b4d8]">Inclusivo</span>
          )}
        </span>
      </div>
    </Link>
  );
}
