import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/leads")({
  component: AdminLeadsPage,
});

type LeadRow = Record<string, unknown>;

type ColumnDef = { key: string; label: string };

type TableKey = "familias" | "estabelecimentos";

const TABLES: Record<
  TableKey,
  { table: "leads_familias" | "leads_estabelecimentos"; label: string; columns: ColumnDef[] }
> = {
  familias: {
    table: "leads_familias",
    label: "Famílias",
    columns: [
      { key: "nome", label: "Nome" },
      { key: "email", label: "Email" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "cidade", label: "Cidade" },
      { key: "estado", label: "Estado" },
      { key: "num_filhos_tea", label: "Filhos TEA" },
      { key: "status_diagnostico", label: "Diagnóstico" },
      { key: "preocupacoes", label: "Preocupações" },
      { key: "como_conheceu", label: "Como conheceu" },
      { key: "origem", label: "Origem" },
      { key: "criado_em", label: "Criado em" },
    ],
  },
  estabelecimentos: {
    table: "leads_estabelecimentos",
    label: "Estabelecimentos",
    columns: [
      { key: "nome", label: "Nome" },
      { key: "nome_estabelecimento", label: "Estabelecimento" },
      { key: "cargo", label: "Cargo" },
      { key: "email", label: "Email" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "cidade", label: "Cidade" },
      { key: "estado", label: "Estado" },
      { key: "tipo", label: "Tipo" },
      { key: "num_colaboradores", label: "Colaboradores" },
      { key: "iniciativa_atual", label: "Iniciativa atual" },
      { key: "interesses", label: "Interesses" },
      { key: "como_conheceu", label: "Como conheceu" },
      { key: "origem", label: "Origem" },
      { key: "criado_em", label: "Criado em" },
    ],
  },
};

function formatValue(key: string, value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (key === "criado_em" && typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString("pt-BR");
  }
  return String(value);
}

function AdminLeadsPage() {
  const [selected, setSelected] = useState<TableKey>("familias");
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPagina] = useState(20);

  const config = TABLES[selected];

  const carregar = useCallback(async (key: TableKey) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLES[key].table)
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      setRows((data ?? []) as LeadRow[]);
    } catch (err) {
      toast.error("Erro ao carregar leads", {
        description: err instanceof Error ? err.message : undefined,
      });
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void carregar(selected);
  }, [carregar, selected]);

  // Volta pra página 1 sempre que a tabela, busca ou tamanho mudarem.
  useEffect(() => {
    setPagina(1);
  }, [selected, q, tamanhoPagina]);

  // Filtro client-side: casa o termo contra qualquer coluna visível.
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      config.columns.some((c) => formatValue(c.key, row[c.key]).toLowerCase().includes(term)),
    );
  }, [rows, q, config.columns]);

  const total = filtered.length;
  const totalPaginas = Math.max(1, Math.ceil(total / tamanhoPagina));
  const visiveis = useMemo(
    () => filtered.slice((pagina - 1) * tamanhoPagina, pagina * tamanhoPagina),
    [filtered, pagina, tamanhoPagina],
  );

  function exportarCSV() {
    const { columns, label } = config;
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [columns.map((c) => escape(c.label)).join(",")];
    for (const row of filtered) {
      lines.push(columns.map((c) => escape(formatValue(c.key, row[c.key]))).join(","));
    }
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${label.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} registro(s) exportado(s)`);
  }

  return (
    <div className="space-y-5 min-w-0">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando..." : `${total} registro(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Seletor de tabela */}
          <div className="inline-flex rounded-lg border bg-muted/40 p-1">
            {(Object.keys(TABLES) as TableKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={
                  "px-4 py-1.5 text-sm font-medium rounded-md transition " +
                  (selected === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {TABLES[key].label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={exportarCSV}
            disabled={loading || total === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </header>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-16rem)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
              <tr>
                {config.columns.map((c) => (
                  <th key={c.key} className="px-4 py-4 whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={config.columns.length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : visiveis.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.columns.length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Nenhum lead encontrado.
                  </td>
                </tr>
              ) : (
                visiveis.map((row, i) => (
                  <tr key={(row.id as string) ?? i} className="hover:bg-muted/30">
                    {config.columns.map((c) => {
                      const text = formatValue(c.key, row[c.key]);
                      return (
                        <td
                          key={c.key}
                          className={
                            "px-4 py-4 whitespace-nowrap " +
                            (c.key === "nome"
                              ? "font-medium text-foreground"
                              : "text-foreground/80")
                          }
                        >
                          {text || <span className="text-muted-foreground">-</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          pagina={pagina}
          tamanhoPagina={tamanhoPagina}
          totalPaginas={totalPaginas}
          total={total}
          onPaginaChange={setPagina}
          onTamanhoChange={setTamanhoPagina}
          loading={loading}
          itemLabel="lead(s)"
        />
      </div>
    </div>
  );
}
