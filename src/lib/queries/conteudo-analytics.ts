/**
 * Queries de analytics de conteúdo TEA.
 *
 * Lê da tabela `conteudo_eventos` (RLS restringe SELECT a admins).
 * Agrega no cliente para evitar dependência de RPC.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type EventoTipo = "view" | "click";

export interface AnalyticsFiltros {
  desdeISO: string; // inclusivo
  ateISO: string; // inclusivo
  conteudoId?: string; // opcional — limita a um artigo
}

export type ConteudoEventoRow = Pick<
  Tables<"conteudo_eventos">,
  "id" | "conteudo_id" | "tipo" | "url_alvo" | "criado_em"
>;

export interface AnalyticsResumo {
  totalViews: number;
  totalClicks: number;
  visitantesUnicos: number;
  ctr: number; // clicks / views (0..1)
}

export interface PontoSerie {
  data: string; // YYYY-MM-DD
  views: number;
  clicks: number;
}

export interface PorArtigoRow {
  conteudo_id: string;
  titulo: string;
  slug: string;
  views: number;
  clicks: number;
  ctr: number;
}

export interface TopLinkRow {
  url: string;
  clicks: number;
}

export interface AnalyticsConteudoData {
  resumo: AnalyticsResumo;
  serie: PontoSerie[];
  porArtigo: PorArtigoRow[];
  topLinks: TopLinkRow[];
}

/** Lista artigos para popular o seletor de filtro do painel. */
export async function fetchConteudosParaSeletor(): Promise<
  { id: string; titulo: string; slug: string }[]
> {
  const { data, error } = await supabase
    .from("conteudo_tea")
    .select("id, titulo, slug")
    .order("criado_em", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

function diaUTC(iso: string): string {
  return iso.slice(0, 10);
}

function preencherSerie(
  desdeISO: string,
  ateISO: string,
  buckets: Map<string, { views: number; clicks: number }>,
): PontoSerie[] {
  const result: PontoSerie[] = [];
  const start = new Date(desdeISO);
  const end = new Date(ateISO);
  // Itera dia a dia em UTC
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cursor.getTime() <= last.getTime()) {
    const key = cursor.toISOString().slice(0, 10);
    const b = buckets.get(key);
    result.push({ data: key, views: b?.views ?? 0, clicks: b?.clicks ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

/**
 * Busca eventos do período e agrega resumo + série diária + ranking
 * por artigo + top URLs clicadas.
 */
export async function fetchAnalyticsConteudo(
  filtros: AnalyticsFiltros,
): Promise<AnalyticsConteudoData> {
  // 1) Eventos do período
  let q = supabase
    .from("conteudo_eventos")
    .select("id, conteudo_id, tipo, url_alvo, sessao_id, criado_em")
    .gte("criado_em", filtros.desdeISO)
    .lte("criado_em", filtros.ateISO)
    .order("criado_em", { ascending: false })
    .limit(50000);

  if (filtros.conteudoId) q = q.eq("conteudo_id", filtros.conteudoId);

  const { data: eventos, error } = await q;
  if (error) throw error;

  const rows = (eventos ?? []) as Array<ConteudoEventoRow & { sessao_id: string | null }>;

  // 2) Agregações
  const buckets = new Map<string, { views: number; clicks: number }>();
  const porArtigoMap = new Map<string, { views: number; clicks: number }>();
  const linksMap = new Map<string, number>();
  const sessoes = new Set<string>();
  let totalViews = 0;
  let totalClicks = 0;

  for (const ev of rows) {
    const dia = diaUTC(ev.criado_em);
    const b = buckets.get(dia) ?? { views: 0, clicks: 0 };
    const a = porArtigoMap.get(ev.conteudo_id) ?? { views: 0, clicks: 0 };
    if (ev.tipo === "view") {
      b.views += 1;
      a.views += 1;
      totalViews += 1;
    } else if (ev.tipo === "click") {
      b.clicks += 1;
      a.clicks += 1;
      totalClicks += 1;
      if (ev.url_alvo) linksMap.set(ev.url_alvo, (linksMap.get(ev.url_alvo) ?? 0) + 1);
    }
    buckets.set(dia, b);
    porArtigoMap.set(ev.conteudo_id, a);
    if (ev.sessao_id) sessoes.add(ev.sessao_id);
  }

  // 3) Resolve títulos dos artigos referenciados
  const ids = Array.from(porArtigoMap.keys());
  let titulos = new Map<string, { titulo: string; slug: string }>();
  if (ids.length > 0) {
    const { data: arts, error: artsErr } = await supabase
      .from("conteudo_tea")
      .select("id, titulo, slug")
      .in("id", ids);
    if (artsErr) throw artsErr;
    titulos = new Map((arts ?? []).map((a) => [a.id, { titulo: a.titulo, slug: a.slug }]));
  }

  const porArtigo: PorArtigoRow[] = Array.from(porArtigoMap.entries())
    .map(([conteudo_id, agg]) => {
      const meta = titulos.get(conteudo_id);
      return {
        conteudo_id,
        titulo: meta?.titulo ?? "(artigo removido)",
        slug: meta?.slug ?? "",
        views: agg.views,
        clicks: agg.clicks,
        ctr: agg.views > 0 ? agg.clicks / agg.views : 0,
      };
    })
    .sort((a, b) => b.views - a.views);

  const topLinks: TopLinkRow[] = Array.from(linksMap.entries())
    .map(([url, clicks]) => ({ url, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const serie = preencherSerie(filtros.desdeISO, filtros.ateISO, buckets);

  return {
    resumo: {
      totalViews,
      totalClicks,
      visitantesUnicos: sessoes.size,
      ctr: totalViews > 0 ? totalClicks / totalViews : 0,
    },
    serie,
    porArtigo,
    topLinks,
  };
}
