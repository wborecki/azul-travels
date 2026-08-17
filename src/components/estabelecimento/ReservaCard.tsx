import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeletorHospedes } from "@/components/estabelecimento/SeletorHospedes";
import { MesGrade } from "@/components/estabelecimento/MesGrade";
import type { DisponibilidadeQuarto } from "@/hooks/useDisponibilidadeQuarto";
import { useHospedesQuarto } from "@/hooks/useHospedesQuarto";
import { formatDataISO } from "@/lib/brazil";
import { cn } from "@/lib/utils";

interface ReservaCardProps {
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

type Painel = "datas" | "hospedes" | null;

/**
 * Card de reserva estilo Airbnb: preço (total quando há datas selecionadas,
 * por noite caso contrário), seletor de check-in/check-out que abre o
 * calendário compartilhado com a seção "Datas disponíveis", e um contador de
 * hóspedes (adultos/crianças). Itens financeiros específicos do Airbnb sem
 * equivalente real aqui (parcelamento, política de cancelamento, "você ainda
 * não será cobrado") foram deixados de fora - o pagamento acontece fora da
 * plataforma, direto com o estabelecimento.
 */
export function ReservaCard({
  preco,
  itemId,
  capacidadeTotal,
  capacidadeAdultos,
  capacidadeCriancas,
  disponibilidade,
}: ReservaCardProps) {
  const { checkIn, checkOut, noites } = disponibilidade;

  const [painelAberto, setPainelAberto] = useState<Painel>(null);

  const hospedes = useHospedesQuarto(capacidadeTotal, capacidadeAdultos, capacidadeCriancas);
  const { adultos, criancas, total: totalHospedes } = hospedes;

  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (raizRef.current && !raizRef.current.contains(e.target as Node)) {
        setPainelAberto(null);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const total = preco * noites;

  return (
    <div ref={raizRef} className="bg-card rounded-2xl border border-border shadow-lg p-6 space-y-4">
      {checkIn && checkOut ? (
        <div>
          <div className="text-2xl font-bold text-primary">Total: {formatBRL(total)}</div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatBRL(preco)} / noite · {noites} {noites === 1 ? "noite" : "noites"}
          </p>
        </div>
      ) : (
        <div className="text-2xl font-bold text-primary">
          {formatBRL(preco)} <span className="text-sm font-normal text-muted-foreground">/ noite</span>
        </div>
      )}

      <div className="rounded-xl border border-border">
        {/* Check-in / check-out */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPainelAberto((p) => (p === "datas" ? null : "datas"))}
            className="grid grid-cols-2 w-full text-left"
          >
            <div className="p-3 border-r border-border">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Check-in
              </div>
              <div className="text-sm text-foreground">
                {checkIn ? format(checkIn, "dd/MM/yyyy") : "Selecionar"}
              </div>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Checkout
              </div>
              <div className="text-sm text-foreground">
                {checkOut ? format(checkOut, "dd/MM/yyyy") : "Selecionar"}
              </div>
            </div>
          </button>

          {painelAberto === "datas" && (
            <div className="absolute z-50 right-0 top-full mt-2 w-[min(92vw,640px)] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card p-5 shadow-2xl">
              <PainelDatas disponibilidade={disponibilidade} onFechar={() => setPainelAberto(null)} />
            </div>
          )}
        </div>

        {/* Hóspedes */}
        <div className="relative border-t border-border">
          <button
            type="button"
            onClick={() => setPainelAberto((p) => (p === "hospedes" ? null : "hospedes"))}
            className="flex w-full items-center justify-between p-3 text-left"
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Hóspedes
              </div>
              <div className="text-sm text-foreground">
                {totalHospedes} {totalHospedes === 1 ? "hóspede" : "hóspedes"}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                painelAberto === "hospedes" && "rotate-180",
              )}
            />
          </button>

          {painelAberto === "hospedes" && (
            <div className="absolute z-50 left-0 right-0 top-full mt-2 rounded-2xl border border-border bg-card p-4 shadow-2xl space-y-4">
              <SeletorHospedes hospedes={hospedes} />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setPainelAberto(null)}
                  className="text-sm font-semibold text-foreground underline underline-offset-2"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {checkIn && checkOut ? (
        <Button asChild className="w-full bg-secondary hover:bg-secondary/90 text-white" size="lg">
          <Link
            to="/reservar"
            search={{
              itemId,
              checkIn: formatDataISO(checkIn),
              checkOut: formatDataISO(checkOut),
              adultos,
              criancas,
            }}
          >
            Solicitar Reserva
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          className="w-full bg-secondary hover:bg-secondary/90 text-white"
          size="lg"
          onClick={() => setPainelAberto("datas")}
        >
          Conferir disponibilidade
        </Button>
      )}

      <p className="text-[11px] text-muted-foreground leading-snug">
        Esta plataforma conecta você ao estabelecimento. O pagamento é feito diretamente com eles.
      </p>
    </div>
  );
}

function PainelDatas({
  disponibilidade,
  onFechar,
}: {
  disponibilidade: DisponibilidadeQuarto;
  onFechar: () => void;
}) {
  const {
    hoje,
    indisponiveis,
    carregando,
    offset,
    setOffset,
    meses,
    checkIn,
    checkOut,
    fimExibido,
    noites,
    selecionarDia,
    setHoverDate,
    limparSelecao,
  } = disponibilidade;

  if (carregando) {
    return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">
          {checkIn && checkOut
            ? `${noites} ${noites === 1 ? "noite" : "noites"}`
            : checkIn
              ? "Escolha o check-out"
              : "Selecione o check-in"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={limparSelecao}
            className="text-sm font-medium text-secondary hover:underline underline-offset-2"
          >
            Limpar datas
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setOffset((o) => Math.max(0, o - 1))}
              disabled={offset === 0}
              className="rounded-full p-1.5 hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Meses anteriores"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOffset((o) => Math.min(10, o + 1))}
              disabled={offset >= 10}
              className="rounded-full p-1.5 hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Próximos meses"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-8" onMouseLeave={() => setHoverDate(null)}>
        {meses.map((mes) => (
          <MesGrade
            key={mes.toISOString()}
            mes={mes}
            hoje={hoje}
            indisponiveis={indisponiveis}
            checkIn={checkIn}
            checkOut={checkOut}
            fimExibido={fimExibido}
            onSelecionar={selecionarDia}
            onHover={setHoverDate}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={onFechar}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
