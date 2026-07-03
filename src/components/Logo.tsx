import { Link } from "@tanstack/react-router";
import logoSvg from "@/assets/logo_colorido_transparente_fundo_azul.svg";

export function Logo({
  variant,
  light,
  showTagline,
}: {
  variant?: "light" | "dark";
  light?: boolean;
  showTagline?: boolean;
} = {}) {
  void variant;
  void light;
  void showTagline;

  return (
    <Link to="/" aria-label="Turismo Azul Inclusivo - início">
      <img src={logoSvg} alt="Turismo Azul Inclusivo" className="h-28 w-auto" />
    </Link>
  );
}
