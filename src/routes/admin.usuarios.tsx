import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, ShieldOff, Users } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APP_ROLE_LABEL, type AppRole } from "@/lib/enums";

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsuariosPage,
});

type Row = {
  user_id: string;
  tipo: "familia" | "estabelecimento";
  nome: string | null;
  email: string | null;
  cidade: string | null;
  estado: string | null;
  criado_em: string;
  roles: AppRole[];
};

function AdminUsuariosPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [acaoEm, setAcaoEm] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [familias, estabs, roles] = await Promise.all([
        supabase
          .from("familia_profiles")
          .select("id, nome_responsavel, email, cidade, estado, criado_em")
          .order("criado_em", { ascending: false }),
        supabase
          .from("estabelecimento_profiles")
          .select("id, nome_responsavel, email, criado_em")
          .order("criado_em", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (familias.error) throw familias.error;
      if (estabs.error) throw estabs.error;
      if (roles.error) throw roles.error;

      const rolesByUser = new Map<string, AppRole[]>();
      for (const r of roles.data ?? []) {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        rolesByUser.set(r.user_id, arr);
      }

      const all: Row[] = [
        ...(familias.data ?? []).map((f) => ({
          user_id: f.id,
          tipo: "familia" as const,
          nome: f.nome_responsavel,
          email: f.email,
          cidade: f.cidade,
          estado: f.estado,
          criado_em: f.criado_em,
          roles: rolesByUser.get(f.id) ?? [],
        })),
        ...(estabs.data ?? []).map((e) => ({
          user_id: e.id,
          tipo: "estabelecimento" as const,
          nome: e.nome_responsavel,
          email: e.email,
          cidade: null,
          estado: null,
          criado_em: e.criado_em,
          roles: rolesByUser.get(e.id) ?? [],
        })),
      ].sort((a, b) => b.criado_em.localeCompare(a.criado_em));

      setRows(all);
    } catch (err) {
      toast.error("Erro ao carregar usuários", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function promover(userId: string) {
    setAcaoEm(userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    setAcaoEm(null);
    if (error) {
      toast.error("Erro ao promover: " + error.message);
      return;
    }
    toast.success("Usuário promovido a administrador.");
    void carregar();
  }

  async function despromover(userId: string) {
    setAcaoEm(userId);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");
    setAcaoEm(null);
    if (error) {
      toast.error("Erro ao remover admin: " + error.message);
      return;
    }
    toast.success("Acesso de admin removido.");
    void carregar();
  }

  const termo = busca.trim().toLowerCase();
  const filtradas = termo
    ? rows.filter(
        (r) =>
          (r.nome ?? "").toLowerCase().includes(termo) ||
          (r.email ?? "").toLowerCase().includes(termo),
      )
    : rows;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Famílias e estabelecimentos cadastrados. Promova ou remova administradores.
          </p>
        </div>
        <Input
          placeholder="Buscar por nome ou e-mail…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs"
        />
      </header>

      <div className="bg-card border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando…
          </div>
        ) : filtradas.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Nenhum usuário encontrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Papéis</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((r) => {
                const isAdmin = r.roles.includes("admin");
                const busy = acaoEm === r.user_id;
                return (
                  <TableRow key={`${r.tipo}-${r.user_id}`}>
                    <TableCell className="font-medium">{r.nome ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email ?? "-"}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-azul-claro text-primary">
                        {r.tipo === "familia" ? "Família" : "Estabelecimento"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">-</span>
                        ) : (
                          r.roles.map((role) => (
                            <span
                              key={role}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                role === "admin"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground/70"
                              }`}
                            >
                              {APP_ROLE_LABEL[role]}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => despromover(r.user_id)}
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShieldOff className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Remover admin
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => promover(r.user_id)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Promover a admin
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
