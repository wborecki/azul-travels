import { Badge } from "@/components/ui/badge";
import { RESERVA_STATUS_LABEL, type ReservaStatus } from "@/lib/enums";

/**
 * Paleta única de status de reserva - usada tanto na lista (Badge) quanto
 * no calendário (pontos/chips), para as duas visões ficarem consistentes.
 */
export const STATUS_DOT_CLASS: Record<ReservaStatus, string> = {
  aguardando_pagamento: "bg-secondary",
  pendente: "bg-warning",
  confirmada: "bg-success",
  cancelada: "bg-destructive",
  concluida: "bg-muted-foreground",
};

export const STATUS_CHIP_CLASS: Record<ReservaStatus, string> = {
  aguardando_pagamento: "bg-secondary/15 text-secondary",
  pendente: "bg-warning/15 text-warning",
  confirmada: "bg-success/15 text-success",
  cancelada: "bg-destructive/15 text-destructive",
  concluida: "bg-muted text-muted-foreground",
};

const STATUS_BADGE_CLASS: Record<ReservaStatus, string> = {
  aguardando_pagamento: "bg-secondary/15 text-secondary hover:bg-secondary/15",
  pendente: "bg-warning/15 text-warning hover:bg-warning/15",
  confirmada: "bg-success/15 text-success hover:bg-success/15",
  cancelada: "bg-destructive/15 text-destructive hover:bg-destructive/15",
  concluida: "bg-muted text-muted-foreground hover:bg-muted",
};

export function StatusBadge({ status }: { status: ReservaStatus | null }) {
  if (!status) return <Badge variant="secondary">-</Badge>;
  return <Badge className={STATUS_BADGE_CLASS[status]}>{RESERVA_STATUS_LABEL[status]}</Badge>;
}
