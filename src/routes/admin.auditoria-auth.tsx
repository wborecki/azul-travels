import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShieldCheck, Download, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/auditoria-auth")({
  component: AuditoriaAuthPage,
});

type AuditRow = {
  id: string;
  evento: string;
  sucesso: boolean;
  user_id: string | null;
  email_mascarado: string | null;
  ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  criado_em: string;
};

const EVENTOS = [
  "login_success",
  "login_failure",
  "logout",
  "signup_success",
  "signup_failure",
  "password_reset_request",
  "password_reset_complete",
  "admin_password_reset",
  "session_refresh",
  "session_expired",
  "oauth_start",
  "oauth_callback",
] as const;

const EVENTO_LABEL: Record<string, string> = {
  login_success: "Login (sucesso)",
  login_failure: "Login (falha)",
  logout: "Logout",
  signup_success: "Cadastro (sucesso)",
  signup_failure: "Cadastro (falha)",
  password_reset_request: "Pedido de redefinição",
  password_reset_complete: "Redefinição concluída",
  admin_password_reset: "Reset feito pelo admin",
  session_refresh: "Sessão renovada",
  session_expired: "Sessão expirada",
  oauth_start: "OAuth iniciado",
  oauth_callback: "OAuth retorno",
};

function AuditoriaAuthPage() {
  const { isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [filtroEvento, setFiltroEvento] = useState<string>("todos");
  const [filtroSucesso, setFiltroSucesso] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  async function load() {
    setBusy(true);
    let q = supabase
      .from("auth_audit_log")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(500);
    if (filtroEvento !== "todos") q = q.eq("evento", filtroEvento);
    if (filtroSucesso !== "todos") q = q.eq("sucesso", filtroSucesso === "sim");
    const { data } = await q;
    setRows((data ?? []) as AuditRow[]);
    setBusy(false);
  }

  useEffect(() => {
    if (!loading && isAdmin) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAdmin, filtroEvento, filtroSucesso]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return rows;
    return rows.filter(
      (r) =>
        (r.email_mascarado ?? "").toLowerCase().includes(termo) ||
        (r.ip ?? "").toLowerCase().includes(termo) ||
        (r.user_id ?? "").toLowerCase().includes(termo) ||
        r.evento.toLowerCase().includes(termo),
    );
  }, [rows, busca]);

  function exportCsv() {
    const header = [
      "criado_em",
      "evento",
      "sucesso",
      "email_mascarado",
      "user_id",
      "ip",
      "user_agent",
    ];
    const lines = [header.join(",")];
    for (const r of filtradas) {
      lines.push(
        [
          r.criado_em,
          r.evento,
          r.sucesso ? "sim" : "nao",
          r.email_mascarado ?? "",
          r.user_id ?? "",
          r.ip ?? "",
          (r.user_agent ?? "").replace(/[",\n]/g, " "),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `auditoria-auth-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-display font-bold text-[#1a2f5e] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Auditoria de autenticação
          </h2>
          <p className="text-sm text-muted-foreground">
            Registro dos eventos de login, cadastro e redefinição de senha. E-mails são
            mascarados, e nenhuma senha ou token é armazenado.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
            <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtradas.length}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </div>
      </header>

      <div className="bg-white border rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs text-muted-foreground">Buscar</label>
          <Input
            placeholder="email, IP, user_id ou evento"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="w-56">
          <label className="text-xs text-muted-foreground">Evento</label>
          <Select value={filtroEvento} onValueChange={setFiltroEvento}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {EVENTOS.map((e) => (
                <SelectItem key={e} value={e}>
                  {EVENTO_LABEL[e] ?? e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <label className="text-xs text-muted-foreground">Resultado</label>
          <Select value={filtroSucesso} onValueChange={setFiltroSucesso}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="sim">Sucesso</SelectItem>
              <SelectItem value="nao">Falha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#f8fafc] text-[#1a2f5e]">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Data/Hora</th>
              <th className="text-left px-3 py-2 font-semibold">Evento</th>
              <th className="text-left px-3 py-2 font-semibold">Resultado</th>
              <th className="text-left px-3 py-2 font-semibold">E-mail</th>
              <th className="text-left px-3 py-2 font-semibold">IP</th>
              <th className="text-left px-3 py-2 font-semibold">User-Agent</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  {busy ? "Carregando…" : "Sem registros."}
                </td>
              </tr>
            )}
            {filtradas.map((r) => (
              <tr key={r.id} className="border-t hover:bg-[#f8fafc]/50">
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  {new Date(r.criado_em).toLocaleString("pt-BR")}
                </td>
                <td className="px-3 py-2 text-xs">{EVENTO_LABEL[r.evento] ?? r.evento}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                      r.sucesso
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {r.sucesso ? "Sucesso" : "Falha"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">{r.email_mascarado ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{r.ip ?? "—"}</td>
                <td className="px-3 py-2 text-xs max-w-[280px] truncate" title={r.user_agent ?? ""}>
                  {r.user_agent ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filtradas.length} de até 500 registros mais recentes. Para histórico completo,
        exporte em CSV.
      </p>
    </div>
  );
}
