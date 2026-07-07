import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  fetchEstabelecimentoPorSlug,
  type EstabelecimentoNormalized,
} from "@/lib/queries/estabelecimentos";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/minha-conta/reservas/nova")({
  validateSearch: (s: Record<string, unknown>): { slug?: string } => {
    const slug = typeof s.slug === "string" ? s.slug : undefined;
    return slug ? { slug } : {};
  },
  component: NovaReservaPage,
});

function NovaReservaPage() {
  const { slug } = useSearch({ from: "/minha-conta/reservas/nova" });
  const [estab, setEstab] = useState<EstabelecimentoNormalized | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (slug ? fetchEstabelecimentoPorSlug(slug) : Promise.resolve(null))
      .then((e) => {
        if (alive) setEstab(e);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="text-muted-foreground inline-flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-2xl p-8 text-center max-w-xl mx-auto space-y-3">
      <h1 className="text-2xl font-display font-bold text-primary">Reservas em atualização</h1>
      <p className="text-sm text-muted-foreground">
        {estab
          ? `Estamos atualizando o jeito de reservar em ${estab.nome}: em breve você vai escolher entre as opções disponíveis do local antes de enviar o pedido.`
          : "Estamos atualizando o jeito de reservar: em breve você vai escolher entre as opções disponíveis de cada local antes de enviar o pedido."}
      </p>
      <Button asChild className="mt-2">
        <Link to="/explorar">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar para explorar
        </Link>
      </Button>
    </div>
  );
}
