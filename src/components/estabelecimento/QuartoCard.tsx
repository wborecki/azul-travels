import { Link } from "@tanstack/react-router";
import { ImageOff, Users, BedDouble, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMODIDADE_POR_KEY } from "@/lib/itens-comodidades";
import type { ItemReservavel } from "@/lib/queries";

function formatPreco(preco: number): string {
  return `${preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / noite`;
}

interface QuartoCardProps {
  item: ItemReservavel;
  estabelecimentoSlug: string;
}

/**
 * Card horizontal de um quarto na vitrine pública (`/estabelecimento/$slug`),
 * inspirado na lista de tipos de quarto do Booking - foto, capacidade,
 * comodidades em destaque e preço. Leva à página própria do quarto
 * (`/quartos/$id`) para o detalhe completo, com CTA direta pra reservar.
 */
export function QuartoCard({ item, estabelecimentoSlug }: QuartoCardProps) {
  const imagens = Array.isArray(item.imagens) ? (item.imagens as string[]) : [];
  const capa = imagens[0];
  const comodidadesDestaque = item.comodidades.slice(0, 4);

  return (
    <div className="group flex flex-col sm:flex-row gap-0 sm:gap-4 rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition">
      <Link
        to="/quartos/$id"
        params={{ id: item.id }}
        className="relative sm:w-64 shrink-0 aspect-[4/3] sm:aspect-auto bg-muted"
        aria-label={`Ver detalhes de ${item.nome}`}
      >
        {capa ? (
          <img src={capa} alt={item.nome} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <ImageOff className="h-6 w-6 text-foreground/30" />
          </div>
        )}
        {imagens.length > 1 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 text-white text-[11px] px-2 py-0.5">
            <Images className="h-3 w-3" /> {imagens.length}
          </span>
        )}
      </Link>

      <div className="flex-1 p-4 sm:py-4 sm:pr-4 flex flex-col gap-2 min-w-0">
        <Link to="/quartos/$id" params={{ id: item.id }} className="text-left">
          <h3 className="font-display font-bold text-lg text-primary group-hover:underline">
            {item.nome}
          </h3>
        </Link>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/70">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" /> Até {item.capacidade_total} pessoa(s)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" /> {item.quantidade_camas} cama(s)
          </span>
        </div>

        {comodidadesDestaque.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {comodidadesDestaque.map((key) => {
              const c = COMODIDADE_POR_KEY[key];
              if (!c) return null;
              const Icon = c.icon;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground/70"
                >
                  <Icon className="h-3.5 w-3.5" /> {c.label}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-auto pt-2 flex items-end justify-between gap-3">
          <div className="text-lg font-bold text-primary shrink-0">{formatPreco(item.preco)}</div>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild size="sm" variant="outline">
              <Link to="/quartos/$id" params={{ id: item.id }}>
                Ver detalhes
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-secondary hover:bg-secondary/90 text-white">
              <Link
                to="/minha-conta/reservas/nova"
                search={{ slug: estabelecimentoSlug, itemId: item.id } as never}
              >
                Reservar
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
