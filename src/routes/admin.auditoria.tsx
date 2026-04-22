import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, History, Search, X } from "lucide-react";
import { toast } from "sonner";
import { fetchAuditoriaAdminPaginated, type AuditoriaRow } from "@/lib/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/auditoria")({
  component: AdminAuditoria,
});

/** Mapeia ações conhecidas para um label/cor consistente. */
function acaoBadge(acao: string) {
  const norm = acao.toLowerCase();
  if (norm.includes("confirm"))
    return { label: "Confirmou", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (norm.includes("cancel"))
    return { label: "Cancelou", cls: "bg-rose-100 text-rose-700 border-rose-200" };
  if (norm.includes("conclu"))
    return { label: "Concluiu", cls: "bg-blue-100 text-blue-700 border-blue-200" };
  if (norm.includes("criar") || norm.includes("criou"))
    return { label: "Criou", cls: "bg-violet-100 text-violet-700 border-violet-200" };
  return { label: acao, cls: "bg-muted text-foreground/70 border-border" };
}

function AdminAuditoria() {
  const [rows, setRows] = useState<AuditoriaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState<Date | undefined>();
  const [ate, setAte] = useState<Date | undefined>();
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPagina] = useState(20);
  const debouncedQ = useDebouncedValue(q, 350);

  // Reset para a página 1 sempre que filtros/busca mudarem.
  useEffect(() => {
    setPagina(1);
  }, [debouncedQ, desde, ate, tamanhoPagina]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        // `desde`: começo do dia / `ate`: fim do dia (inclusivo).
        const desdeIso = desde
          ? new Date(desde.getFullYear(), desde.getMonth(), desde.getDate(), 0, 0, 0).toISOString()
          : undefined;
        const ateIso = ate
          ? new Date(
              ate.getFullYear(),
              ate.getMonth(),
              ate.getDate(),
              23,
              59,
              59,
              999,
            ).toISOString()
          : undefined;

        const page = await fetchAuditoriaAdminPaginated({
          busca: debouncedQ.trim() || undefined,
          desde: desdeIso,
          ate: ateIso,
          pagina,
          tamanhoPagina,
        });
        if (cancelled) return;
        setRows(page.items);
        setTotal(page.total);
        setTotalPaginas(page.totalPaginas);
      } catch (err) {
        if (cancelled) return;
        toast.error("Erro ao carregar auditoria", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, desde, ate, pagina, tamanhoPagina]);

  const limparFiltros = () => {
    setQ("");
    setDesde(undefined);
    setAte(undefined);
  };

  const temFiltro = q.trim() !== "" || desde !== undefined || ate !== undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Auditoria de reservas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quem alterou o quê — registros gerados a partir das ações dos administradores
            sobre as reservas.
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-2xl">
        <div className="p-4 flex flex-wrap items-center gap-2 border-b">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por admin (e-mail), ação, observação ou ID da reserva..."
              className="pl-9"
            />
          </div>
          <DateField label="De" date={desde} onChange={setDesde} />
          <DateField label="Até" date={ate} onChange={setAte} />
          {temFiltro && (
            <Button variant="ghost" size="sm" onClick={limparFiltros}>
              <X className="h-4 w-4 mr-1" /> Limpar
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[170px]">Quando</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Mudança</TableHead>
              <TableHead>Reserva</TableHead>
              <TableHead>Observação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const b = acaoBadge(r.acao);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {format(new Date(r.criado_em), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.ator_email ?? (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", b.cls)}>
                        {b.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.status_anterior || r.status_novo ? (
                        <span className="text-muted-foreground">
                          {r.status_anterior ?? "—"}{" "}
                          <span className="text-foreground/40">→</span>{" "}
                          <span className="text-foreground font-medium">
                            {r.status_novo ?? "—"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {r.reserva_id.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate">
                      {r.observacao ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <AdminPagination
          pagina={pagina}
          tamanhoPagina={tamanhoPagina}
          totalPaginas={totalPaginas}
          total={total}
          onPaginaChange={setPagina}
          onTamanhoChange={setTamanhoPagina}
          loading={loading}
          itemLabel="evento(s)"
        />
      </div>
    </div>
  );
}

function DateField({
  label,
  date,
  onChange,
}: {
  label: string;
  date: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          {label}: {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "—"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          initialFocus
          locale={ptBR}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
