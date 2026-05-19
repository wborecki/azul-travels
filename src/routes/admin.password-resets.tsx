import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, KeyRound, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/password-resets")({
  component: AdminPasswordResetsPage,
});

type Reset = {
  id: string;
  criado_em: string;
  target_user_id: string;
  target_email: string | null;
  ator_id: string | null;
  ator_email: string | null;
  motivo: string | null;
  ip: string | null;
  user_agent: string | null;
};

const PAGE_SIZE = 20;

function AdminPasswordResetsPage() {
  const [rows, setRows] = useState<Reset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // filtros aplicados
  const [emailAlvo, setEmailAlvo] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // filtros em edição
  const [emailInput, setEmailInput] = useState("");
  const [iniInput, setIniInput] = useState("");
  const [fimInput, setFimInput] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase
        .from("admin_password_resets")
        .select("*", { count: "exact" })
        .order("criado_em", { ascending: false });

      if (emailAlvo.trim()) q = q.ilike("target_email", `%${emailAlvo.trim()}%`);
      if (dataInicio) q = q.gte("criado_em", new Date(dataInicio).toISOString());
      if (dataFim) {
        const f = new Date(dataFim);
        f.setHours(23, 59, 59, 999);
        q = q.lte("criado_em", f.toISOString());
      }

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await q.range(from, to);
      if (error) throw error;
      setRows((data ?? []) as Reset[]);
      setTotal(count ?? 0);
    } catch (err) {
      toast.error("Erro ao carregar histórico", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
    setLoading(false);
  }, [emailAlvo, dataInicio, dataFim, page]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function aplicarFiltros() {
    setEmailAlvo(emailInput);
    setDataInicio(iniInput);
    setDataFim(fimInput);
    setPage(0);
  }

  function limparFiltros() {
    setEmailInput("");
    setIniInput("");
    setFimInput("");
    setEmailAlvo("");
    setDataInicio("");
    setDataFim("");
    setPage(0);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = !!(emailAlvo || dataInicio || dataFim);

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <KeyRound className="h-7 w-7 text-primary" /> Resets de senha
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando…" : `${total} registro(s)`}
          </p>
        </div>
        <Button variant="outline" onClick={() => void carregar()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </header>

      <div className="bg-white border rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <Label htmlFor="email-alvo" className="text-xs">Email do usuário-alvo</Label>
          <Input
            id="email-alvo"
            placeholder="ex: usuario@dominio.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
          />
        </div>
        <div>
          <Label htmlFor="data-ini" className="text-xs">De</Label>
          <Input id="data-ini" type="date" value={iniInput} onChange={(e) => setIniInput(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="data-fim" className="text-xs">Até</Label>
          <Input id="data-fim" type="date" value={fimInput} onChange={(e) => setFimInput(e.target.value)} />
        </div>
        <div className="md:col-span-4 flex gap-2 justify-end">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={limparFiltros} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Limpar
            </Button>
          )}
          <Button onClick={aplicarFiltros} size="sm">Aplicar filtros</Button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Nenhum reset registrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário-alvo</TableHead>
                <TableHead>Executado por</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Navegador</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(r.criado_em).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-foreground">{r.target_email ?? "-"}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{r.target_user_id}</div>
                  </TableCell>
                  <TableCell className="text-xs">{r.ator_email ?? <span className="italic text-muted-foreground">-</span>}</TableCell>
                  <TableCell className="text-xs font-mono">{r.ip ?? <span className="italic text-muted-foreground">-</span>}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={r.user_agent ?? undefined}>
                    {r.user_agent ?? <span className="italic">-</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate" title={r.motivo ?? undefined}>
                    {r.motivo ?? <span className="italic">-</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
