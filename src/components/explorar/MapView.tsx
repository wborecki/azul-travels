import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Link } from "@tanstack/react-router";
import L from "leaflet";
import { MapContainer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Layers,
  List,
  LocateFixed,
  Search,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ESTAB_TIPO_LABEL } from "@/lib/enums";
import { MAPA_ZOOM_MAXIMO, MaptilerBaseLayer } from "@/components/maps/MaptilerBaseLayer";
import { pinIcon } from "@/components/explorar/pinos";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import type { ItemMapa } from "@/lib/queries";

import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "./map-theme.css";

const CENTRO_BRASIL: L.LatLngExpression = [-14.24, -51.93];
const ZOOM_BRASIL = 4;
const ZOOM_PIN_UNICO = 14;
const ESPERA_INICIAL_MS = 700;

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

function boundsParaSimples(bounds: L.LatLngBounds): BoundsSimples {
  return {
    norte: bounds.getNorth(),
    sul: bounds.getSouth(),
    leste: bounds.getEast(),
    oeste: bounds.getWest(),
  };
}

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

function ObservarMovimento({
  ignorarProximoMove,
  onMovimento,
}: {
  ignorarProximoMove: MutableRefObject<boolean>;
  onMovimento: (bounds: BoundsSimples) => void;
}) {
  const montadoEm = useRef(Date.now());

  const map = useMapEvents({
    moveend: () => {
      if (ignorarProximoMove.current) {
        ignorarProximoMove.current = false;
        return;
      }
      if (Date.now() - montadoEm.current < ESPERA_INICIAL_MS) return;
      onMovimento(boundsParaSimples(map.getBounds()));
    },
  });

  return null;
}

interface MapViewProps {
  items: ItemMapa[];
  dataIn?: string;
  dataOut?: string;
  adultos?: number;
  criancas?: number;
  areaAtiva: boolean;
  truncado: boolean;
  total: number;
  itemAtivoId: string | null;
  onItemAtivo: (id: string | null) => void;
  onSelecionarItem: (id: string) => void;
  onBoundsChange: (bounds: BoundsSimples) => void;
  onPertoDeMim: (coords: { lat: number; lng: number }) => void;
  centroFoco?: { lat: number; lng: number };
  onFechar: () => void;
}

export function MapView({
  items,
  dataIn,
  dataOut,
  adultos,
  criancas,
  areaAtiva,
  truncado,
  total,
  itemAtivoId,
  onItemAtivo,
  onSelecionarItem,
  onBoundsChange,
  onPertoDeMim,
  centroFoco,
  onFechar,
}: MapViewProps) {
  const ehDesktop = useMediaQuery("(min-width: 1024px)");
  const mapRef = useRef<L.Map | null>(null);
  const marcadoresRef = useRef(new Map<string, L.Marker>());
  const ignorarProximoMove = useRef(false);

  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [boundsPendentes, setBoundsPendentes] = useState<BoundsSimples | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState<ItemMapa | null>(null);
  const [avisoFechado, setAvisoFechado] = useState(false);

  const searchQuarto = useMemo(
    () => ({
      ...(dataIn ? { checkIn: dataIn } : {}),
      ...(dataIn && dataOut ? { checkOut: dataOut } : {}),
      ...(adultos !== undefined ? { adultos } : {}),
      ...(criancas !== undefined ? { criancas } : {}),
    }),
    [dataIn, dataOut, adultos, criancas],
  );

  const icones = useMemo(() => new Map(items.map((i) => [i.id, pinIcon(i)])), [items]);
  const posicoes = useMemo(
    () => new Map(items.map((i) => [i.id, [i.latitude, i.longitude] as [number, number]])),
    [items],
  );

  const acoesRef = useRef({ onItemAtivo, onSelecionarItem });
  useEffect(() => {
    acoesRef.current = { onItemAtivo, onSelecionarItem };
  });

  useEffect(() => {
    setBoundsPendentes(null);
    setItemSelecionado(null);
    setAvisoFechado(false);
  }, [items]);

  useEffect(() => {
    if (!itemAtivoId) return;
    const marcador = marcadoresRef.current.get(itemAtivoId);
    const elemento = marcador?.getElement();
    if (!marcador || !elemento) return;
    elemento.classList.add("pin-ativo");
    marcador.setZIndexOffset(1000);
    return () => {
      elemento.classList.remove("pin-ativo");
      marcador.setZIndexOffset(0);
    };
  }, [itemAtivoId, items]);

  const marcadores = useMemo(
    () =>
      items.map((item) => (
        <Marker
          key={item.id}
          position={posicoes.get(item.id) as [number, number]}
          icon={icones.get(item.id)}
          ref={(instancia) => {
            if (instancia) marcadoresRef.current.set(item.id, instancia);
            else marcadoresRef.current.delete(item.id);
          }}
          eventHandlers={{
            click: () => {
              acoesRef.current.onSelecionarItem(item.id);
              if (!ehDesktop) setItemSelecionado(item);
            },
            mouseover: () => acoesRef.current.onItemAtivo(item.id),
            mouseout: () => acoesRef.current.onItemAtivo(null),
          }}
        >
          {ehDesktop && (
            <Popup closeButton={false} autoPanPadding={[24, 24]}>
              <MiniCard
                item={item}
                searchQuarto={searchQuarto}
                onFechar={() => mapRef.current?.closePopup()}
              />
            </Popup>
          )}
        </Marker>
      )),
    [items, posicoes, icones, ehDesktop, searchQuarto],
  );

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

  const mostrarAvisoTruncado = truncado && !avisoFechado;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={mapRef}
        center={CENTRO_BRASIL}
        zoom={ZOOM_BRASIL}
        scrollWheelZoom
        maxZoom={MAPA_ZOOM_MAXIMO}
        className={cn("mapa-azul h-full w-full", !ehDesktop && "mapa-com-barra")}
        style={{ zIndex: 0 }}
      >
        <MaptilerBaseLayer />

        <AjustarEnquadramento
          items={items}
          suspenso={areaAtiva}
          ignorarProximoMove={ignorarProximoMove}
        />
        <FocarCentro centro={centroFoco} ignorarProximoMove={ignorarProximoMove} />
        <ObservarMovimento
          ignorarProximoMove={ignorarProximoMove}
          onMovimento={setBoundsPendentes}
        />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={clusterIcon}
          maxClusterRadius={60}
          showCoverageOnHover={false}
        >
          {marcadores}
        </MarkerClusterGroup>
      </MapContainer>

      {!ehDesktop && (
        <div className="absolute inset-x-0 top-0 z-[1100] flex items-center justify-between gap-2 border-b border-border bg-white/95 px-3 py-2 backdrop-blur">
          <span className="text-sm font-semibold text-primary">
            {total} {total === 1 ? "opção" : "opções"} no mapa
          </span>
          <Button size="sm" variant="outline" onClick={onFechar}>
            <List className="mr-1.5 h-4 w-4" />
            Ver lista
          </Button>
        </div>
      )}

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 z-[1000] flex flex-col items-center gap-2 px-3",
          ehDesktop ? "top-3" : "top-14",
        )}
      >
        {mostrarAvisoTruncado && (
          <div className="pointer-events-auto flex max-w-md items-start gap-2 rounded-xl border border-border bg-white px-3 py-2 text-xs text-foreground shadow-md">
            <Layers className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              Mostrando {items.length} de {total} — aproxime o mapa e busque nesta área para ver o
              resto.
            </span>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => setAvisoFechado(true)}
              className="-mr-1 -mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-azul-claro hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {boundsPendentes && (
          <button
            type="button"
            onClick={() => {
              onBoundsChange(boundsPendentes);
              setBoundsPendentes(null);
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          >
            <Search className="h-4 w-4" />
            Buscar nesta área
          </button>
        )}
      </div>

      {!(itemSelecionado && !ehDesktop) && (
        <div className="absolute bottom-3 right-3 z-[1000]">
          <Button
            size="sm"
            variant="secondary"
            disabled={buscandoLocalizacao}
            className="rounded-full shadow-md"
            onClick={handlePertoDeMim}
          >
            <LocateFixed className="mr-1.5 h-4 w-4" />
            {buscandoLocalizacao ? "Localizando…" : "Perto de mim"}
          </Button>
        </div>
      )}

      {itemSelecionado && !ehDesktop && (
        <div className="absolute inset-x-0 bottom-0 z-[1100] p-3">
          <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
            <MiniCard
              item={itemSelecionado}
              searchQuarto={searchQuarto}
              onFechar={() => setItemSelecionado(null)}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface MiniCardProps {
  item: ItemMapa;
  searchQuarto: Record<string, string | number>;
  onFechar: () => void;
  className?: string;
}

function MiniCard({ item, searchQuarto, onFechar, className }: MiniCardProps) {
  const fotos =
    item.imagens.length > 0
      ? item.imagens
      : item.estabelecimento_foto_capa
        ? [item.estabelecimento_foto_capa]
        : [];
  const [indice, setIndice] = useState(0);

  const irPara = (i: number) => setIndice((i + fotos.length) % fotos.length);

  return (
    <div className={cn("w-64", className)}>
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

        <button
          type="button"
          aria-label="Fechar"
          onClick={onFechar}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-sm transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {item.selo_azul && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-primary shadow-md">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
            Selo Azul
          </span>
        )}

        {fotos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => irPara(indice - 1)}
              className="absolute left-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-sm transition md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={() => irPara(indice + 1)}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-sm transition md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <LinkDaOferta item={item} searchQuarto={searchQuarto}>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

        {item.capacidade_total !== null && item.quantidade_camas !== null && (
          <div className="mt-1 flex items-center gap-3 text-xs text-foreground/70">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> {item.capacidade_total}
            </span>
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3 w-3" /> {item.quantidade_camas}
            </span>
          </div>
        )}

        <p className="mt-1.5 text-sm font-bold text-primary">
          {item.preco !== null ? (
            <>
              {item.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              <span className="text-xs font-normal text-muted-foreground"> / noite</span>
            </>
          ) : (
            "Reserva sem cobrança"
          )}
        </p>
      </LinkDaOferta>
    </div>
  );
}

function LinkDaOferta({
  item,
  searchQuarto,
  children,
}: {
  item: ItemMapa;
  searchQuarto: Record<string, string | number>;
  children: React.ReactNode;
}) {
  const classe = "group block rounded-b-xl px-3 pb-3 pt-2 no-underline";

  if (item.natureza === "visita") {
    return (
      <Link
        to="/estabelecimento/$slug"
        params={{ slug: item.estabelecimento_slug }}
        className={classe}
        aria-label={`Ver ${item.estabelecimento_nome}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      to="/quartos/$id"
      params={{ id: item.id }}
      search={searchQuarto}
      className={classe}
      aria-label={`Ver detalhes de ${item.item_nome} - ${item.estabelecimento_nome}`}
    >
      {children}
    </Link>
  );
}
