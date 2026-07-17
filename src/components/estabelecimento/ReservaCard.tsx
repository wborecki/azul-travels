import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { format } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContadorHospedes } from "@/components/ContadorHospedes";
import { MesGrade } from "@/components/estabelecimento/MesGrade";
import type { DisponibilidadeQuarto } from "@/hooks/useDisponibilidadeQuarto";
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

function clamp(valor: number, min: number, max: number): number {
  return Math.min(Math.max(valor, min), max);
}

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

  const search = useSearch({ from: "/quartos/$id" });
  const navigate = useNavigate({ from: "/quartos/$id" });

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

  const maxTotal = capacidadeTotal;
  const maxAdultos = capacidadeAdultos ?? maxTotal;
  const maxCriancas = capacidadeCriancas ?? maxTotal;

  // Hóspedes moram na URL (?adultos=N&criancas=N) e sempre obedecem a
  // capacidade do quarto: um valor ausente ou fora do limite é fixado aqui
  // em um valor válido, e o efeito abaixo corrige a própria URL de volta.
  const adultos = clamp(search.adultos ?? 1, 1, Math.max(1, Math.min(maxAdultos, maxTotal)));
  const criancas = clamp(
    search.criancas ?? 0,
    0,
    Math.max(0, Math.min(maxCriancas, maxTotal - adultos)),
  );

  function definirHospedes(novoAdultos: number, novoCriancas: number) {
    navigate({
      search: (prev) => ({
        ...prev,
        adultos: novoAdultos !== 1 ? novoAdultos : undefined,
        criancas: novoCriancas !== 0 ? novoCriancas : undefined,
      }),
      replace: true,
      resetScroll: false,
    });
  }

  useEffect(() => {
    if ((search.adultos ?? 1) !== adultos || (search.criancas ?? 0) !== criancas) {
      definirHospedes(adultos, criancas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.adultos, search.criancas, adultos, criancas]);

  const totalHospedes = adultos + criancas;
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
              <ContadorHospedes
                label="Adultos"
                sublabel="13 anos ou mais"
                valor={adultos}
                min={1}
                max={Math.max(1, Math.min(maxAdultos, maxTotal - criancas))}
                onChange={(v) => definirHospedes(v, criancas)}
              />
              <ContadorHospedes
                label="Crianças"
                sublabel="De 2 a 12 anos"
                valor={criancas}
                min={0}
                max={Math.max(0, Math.min(maxCriancas, maxTotal - adultos))}
                onChange={(v) => definirHospedes(adultos, v)}
              />
              <p className="text-xs text-muted-foreground">
                Este espaço acomoda no máximo {capacidadeTotal} hóspede(s).
              </p>
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
