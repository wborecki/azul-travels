import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import logo from "@/assets/logo-turismo-azul.svg";
import { useAuth } from "@/hooks/useAuth";

type Aba = "reservas" | "mensagens" | "opcoes";

const ITENS: ReadonlyArray<{ key: Aba; label: string; to: string }> = [
  { key: "reservas", label: "Reservas", to: "/meu-estabelecimento/reservas" },
  { key: "mensagens", label: "Mensagens", to: "/meu-estabelecimento/mensagens" },
  { key: "opcoes", label: "Quartos", to: "/meu-estabelecimento/opcoes" },
];

export function EstabelecimentoHeader({ ativa }: { ativa: Aba }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/meu-estabelecimento" className="flex items-center gap-3">
          <img src={logo} alt="Turismo Azul" className="h-8 w-auto" />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            to="/meu-estabelecimento"
            className="px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
          >
            Meu Estabelecimento
          </Link>
          {ITENS.map((item) =>
            item.key === ativa ? (
              <span
                key={item.key}
                className="px-3 py-2 rounded-lg font-semibold text-primary bg-azul-claro"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.key}
                to={item.to}
                className="px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
              >
                {item.label}
              </Link>
            ),
          )}
          <button
            onClick={() => void signOut().then(() => navigate({ to: "/" }))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-foreground/70 hover:bg-azul-claro hover:text-primary transition"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
