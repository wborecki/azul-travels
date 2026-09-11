import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  fetchEstabelecimentoPorSlug,
  type EstabelecimentoNormalized,
} from "@/lib/queries/estabelecimentos";
import { fetchItemReservavelPorId, type ItemReservavel } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/minha-conta/reservas/nova")({
  validateSearch: (s: Record<string, unknown>): { slug?: string; itemId?: string } => {
    const slug = typeof s.slug === "string" ? s.slug : undefined;
    const itemId = typeof s.itemId === "string" ? s.itemId : undefined;
    return { ...(slug ? { slug } : {}), ...(itemId ? { itemId } : {}) };
  },
  component: NovaReservaPage,
});

function NovaReservaPage() {
  const { slug, itemId } = useSearch({ from: "/minha-conta/reservas/nova" });
  const [estab, setEstab] = useState<EstabelecimentoNormalized | null>(null);
  const [quarto, setQuarto] = useState<ItemReservavel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      slug ? fetchEstabelecimentoPorSlug(slug) : Promise.resolve(null),
      itemId ? fetchItemReservavelPorId(itemId) : Promise.resolve(null),
    ])
      .then(([e, q]) => {
        if (!alive) return;
        setEstab(e);
        setQuarto(q);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug, itemId]);

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
      {quarto && estab ? (
        <p className="text-sm text-muted-foreground">
          Você selecionou o quarto <strong>{quarto.nome}</strong> em <strong>{estab.nome}</strong>.
          Estamos finalizando o formulário de reserva com essa opção pré-selecionada - volte em
          breve para enviar o pedido.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {estab
            ? `Estamos atualizando o jeito de reservar em ${estab.nome}: em breve você vai escolher entre os quartos disponíveis do local antes de enviar o pedido.`
            : "Estamos atualizando o jeito de reservar: em breve você vai escolher entre os quartos disponíveis de cada local antes de enviar o pedido."}
        </p>
      )}
      <Button asChild className="mt-2">
        <Link to="/explorar">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar para explorar
        </Link>
      </Button>
    </div>
  );
}
