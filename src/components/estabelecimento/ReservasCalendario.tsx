import { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATUS_CHIP_CLASS } from "./StatusBadge";
import type { ReservaEstabelecimentoRow } from "@/lib/queries";

interface ReservasCalendarioProps {
  reservas: ReservaEstabelecimentoRow[];
  onSelecionar: (reserva: ReservaEstabelecimentoRow) => void;
}

/**
 * Grade mensal via FullCalendar (`@fullcalendar/react` + `daygrid`) - cada
 * reserva vira uma barra contínua do check-in ao check-out. `end` é
 * exclusivo nos eventos allDay do FullCalendar, então somamos 1 dia ao
 * check-out pra incluí-lo visualmente na barra.
 */
export function ReservasCalendario({ reservas, onSelecionar }: ReservasCalendarioProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [titulo, setTitulo] = useState(() =>
    format(new Date(), "MMMM 'de' yyyy", { locale: ptBR }),
  );

  const eventos = useMemo<EventInput[]>(() => {
    return reservas
      .filter((r): r is ReservaEstabelecimentoRow & { data_checkin: string } => !!r.data_checkin)
      .map((r) => {
        const fimExclusivo = format(
          addDays(parseISO(r.data_checkout ?? r.data_checkin), 1),
          "yyyy-MM-dd",
        );
        return {
          id: r.id,
          title: r.familia_profiles?.nome_responsavel ?? "Família não identificada",
          start: r.data_checkin,
          end: fimExclusivo,
          allDay: true,
          classNames: STATUS_CHIP_CLASS[r.status ?? "pendente"].split(" "),
          extendedProps: { reserva: r },
        };
      });
  }, [reservas]);

  return (
    <div
      className="bg-white border rounded-2xl overflow-hidden p-2 sm:p-4"
      style={{ "--fc-today-bg-color": "var(--azul-claro)" } as React.CSSProperties}
    >
      <div className="flex items-center justify-between px-2 pb-3">
        <h2 className="font-display font-bold text-primary capitalize">{titulo}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => calendarRef.current?.getApi().prev()}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => calendarRef.current?.getApi().today()}>
            Hoje
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => calendarRef.current?.getApi().next()}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={false}
        locale={ptBrLocale}
        firstDay={0}
        height="auto"
        dayMaxEvents={3}
        eventDisplay="block"
        events={eventos}
        datesSet={(arg) => {
          setTitulo(format(arg.view.currentStart, "MMMM 'de' yyyy", { locale: ptBR }));
        }}
        eventClick={(info: EventClickArg) => {
          onSelecionar(info.event.extendedProps.reserva as ReservaEstabelecimentoRow);
        }}
      />
    </div>
  );
}
