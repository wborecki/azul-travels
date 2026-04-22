import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, Pencil, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIA_LABEL } from "@/lib/conteudo";

export const Route = createFileRoute("/admin/conteudo/")({
  component: AdminConteudo,
});

type Row = Pick<
  Tables<"conteudo_tea">,
  "id" | "titulo" | "slug" | "categoria" | "publicado" | "autor" | "criado_em" | "foto_capa"
>;

const CATEGORIAS = Constants.public.Enums.conteudo_categoria;

function AdminConteudo() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("todas");
  const [pub, setPub] = useState<string>("todos");
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("conteudo_tea")
      .select("id, titulo, slug, categoria, publicado, autor, criado_em, foto_capa")
      .order("criado_em", { ascending: false })
      .limit(300);
    if (error) toast.error("Erro ao carregar", { description: error.message });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (cat !== "todas" && r.categoria !== cat) return false;
      if (pub === "publicados" && !r.publicado) return false;
      if (pub === "rascunhos" && r.publicado) return false;
      if (term) {
        const hay = [r.titulo, r.slug, r.autor].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [rows, q, cat, pub]);

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
    void load();
  };

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Conteúdo TEA</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando..." : `${filtered.length} de ${rows.length} artigo(s)`}
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
            {CATEGORIAS.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORIA_LABEL[c]}
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
                            <img
                              src={r.foto_capa}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {r.titulo}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            /{r.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      {r.categoria ? CATEGORIA_LABEL[r.categoria] : "—"}
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
                          aria-label="Editar"
                        >
                          <Link to="/admin/conteudo/$id" params={{ id: r.id }}>
                            <Pencil className="h-4 w-4" />
                          </Link>
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
              Esta ação removerá permanentemente <strong>{toDelete?.titulo}</strong>. Não
              pode ser desfeita.
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
