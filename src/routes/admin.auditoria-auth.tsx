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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  ShieldCheck,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

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

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

type Filtros = {
  evento: string;
  sucesso: string;
  email: string;
  ip: string;
  userId: string;
  de: string; // yyyy-mm-dd
  ate: string;
  pageSize: number;
};

const FILTROS_PADRAO: Filtros = {
  evento: "todos",
  sucesso: "todos",
  email: "",
  ip: "",
  userId: "",
  de: "",
  ate: "",
  pageSize: 50,
};

function AuditoriaAuthPage() {
  const { isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pagina, setPagina] = useState(0); // zero-based
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_PADRAO);
  const [filtrosAplicados, setFiltrosAplicados] = useState<Filtros>(FILTROS_PADRAO);
  const [erro, setErro] = useState<string | null>(null);

  function aplicarQueryFiltros(query: ReturnType<typeof baseQuery>) {
    const f = filtrosAplicados;
    let q = query;
    if (f.evento !== "todos") q = q.eq("evento", f.evento);
    if (f.sucesso !== "todos") q = q.eq("sucesso", f.sucesso === "sim");
    if (f.email.trim())
      q = q.ilike("email_mascarado", `%${f.email.trim().toLowerCase()}%`);
    if (f.ip.trim()) q = q.ilike("ip", `%${f.ip.trim()}%`);
    if (f.userId.trim()) q = q.eq("user_id", f.userId.trim());
    if (f.de) q = q.gte("criado_em", new Date(`${f.de}T00:00:00`).toISOString());
    if (f.ate) q = q.lte("criado_em", new Date(`${f.ate}T23:59:59`).toISOString());
    return q;
  }

  function baseQuery() {
    return supabase.from("auth_audit_log").select("*", { count: "exact" });
  }

  async function load() {
    setBusy(true);
    setErro(null);
    const desde = pagina * filtrosAplicados.pageSize;
    const ate = desde + filtrosAplicados.pageSize - 1;
    const q = aplicarQueryFiltros(baseQuery())
      .order("criado_em", { ascending: false })
      .range(desde, ate);
    const { data, error, count } = await q;
    if (error) {
      setErro(error.message);
      setRows([]);
      setTotal(0);
    } else {
      setRows((data ?? []) as AuditRow[]);
      setTotal(count ?? 0);
    }
    setBusy(false);
  }

  useEffect(() => {
    if (!loading && isAdmin) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAdmin, filtrosAplicados, pagina]);

  function aplicar() {
    setPagina(0);
    setFiltrosAplicados(filtros);
  }

  function limpar() {
    setFiltros(FILTROS_PADRAO);
    setFiltrosAplicados(FILTROS_PADRAO);
    setPagina(0);
  }

  const totalPaginas = Math.max(1, Math.ceil(total / filtrosAplicados.pageSize));

  const filtrosAtivos = useMemo(() => {
    const a = filtrosAplicados;
    const tags: { k: string; label: string; onClear: () => void }[] = [];
    if (a.evento !== "todos")
      tags.push({
        k: "evento",
        label: `Evento: ${EVENTO_LABEL[a.evento] ?? a.evento}`,
        onClear: () => aplicarPatch({ evento: "todos" }),
      });
    if (a.sucesso !== "todos")
      tags.push({
        k: "sucesso",
        label: `Resultado: ${a.sucesso === "sim" ? "Sucesso" : "Falha"}`,
        onClear: () => aplicarPatch({ sucesso: "todos" }),
      });
    if (a.email)
      tags.push({
        k: "email",
        label: `E-mail: ${a.email}`,
        onClear: () => aplicarPatch({ email: "" }),
      });
    if (a.ip)
      tags.push({
        k: "ip",
        label: `IP: ${a.ip}`,
        onClear: () => aplicarPatch({ ip: "" }),
      });
    if (a.userId)
      tags.push({
        k: "userId",
        label: `User ID: ${a.userId.slice(0, 8)}…`,
        onClear: () => aplicarPatch({ userId: "" }),
      });
    if (a.de)
      tags.push({
        k: "de",
        label: `De: ${a.de}`,
        onClear: () => aplicarPatch({ de: "" }),
      });
    if (a.ate)
      tags.push({
        k: "ate",
        label: `Até: ${a.ate}`,
        onClear: () => aplicarPatch({ ate: "" }),
      });
    return tags;
  }, [filtrosAplicados]);

  function aplicarPatch(patch: Partial<Filtros>) {
    const novo = { ...filtrosAplicados, ...patch };
    setFiltros(novo);
    setFiltrosAplicados(novo);
    setPagina(0);
  }

  async function buscarRegistros(escopo: "pagina" | "todos"): Promise<AuditRow[]> {
    if (escopo === "pagina") return rows;
    const tamLote = 1000;
    let inicio = 0;
    const linhasTotal: AuditRow[] = [];
    const { count } = await aplicarQueryFiltros(baseQuery()).range(0, 0);
    const totalExp = count ?? 0;
    while (inicio < totalExp) {
      const { data } = await aplicarQueryFiltros(baseQuery())
        .order("criado_em", { ascending: false })
        .range(inicio, inicio + tamLote - 1);
      if (!data || data.length === 0) break;
      linhasTotal.push(...(data as AuditRow[]));
      inicio += tamLote;
    }
    return linhasTotal;
  }

  function baixarArquivo(nome: string, conteudo: string, mime: string) {
    const blob = new Blob([conteudo], { type: `${mime};charset=utf-8` });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function montarCsv(linhas: AuditRow[]): string {
    const header = [
      "criado_em",
      "evento",
      "sucesso",
      "email_mascarado",
      "user_id",
      "ip",
      "user_agent",
      "metadata",
    ];
    const out = ["\uFEFF" + header.join(",")];
    for (const r of linhas) {
      out.push(
        [
          r.criado_em,
          r.evento,
          r.sucesso ? "sim" : "nao",
          r.email_mascarado ?? "",
          r.user_id ?? "",
          r.ip ?? "",
          (r.user_agent ?? "").replace(/[\r\n]/g, " "),
          JSON.stringify(r.metadata ?? {}),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    }
    return out.join("\n");
  }

  function montarJson(linhas: AuditRow[]): string {
    return JSON.stringify(
      {
        gerado_em: new Date().toISOString(),
        filtros: filtrosAplicados,
        total: linhas.length,
        registros: linhas,
      },
      null,
      2,
    );
  }

  async function exportar(formato: "csv" | "json", escopo: "pagina" | "todos") {
    setBusy(true);
    try {
      const linhas = await buscarRegistros(escopo);
      const stamp = new Date().toISOString().slice(0, 10);
      const sufixo = escopo === "pagina" ? `pagina-${pagina + 1}` : "filtrado";
      const nome = `auditoria-auth-${stamp}-${sufixo}.${formato}`;
      if (formato === "csv") {
        baixarArquivo(nome, montarCsv(linhas), "text/csv");
      } else {
        baixarArquivo(nome, montarJson(linhas), "application/json");
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando…
      </div>
    );
  }

  const inicioMostrando = total === 0 ? 0 : pagina * filtrosAplicados.pageSize + 1;
  const fimMostrando = Math.min(total, (pagina + 1) * filtrosAplicados.pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-display font-bold text-[#1a2f5e] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Auditoria de autenticação
          </h2>
          <p className="text-sm text-muted-foreground">
            Investigue eventos de login, cadastro e redefinição de senha. E-mails são
            mascarados e nenhuma senha/token é armazenado.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
            <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={busy || total === 0}>
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Página atual ({rows.length})</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => void exportar("csv", "pagina")}>
                CSV - página atual
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportar("json", "pagina")}>
                JSON - página atual
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Todos os filtrados ({total})</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => void exportar("csv", "todos")}>
                CSV - todos filtrados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportar("json", "todos")}>
                JSON - todos filtrados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Evento</label>
            <Select
              value={filtros.evento}
              onValueChange={(v) => setFiltros((f) => ({ ...f, evento: v }))}
            >
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
          <div>
            <label className="text-xs text-muted-foreground">Resultado</label>
            <Select
              value={filtros.sucesso}
              onValueChange={(v) => setFiltros((f) => ({ ...f, sucesso: v }))}
            >
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
          <div>
            <label className="text-xs text-muted-foreground">E-mail (mascarado)</label>
            <Input
              placeholder="ex: ma***@dominio.com"
              value={filtros.email}
              onChange={(e) => setFiltros((f) => ({ ...f, email: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && aplicar()}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">IP</label>
            <Input
              placeholder="ex: 177.220"
              value={filtros.ip}
              onChange={(e) => setFiltros((f) => ({ ...f, ip: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && aplicar()}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">User ID (uuid exato)</label>
            <Input
              placeholder="00000000-0000-…"
              value={filtros.userId}
              onChange={(e) => setFiltros((f) => ({ ...f, userId: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && aplicar()}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">De</label>
            <Input
              type="date"
              value={filtros.de}
              onChange={(e) => setFiltros((f) => ({ ...f, de: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Até</label>
            <Input
              type="date"
              value={filtros.ate}
              onChange={(e) => setFiltros((f) => ({ ...f, ate: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Por página</label>
            <Select
              value={String(filtros.pageSize)}
              onValueChange={(v) =>
                setFiltros((f) => ({ ...f, pageSize: Number(v) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-1">
            {filtrosAtivos.map((t) => (
              <span
                key={t.k}
                className="inline-flex items-center gap-1 bg-[#eef2ff] text-[#1a2f5e] text-[11px] px-2 py-0.5 rounded-full"
              >
                {t.label}
                <button
                  type="button"
                  onClick={t.onClear}
                  className="hover:text-rose-600"
                  aria-label="Remover filtro"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filtrosAtivos.length === 0 && (
              <span className="text-xs text-muted-foreground">
                Nenhum filtro ativo.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={limpar} disabled={busy}>
              Limpar
            </Button>
            <Button size="sm" onClick={aplicar} disabled={busy}>
              Aplicar filtros
            </Button>
          </div>
        </div>
      </div>

      {erro && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">
          {erro}
        </div>
      )}

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
              <th className="text-left px-3 py-2 font-semibold">User ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  {busy ? "Carregando…" : "Sem registros para os filtros atuais."}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-[#f8fafc]/50 align-top">
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
                <td className="px-3 py-2 text-xs">
                  {r.email_mascarado ? (
                    <button
                      type="button"
                      className="underline-offset-2 hover:underline"
                      onClick={() => aplicarPatch({ email: r.email_mascarado ?? "" })}
                      title="Filtrar por este e-mail"
                    >
                      {r.email_mascarado}
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.ip ? (
                    <button
                      type="button"
                      className="underline-offset-2 hover:underline"
                      onClick={() => aplicarPatch({ ip: r.ip ?? "" })}
                      title="Filtrar por este IP"
                    >
                      {r.ip}
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-xs max-w-[260px] truncate" title={r.user_agent ?? ""}>
                  {r.user_agent ?? "—"}
                </td>
                <td className="px-3 py-2 text-xs font-mono">
                  {r.user_id ? (
                    <button
                      type="button"
                      className="underline-offset-2 hover:underline"
                      onClick={() => aplicarPatch({ userId: r.user_id ?? "" })}
                      title="Filtrar por este usuário"
                    >
                      {r.user_id.slice(0, 8)}…
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-muted-foreground">
          {total === 0
            ? "0 resultados"
            : `Mostrando ${inicioMostrando}-${fimMostrando} de ${total}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            disabled={busy || pagina === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {pagina + 1} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
            disabled={busy || pagina + 1 >= totalPaginas}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
