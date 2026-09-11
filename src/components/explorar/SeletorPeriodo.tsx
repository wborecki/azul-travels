import { useMemo, useState } from "react";
import {
  addMonths,
  differenceInCalendarDays,
  isAfter,
  isBefore,
  startOfMonth,
  startOfToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MesGrade } from "@/components/estabelecimento/MesGrade";

interface SeletorPeriodoProps {
  checkIn?: Date | null;
  checkOut?: Date | null;
  onChange: (checkIn: Date | null, checkOut: Date | null) => void;
  onFechar?: () => void;
  mostrarBotaoFechar?: boolean;
}

export function SeletorPeriodo({
  checkIn: checkInProp,
  checkOut: checkOutProp,
  onChange,
  onFechar,
  mostrarBotaoFechar = true,
}: SeletorPeriodoProps) {
  const hoje = useMemo(() => startOfToday(), []);
  const [checkIn, setCheckIn] = useState<Date | null>(checkInProp ?? null);
  const [checkOut, setCheckOut] = useState<Date | null>(checkOutProp ?? null);
  const [offset, setOffset] = useState(0);

  const mesBase = useMemo(() => addMonths(startOfMonth(hoje), offset), [hoje, offset]);
  const meses = useMemo(() => [mesBase, addMonths(mesBase, 1)], [mesBase]);
  const noites = checkIn && checkOut ? differenceInCalendarDays(checkOut, checkIn) : 0;

  const indisponiveis = useMemo(() => new Set<string>(), []);

  function ehIndisponivel(dia: Date) {
    return isBefore(dia, hoje);
  }

  function selecionarDia(dia: Date) {
    if (ehIndisponivel(dia)) return;

    if (!checkIn || checkOut) {
      setCheckIn(dia);
      setCheckOut(null);
      return;
    }

    if (!isAfter(dia, checkIn)) {
      setCheckIn(dia);
      setCheckOut(null);
      return;
    }

    setCheckOut(dia);
    onChange(checkIn, dia);
  }

  function limparSelecao() {
    setCheckIn(null);
    setCheckOut(null);
    onChange(null, null);
  }

  function fechar() {
    if (checkIn || checkOut) {
      onChange(checkIn, checkOut);
    }
    onFechar?.();
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

      <div className="grid sm:grid-cols-2 gap-8">
        {meses.map((mes) => (
          <MesGrade
            key={mes.toISOString()}
            mes={mes}
            hoje={hoje}
            indisponiveis={indisponiveis}
            checkIn={checkIn}
            checkOut={checkOut}
            fimExibido={checkOut}
            onSelecionar={selecionarDia}
            onHover={() => {}}
          />
        ))}
      </div>

      {mostrarBotaoFechar && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={fechar}>
            Fechar
          </Button>
        </div>
      )}
    </div>
  );
}
