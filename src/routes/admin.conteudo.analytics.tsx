import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAnalyticsConteudo,
  fetchConteudosParaSeletor,
  type AnalyticsConteudoData,
} from "@/lib/queries/conteudo-analytics";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, MousePointerClick, Users, Percent, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/admin/conteudo/analytics")({
  component: AnalyticsConteudoPage,
});

type Periodo = "7d" | "30d" | "90d" | "custom";

function isoStartOfDay(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function isoEndOfDay(d: Date): string {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseYmd(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function periodoToRange(p: Periodo, customDe: string, customAte: string): { de: Date; ate: Date } {
  const ate = new Date();
  if (p === "custom") {
    const d = parseYmd(customDe) ?? new Date(Date.now() - 7 * 86400000);
    const a = parseYmd(customAte) ?? new Date();
    return { de: d, ate: a };
  }
  const dias = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  const de = new Date(Date.now() - (dias - 1) * 86400000);
  return { de, ate };
}

function formatNumber(n: number): string {
  return n.toLocaleString("pt-BR");
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function formatDayLabel(iso: string): string {
  // iso = "YYYY-MM-DD"
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function AnalyticsConteudoPage() {
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [customDe, setCustomDe] = useState<string>(
    ymd(new Date(Date.now() - 30 * 86400000)),
  );
  const [customAte, setCustomAte] = useState<string>(ymd(new Date()));
  const [conteudoId, setConteudoId] = useState<string>("todos");
  const [seletor, setSeletor] = useState<{ id: string; titulo: string; slug: string }[]>([]);
  const [data, setData] = useState<AnalyticsConteudoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const arts = await fetchConteudosParaSeletor();
        setSeletor(arts);
      } catch (err) {
        toast.error("Erro ao carregar artigos", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    })();
  }, []);

  const range = useMemo(() => periodoToRange(periodo, customDe, customAte), [
    periodo,
    customDe,
    customAte,
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const result = await fetchAnalyticsConteudo({
          desdeISO: isoStartOfDay(range.de),
          ateISO: isoEndOfDay(range.ate),
          conteudoId: conteudoId !== "todos" ? conteudoId : undefined,
        });
        if (cancelled) return;
        setData(result);
      } catch (err) {
        if (cancelled) return;
        toast.error("Erro ao carregar analytics", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range.de, range.ate, conteudoId]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/admin/conteudo" className="inline-flex items-center gap-1 hover:text-secondary">
              <ArrowLeft className="h-3 w-3" /> Voltar para Conteúdo
            </Link>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Analytics de Conteúdo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualizações e cliques nos artigos por período.
          </p>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-card border rounded-2xl p-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Período</Label>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {periodo === "custom" && (
          <>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">De</Label>
              <Input
                type="date"
                value={customDe}
                onChange={(e) => setCustomDe(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Até</Label>
              <Input
                type="date"
                value={customAte}
                onChange={(e) => setCustomAte(e.target.value)}
                className="w-40"
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1 min-w-[260px] flex-1">
          <Label className="text-xs text-muted-foreground">Artigo</Label>
          <Select value={conteudoId} onValueChange={setConteudoId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os artigos</SelectItem>
              {seletor.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Eye className="h-5 w-5" />}
          label="Visualizações"
          value={loading ? "—" : formatNumber(data?.resumo.totalViews ?? 0)}
        />
        <KpiCard
          icon={<MousePointerClick className="h-5 w-5" />}
          label="Cliques"
          value={loading ? "—" : formatNumber(data?.resumo.totalClicks ?? 0)}
        />
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          label="Visitantes únicos"
          value={loading ? "—" : formatNumber(data?.resumo.visitantesUnicos ?? 0)}
        />
        <KpiCard
          icon={<Percent className="h-5 w-5" />}
          label="Taxa de cliques (CTR)"
          value={loading ? "—" : formatPct(data?.resumo.ctr ?? 0)}
        />
      </div>

      {/* Gráfico de série temporal */}
      <div className="bg-card border rounded-2xl p-4">
        <h2 className="text-lg font-display font-semibold text-foreground mb-3">
          Evolução diária
        </h2>
        <div className="h-[320px]">
          {loading || !data ? (
            <div className="h-full grid place-items-center text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.serie} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="data"
                  tickFormatter={formatDayLabel}
                  tick={{ fontSize: 12 }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelFormatter={(l) => formatDayLabel(String(l))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="views"
                  name="Visualizações"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  name="Cliques"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Por artigo */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-display font-semibold text-foreground">Por artigo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Artigo</th>
                <th className="px-4 py-3 text-right">Visualizações</th>
                <th className="px-4 py-3 text-right">Cliques</th>
                <th className="px-4 py-3 text-right">CTR</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : !data || data.porArtigo.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum evento registrado neste período.
                  </td>
                </tr>
              ) : (
                data.porArtigo.map((r) => (
                  <tr key={r.conteudo_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground truncate max-w-[420px]">
                        {r.titulo}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">/{r.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(r.views)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(r.clicks)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatPct(r.ctr)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.slug && (
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                            <Link to="/conteudo/$slug" params={{ slug: r.slug }}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top links clicados */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-display font-semibold text-foreground">
            Top links clicados
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3 text-right">Cliques</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : !data || data.topLinks.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum clique registrado neste período.
                  </td>
                </tr>
              ) : (
                data.topLinks.map((l) => (
                  <tr key={l.url} className="hover:bg-muted/30">
                    <td className="px-4 py-3 max-w-0">
                      <div className="truncate text-foreground/80" title={l.url}>
                        {l.url}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(l.clicks)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function KpiCard({ icon, label, value }: KpiCardProps) {
  return (
    <div className="bg-card border rounded-2xl p-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded-xl bg-azul-claro/60 text-primary grid place-items-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-2xl font-display font-bold text-foreground tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}
