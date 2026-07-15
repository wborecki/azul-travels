import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { BedDouble } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Carrossel compacto com as fotos de um item reservável (quarto).
 * Usado nos detalhes de reserva (família, conversas e painel do
 * estabelecimento). Aceita `Json` cru da coluna `imagens`.
 */
export function ItemReservadoFotos({
  imagens,
  titulo,
  className,
  alturaClassName = "h-40",
}: {
  imagens: unknown;
  titulo: string;
  className?: string;
  alturaClassName?: string;
}) {
  const fotos = Array.isArray(imagens)
    ? imagens.filter((f): f is string => typeof f === "string" && f.trim().length > 0)
    : [];

  if (fotos.length === 0) {
    return (
      <div
        className={cn(
          "w-full rounded-xl bg-muted grid place-items-center text-muted-foreground",
          alturaClassName,
          className,
        )}
      >
        <BedDouble className="h-8 w-8 opacity-40" />
      </div>
    );
  }

  if (fotos.length === 1) {
    return (
      <div className={cn("w-full rounded-xl overflow-hidden bg-muted", alturaClassName, className)}>
        <img src={fotos[0]} alt={titulo} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <Carousel className={cn("w-full group", className)} opts={{ loop: true }}>
      <CarouselContent>
        {fotos.map((foto, i) => (
          <CarouselItem key={foto}>
            <div className={cn("w-full rounded-xl overflow-hidden bg-muted", alturaClassName)}>
              <img
                src={foto}
                alt={`${titulo} - foto ${i + 1} de ${fotos.length}`}
                className="h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CarouselNext className="right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Carousel>
  );
}
