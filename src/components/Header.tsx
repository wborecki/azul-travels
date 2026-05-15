import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Menu, X, ArrowRight, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDemo = pathname === "/demo" || pathname.startsWith("/demo/");
  const { user, role, isAdmin, isEstabelecimento } = useAuth();

  const accountLink = isAdmin
    ? { to: "/admin", label: "Admin" }
    : isEstabelecimento
      ? { to: "/minha-empresa", label: "Minha empresa" }
      : { to: "/minha-conta", label: "Minha conta" };

  const navLinkClass =
    "px-3 py-2 text-[15px] font-semibold text-white/85 hover:text-white transition-colors duration-150";
  const activeClass = "text-white border-b-2 border-[#f5a623]";

  const navItems = [
    { label: "Como Funciona", href: "/#como-funciona", type: "anchor" as const },
    { label: "Nossa História", to: "/nossa-historia", type: "route" as const },
    { label: "Para Famílias", to: "/familias", type: "route" as const },
    { label: "Para Parceiros", to: "/estabelecimentos", type: "route" as const },
    { label: "Selo Azul", to: "/sobre-os-selos", type: "route" as const },
  ];

  return (
    <header
      className="fixed left-0 right-0 z-50 w-full shadow-md"
      style={{
        top: isDemo ? 36 : 0,
        backgroundColor: "#1a3666",
      }}
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <Logo variant="dark" />

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) =>
            item.type === "route" ? (
              <Link
                key={item.label}
                to={item.to}
                className={navLinkClass}
                activeProps={{ className: `${navLinkClass} ${activeClass}` }}
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
          <Link
            to="/familias"
            className="inline-flex items-center gap-1.5 h-11 px-6 font-bold text-[#1a3666] bg-[#f5a623] hover:bg-[#e09415] transition-colors shadow-sm"
            style={{ borderRadius: 50 }}
          >
            Quero Conhecer <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          className="lg:hidden p-2 text-white"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10" style={{ backgroundColor: "#1a3666" }}>
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navItems.map((item) =>
              item.type === "route" ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="py-2 text-base font-semibold text-white/90"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="py-2 text-base font-semibold text-white/90"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ),
            )}
            <Link
              to="/familias"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center justify-center gap-1.5 h-11 px-6 font-bold text-[#1a3666] bg-[#f5a623]"
              style={{ borderRadius: 50 }}
            >
              Quero Conhecer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
