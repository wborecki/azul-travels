import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Menu, Telescope, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDemo = pathname === "/demo" || pathname.startsWith("/demo/");

  const navLinkClass =
    "px-3 py-2 text-sm font-medium text-[#1B2E4B] hover:text-[#2CA8A0] transition-colors duration-150 rounded-md";

  return (
    <header
      className="fixed left-0 right-0 z-50 w-full bg-white shadow-sm h-16"
      style={{ top: isDemo ? 36 : 0 }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/demo/explorar" className={navLinkClass} onClick={() => setOpen(false)}>
            Explorar destinos
          </Link>
          <Link to="/beneficios-tea" className={navLinkClass} onClick={() => setOpen(false)}>
            Benefícios TEA
          </Link>
          <Link to="/conteudo" className={navLinkClass} onClick={() => setOpen(false)}>
            Conteúdo
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-secondary text-secondary hover:bg-secondary hover:text-white text-xs h-8"
          >
            <Link to="/demo">
              <Telescope className="h-3.5 w-3.5 mr-1" />
              Ver demo
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-[#1B2E4B] border-[#1B2E4B] hover:bg-[#EBF4F8]"
          >
            <Link to="/familias">Lista de espera — famílias</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-[#1B2E4B] text-white hover:bg-[#2CA8A0]"
          >
            <Link to="/estabelecimentos">Cadastrar estabelecimento</Link>
          </Button>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t shadow-md">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <Link to="/demo/explorar" className="py-2 text-sm" onClick={() => setOpen(false)}>
              Explorar destinos
            </Link>
            <Link to="/beneficios-tea" className="py-2 text-sm" onClick={() => setOpen(false)}>
              Benefícios TEA
            </Link>
            <Link to="/conteudo" className="py-2 text-sm" onClick={() => setOpen(false)}>
              Conteúdo
            </Link>
            <Button
              asChild
              variant="outline"
              className="w-full justify-center border-secondary text-secondary"
            >
              <Link to="/demo" onClick={() => setOpen(false)}>
                <Telescope className="h-4 w-4 mr-1" />
                Ver demo
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-center"
            >
              <Link to="/familias" onClick={() => setOpen(false)}>
                Lista de espera — famílias
              </Link>
            </Button>
            <Button asChild className="w-full justify-center bg-[#1B2E4B] text-white">
              <Link to="/estabelecimentos" onClick={() => setOpen(false)}>
                Cadastrar estabelecimento
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
