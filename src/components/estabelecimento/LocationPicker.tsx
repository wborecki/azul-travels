import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import { MAPA_ZOOM_MAXIMO, MaptilerBaseLayer } from "@/components/maps/MaptilerBaseLayer";
import pinPuzzleSvg from "@/assets/pin-puzzle.svg";

import "leaflet/dist/leaflet.css";
import "./location-picker-theme.css";

const CENTRO_BRASIL: L.LatLngExpression = [-14.24, -51.93];
const ZOOM_BRASIL = 4;
const ZOOM_PINO = 16;

const PINO_ICON = L.icon({
  iconUrl: pinPuzzleSvg,
  iconSize: [34, 41],
  iconAnchor: [17, 39],
  className: "pino-local",
});

function EventosDoMapa({ onSelecionar }: { onSelecionar: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelecionar(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function CentralizarNoPino({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), ZOOM_PINO), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  return null;
}

export interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const temPino = latitude != null && longitude != null;

  return (
    <MapContainer
      center={temPino ? [latitude, longitude] : CENTRO_BRASIL}
      zoom={temPino ? ZOOM_PINO : ZOOM_BRASIL}
      scrollWheelZoom
      maxZoom={MAPA_ZOOM_MAXIMO}
      className="mapa-picker h-full w-full"
      style={{ zIndex: 0 }}
    >
      <MaptilerBaseLayer />

      <EventosDoMapa onSelecionar={onChange} />
      <CentralizarNoPino latitude={latitude} longitude={longitude} />

      {temPino && (
        <Marker
          position={[latitude, longitude]}
          icon={PINO_ICON}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const pos = (e.target as L.Marker).getLatLng();
              onChange(pos.lat, pos.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
