import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PrecoDetalhesDrawer } from "@/components/estabelecimento/PrecoDetalhesDrawer";
import { CalendarioMobileModal } from "@/components/estabelecimento/CalendarioMobileModal";
import type { DisponibilidadeQuarto } from "@/hooks/useDisponibilidadeQuarto";
import { useHospedesQuarto } from "@/hooks/useHospedesQuarto";
import { formatDataISO } from "@/lib/brazil";

interface MobileReservaBarProps {
  preco: number;
  itemId: string;
  capacidadeTotal: number;
  capacidadeAdultos: number | null;
  capacidadeCriancas: number | null;
  disponibilidade: DisponibilidadeQuarto;
}

function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Barra de reserva fixa no rodapé, só no mobile (a coluna direita grande
 * fica escondida lá). Tocar no preço abre os detalhes (ou o calendário
 * direto, se ainda não há datas); o botão à direita reflete o mesmo estado.
 */
export function MobileReservaBar({
  preco,
  itemId,
  capacidadeTotal,
  capacidadeAdultos,
  capacidadeCriancas,
  disponibilidade,
}: MobileReservaBarProps) {
  const { checkIn, checkOut, noites } = disponibilidade;
  const hospedes = useHospedesQuarto(capacidadeTotal, capacidadeAdultos, capacidadeCriancas);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);

  const temDatas = !!checkIn && !!checkOut;
  const total = preco * noites;

  function aoTocarPreco() {
    if (temDatas) setDetalhesAberto(true);
    else setCalendarioAberto(true);
  }

  return (
    <>
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <button type="button" onClick={aoTocarPreco} className="text-left">
            <div className="text-lg font-bold text-primary whitespace-nowrap">
              {temDatas ? formatBRL(total) : formatBRL(preco)}
            </div>
            <div className="text-xs text-muted-foreground">
              {temDatas ? (
                <span className="underline underline-offset-2">
                  {noites} {noites === 1 ? "noite" : "noites"} · {hospedes.total}{" "}
                  {hospedes.total === 1 ? "hóspede" : "hóspedes"}
                </span>
              ) : (
                "/ noite"
              )}
            </div>
          </button>

          {temDatas ? (
            <Button
              asChild
              className="flex-1 max-w-[220px] bg-secondary hover:bg-secondary/90 text-white"
              size="lg"
            >
              <Link
                to="/reservar"
                search={{
                  itemId,
                  checkIn: checkIn ? formatDataISO(checkIn) : undefined,
                  checkOut: checkOut ? formatDataISO(checkOut) : undefined,
                  adultos: hospedes.adultos,
                  criancas: hospedes.criancas,
                }}
              >
                Solicitar Reserva
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setCalendarioAberto(true)}
              className="flex-1 max-w-[220px] bg-secondary hover:bg-secondary/90 text-white"
              size="lg"
            >
              Conferir disponibilidade
            </Button>
          )}
        </div>
      </div>

      <PrecoDetalhesDrawer
        open={detalhesAberto}
        onOpenChange={setDetalhesAberto}
        preco={preco}
        itemId={itemId}
        disponibilidade={disponibilidade}
        hospedes={hospedes}
        onAlterarDatas={() => {
          setDetalhesAberto(false);
          setCalendarioAberto(true);
        }}
      />

      <CalendarioMobileModal
        open={calendarioAberto}
        onOpenChange={setCalendarioAberto}
        disponibilidade={disponibilidade}
        hospedes={hospedes}
        preco={preco}
        onSalvar={() => {
          setCalendarioAberto(false);
          setDetalhesAberto(true);
        }}
      />
    </>
  );
}
