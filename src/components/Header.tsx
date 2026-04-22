import { Link } from "@tanstack/react-router";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-background/90 backdrop-blur transition-shadow ${
        scrolled ? "shadow-soft" : ""
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/explorar"
            className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-md"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            Explorar
          </Link>
          <Link
            to="/beneficios-tea"
            className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-md"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            Benefícios TEA
          </Link>
          <Link
            to="/conteudo"
            className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-md"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            Conteúdo
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
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
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
