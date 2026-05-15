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
import { Crown, Loader2, Plus, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/administradores")({
  component: AdminAdministradoresPage,
});

type Admin = {
  user_id: string;
  nome: string | null;
  email: string | null;
  promoted_by_email: string | null;
  criado_em: string;
};

function AdminAdministradoresPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [convidarOpen, setConvidarOpen] = useState(false);
  const [emailBusca, setEmailBusca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [remover, setRemover] = useState<Admin | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, criado_em, promoted_by")
        .eq("role", "admin")
        .order("criado_em", { ascending: false });
      if (error) throw error;

      const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
      const promoterIds = Array.from(
        new Set((roles ?? []).map((r) => r.promoted_by).filter((x): x is string => !!x)),
      );
      const allIds = Array.from(new Set([...ids, ...promoterIds]));

      const [fams, ests] = await Promise.all([
        allIds.length
          ? supabase
              .from("familia_profiles")
              .select("id, nome_responsavel, email")
              .in("id", allIds)
          : Promise.resolve({ data: [], error: null }),
        allIds.length
          ? supabase
              .from("estabelecimento_profiles")
              .select("id, nome_responsavel, email")
              .in("id", allIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const profiles = new Map<string, { nome: string | null; email: string | null }>();
      for (const f of fams.data ?? []) profiles.set(f.id, { nome: f.nome_responsavel, email: f.email });
      for (const e of ests.data ?? [])
        if (!profiles.has(e.id)) profiles.set(e.id, { nome: e.nome_responsavel, email: e.email });

      setAdmins(
        (roles ?? []).map((r) => {
          const p = profiles.get(r.user_id);
          const promoter = r.promoted_by ? profiles.get(r.promoted_by) : null;
          return {
            user_id: r.user_id,
            nome: p?.nome ?? null,
            email: p?.email ?? null,
            promoted_by_email: promoter?.email ?? null,
            criado_em: r.criado_em,
          };
        }),
      );
    } catch (err) {
      toast.error("Erro ao carregar admins", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function promoverPorEmail() {
    const email = emailBusca.trim().toLowerCase();
    if (!email) {
      toast.error("Informe um email.");
      return;
    }
    setBuscando(true);
    try {
      const [fams, ests] = await Promise.all([
        supabase.from("familia_profiles").select("id, email, nome_responsavel").ilike("email", email).limit(1),
        supabase.from("estabelecimento_profiles").select("id, email, nome_responsavel").ilike("email", email).limit(1),
      ]);
      const found = fams.data?.[0] ?? ests.data?.[0];
      if (!found) {
        toast.error("Usuário não encontrado", {
          description: "O email precisa estar cadastrado como família ou estabelecimento.",
        });
        return;
      }
      const { error } = await supabase.rpc("promote_to_admin", { _user_id: found.id });
      if (error) {
        toast.error("Erro ao promover", { description: error.message });
        return;
      }
      toast.success(`${found.nome_responsavel ?? email} agora é administrador.`);
      setConvidarOpen(false);
      setEmailBusca("");
      void carregar();
    } finally {
      setBuscando(false);
    }
  }

  async function confirmarRemover() {
    if (!remover) return;
    setBusy(remover.user_id);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", remover.user_id)
      .eq("role", "admin");
    setBusy(null);
    if (error) {
      toast.error("Erro ao remover", { description: error.message });
      return;
    }
    toast.success("Acesso de admin removido.");
    setAdmins((a) => a.filter((x) => x.user_id !== remover.user_id));
    setRemover(null);
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Crown className="h-7 w-7 text-primary" /> Administradores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando…" : `${admins.length} administrador(es)`}
          </p>
        </div>
        <Button onClick={() => setConvidarOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Convidar novo admin
        </Button>
      </header>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando…
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Nenhum administrador.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Promovido por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <TableRow key={a.user_id}>
                  <TableCell className="font-medium">{a.nome ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{a.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {a.promoted_by_email ?? <span className="italic">—</span>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === a.user_id}
                      onClick={() => setRemover(a)}
                    >
                      {busy === a.user_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldOff className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Remover admin
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={convidarOpen} onOpenChange={setConvidarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar novo admin</DialogTitle>
            <DialogDescription>
              Informe o email de um usuário já cadastrado (família ou estabelecimento) para
              promovê-lo a administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="email-promover">Email do usuário</Label>
            <Input
              id="email-promover"
              type="email"
              placeholder="usuario@exemplo.com"
              value={emailBusca}
              onChange={(e) => setEmailBusca(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvidarOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void promoverPorEmail()} disabled={buscando}>
              {buscando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Promover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!remover} onOpenChange={(o) => !o && setRemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso de administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{remover?.nome ?? remover?.email}</strong> perderá acesso ao painel admin.
              A conta e os dados não são afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmarRemover()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
