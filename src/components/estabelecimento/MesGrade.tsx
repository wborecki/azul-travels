import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

/**
 * Grade de um único mês do date-range-picker (Datas disponíveis / card de
 * reserva), estilo Airbnb: dias indisponíveis riscados, check-in/check-out
 * com bolinha sólida e faixa de seleção entre eles.
 */
export function MesGrade({
  mes,
  hoje,
  indisponiveis,
  checkIn,
  checkOut,
  fimExibido,
  onSelecionar,
  onHover,
  mostrarCabecalhoSemana = true,
  alinharTituloEsquerda = false,
}: {
  mes: Date;
  hoje: Date;
  indisponiveis: Set<string>;
  checkIn: Date | null;
  checkOut: Date | null;
  fimExibido: Date | null;
  onSelecionar: (dia: Date) => void;
  onHover: (dia: Date | null) => void;
  /** Oculta o cabeçalho D S T Q Q S S - útil na lista vertical do mobile, onde ele aparece uma única vez, fixo no topo. */
  mostrarCabecalhoSemana?: boolean;
  /** Título do mês alinhado à esquerda em vez de centralizado - layout de lista vertical do mobile. */
  alinharTituloEsquerda?: boolean;
}) {
  const dias = eachDayOfInterval({
    start: startOfWeek(startOfMonth(mes), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(mes), { weekStartsOn: 0 }),
  });

  // Só existe faixa visível (banda entre check-in e o fim exibido) quando há
  // um segundo dia de fato - um check-in sozinho não desenha banda nenhuma.
  const temFaixa = !!checkIn && !!fimExibido && !isSameDay(checkIn, fimExibido);

  return (
    <div>
      <h3
        className={cn(
          "font-semibold text-foreground first-letter:uppercase mb-3",
          alinharTituloEsquerda ? "text-left text-lg" : "text-center",
        )}
      >
        {format(mes, "MMMM 'de' yyyy", { locale: ptBR })}
      </h3>
      {mostrarCabecalhoSemana && (
        <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] text-muted-foreground mb-1">
          {DIAS_SEMANA.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-7 gap-y-1">
        {dias.map((dia) => {
          if (!isSameMonth(dia, mes)) return <span key={dia.toISOString()} />;
          const iso = format(dia, "yyyy-MM-dd");
          const passado = isBefore(dia, hoje);
          const indisponivel = passado || indisponiveis.has(iso);
          const ehHoje = isSameDay(dia, hoje);

          const isCheckIn = !!checkIn && isSameDay(dia, checkIn);
          const isCheckOut = !!checkOut && isSameDay(dia, checkOut);
          const isEndpoint = isCheckIn || isCheckOut;

          const dentroFaixa =
            temFaixa && !isBefore(dia, checkIn as Date) && !isAfter(dia, fimExibido as Date);

          const diaSemana = getDay(dia); // 0 = domingo, 6 = sábado
          const arredondaEsq = dentroFaixa && (isSameDay(dia, checkIn as Date) || diaSemana === 0);
          const arredondaDir =
            dentroFaixa && (isSameDay(dia, fimExibido as Date) || diaSemana === 6);

          const ehPreview = dentroFaixa && !checkOut;

          let estadoLabel: string;
          if (indisponivel) estadoLabel = "indisponível";
          else if (isCheckIn) estadoLabel = "check-in selecionado";
          else if (isCheckOut) estadoLabel = "check-out selecionado";
          else estadoLabel = "disponível";

          return (
            <div key={iso} className="relative grid place-items-center">
              {dentroFaixa && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-1",
                    ehPreview ? "bg-secondary/15" : "bg-secondary/20",
                    // Nos dias com bolinha (check-in/check-out), a faixa cobre só a
                    // metade da célula voltada para a viagem - assim a ponta
                    // arredondada nasce exatamente no centro (onde a bolinha também
                    // está centralizada) e fica sempre encoberta por ela, em vez de
                    // vazar um pedaço de azul claro ao lado quando a célula é mais
                    // larga que a bolinha (telas grandes).
                    isCheckIn && "left-1/2 right-0 rounded-l-full",
                    isCheckOut && "left-0 right-1/2 rounded-r-full",
                    !isEndpoint && "inset-x-0",
                    !isEndpoint && arredondaEsq && "rounded-l-full",
                    !isEndpoint && arredondaDir && "rounded-r-full",
                  )}
                />
              )}
              <button
                type="button"
                disabled={indisponivel}
                onClick={() => onSelecionar(dia)}
                onMouseEnter={() => onHover(dia)}
                className={cn(
                  "relative z-10 grid h-9 w-9 place-items-center rounded-full text-sm tabular-nums transition-colors",
                  indisponivel && "text-muted-foreground/60 line-through cursor-not-allowed",
                  !indisponivel && !isEndpoint && "font-medium text-foreground hover:bg-secondary/25",
                  isEndpoint && "bg-primary font-semibold text-primary-foreground",
                  !indisponivel && !isEndpoint && ehHoje && "ring-1 ring-primary/50",
                )}
                aria-label={`${format(dia, "d 'de' MMMM", { locale: ptBR })} - ${estadoLabel}`}
              >
                {format(dia, "d")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
