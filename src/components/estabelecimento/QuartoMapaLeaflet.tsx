import L from "leaflet";
import { MapContainer, Marker } from "react-leaflet";
import { MAPA_ZOOM_MAXIMO, MaptilerBaseLayer } from "@/components/maps/MaptilerBaseLayer";
import pinPuzzleSvg from "@/assets/pin-puzzle.svg";

import "leaflet/dist/leaflet.css";
import "./quarto-mapa-theme.css";

const ZOOM_QUARTO = 15;

const PINO_ICON = L.icon({
  iconUrl: pinPuzzleSvg,
  iconSize: [34, 41],
  iconAnchor: [17, 39],
  className: "pino-quarto",
});

interface QuartoMapaLeafletProps {
  latitude: number;
  longitude: number;
}

export function QuartoMapaLeaflet({ latitude, longitude }: QuartoMapaLeafletProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={ZOOM_QUARTO}
      maxZoom={MAPA_ZOOM_MAXIMO}
      scrollWheelZoom={false}
      className="mapa-quarto h-full w-full"
      style={{ zIndex: 0 }}
    >
      <MaptilerBaseLayer />
      <Marker position={[latitude, longitude]} icon={PINO_ICON} />
    </MapContainer>
  );
}
