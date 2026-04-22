import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Páginas com hero escuro no topo (header transparente sobre fundo escuro
  // até rolar). Hoje, apenas a home.
  const overDarkHero = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Em páginas com hero escuro: enquanto não rolou, header transparente sobre
  // fundo escuro → variant "dark". Após rolar, header branco → variant "light".
  // Em páginas sem hero escuro: sempre header branco → variant "light".
  const onDark = overDarkHero && !scrolled;
  const logoVariant = onDark ? "dark" : "light";

  const headerBg = onDark
    ? "bg-transparent"
    : `bg-background/90 backdrop-blur ${scrolled ? "shadow-soft" : ""}`;

  const navLinkClass = onDark
    ? "px-3 py-2 text-sm font-medium text-white hover:text-[#2CA8A0] transition-colors duration-200 rounded-md"
    : "px-3 py-2 text-sm font-medium text-[#1B2E4B] hover:text-[#2CA8A0] transition-colors duration-200 rounded-md";

  const navActiveClass = onDark
    ? "text-[#2CA8A0] font-semibold"
    : "text-[#2CA8A0] font-semibold";

  const entrarBtnClass = onDark
    ? "text-white border border-white hover:bg-white/10 hover:text-white transition-colors duration-200"
    : "text-[#1B2E4B] border border-[#1B2E4B] hover:bg-[#1B2E4B]/5 transition-colors duration-200";

  const cadastrarBtnClass = onDark
    ? "bg-[#2CA8A0] text-white hover:bg-[#2CA8A0]/90 transition-colors duration-200"
    : "bg-[#1B2E4B] text-white hover:bg-[#1B2E4B]/90 transition-colors duration-200";

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-200 ${headerBg}`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Logo variant={logoVariant} />

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
