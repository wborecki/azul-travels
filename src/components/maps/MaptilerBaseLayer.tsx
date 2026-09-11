import { useEffect } from "react";
import { TileLayer, useMap } from "react-leaflet";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";
import type { StyleSpecification } from "@maptiler/sdk";
import pastelCalmoStyleRaw from "./pastel-calmo-style.json";

import "@maptiler/sdk/dist/maptiler-sdk.css";

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;

/**
 * O estilo exportado do MapTiler Cloud traz a chave de quem o exportou
 * hardcoded nas URLs de `sources`/`glyphs` - trocamos pela chave real de
 * `VITE_MAPTILER_KEY` em runtime, para não depender de sincronizar o JSON
 * toda vez que a chave mudar.
 */
function estiloComChaveAtual(style: Record<string, unknown>, apiKey: string): StyleSpecification {
  const trocarChave = (url: string) => url.replace(/key=[^&]+/, `key=${apiKey}`);
  const sources = style.sources as Record<string, { url?: string } & Record<string, unknown>>;
  return {
    ...style,
    glyphs: typeof style.glyphs === "string" ? trocarChave(style.glyphs) : style.glyphs,
    sources: Object.fromEntries(
      Object.entries(sources).map(([id, src]) =>
        typeof src.url === "string" ? [id, { ...src, url: trocarChave(src.url) }] : [id, src],
      ),
    ),
  } as StyleSpecification;
}

/**
 * Zoom máximo dos mapas do projeto. Precisa ser passado como prop `maxZoom`
 * em todo `<MapContainer>` que usa `<MaptilerBaseLayer>` - o `MaptilerLayer`
 * não é um `TileLayer` padrão e não registra limite de zoom no mapa sozinho
 * (sem isso, `leaflet.markercluster` quebra com "Map has no maxZoom
 * specified" por não conseguir ler `map.getMaxZoom()`).
 */
export const MAPA_ZOOM_MAXIMO = 19;

/**
 * Camada-base (tiles) compartilhada por todos os mapas Leaflet do projeto.
 *
 * Usa o estilo customizado "Pastel Calmo" (`pastel-calmo-style.json`,
 * exportado do MapTiler Cloud) quando há uma API key configurada
 * (`VITE_MAPTILER_KEY` no `.env` - conta gratuita em
 * https://cloud.maptiler.com). Sem chave, cai para tiles OpenStreetMap
 * puros (gratuitos, sem conta) para não quebrar o ambiente local de quem
 * ainda não configurou a chave.
 *
 * O `MaptilerLayer` chama `map.attributionControl.addAttribution(...)`
 * internamente sem checar se o controle existe - o `<MapContainer>` que usa
 * este componente precisa manter `attributionControl` no padrão (ligado),
 * nunca `attributionControl={false}`.
 */
export function MaptilerBaseLayer() {
  if (!MAPTILER_API_KEY) {
    return <TileLayerOsmFallback />;
  }
  return <MaptilerSdkLayer apiKey={MAPTILER_API_KEY} />;
}

/**
 * O `MaptilerLayer` (abaixo) e o `TileLayer` do Leaflet compartilham o
 * mesmo pane (`tilePane`/`.leaflet-tile-pane`) - o filtro de saturação dos
 * temas (`*-theme.css`) precisa alcançar só os tiles raster crus do OSM,
 * nunca o estilo "Pastel Calmo" (já vem com a paleta certa). Marcamos essa
 * classe no container do mapa para os temas escoparem o filtro por ela.
 */
function TileLayerOsmFallback() {
  const map = useMap();

  useEffect(() => {
    const el = map.getContainer();
    el.classList.add("mapa-tiles-osm");
    return () => {
      el.classList.remove("mapa-tiles-osm");
    };
  }, [map]);

  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={MAPA_ZOOM_MAXIMO}
    />
  );
}

function MaptilerSdkLayer({ apiKey }: { apiKey: string }) {
  const map = useMap();

  useEffect(() => {
    const layer = new MaptilerLayer({
      apiKey,
      style: estiloComChaveAtual(pastelCalmoStyleRaw, apiKey),
    });
    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, apiKey]);

  return null;
}
