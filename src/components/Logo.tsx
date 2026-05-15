import { Link } from "@tanstack/react-router";

type LogoVariant = "light" | "dark";

/**
 * Logo do Turismo Azul Inclusivo.
 *
 * Símbolo: coração quebra-cabeça com 4 quadrantes (vermelho, azul, verde, amarelo)
 * e linhas brancas estilo puzzle, conforme arte oficial.
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
    resolvedVariant === "dark" ? "text-[#f0c25a]" : "text-[#c69820]";

  return (
    <Link to="/" className="flex items-center gap-3 group" aria-label="Turismo Azul Inclusivo — início">
      {/* Coração quebra-cabeça oficial */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 100 100"
        className="shrink-0"
        aria-hidden="true"
      >
        <path d="M 50 22 C 35 4, 10 8, 12 30 C 12.74 37.4, 15.67 43.98, 20 50 L 30 50 C 30 44, 40 44, 40 50 L 50 50 L 50 42 C 56 42, 56 32, 50 32 L 50 22 Z" fill="#d94a4a" />
        <path d="M 50 22 C 65 4, 90 8, 88 30 C 87.26 37.4, 84.33 43.98, 80 50 L 70 50 C 70 56, 60 56, 60 50 L 50 50 L 50 42 C 56 42, 56 32, 50 32 L 50 22 Z" fill="#2a6fb3" />
        <path d="M 50 50 L 60 50 C 60 56, 70 56, 70 50 L 80 50 C 72.68 60.9, 61.34 70.66, 50 82 L 50 72 C 44 72, 44 60, 50 60 L 50 50 Z" fill="#3e8e5c" />
        <path d="M 20 50 L 30 50 C 30 44, 40 44, 40 50 L 50 50 L 50 60 C 44 60, 44 72, 50 72 L 50 82 C 38.66 70.66, 27.32 60.91, 20 50 Z" fill="#e8b73d" />
        <g fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 50 22 L 50 32 C 56 32, 56 42, 50 42 L 50 60 C 44 60, 44 72, 50 72 L 50 82" />
          <path d="M 20 50 L 30 50 C 30 44, 40 44, 40 50 L 60 50 C 60 56, 70 56, 70 50 L 80 50" />
          <path d="M 50 22 C 35 4, 10 8, 12 30 C 14 50, 32 64, 50 82 C 68 64, 86 50, 88 30 C 90 8, 65 4, 50 22 Z" />
        </g>
      </svg>

      <div className="flex flex-col leading-tight">
        <span className={`text-[10px] uppercase tracking-[0.22em] font-bold ${subColor}`}>
          Marketplace Inclusivo
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className={`font-display font-extrabold text-xl tracking-wide ${titleColor}`}>
            TURISMO AZUL
          </span>
          {showTagline && (
            <span className="tagline-italic text-sm text-[#f0c25a]">inclusivo</span>
          )}
        </span>
      </div>
    </Link>
  );
}
