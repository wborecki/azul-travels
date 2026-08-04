import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDataISO } from "@/lib/brazil";

interface PedidoVisitaCardProps {
  estabelecimentoId: string;
}

/** Âncora usada pela barra mobile para rolar até o card. */
export const PEDIDO_VISITA_ANCHOR = "pedido-visita";

/**
 * Barra fixa no rodapé do mobile, onde a coluna direita fica escondida.
 *
 * Não reaproveita `MobileReservaBar`: aquela é construída em torno de preço
 * por noite, total e calendário de disponibilidade, e lê a search param da
 * rota `/quartos/$id`. Uma visita não tem nada disso - ela só precisa levar a
 * família até o formulário, que já é curto.
 */
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

/**
 * Pedido de visita para locais que não são hospedagem: a família não escolhe
 * um item, ela marca dia, horário e quantas pessoas no próprio local.
 *
 * Aqui só se coleta o contexto e navega para `/reservar`, que segue sendo o
 * lugar único onde o pedido é montado e enviado (com login, perfis TEA e
 * mensagem). Os campos viajam pela URL, como no resto do fluxo de reserva.
 */
export function PedidoVisitaCard({ estabelecimentoId }: PedidoVisitaCardProps) {
  const navigate = useNavigate();
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);

  const completo = !!data && !!hora;

  const continuar = () =>
    void navigate({
      to: "/reservar",
      search: {
        estabelecimentoId,
        checkIn: data,
        hora,
        adultos,
        ...(criancas > 0 ? { criancas } : {}),
      },
    });

  return (
    <div
      id={PEDIDO_VISITA_ANCHOR}
      className="scroll-mt-24 bg-card rounded-2xl border border-border shadow-lg p-6 space-y-4"
    >
      <h3 className="text-lg font-bold text-primary">Solicitar reserva</h3>
      <p className="text-sm text-muted-foreground">
        Escolha o dia e o horário. Seu pedido chega com o perfil sensorial do seu filho, para a
        equipe se preparar antes de vocês chegarem.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="visitaAdultos" className="text-xs font-semibold text-muted-foreground">
            Adultos
          </Label>
          <Input
            id="visitaAdultos"
            type="number"
            min={1}
            max={20}
            className="mt-1"
            value={adultos}
            onChange={(ev) => setAdultos(Math.max(1, Number(ev.target.value) || 1))}
          />
        </div>
        <div>
          <Label htmlFor="visitaCriancas" className="text-xs font-semibold text-muted-foreground">
            Crianças
          </Label>
          <Input
            id="visitaCriancas"
            type="number"
            min={0}
            max={20}
            className="mt-1"
            value={criancas}
            onChange={(ev) => setCriancas(Math.max(0, Number(ev.target.value) || 0))}
          />
        </div>
        <div>
          <Label htmlFor="visitaDia" className="text-xs font-semibold text-muted-foreground">
            Dia
          </Label>
          <Input
            id="visitaDia"
            type="date"
            className="mt-1"
            min={formatDataISO(new Date())}
            value={data}
            onChange={(ev) => setData(ev.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="visitaHorario" className="text-xs font-semibold text-muted-foreground">
            Horário
          </Label>
          <Input
            id="visitaHorario"
            type="time"
            className="mt-1"
            value={hora}
            onChange={(ev) => setHora(ev.target.value)}
          />
        </div>
      </div>

      <Button
        className="w-full bg-secondary hover:bg-secondary/90 text-white"
        size="lg"
        disabled={!completo}
        onClick={continuar}
      >
        <CalendarDays className="h-4 w-4 mr-2" /> Continuar
      </Button>

      {!completo && (
        <p className="text-[11px] text-muted-foreground text-center">
          Escolha o dia e o horário para continuar.
        </p>
      )}

      <p className="text-[11px] text-muted-foreground leading-snug">
        A reserva garante o seu lugar e não tem cobrança pela plataforma. O pedido fica pendente até
        o local confirmar.
      </p>
    </div>
  );
}
