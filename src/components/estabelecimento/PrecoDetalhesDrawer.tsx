import { Link } from "@tanstack/react-router";
import { format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { HospedesColapsavel } from "@/components/estabelecimento/SeletorHospedes";
import type { DisponibilidadeQuarto } from "@/hooks/useDisponibilidadeQuarto";
import type { HospedesQuarto } from "@/hooks/useHospedesQuarto";
import { formatDataISO } from "@/lib/brazil";

interface PrecoDetalhesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preco: number;
  itemId: string;
  disponibilidade: DisponibilidadeQuarto;
  hospedes: HospedesQuarto;
  onAlterarDatas: () => void;
}

function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Bottom sheet "Detalhes do preço" (mobile), estilo Airbnb: aberto ao tocar
 * no card de preço fixo no rodapé, quando já há check-in/check-out
 * selecionados - sem datas não há preço total para detalhar, então o
 * disparo abre direto o calendário (`CalendarioMobileModal`) em vez desta
 * folha.
 */
export function PrecoDetalhesDrawer({
  open,
  onOpenChange,
  preco,
  itemId,
  disponibilidade,
  hospedes,
  onAlterarDatas,
}: PrecoDetalhesDrawerProps) {
  const { checkIn, checkOut, noites } = disponibilidade;

  if (!checkIn || !checkOut) return null;

  const total = preco * noites;
  const datasTexto = isSameMonth(checkIn, checkOut)
    ? `${format(checkIn, "d")} – ${format(checkOut, "d 'de' MMM.", { locale: ptBR })}`
    : `${format(checkIn, "d 'de' MMM.", { locale: ptBR })} – ${format(checkOut, "d 'de' MMM.", { locale: ptBR })}`;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-5 pb-6">
        <div className="flex items-center justify-between mb-2">
          <DrawerTitle className="text-xl">Detalhes do preço</DrawerTitle>
          <DrawerClose className="rounded-full p-1.5 hover:bg-muted transition" aria-label="Fechar">
            <X className="h-5 w-5" />
          </DrawerClose>
        </div>

        <div className="flex items-center justify-between py-4 text-sm">
          <span className="text-foreground">
            {noites} {noites === 1 ? "noite" : "noites"} x {formatBRL(preco)}
          </span>
          <span className="font-semibold text-foreground">{formatBRL(total)}</span>
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">Datas</div>
            <div className="text-sm text-muted-foreground">{datasTexto}</div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onAlterarDatas}>
            Alterar
          </Button>
        </div>

        <HospedesColapsavel hospedes={hospedes} className="border-t border-border" />

        <Button
          asChild
          className="w-full mt-6 bg-secondary hover:bg-secondary/90 text-white"
          size="lg"
        >
          <Link
            to="/reservar"
            search={{
              itemId,
              checkIn: formatDataISO(checkIn),
              checkOut: formatDataISO(checkOut),
              adultos: hospedes.adultos,
              criancas: hospedes.criancas,
            }}
          >
            Reservar
          </Link>
        </Button>
      </DrawerContent>
    </Drawer>
  );
}
