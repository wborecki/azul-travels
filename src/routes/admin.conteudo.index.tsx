import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchConteudosAdminPaginated, type ConteudoAdminRow } from "@/lib/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AdminPagination } from "@/components/admin/AdminPagination";
import {
  CONTEUDO_CATEGORIAS,
  CONTEUDO_CATEGORIA_LABEL,
  isConteudoCategoria,
  type ConteudoCategoria,
} from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/conteudo/")({
  component: AdminConteudo,
});

type Row = ConteudoAdminRow;

function AdminConteudo() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("todas");
  const [pub, setPub] = useState<string>("todos");
  const [pagina, setPagina] = useState(1);
  const [tamanhoPagina, setTamanhoPagina] = useState(20);
  const debouncedQ = useDebouncedValue(q, 350);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Reset para página 1 quando filtros/busca mudarem.
  useEffect(() => {
    setPagina(1);
  }, [debouncedQ, cat, pub, tamanhoPagina]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const page = await fetchConteudosAdminPaginated({
          busca: debouncedQ.trim() || undefined,
          categoria:
            cat !== "todas" && CONTEUDO_CATEGORIAS.includes(cat as (typeof CONTEUDO_CATEGORIAS)[number])
              ? (cat as (typeof CONTEUDO_CATEGORIAS)[number])
              : undefined,
          publicado: pub === "publicados" ? true : pub === "rascunhos" ? false : undefined,
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
  }, [debouncedQ, cat, pub, pagina, tamanhoPagina]);

  const filtered = useMemo(() => rows, [rows]);

  const togglePublicado = async (r: Row) => {
    const next = !r.publicado;
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, publicado: next } : x)));
    const { error } = await supabase
      .from("conteudo_tea")
      .update({ publicado: next })
      .eq("id", r.id);
    if (error) {
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, publicado: !next } : x)));
      toast.error("Não foi possível atualizar", { description: error.message });
      return;
    }
    toast.success(next ? "Artigo publicado" : "Artigo despublicado");
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("conteudo_tea").delete().eq("id", toDelete.id);
    setDeleting(false);
    if (error) {
      toast.error("Erro ao excluir", { description: error.message });
      return;
    }
    toast.success(`"${toDelete.titulo}" excluído`);
    setToDelete(null);
    setRows((rs) => rs.filter((r) => r.id !== toDelete.id));
    setTotal((t) => Math.max(0, t - 1));
    if (rows.length === 1 && pagina > 1) setPagina((p) => p - 1);
  };

  const handleDuplicate = async (r: Row) => {
    setDuplicatingId(r.id);
    try {
      // Busca artigo completo (resumo, conteúdo, etc.)
      const { data: original, error: fetchErr } = await supabase
        .from("conteudo_tea")
        .select("titulo, resumo, conteudo, categoria, autor, foto_capa")
        .eq("id", r.id)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!original) throw new Error("Artigo original não encontrado.");

      // Gera slug único a partir do slug atual
      const baseSlug = `${r.slug}-copia`.slice(0, 100);
      let slug = baseSlug;
      let suffix = 1;
      // Tenta até encontrar um slug livre (limite de tentativas defensivo)
      while (suffix < 50) {
        const { data: existing, error: slugErr } = await supabase
          .from("conteudo_tea")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (slugErr) throw slugErr;
        if (!existing) break;
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }

      const { data: created, error: insertErr } = await supabase
        .from("conteudo_tea")
        .insert({
          titulo: `${original.titulo} (cópia)`,
          slug,
          resumo: original.resumo,
          conteudo: original.conteudo,
          categoria: original.categoria,
          autor: original.autor,
          foto_capa: original.foto_capa,
          publicado: false,
        })
        .select("id")
        .single();
      if (insertErr) throw insertErr;

      toast.success("Artigo duplicado como rascunho");
      void navigate({ to: "/admin/conteudo/$id", params: { id: created.id } });
    } catch (err) {
      toast.error("Não foi possível duplicar", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Conteúdo TEA</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando..." : `${total} artigo(s)`}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/admin/conteudo/$id" params={{ id: "novo" }}>
            <Plus className="h-4 w-4" /> Novo artigo
          </Link>
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, slug ou autor..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {CONTEUDO_CATEGORIAS.map((c) => (
              <SelectItem key={c} value={c}>
                {CONTEUDO_CATEGORIA_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pub} onValueChange={setPub}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="publicados">Publicados</SelectItem>
            <SelectItem value="rascunhos">Rascunhos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Artigo</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Autor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum artigo encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border">
                          {r.foto_capa ? (
                            <img src={r.foto_capa} alt="" className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{r.titulo}</div>
                          <div className="text-xs text-muted-foreground truncate">/{r.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      {r.categoria ? CONTEUDO_CATEGORIA_LABEL[r.categoria] : "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{r.autor ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.publicado ? (
                        <Badge className="bg-success/15 text-success hover:bg-success/15">
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Rascunho</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">
                      {new Date(r.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <QuickEditPopover
                          row={r}
                          onSaved={(patch) =>
                            setRows((rs) =>
                              rs.map((x) => (x.id === r.id ? { ...x, ...patch } : x)),
                            )
                          }
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => togglePublicado(r)}
                          aria-label={r.publicado ? "Despublicar" : "Publicar"}
                          title={r.publicado ? "Despublicar" : "Publicar"}
                        >
                          {r.publicado ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        {r.publicado && (
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            aria-label="Ver no site"
                          >
                            <Link to="/conteudo/$slug" params={{ slug: r.slug }}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          aria-label="Editar completo"
                          title="Editar completo"
                        >
                          <Link to="/admin/conteudo/$id" params={{ id: r.id }}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => handleDuplicate(r)}
                          disabled={duplicatingId === r.id}
                          aria-label="Duplicar artigo"
                          title="Duplicar artigo"
                        >
                          {duplicatingId === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setToDelete(r)}
                          aria-label="Excluir"
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
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente <strong>{toDelete?.titulo}</strong>. Não pode ser
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

// ────────────────────────────────────────────────────────────────────────────
// Editor rápido — título, categoria e status publicado em popover
// ────────────────────────────────────────────────────────────────────────────

type QuickEditPatch = Partial<Pick<Row, "titulo" | "categoria" | "publicado">>;

interface QuickEditPopoverProps {
  row: Row;
  onSaved: (patch: QuickEditPatch) => void;
}

function QuickEditPopover({ row, onSaved }: QuickEditPopoverProps) {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState(row.titulo);
  const [categoria, setCategoria] = useState<ConteudoCategoria | "">(row.categoria ?? "");
  const [publicado, setPublicado] = useState(!!row.publicado);
  const [saving, setSaving] = useState(false);

  // Reset ao abrir para refletir valor mais recente
  useEffect(() => {
    if (open) {
      setTitulo(row.titulo);
      setCategoria(row.categoria ?? "");
      setPublicado(!!row.publicado);
    }
  }, [open, row.titulo, row.categoria, row.publicado]);

  const tituloTrim = titulo.trim();
  const dirty =
    tituloTrim !== row.titulo ||
    (categoria || null) !== (row.categoria ?? null) ||
    publicado !== !!row.publicado;

  const handleSave = async () => {
    if (!tituloTrim) {
      toast.error("Título não pode ficar vazio");
      return;
    }
    const novaCategoria: ConteudoCategoria | null =
      categoria && isConteudoCategoria(categoria) ? categoria : null;

    const patch: QuickEditPatch = {
      titulo: tituloTrim,
      categoria: novaCategoria,
      publicado,
    };

    setSaving(true);
    const { error } = await supabase.from("conteudo_tea").update(patch).eq("id", row.id);
    setSaving(false);

    if (error) {
      toast.error("Não foi possível salvar", { description: error.message });
      return;
    }

    onSaved(patch);
    toast.success("Alterações salvas");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2"
          aria-label="Edição rápida"
          title="Edição rápida"
        >
          <Zap className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm">Edição rápida</h4>
          <p className="text-xs text-muted-foreground">
            Para conteúdo, capa e SEO use o editor completo.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`qe-titulo-${row.id}`} className="text-xs">
            Título
          </Label>
          <Input
            id={`qe-titulo-${row.id}`}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Categoria</Label>
          <Select
            value={categoria || "__none"}
            onValueChange={(v) => setCategoria(v === "__none" ? "" : (v as ConteudoCategoria))}
            disabled={saving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Sem categoria</SelectItem>
              {CONTEUDO_CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {CONTEUDO_CATEGORIA_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="space-y-0.5">
            <Label htmlFor={`qe-pub-${row.id}`} className="text-sm">
              {publicado ? "Publicado" : "Rascunho"}
            </Label>
            <p className="text-xs text-muted-foreground">
              {publicado ? "Visível no site" : "Apenas no admin"}
            </p>
          </div>
          <Switch
            id={`qe-pub-${row.id}`}
            checked={publicado}
            onCheckedChange={setPublicado}
            disabled={saving}
            aria-label="Alternar publicado"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty} className="gap-1.5">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
