import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-azul-claro px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-extrabold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Turismo Azul — Marketplace de turismo inclusivo TEA" },
      {
        name: "description",
        content:
          "O primeiro marketplace brasileiro que conecta famílias de pessoas com Transtorno do Espectro Autista a destinos turísticos realmente preparados.",
      },
      { property: "og:title", content: "Turismo Azul — Marketplace de turismo inclusivo TEA" },
      {
        property: "og:description",
        content: "Viajar com autismo. Com confiança, com conforto, com alegria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Turismo Azul — Marketplace de turismo inclusivo TEA" },
      { name: "description", content: "Turismo Azul: marketplace web que conecta famílias TEA a estabelecimentos turísticos inclusivos no Brasil." },
      { property: "og:description", content: "Turismo Azul: marketplace web que conecta famílias TEA a estabelecimentos turísticos inclusivos no Brasil." },
      { name: "twitter:description", content: "Turismo Azul: marketplace web que conecta famílias TEA a estabelecimentos turísticos inclusivos no Brasil." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1f0b8bb1-3e42-4ff5-9f8a-d8ebd6e1272d/id-preview-fe710600--7bf2bcd5-3bbd-46f8-9d66-38cabb2c62ae.lovable.app-1776897014760.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1f0b8bb1-3e42-4ff5-9f8a-d8ebd6e1272d/id-preview-fe710600--7bf2bcd5-3bbd-46f8-9d66-38cabb2c62ae.lovable.app-1776897014760.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pt-16">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
