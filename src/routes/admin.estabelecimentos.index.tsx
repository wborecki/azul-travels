import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchEstabelecimentosAdminViewPaginated,
  type EstabelecimentoAdminView,
} from "@/lib/queries";
import { ESTAB_STATUS, ESTAB_STATUS_LABEL, type EstabStatus } from "@/lib/enums";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Pencil, Trash2, ChevronDown, Loader2, Star, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { DemoBadge } from "@/components/admin/DemoBadge";

export const Route = createFileRoute("/admin/estabelecimentos/")({
  validateSearch: (search: Record<string, unknown>) => ({
    quer_selo_azul: search.quer_selo_azul === "1" || search.quer_selo_azul === 1 ? 1 : undefined,
  }),
  component: AdminEstabelecimentos,
});

type Row = EstabelecimentoAdminView;

function AdminEstabelecimentos() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const apenasQuerSeloAzul = search.quer_selo_azul === 1;

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPagina] = useState(20);
  const debouncedQ = useDebouncedValue(q, 350);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  /** Ids em mutação (para mostrar spinner inline e desabilitar controles). */
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // Reset pra página 1 sempre que busca/tamanho/filtros mudarem.
  useEffect(() => {
    setPagina(1);
  }, [debouncedQ, tamanhoPagina, apenasQuerSeloAzul]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const page = await fetchEstabelecimentosAdminViewPaginated({
          busca: debouncedQ.trim() || undefined,
          apenasQuerSeloAzul: apenasQuerSeloAzul || undefined,
          pagina,
          tamanhoPagina,
        });
        if (cancelled) return;
        setRows(page.items);
        setTotal(page.total);
        setTotalPaginas(page.totalPaginas);
      } catch (err) {
        if (cancelled) return;
        toast.error("Erro ao carregar", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, pagina, tamanhoPagina, apenasQuerSeloAzul]);

  const filtered = useMemo(() => rows, [rows]);


  const markSaving = (id: string, on: boolean) =>
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  /**
   * Atualiza status com **rollback otimista** - aplica na UI primeiro;
   * se o Supabase falhar, restaura o valor anterior e mostra erro.
   */
  const handleStatusChange = async (row: Row, next: EstabStatus) => {
    if (row.status === next) return;
    const previous = row.status;
    markSaving(row.id, true);
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: next } : r)));

    const { error } = await supabase
      .from("estabelecimentos")
      .update({ status: next })
      .eq("id", row.id);

    markSaving(row.id, false);

    if (error) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: previous } : r)));
      toast.error("Não foi possível alterar o status", { description: error.message });
      return;
    }
    toast.success(`"${row.nome}" agora está ${ESTAB_STATUS_LABEL[next].toLowerCase()}`);
  };

  /** Toggle de destaque com mesma estratégia otimista. */
  const handleDestaqueToggle = async (row: Row, next: boolean) => {
    const previous = row.destaque;
    markSaving(row.id, true);
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, destaque: next } : r)));

    const { error } = await supabase
      .from("estabelecimentos")
      .update({ destaque: next })
      .eq("id", row.id);

    markSaving(row.id, false);

    if (error) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, destaque: previous } : r)));
      toast.error("Não foi possível alterar o destaque", { description: error.message });
      return;
    }
    toast.success(next ? `"${row.nome}" marcado como destaque` : `"${row.nome}" sem destaque`);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("estabelecimentos").delete().eq("id", toDelete.id);
    setDeleting(false);
    if (error) {
      toast.error("Erro ao excluir", { description: error.message });
      return;
    }
    toast.success(`"${toDelete.nome}" excluído`);
    setToDelete(null);
    // Remove localmente e ajusta paginação se a página atual ficou vazia.
    setRows((rs) => rs.filter((r) => r.id !== toDelete.id));
    setTotal((t) => Math.max(0, t - 1));
    if (rows.length === 1 && pagina > 1) setPagina((p) => p - 1);
  };

  const handleToggleDemo = async (row: Row) => {
    const next = !row.is_demo;
    markSaving(row.id, true);
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_demo: next } : r)));
    const { error } = await supabase
      .from("estabelecimentos")
      .update({ is_demo: next })
      .eq("id", row.id);
    markSaving(row.id, false);
    if (error) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_demo: row.is_demo } : r)));
      toast.error("Não foi possível atualizar a marcação", { description: error.message });
      return;
    }
    toast.success(next ? `"${row.nome}" marcado como demo` : `"${row.nome}" marcado como real`);
  };

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Estabelecimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando..." : `${total} registro(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, cidade, tipo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant={apenasQuerSeloAzul ? "default" : "outline"}
            className="gap-2"
            onClick={() =>
              navigate({ search: { quer_selo_azul: apenasQuerSeloAzul ? undefined : 1 } })
            }
            title="Mostrar apenas estabelecimentos que pediram contato para o Selo Azul"
          >
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">
              {apenasQuerSeloAzul ? "Selo Azul: pendentes" : "Quer Selo Azul"}
            </span>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/admin/estabelecimentos/$id" params={{ id: "novo" }}>
              <Plus className="h-4 w-4" /> Novo
            </Link>
          </Button>
        </div>
      </header>

      {apenasQuerSeloAzul && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#c9a84c]/40 bg-[#fff8e6] px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-[#b8852a]" />
            <span className="text-foreground/90">
              Mostrando apenas estabelecimentos que <strong>solicitaram contato para o Selo Azul</strong>.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ search: { quer_selo_azul: undefined } })}
          >
            Limpar filtro
          </Button>
        </div>
      )}

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Destaque</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum estabelecimento encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                        {r.nome}
                        {r.is_demo && <DemoBadge />}
                        {r.quer_selo_azul && !r.selo_azul && (
                          <span
                            title={
                              r.quer_selo_azul_em
                                ? `Solicitado em ${new Date(r.quer_selo_azul_em).toLocaleDateString("pt-BR")}`
                                : "Interesse no Selo Azul"
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#c9a84c]/15 text-[#8a7028] border border-[#c9a84c]/40"
                          >
                            ✨ Quer Selo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">/{r.slug}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-foreground/80">{r.tipo}</td>
                    <td className="px-4 py-3 text-foreground/80">
                      {[r.cidade, r.estado].filter(Boolean).join(" / ") || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusControl
                        row={r}
                        saving={savingIds.has(r.id)}
                        onChange={(next) => void handleStatusChange(r, next)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <DestaqueControl
                        row={r}
                        saving={savingIds.has(r.id)}
                        onChange={(next) => void handleDestaqueToggle(r, next)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => void handleToggleDemo(r)}
                          disabled={savingIds.has(r.id)}
                          aria-label={r.is_demo ? `Desmarcar ${r.nome} como demo` : `Marcar ${r.nome} como demo`}
                          title={r.is_demo ? "Desmarcar como demo" : "Marcar como demo"}
                        >
                          <span className={`text-[10px] font-semibold ${r.is_demo ? "text-orange-700" : "text-muted-foreground"}`}>
                            {r.is_demo ? "DEMO ✓" : "Demo?"}
                          </span>
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                          <Link
                            to="/admin/estabelecimentos/$id/preview"
                            params={{ id: r.id }}
                            aria-label={`Pré-visualizar ${r.nome}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                          <Link
                            to="/admin/estabelecimentos/$id"
                            params={{ id: r.id }}
                            aria-label={`Editar ${r.nome}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={() => setToDelete(r)}
                          aria-label={`Excluir ${r.nome}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
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
          itemLabel="estabelecimento(s)"
        />
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir estabelecimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente <strong>{toDelete?.nome}</strong>. Não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Cores semânticas por status. Exhaustive `Record<EstabStatus, ...>` -
 * adicionar valor novo ao enum quebra o build até ser tratado aqui.
 */
const STATUS_BADGE: Record<EstabStatus, string> = {
  ativo: "bg-success/15 text-success hover:bg-success/15",
  pendente: "bg-warning/15 text-warning hover:bg-warning/15",
  inativo: "bg-muted text-muted-foreground hover:bg-muted",
};

function StatusBadge({ status }: { status: Row["status"] }) {
  if (!status) return <Badge variant="secondary">-</Badge>;
  return <Badge className={STATUS_BADGE[status]}>{ESTAB_STATUS_LABEL[status]}</Badge>;
}

/**
 * Dropdown que troca o status do estabelecimento direto na lista.
 * O badge serve como trigger; ao abrir, lista os status disponíveis e
 * marca o atual como desabilitado.
 */
function StatusControl({
  row,
  saving,
  onChange,
}: {
  row: Row;
  saving: boolean;
  onChange: (next: EstabStatus) => void;
}) {
  const status = row.status;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={saving}
          aria-label={`Alterar status de ${row.nome}`}
          className="inline-flex items-center gap-1.5 rounded-full disabled:opacity-60"
        >
          {saving ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-2 py-1">
              <Loader2 className="h-3 w-3 animate-spin" /> salvando...
            </span>
          ) : (
            <>
              <StatusBadge status={status} />
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>Mudar status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ESTAB_STATUS.map((s) => (
          <DropdownMenuItem
            key={s}
            disabled={s === status}
            onSelect={() => onChange(s)}
            className="flex items-center justify-between gap-2"
          >
            <span>{ESTAB_STATUS_LABEL[s]}</span>
            {s === status && <span className="text-xs text-muted-foreground">atual</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Toggle inline do flag `destaque`, com ícone e estado de loading. */
function DestaqueControl({
  row,
  saving,
  onChange,
}: {
  row: Row;
  saving: boolean;
  onChange: (next: boolean) => void;
}) {
  const checked = !!row.destaque;
  return (
    <div className="inline-flex items-center gap-2">
      <Switch
        checked={checked}
        disabled={saving}
        onCheckedChange={(v) => onChange(v === true)}
        aria-label={`${checked ? "Remover" : "Marcar como"} destaque para ${row.nome}`}
      />
      {saving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : checked ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          <Star className="h-3.5 w-3.5 fill-primary" /> Destaque
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      )}
    </div>
  );
}
