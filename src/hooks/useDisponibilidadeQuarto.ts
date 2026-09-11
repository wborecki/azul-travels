import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfMonth,
  startOfToday,
} from "date-fns";
import { fetchDatasIndisponiveisItem } from "@/lib/queries";
import { formatDataISO, parseDataISO } from "@/lib/brazil";

/**
 * Estado e lógica de seleção de datas de um quarto, compartilhados entre o
 * card de reserva (coluna direita) e a seção "Datas disponíveis" da página -
 * selecionar em um lugar reflete no outro, como um único date-range-picker
 * por trás de duas superfícies diferentes.
 *
 * Check-in/check-out moram na URL (`?checkIn=yyyy-MM-dd&checkOut=yyyy-MM-dd`)
 * em vez de useState puro - assim a seleção é compartilhável e sobrevive a um
 * refresh. Como as regras de disponibilidade só podem ser checadas depois
 * que os dias bloqueados terminam de carregar, um valor inválido vindo da
 * URL (data passada, bloqueada, ou intervalo cruzando um bloqueio) é
 * silenciosamente corrigido assim que os dados chegam.
 */
export function useDisponibilidadeQuarto(itemId: string) {
  const hoje = startOfToday();
  const search = useSearch({ from: "/quartos/$id" });
  const navigate = useNavigate({ from: "/quartos/$id" });

  const [indisponiveis, setIndisponiveis] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const checkIn = useMemo(() => parseDataISO(search.checkIn), [search.checkIn]);
  const checkOut = useMemo(() => parseDataISO(search.checkOut), [search.checkOut]);

  function definirDatas(novoCheckIn: Date | null, novoCheckOut: Date | null) {
    navigate({
      search: (prev) => ({
        ...prev,
        checkIn: novoCheckIn ? formatDataISO(novoCheckIn) : undefined,
        checkOut: novoCheckOut ? formatDataISO(novoCheckOut) : undefined,
      }),
      replace: true,
      resetScroll: false,
    });
  }

  useEffect(() => {
    let alive = true;
    setCarregando(true);
    void fetchDatasIndisponiveisItem(itemId)
      .then((set) => {
        if (alive) setIndisponiveis(set);
      })
      .finally(() => {
        if (alive) setCarregando(false);
      });
    return () => {
      alive = false;
    };
  }, [itemId]);

  const mesBase = useMemo(() => addMonths(startOfMonth(hoje), offset), [hoje, offset]);
  const meses = useMemo(() => [mesBase, addMonths(mesBase, 1)], [mesBase]);

  const ehIndisponivel = (dia: Date) =>
    isBefore(dia, hoje) || indisponiveis.has(format(dia, "yyyy-MM-dd"));

  /**
   * Corrige a seleção vinda da URL assim que os dias bloqueados terminam de
   * carregar: check-in no passado ou bloqueado limpa tudo; check-out
   * inválido (antes/igual ao check-in ou cruzando um bloqueio) mantém só o
   * check-in. Roda de novo se o quarto mudar (`itemId`, refletido em
   * `carregando`).
   */
  useEffect(() => {
    if (carregando) return;
    if (!checkIn) return;

    if (ehIndisponivel(checkIn)) {
      definirDatas(null, null);
      return;
    }

    if (checkOut) {
      const intervaloValido =
        isAfter(checkOut, checkIn) &&
        eachDayOfInterval({ start: addDays(checkIn, 1), end: checkOut }).every(
          (d) => !ehIndisponivel(d),
        );
      if (!intervaloValido) definirDatas(checkIn, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando]);

  /**
   * Prévia do check-out durante o hover: anda dia a dia a partir do
   * check-in até o dia sob o mouse, parando no último dia disponível antes
   * de qualquer bloqueio - assim a faixa de prévia nunca atravessa uma data
   * indisponível.
   */
  const previewEnd = useMemo(() => {
    if (!checkIn || checkOut || !hoverDate || !isAfter(hoverDate, checkIn)) return null;
    let fim = checkIn;
    for (const dia of eachDayOfInterval({ start: addDays(checkIn, 1), end: hoverDate })) {
      if (ehIndisponivel(dia)) break;
      fim = dia;
    }
    return isSameDay(fim, checkIn) ? null : fim;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, hoverDate, indisponiveis, hoje]);

  const fimExibido = checkOut ?? previewEnd;
  const noites = checkIn && checkOut ? differenceInCalendarDays(checkOut, checkIn) : 0;

  function limparSelecao() {
    setHoverDate(null);
    definirDatas(null, null);
  }

  function selecionarDia(dia: Date) {
    if (ehIndisponivel(dia)) return;

    if (!checkIn || checkOut) {
      // sem seleção, ou seleção já completa: começa uma nova
      definirDatas(dia, null);
      return;
    }

    if (!isAfter(dia, checkIn)) {
      // clicou em um dia igual ou anterior ao check-in: recomeça a partir dele
      definirDatas(dia, null);
      return;
    }

    const intervaloLivre = eachDayOfInterval({ start: addDays(checkIn, 1), end: dia }).every(
      (d) => !ehIndisponivel(d),
    );

    if (intervaloLivre) {
      definirDatas(checkIn, dia);
    } else {
      // o intervalo cruza uma data bloqueada: trata como novo check-in
      definirDatas(dia, null);
    }
  }

  return {
    hoje,
    indisponiveis,
    carregando,
    offset,
    setOffset,
    meses,
    checkIn,
    checkOut,
    hoverDate,
    setHoverDate,
    fimExibido,
    noites,
    selecionarDia,
    limparSelecao,
  };
}

export type DisponibilidadeQuarto = ReturnType<typeof useDisponibilidadeQuarto>;
