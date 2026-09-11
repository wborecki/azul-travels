import { format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DisponibilidadeQuarto } from "@/hooks/useDisponibilidadeQuarto";
import { MesGrade } from "@/components/estabelecimento/MesGrade";

interface QuartoDisponibilidadeProps {
  disponibilidade: DisponibilidadeQuarto;
}

/**
 * Calendário de disponibilidade do quarto, inspirado no bloco "Datas
 * disponíveis" do Airbnb: dois meses lado a lado (um no mobile), dias
 * indisponíveis riscados e sem destaque. Os dados vêm da RPC pública
 * `datas_indisponiveis_item` (bloqueios de manutenção + reservas ativas),
 * sem expor quem reservou.
 *
 * Além de informativo, o calendário é selecionável: um clique define o
 * check-in, passar o mouse sobre os dias seguintes mostra uma prévia do
 * período (a faixa para antes de qualquer data bloqueada, nunca a
 * atravessa) e um segundo clique confirma o check-out - desde que todo o
 * intervalo esteja livre. O estado de seleção vem de `useDisponibilidadeQuarto`
 * e é compartilhado com o card de reserva - selecionar aqui ou lá reflete
 * nos dois lugares.
 */
export function QuartoDisponibilidade({ disponibilidade }: QuartoDisponibilidadeProps) {
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
    return <div className="h-72 rounded-2xl bg-muted animate-pulse" />;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="text-sm text-muted-foreground">
          Clique em um dia para escolher o check-in e em outro, mais à frente, para o check-out.
          Datas em cinza estão indisponíveis (reservadas ou em manutenção).
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            className="rounded-full p-2 hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Meses anteriores"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setOffset((o) => Math.min(10, o + 1))}
            disabled={offset >= 10}
            className="rounded-full p-2 hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Próximos meses"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {checkIn && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm">
          <span className="font-medium text-foreground">
            {checkOut
              ? `${noites} ${noites === 1 ? "noite" : "noites"} · ${
                  isSameMonth(checkIn, checkOut)
                    ? `${format(checkIn, "d")} a ${format(checkOut, "d 'de' MMMM", { locale: ptBR })}`
                    : `${format(checkIn, "d 'de' MMMM", { locale: ptBR })} a ${format(checkOut, "d 'de' MMMM", { locale: ptBR })}`
                }`
              : `Check-in em ${format(checkIn, "d 'de' MMMM", { locale: ptBR })} · escolha o check-out`}
          </span>
          <button
            type="button"
            onClick={limparSelecao}
            className="text-sm font-medium text-secondary hover:underline underline-offset-2"
          >
            Limpar datas
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-8" onMouseLeave={() => setHoverDate(null)}>
        {meses.map((mes, i) => (
          // No mobile só o primeiro mês aparece - o segundo fica pronto no
          // DOM (mesma janela de 2 meses usada pelos botões prev/next), só
          // escondido via CSS até a tela alargar o suficiente pros 2 lado a lado.
          <div key={mes.toISOString()} className={i === 1 ? "hidden sm:block" : undefined}>
            <MesGrade
              mes={mes}
              hoje={hoje}
              indisponiveis={indisponiveis}
              checkIn={checkIn}
              checkOut={checkOut}
              fimExibido={fimExibido}
              onSelecionar={selecionarDia}
              onHover={setHoverDate}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full border border-border bg-card" /> Disponível
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-muted" /> Indisponível
        </span>
      </div>
    </div>
  );
}
