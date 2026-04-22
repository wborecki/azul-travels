import { Link } from "@tanstack/react-router";

type LogoVariant = "light" | "dark";

/**
 * Logo do Turismo Azul.
 *
 * Regras de cor (fixas):
 *   - Símbolo (ondas): SEMPRE teal (#2CA8A0)
 *   - Palavra "Azul":  SEMPRE teal (#2CA8A0)
 *   - Palavra "Turismo":
 *       variant="light" (fundo claro)  → navy  (#1B2E4B)
 *       variant="dark"  (fundo escuro) → branco (#FFFFFF)
 *
 * Compatibilidade: a prop legada `light` (boolean) ainda é aceita e equivale
 * a `variant="dark"` (logo sobre fundo escuro). Prefira `variant`.
 */
export function Logo({
  variant = "light",
  light,
}: {
  variant?: LogoVariant;
  light?: boolean;
}) {
  const resolvedVariant: LogoVariant = light ? "dark" : variant;
  const turismoColor = resolvedVariant === "dark" ? "text-white" : "text-[#1B2E4B]";

  return (
    <Link to="/" className="flex items-center gap-2 group" aria-label="Turismo Azul — início">
      {/* Símbolo (ondas) — sempre teal */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        className="shrink-0"
        aria-hidden="true"
      >
        <path
          d="M2 20c3-2 5-2 8 0s5 2 8 0 5-2 8 0c2 1.3 4 1.3 4 1.3"
          stroke="#2CA8A0"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M2 13c3-2 5-2 8 0s5 2 8 0 5-2 8 0"
          stroke="#2CA8A0"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.85}
        />
      </svg>

      <span className="font-display font-extrabold text-lg tracking-tight transition-colors duration-200">
        <span className={turismoColor}>Turismo </span>
        <span className="text-[#2CA8A0]">Azul</span>
      </span>
    </Link>
  );
}
