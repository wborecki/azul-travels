/**
 * Lista compacta do histórico de alterações de um estabelecimento,
 * usada dentro do editor admin (`/admin/estabelecimentos/$id`).
 *
 * Renderiza cada linha de `estabelecimentos_auditoria` com:
 *  - Quem alterou (e-mail) e quando
 *  - Qual ação (criou/editou/excluiu)
 *  - Para edições, qual campo mudou e o diff antigo → novo
 */
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  fetchAuditoriaPorEstabelecimento,
  type EstabAuditoriaRow,
} from "@/lib/queries";
import { CAMPO_LABEL, formatAuditValue, acaoBadgeEstab } from "./estabAuditoriaUtils";

export function EstabAuditoriaList({ estabelecimentoId }: { estabelecimentoId: string }) {
  const [rows, setRows] = useState<EstabAuditoriaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await fetchAuditoriaPorEstabelecimento(estabelecimentoId, 100);
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled)
          toast.error("Erro ao carregar histórico", {
            description: err instanceof Error ? err.message : undefined,
          });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [estabelecimentoId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        <History className="mx-auto h-5 w-5 mb-1" />
        Nenhuma alteração registrada ainda.
      </div>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-border/60 ml-2 pl-5">
      {rows.map((r) => {
        const b = acaoBadgeEstab(r.acao);
        return (
          <li key={r.id} className="relative">
            <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground tabular-nums">
                {format(new Date(r.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
              <Badge variant="outline" className={cn("font-medium", b.cls)}>
                {b.label}
              </Badge>
              <span className="text-foreground/80">
                por{" "}
                <span className="font-medium">
                  {r.ator_email ?? "sistema"}
                </span>
              </span>
            </div>
            {r.acao === "editado" && r.campo && (
              <div className="mt-1.5 text-sm">
                <span className="font-medium text-foreground">
                  {CAMPO_LABEL[r.campo] ?? r.campo}
                </span>
                <div className="mt-1 flex items-start gap-2 flex-wrap text-xs">
                  <code className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 max-w-[300px] truncate">
                    {formatAuditValue(r.valor_anterior)}
                  </code>
                  <span className="text-muted-foreground">→</span>
                  <code className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 max-w-[300px] truncate">
                    {formatAuditValue(r.valor_novo)}
                  </code>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
