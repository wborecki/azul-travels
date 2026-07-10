import { useEffect, useState } from "react";
import { addMonths, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MesGrade, DIAS_SEMANA } from "@/components/estabelecimento/MesGrade";
import type { DisponibilidadeQuarto } from "@/hooks/useDisponibilidadeQuarto";

const MESES_INICIAIS = 3;
const MESES_POR_CARGA = 3;
// A RPC `datas_indisponiveis_item` só traz bloqueios dos próximos 12 meses
// (mesmo limite do offset do calendário desktop) - carregar mais que isso
// mostraria meses "livres" só porque não temos dado nenhum sobre eles.
const MESES_MAXIMOS = 12;

interface CalendarioMobileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disponibilidade: DisponibilidadeQuarto;
  preco: number;
  onSalvar: () => void;
}

function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Seletor de datas em tela cheia para o mobile, estilo Airbnb: meses
 * empilhados verticalmente (em vez de 2 lado a lado como no desktop) com
 * carregamento incremental - começa com 3 meses e cada toque em "Carregar
 * mais datas" soma mais 3, até o limite de dados que temos disponível.
 */
export function CalendarioMobileModal({
  open,
  onOpenChange,
  disponibilidade,
  preco,
  onSalvar,
}: CalendarioMobileModalProps) {
  const {
    hoje,
    indisponiveis,
    carregando,
    checkIn,
    checkOut,
    fimExibido,
    noites,
    selecionarDia,
    setHoverDate,
    limparSelecao,
  } = disponibilidade;

  const [quantidadeMeses, setQuantidadeMeses] = useState(MESES_INICIAIS);

  useEffect(() => {
    if (open) setQuantidadeMeses(MESES_INICIAIS);
  }, [open]);

  if (!open) return null;

  const mesesVisiveis = Array.from({ length: quantidadeMeses }, (_, i) =>
    addMonths(startOfMonth(hoje), i),
  );
  const podeCarregarMais = quantidadeMeses < MESES_MAXIMOS;
  const total = preco * noites;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-full p-1.5 hover:bg-muted transition"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={limparSelecao}
          className="text-sm font-medium text-secondary hover:underline underline-offset-2"
        >
          Limpar datas
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4" onMouseLeave={() => setHoverDate(null)}>
        <div className="py-4">
          <h2 className="text-xl font-bold text-foreground">
            {checkIn && checkOut
              ? `${noites} ${noites === 1 ? "noite" : "noites"}`
              : checkIn
                ? "Escolha o check-out"
                : "Selecione o check-in"}
          </h2>
          {checkIn && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {checkOut
                ? `${format(checkIn, "d 'de' MMM. 'de' yyyy", { locale: ptBR })} - ${format(checkOut, "d 'de' MMM. 'de' yyyy", { locale: ptBR })}`
                : `Check-in em ${format(checkIn, "d 'de' MMMM", { locale: ptBR })}`}
            </p>
          )}
        </div>

        {carregando ? (
          <div className="h-72 rounded-2xl bg-muted animate-pulse" />
        ) : (
          <>
            <div className="sticky top-0 z-10 grid grid-cols-7 gap-y-1 bg-background text-center text-[11px] text-muted-foreground pb-1">
              {DIAS_SEMANA.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>

            <div className="space-y-8 pb-6">
              {mesesVisiveis.map((mes) => (
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
                  mostrarCabecalhoSemana={false}
                  alinharTituloEsquerda
                />
              ))}
            </div>

            {podeCarregarMais && (
              <div className="flex justify-center pb-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setQuantidadeMeses((n) => Math.min(MESES_MAXIMOS, n + MESES_POR_CARGA))
                  }
                >
                  Carregar mais datas
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <div
        className="shrink-0 border-t border-border px-4 py-3 flex items-center justify-between gap-4"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <span className="text-sm font-semibold text-foreground">
          {checkIn && checkOut ? `Total: ${formatBRL(total)}` : "Selecione as datas"}
        </span>
        <Button
          type="button"
          disabled={!checkIn || !checkOut}
          onClick={onSalvar}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}
