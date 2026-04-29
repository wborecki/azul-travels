import { createFileRoute } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";

function NotFoundPageComponent() {
  const router = useRouter();
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-azul-claro px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-extrabold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <button
            onClick={() => {
              router.navigate({ to: "/" });
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/$")({
  component: NotFoundPageComponent,
}); 
