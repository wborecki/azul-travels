import { Link } from "@tanstack/react-router";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0">
        <path
          d="M2 20c3-2 5-2 8 0s5 2 8 0 5-2 8 0c2 1.3 4 1.3 4 1.3"
          stroke={light ? "#fff" : "hsl(var(--primary))"}
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M2 13c3-2 5-2 8 0s5 2 8 0 5-2 8 0"
          stroke="oklch(0.66 0.10 195)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
      <span className={`font-display font-extrabold text-lg tracking-tight ${light ? "text-white" : "text-primary"}`}>
        Turismo <span className="text-secondary">Azul</span>
      </span>
    </Link>
  );
}
