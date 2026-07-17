import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Link } from "@tanstack/react-router";
import L from "leaflet";
import { MapContainer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageOff,
  LocateFixed,
  Star,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ESTAB_TIPO_LABEL } from "@/lib/enums";
import { MAPA_ZOOM_MAXIMO, MaptilerBaseLayer } from "@/components/maps/MaptilerBaseLayer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ItemMapa } from "@/lib/queries";

import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "./map-theme.css";

const CENTRO_BRASIL: L.LatLngExpression = [-14.24, -51.93];
const ZOOM_BRASIL = 4;
const ZOOM_PIN_UNICO = 14;

function formatPrecoCurto(preco: number): string {
  return preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

function precoIcon(item: ItemMapa): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="pin-preco"><span>${escapeHtml(formatPrecoCurto(item.preco))}</span></div>`,
    iconSize: [64, 26],
    iconAnchor: [32, 13],
  });
}

function tamanhoCluster(n: number): number {
  if (n < 10) return 34;
  if (n < 50) return 42;
  return 52;
}

function clusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const n = cluster.getChildCount();
  const tamanho = tamanhoCluster(n);
  const fonte = tamanho <= 34 ? 0.7 : 0.8;
  return L.divIcon({
    className: "",
    html: `<span class="cluster-azul" style="width:${tamanho}px;height:${tamanho}px;font-size:${fonte}rem">${n}</span>`,
    iconSize: L.point(tamanho, tamanho, true),
  });
}

export interface BoundsSimples {
  norte: number;
  sul: number;
  leste: number;
  oeste: number;
}

const DEBOUNCE_MOVIMENTO_MS = 450;

function boundsParaSimples(bounds: L.LatLngBounds): BoundsSimples {
  return {
    norte: bounds.getNorth(),
    sul: bounds.getSouth(),
    leste: bounds.getEast(),
    oeste: bounds.getWest(),
  };
}

/**
 * Ajusta o enquadramento aos items exibidos — mas só quando não há uma área
 * de mapa ativa (bbox ou "perto de mim"), senão entraria em loop com
 * ReportarMovimento (fitBounds -> moveend -> nova busca -> novo fitBounds).
 */
function AjustarEnquadramento({
  items,
  suspenso,
  ignorarProximoMove,
}: {
  items: ItemMapa[];
  suspenso: boolean;
  ignorarProximoMove: MutableRefObject<boolean>;
}) {
  const map = useMap();

  const chave = useMemo(() => items.map((i) => `${i.latitude},${i.longitude}`).join("|"), [items]);

  useEffect(() => {
    if (suspenso) return;
    ignorarProximoMove.current = true;
    if (items.length === 0) {
      map.setView(CENTRO_BRASIL, ZOOM_BRASIL);
      return;
    }
    const bounds = L.latLngBounds(items.map((i) => [i.latitude, i.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: ZOOM_PIN_UNICO });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, map, suspenso]);

  return null;
}

/** Centraliza o mapa em um ponto (usado por "Perto de mim") sem disparar nova busca. */
function FocarCentro({
  centro,
  ignorarProximoMove,
}: {
  centro: { lat: number; lng: number } | undefined;
  ignorarProximoMove: MutableRefObject<boolean>;
}) {
  const map = useMap();
  const chave = centro ? `${centro.lat},${centro.lng}` : "";

  useEffect(() => {
    if (!centro) return;
    ignorarProximoMove.current = true;
    map.setView([centro.lat, centro.lng], ZOOM_PIN_UNICO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, map]);

  return null;
}

/** Observa o movimento do mapa e reporta os novos bounds (com debounce). */
function ReportarMovimento({
  ignorarProximoMove,
  onBoundsChange,
}: {
  ignorarProximoMove: MutableRefObject<boolean>;
  onBoundsChange: (bounds: BoundsSimples) => void;
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const map = useMapEvents({
    moveend: () => {
      if (ignorarProximoMove.current) {
        ignorarProximoMove.current = false;
        return;
      }
      const bounds = boundsParaSimples(map.getBounds());
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => onBoundsChange(bounds), DEBOUNCE_MOVIMENTO_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
}

interface MapViewProps {
  items: ItemMapa[];
  dataIn?: string;
  dataOut?: string;
  adultos?: number;
  criancas?: number;
  /** Há bbox ou centro/raio ativo na URL — suprime o auto-enquadramento. */
  areaAtiva: boolean;
  onBoundsChange: (bounds: BoundsSimples) => void;
  onPertoDeMim: (coords: { lat: number; lng: number }) => void;
  centroFoco?: { lat: number; lng: number };
}

export function MapView({
  items,
  dataIn,
  dataOut,
  adultos,
  criancas,
  areaAtiva,
  onBoundsChange,
  onPertoDeMim,
  centroFoco,
}: MapViewProps) {
  const searchQuarto = {
    ...(dataIn ? { checkIn: dataIn } : {}),
    ...(dataIn && dataOut ? { checkOut: dataOut } : {}),
    ...(adultos !== undefined ? { adultos } : {}),
    ...(criancas !== undefined ? { criancas } : {}),
  };

  const ignorarProximoMove = useRef(false);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);

  function handlePertoDeMim() {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não suporta geolocalização.");
      return;
    }
    setBuscandoLocalizacao(true);
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setBuscandoLocalizacao(false);
        onPertoDeMim({ lat: posicao.coords.latitude, lng: posicao.coords.longitude });
      },
      (erro) => {
        setBuscandoLocalizacao(false);
        toast.error(
          erro.code === erro.PERMISSION_DENIED
            ? "Permissão de localização negada."
            : "Não foi possível obter sua localização.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={CENTRO_BRASIL}
        zoom={ZOOM_BRASIL}
        scrollWheelZoom
        maxZoom={MAPA_ZOOM_MAXIMO}
        className="mapa-azul h-full w-full rounded-2xl"
        style={{ zIndex: 0 }}
      >
        <MaptilerBaseLayer />

        <AjustarEnquadramento
          items={items}
          suspenso={areaAtiva}
          ignorarProximoMove={ignorarProximoMove}
        />
        <FocarCentro centro={centroFoco} ignorarProximoMove={ignorarProximoMove} />
        <ReportarMovimento
          ignorarProximoMove={ignorarProximoMove}
          onBoundsChange={onBoundsChange}
        />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={clusterIcon}
          maxClusterRadius={60}
          showCoverageOnHover={false}
        >
          {items.map((item) => (
            <Marker key={item.id} position={[item.latitude, item.longitude]} icon={precoIcon(item)}>
              <Popup closeButton={false} autoPanPadding={[24, 24]}>
                <MiniCard item={item} searchQuarto={searchQuarto} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <div className="absolute bottom-3 right-3 z-[1000]">
        <Button
          size="sm"
          variant="secondary"
          disabled={buscandoLocalizacao}
          className="rounded-full shadow-md"
          onClick={handlePertoDeMim}
        >
          <LocateFixed className="h-4 w-4 mr-1.5" />
          {buscandoLocalizacao ? "Localizando…" : "Perto de mim"}
        </Button>
      </div>
    </div>
  );
}

interface MiniCardProps {
  item: ItemMapa;
  searchQuarto: Record<string, string | number>;
}

function MiniCard({ item, searchQuarto }: MiniCardProps) {
  const map = useMap();
  const fotos =
    item.imagens.length > 0
      ? item.imagens
      : item.estabelecimento_foto_capa
        ? [item.estabelecimento_foto_capa]
        : [];
  const [indice, setIndice] = useState(0);
  const [favorito, setFavorito] = useState(false);

  const irPara = (i: number) => setIndice((i + fotos.length) % fotos.length);

  return (
    <div className="w-64">
      <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-azul-claro">
        {fotos.length > 0 ? (
          <img
            src={fotos[indice]}
            alt={item.item_nome}
            className="h-full w-full object-cover"
            key={fotos[indice]}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/40">
            <ImageOff className="h-8 w-8" />
          </div>
        )}

        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <button
            type="button"
            aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-pressed={favorito}
            onClick={() => setFavorito((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-sm transition hover:scale-105 hover:text-red-500"
          >
            <Heart className={cn("h-4 w-4", favorito && "fill-red-500 text-red-500")} />
          </button>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => map.closePopup()}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-sm transition hover:scale-105 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {fotos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => irPara(indice - 1)}
              className="absolute left-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground/70 opacity-0 shadow-sm transition group-hover:opacity-100 hover:scale-105"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={() => irPara(indice + 1)}
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground/70 opacity-0 shadow-sm transition group-hover:opacity-100 hover:scale-105"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1">
              {fotos.map((foto, i) => (
                <button
                  key={foto}
                  type="button"
                  aria-label={`Ver foto ${i + 1}`}
                  onClick={() => setIndice(i)}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition",
                    i === indice ? "bg-white" : "bg-white/50",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Link
        to="/quartos/$id"
        params={{ id: item.id }}
        search={searchQuarto}
        className="group block rounded-b-xl px-3 pb-3 pt-2 no-underline"
        aria-label={`Ver detalhes de ${item.item_nome} - ${item.estabelecimento_nome}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {ESTAB_TIPO_LABEL[item.estabelecimento_tipo]} · {item.estabelecimento_nome}
          </span>
          {item.avaliacao_media !== null && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-foreground">
              <Star className="h-3 w-3 fill-amarelo text-amarelo" />
              {item.avaliacao_media.toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              {item.total_avaliacoes > 0 && (
                <span className="text-foreground/50">({item.total_avaliacoes})</span>
              )}
            </span>
          )}
        </div>

        <p className="mt-0.5 line-clamp-2 font-display text-sm font-bold leading-tight text-primary group-hover:underline">
          {item.item_nome}
        </p>

        <div className="mt-1 flex items-center gap-3 text-[11px] text-foreground/70">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {item.capacidade_total}
          </span>
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3 w-3" /> {item.quantidade_camas}
          </span>
        </div>

        <p className="mt-1.5 text-sm font-bold text-primary">
          {item.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          <span className="text-[11px] font-normal text-muted-foreground"> / noite</span>
        </p>
      </Link>
    </div>
  );
}
