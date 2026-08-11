import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Menu, X, ArrowRight, LogOut, Repeat } from "lucide-react";
import { Fragment, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BotaoModoCalmo } from "@/components/BotaoModoCalmo";
import { getAccountNav } from "@/lib/account-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDemo = pathname === "/demo" || pathname.startsWith("/demo/");
  const { user, role, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const isAdmin = roles.includes("admin");
  const isEstab = roles.includes("estabelecimento");
  const distinctRoles = Array.from(new Set(roles));
  const hasMultiple = distinctRoles.length >= 2;
  const sections = getAccountNav(roles);

  const accountTo = hasMultiple
    ? "/selecionar-perfil"
    : isAdmin
      ? "/admin"
      : isEstab
        ? "/meu-estabelecimento"
        : "/minha-conta";

  const initial = (
    ((user?.user_metadata as Record<string, unknown> | undefined)?.nome_responsavel as
      | string
      | undefined) ??
    user?.email ??
    "?"
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const navLinkClass =
    "px-3 py-2 text-[15px] font-semibold text-white/85 hover:text-white transition-colors duration-150";
  const activeClass = "text-white border-b-2 border-[#f5a623]";

  const navItems = [
    { label: "Como Funciona", href: "/#como-funciona", type: "anchor" as const },
    { label: "Nossa História", to: "/nossa-historia", type: "route" as const },
    { label: "Para Famílias", to: "/familias", type: "route" as const },
    { label: "Para Estabelecimentos", to: "/estabelecimentos", type: "route" as const },
    { label: "Selo Azul", to: "/como-funciona-o-selo-azul", type: "route" as const },
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
          <BotaoModoCalmo />
          {user && role ? (
            <>
              <Link
                to={accountTo}
                aria-label="Minha conta"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/30 text-white font-bold hover:bg-white/20 transition"
              >
                {initial}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Menu da conta"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/85 hover:bg-white/10 hover:text-white transition"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                  {sections.map((section) => (
                    <Fragment key={section.items[0].to}>
                      <DropdownMenuSeparator />
                      {section.title && (
                        <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {section.title}
                        </div>
                      )}
                      {section.items.map((item) => (
                        <DropdownMenuItem asChild key={item.label}>
                          <Link to={item.to} className="cursor-pointer">
                            <item.icon className="h-4 w-4 mr-2" /> {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </Fragment>
                  ))}
                  <DropdownMenuSeparator />
                  {hasMultiple && (
                    <DropdownMenuItem asChild>
                      <Link to="/selecionar-perfil" className="cursor-pointer">
                        <Repeat className="h-4 w-4 mr-2" /> Trocar de perfil
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 h-11 px-6 font-bold text-white border border-white/40 hover:bg-white/10 transition-colors"
              style={{ borderRadius: 50 }}
            >
              Entrar <ArrowRight className="h-4 w-4" />
            </Link>
          )}
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
            <BotaoModoCalmo variante="linha" />
            {user && role ? (
              <>
                {sections.map((section) => (
                  <div key={section.items[0].to} className="mt-3 border-t border-white/10 pt-3">
                    {section.title && (
                      <div className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                        {section.title}
                      </div>
                    )}
                    {section.items.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 py-2 text-base font-semibold text-white/90"
                      >
                        <item.icon className="h-4 w-4" /> {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
                <div className="mt-3 border-t border-white/10 pt-3 flex flex-col gap-1">
                  {hasMultiple && (
                    <Link
                      to="/selecionar-perfil"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 py-2 text-base font-semibold text-white/90"
                    >
                      <Repeat className="h-4 w-4" /> Trocar de perfil
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void handleLogout();
                    }}
                    className="flex items-center gap-2.5 py-2 text-base font-semibold text-white/90"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex items-center justify-center gap-1.5 h-11 px-6 font-bold text-white border border-white/40"
                style={{ borderRadius: 50 }}
              >
                Entrar <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
