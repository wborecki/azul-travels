import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { addMonths, format, startOfDay, startOfMonth } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContadorHospedes } from "@/components/ContadorHospedes";
import { MesGrade } from "@/components/estabelecimento/MesGrade";
import { formatDataISO } from "@/lib/brazil";
import { cn } from "@/lib/utils";

interface PedidoVisitaCardProps {
  estabelecimentoId: string;
  /** `detalhes.horario_menor_movimento`, quando o local informou. */
  horarioCalmo?: string | null;
}

/** Âncora usada pela barra mobile para rolar até o card. */
export const PEDIDO_VISITA_ANCHOR = "pedido-visita";

/** Teto de pessoas por pedido. Um local de visita não declara capacidade. */
const MAX_PESSOAS = 20;
const MAX_OFFSET_MESES = 10;

type Painel = "data" | "pessoas" | null;

export function MobileVisitaBar() {
  return (
    <div
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-primary">Reserva sem cobrança</div>
          <div className="text-xs text-muted-foreground truncate">Escolha o dia e o horário</div>
        </div>
        <Button
          asChild
          className="shrink-0 bg-secondary hover:bg-secondary/90 text-white"
          size="lg"
        >
          <a href={`#${PEDIDO_VISITA_ANCHOR}`}>Solicitar reserva</a>
        </Button>
      </div>
    </div>
  );
}

export function PedidoVisitaCard({ estabelecimentoId, horarioCalmo }: PedidoVisitaCardProps) {
  const navigate = useNavigate();

  const [painelAberto, setPainelAberto] = useState<Painel>(null);
  const [data, setData] = useState<Date | null>(null);
  const [hora, setHora] = useState("");
  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [offset, setOffset] = useState(0);

  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(ev: MouseEvent) {
      if (raizRef.current && !raizRef.current.contains(ev.target as Node)) {
        setPainelAberto(null);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const hoje = startOfDay(new Date());
  const mes = addMonths(startOfMonth(hoje), offset);
  const totalPessoas = adultos + criancas;
  const completo = !!data && !!hora;

  const continuar = () => {
    if (!data || !hora) return;
    void navigate({
      to: "/reservar",
      search: {
        estabelecimentoId,
        checkIn: formatDataISO(data),
        hora,
        adultos,
        ...(criancas > 0 ? { criancas } : {}),
      },
    });
  };

  return (
    <div
      ref={raizRef}
      id={PEDIDO_VISITA_ANCHOR}
      className="scroll-mt-24 bg-card rounded-2xl border border-border shadow-lg p-6 space-y-4"
    >
      <div>
        <h3 className="text-lg font-bold text-primary">Solicitar reserva</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Seu pedido chega com o Perfil TEA da sua família, para a equipe se preparar antes de vocês
          chegarem.
        </p>
      </div>

      <div className="rounded-xl border border-border">
        <div className="grid grid-cols-2">
          {/* Dia */}
          <div className="relative border-r border-border">
            <button
              type="button"
              onClick={() => setPainelAberto((p) => (p === "data" ? null : "data"))}
              className="w-full p-3 text-left"
            >
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Dia
              </div>
              <div className={cn("text-sm", data ? "text-foreground" : "text-muted-foreground")}>
                {data ? format(data, "dd/MM/yyyy") : "Selecionar"}
              </div>
            </button>

            {painelAberto === "data" && (
              <div className="absolute z-50 left-0 top-full mt-2 w-[min(92vw,340px)] rounded-2xl border border-border bg-card p-5 shadow-2xl">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">Escolha o dia</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setOffset((o) => Math.max(0, o - 1))}
                      disabled={offset === 0}
                      className="rounded-full p-1.5 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Mês anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOffset((o) => Math.min(MAX_OFFSET_MESES, o + 1))}
                      disabled={offset >= MAX_OFFSET_MESES}
                      className="rounded-full p-1.5 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Próximo mês"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Uma visita não tem agenda publicada: nenhum dia futuro vem
                    marcado como indisponível, e é o local que confirma depois. */}
                <MesGrade
                  mes={mes}
                  hoje={hoje}
                  indisponiveis={new Set()}
                  checkIn={data}
                  checkOut={null}
                  fimExibido={null}
                  onSelecionar={(dia) => {
                    setData(dia);
                    setPainelAberto(null);
                  }}
                  onHover={() => {}}
                />
              </div>
            )}
          </div>

          {/* Horário - input nativo, que no celular abre o seletor do sistema */}
          <div className="p-3">
            <label
              htmlFor="visitaHora"
              className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
            >
              Horário
            </label>
            <input
              id="visitaHora"
              type="time"
              value={hora}
              onFocus={() => setPainelAberto(null)}
              onChange={(ev) => setHora(ev.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none"
            />
          </div>
        </div>

        {/* Pessoas */}
        <div className="relative border-t border-border">
          <button
            type="button"
            onClick={() => setPainelAberto((p) => (p === "pessoas" ? null : "pessoas"))}
            className="flex w-full items-center justify-between p-3 text-left"
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Pessoas
              </div>
              <div className="text-sm text-foreground">
                {totalPessoas} {totalPessoas === 1 ? "pessoa" : "pessoas"}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                painelAberto === "pessoas" && "rotate-180",
              )}
            />
          </button>

          {painelAberto === "pessoas" && (
            <div className="absolute z-50 left-0 right-0 top-full mt-2 space-y-4 rounded-2xl border border-border bg-card p-4 shadow-2xl">
              <ContadorHospedes
                label="Adultos"
                sublabel="13 anos ou mais"
                valor={adultos}
                min={1}
                max={MAX_PESSOAS - criancas}
                onChange={setAdultos}
              />
              <ContadorHospedes
                label="Crianças"
                sublabel="De 2 a 12 anos"
                valor={criancas}
                min={0}
                max={MAX_PESSOAS - adultos}
                onChange={setCriancas}
              />
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

      {horarioCalmo && (
        <p className="flex items-center gap-1.5 text-xs text-foreground/70">
          <Clock className="h-3.5 w-3.5 shrink-0 text-secondary" />
          Costuma ser mais calmo por volta das{" "}
          <strong className="font-semibold">{horarioCalmo}</strong>
        </p>
      )}

      <Button
        className="w-full bg-secondary hover:bg-secondary/90 text-white"
        size="lg"
        disabled={!completo}
        onClick={continuar}
      >
        {completo ? "Continuar" : "Escolha o dia e o horário"}
      </Button>

      <p className="text-[11px] leading-snug text-muted-foreground">
        A reserva garante o seu lugar e não tem cobrança pela plataforma. O pedido fica pendente até
        o local confirmar.
      </p>
    </div>
  );
}
