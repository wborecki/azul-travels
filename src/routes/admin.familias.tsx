import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DemoBadge } from "@/components/admin/DemoBadge";

export const Route = createFileRoute("/admin/familias")({
  component: AdminFamiliasPage,
});

const STATUS_OPTIONS = ["ativo", "pendente", "inativo"] as const;
type StatusFilter = "todos" | (typeof STATUS_OPTIONS)[number];
type PerfilFilter = "todos" | "sim" | "nao";

type Row = {
  id: string;
  nome_responsavel: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  criado_em: string;
  status: string;
  tem_perfil_tea: boolean;
  is_admin: boolean;
};

function AdminFamiliasPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState<string>("todos");
  const [statusF, setStatusF] = useState<StatusFilter>("todos");
  const [perfilF, setPerfilF] = useState<PerfilFilter>("todos");
  const debouncedBusca = useDebouncedValue(busca, 300);
  const [verPerfil, setVerPerfil] = useState<Row | null>(null);
  const [promover, setPromover] = useState<Row | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [fams, perfis, roles] = await Promise.all([
        supabase
          .from("familia_profiles")
          .select("id, nome_responsavel, email, telefone, cidade, estado, criado_em, status")
          .order("criado_em", { ascending: false }),
        supabase.from("perfil_tea").select("user_id"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (fams.error) throw fams.error;
      if (perfis.error) throw perfis.error;
      if (roles.error) throw roles.error;

      const comPerfil = new Set((perfis.data ?? []).map((p) => p.user_id));
      const adminSet = new Set(
        (roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
      );
      setRows(
        (fams.data ?? []).map((f) => ({
          ...f,
          status: f.status ?? "ativo",
          tem_perfil_tea: comPerfil.has(f.id),
          is_admin: adminSet.has(f.id),
        })),
      );
    } catch (err) {
      toast.error("Erro ao carregar famílias", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const estadosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.estado && set.add(r.estado));
    return Array.from(set).sort();
  }, [rows]);

  const filtrados = useMemo(() => {
    const termo = debouncedBusca.trim().toLowerCase();
    return rows.filter((r) => {
      if (termo) {
        const blob = `${r.nome_responsavel ?? ""} ${r.email ?? ""}`.toLowerCase();
        if (!blob.includes(termo)) return false;
      }
      if (estado !== "todos" && r.estado !== estado) return false;
      if (statusF !== "todos" && r.status !== statusF) return false;
      if (perfilF === "sim" && !r.tem_perfil_tea) return false;
      if (perfilF === "nao" && r.tem_perfil_tea) return false;
      return true;
    });
  }, [rows, debouncedBusca, estado, statusF, perfilF]);

  async function mudarStatus(row: Row, novo: string) {
    setBusy(row.id);
    const { error } = await supabase
      .from("familia_profiles")
      .update({ status: novo })
      .eq("id", row.id);
    setBusy(null);
    if (error) {
      toast.error("Erro ao mudar status", { description: error.message });
      return;
    }
    toast.success(`Status alterado para ${novo}.`);
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: novo } : r)));
  }

  async function confirmarPromover() {
    if (!promover) return;
    setBusy(promover.id);
    const { error } = await supabase.rpc("promote_to_admin", { _user_id: promover.id });
    setBusy(null);
    if (error) {
      toast.error("Erro ao promover", { description: error.message });
      return;
    }
    toast.success(`${promover.nome_responsavel ?? "Usuário"} promovido a administrador.`);
    setRows((rs) => rs.map((r) => (r.id === promover.id ? { ...r, is_admin: true } : r)));
    setPromover(null);
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" /> Famílias TEA
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Carregando..." : `${filtrados.length} de ${rows.length} família(s)`}
        </p>
      </header>

      <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos UF</SelectItem>
            {estadosDisponiveis.map((uf) => (
              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusF} onValueChange={(v) => setStatusF(v as StatusFilter)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={perfilF} onValueChange={(v) => setPerfilF(v as PerfilFilter)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Perfil TEA" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Perfil TEA: todos</SelectItem>
            <SelectItem value="sim">Com perfil TEA</SelectItem>
            <SelectItem value="nao">Sem perfil TEA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando…
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Nenhuma família encontrada.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Perfil TEA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.nome_responsavel ?? "-"}
                    {r.is_admin && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                        ADMIN
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{r.email ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{r.telefone ?? "-"}</TableCell>
                  <TableCell>{[r.cidade, r.estado].filter(Boolean).join("/") || "-"}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(r.criado_em).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {r.tem_perfil_tea ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                        Preenchido
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={busy === r.id}>
                          {busy === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setVerPerfil(r)}>
                          Ver perfil completo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">Mudar status</DropdownMenuLabel>
                        {STATUS_OPTIONS.map((s) => (
                          <DropdownMenuItem
                            key={s}
                            disabled={r.status === s}
                            onSelect={() => void mudarStatus(r, s)}
                            className="capitalize"
                          >
                            {s}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        {!r.is_admin && (
                          <DropdownMenuItem onSelect={() => setPromover(r)}>
                            Promover a admin
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!verPerfil} onOpenChange={(o) => !o && setVerPerfil(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{verPerfil?.nome_responsavel ?? "Família"}</DialogTitle>
            <DialogDescription>Perfil completo do cadastro.</DialogDescription>
          </DialogHeader>
          {verPerfil && (
            <div className="space-y-2 text-sm">
              <Field label="Email" value={verPerfil.email} />
              <Field label="WhatsApp" value={verPerfil.telefone} />
              <Field label="Cidade/UF" value={[verPerfil.cidade, verPerfil.estado].filter(Boolean).join(" / ")} />
              <Field label="Data de cadastro" value={new Date(verPerfil.criado_em).toLocaleString("pt-BR")} />
              <Field label="Status" value={verPerfil.status} />
              <Field label="Perfil TEA preenchido" value={verPerfil.tem_perfil_tea ? "Sim" : "Não"} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!promover} onOpenChange={(o) => !o && setPromover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promover a administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{promover?.nome_responsavel ?? promover?.email}</strong> terá acesso
              completo ao painel administrativo, incluindo dados sensíveis. Esta ação pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmarPromover()}>
              Promover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "-"}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "ativo"
      ? "bg-emerald-50 text-emerald-700"
      : status === "pendente"
      ? "bg-amber-50 text-amber-700"
      : "bg-gray-100 text-gray-600";
  return <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${tone}`}>{status}</span>;
}
