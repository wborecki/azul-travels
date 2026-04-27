import { Link } from "@tanstack/react-router";

type Props = {
  /** Para qual rota o link de "Quero garantir meu acesso" leva. */
  ctaTo: "/familias" | "/estabelecimentos";
};

/**
 * Banner amarelo fixo no topo durante toda a navegação em /demo/*.
 * Sem botão de fechar. Altura 36px. Acima do header.
 */
export function DemoBanner({ ctaTo }: Props) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center px-4"
      style={{
        height: 36,
        backgroundColor: "#F59E0B",
        color: "#1B2E4B",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <div className="container mx-auto flex items-center justify-between gap-3">
        <span className="flex-1 text-center truncate">
          🧪 Modo demonstração — os dados exibidos são exemplos. A plataforma
          real está em construção.
        </span>
        <Link
          to={ctaTo}
          className="hidden sm:inline-block underline whitespace-nowrap"
          style={{ fontSize: 12, color: "#1B2E4B" }}
        >
          Quero garantir meu acesso →
        </Link>
      </div>
    </div>
  );
}
