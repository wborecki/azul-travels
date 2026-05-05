import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Menu, Plane, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDemo = pathname === "/demo" || pathname.startsWith("/demo/");

  const navLinkClass =
    "px-3 py-2 text-[15px] font-medium text-[#1B2E4B] hover:text-[#2CA8A0] transition-colors duration-150";

  const navItems = [
    { label: "Início", to: "/", type: "route" as const },
    { label: "Sobre Nós", href: "/#por-que-existimos", type: "anchor" as const },
    { label: "Como Funciona", href: "/#como-funciona", type: "anchor" as const },
    { label: "Destinos", to: "/explorar", type: "route" as const },
    { label: "Depoimentos", href: "/#depoimentos", type: "anchor" as const },
    { label: "Contato", to: "/familias", type: "route" as const },
  ];

  return (
    <header
      className="fixed left-0 right-0 z-50 w-full bg-white shadow-sm"
      style={{ top: isDemo ? 36 : 0 }}
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) =>
            item.type === "route" ? (
              <Link
                key={item.label}
                to={item.to}
                className={navLinkClass}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: `${navLinkClass} text-[#1B4F5C] border-b-2 border-[#2CA8A0]` }}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className={navLinkClass}>
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Button
            asChild
            className="bg-[#1B2E4B] text-white hover:bg-[#2CA8A0] rounded-full px-5 h-11 font-semibold"
          >
            <Link to="/familias">
              Quero Viajar <Plane className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t shadow-md">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) =>
              item.type === "route" ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="py-2 text-base font-medium text-[#1B2E4B]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="py-2 text-base font-medium text-[#1B2E4B]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ),
            )}
            <Button asChild className="mt-3 w-full bg-[#1B2E4B] text-white rounded-full">
              <Link to="/familias" onClick={() => setOpen(false)}>
                Quero Viajar <Plane className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
