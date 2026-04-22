import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LogOut, Settings, User as UserIcon } from "lucide-react";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();

  const navLinkClass =
    "px-3 py-2 text-sm font-medium text-[#1B2E4B] hover:text-[#2CA8A0] transition-colors duration-150 rounded-md";
  const navActiveClass = "text-[#2CA8A0] font-semibold";

  const entrarBtnClass =
    "text-[#1B2E4B] border border-[#1B2E4B] hover:bg-[#EBF4F8] hover:text-[#1B2E4B] transition-colors duration-150";

  const cadastrarBtnClass =
    "bg-[#1B2E4B] text-white hover:bg-[#2CA8A0] hover:text-white transition-colors duration-150";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white shadow-sm h-16">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/explorar"
            className={navLinkClass}
            activeProps={{ className: navActiveClass }}
          >
            Explorar destinos
          </Link>
          <Link
            to="/beneficios-tea"
            className={navLinkClass}
            activeProps={{ className: navActiveClass }}
          >
            Benefícios TEA
          </Link>
          <Link
            to="/conteudo"
            className={navLinkClass}
            activeProps={{ className: navActiveClass }}
          >
            Conteúdo
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-2 ${entrarBtnClass}`}
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Minha conta</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/minha-conta">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/minha-conta/perfil-sensorial">Perfis sensoriais</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/minha-conta/reservas">Minhas reservas</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="gap-2">
                        <Settings className="h-4 w-4" /> Painel admin
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild className={entrarBtnClass}>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild className={cadastrarBtnClass}>
                <Link to="/cadastro">Cadastrar grátis</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
