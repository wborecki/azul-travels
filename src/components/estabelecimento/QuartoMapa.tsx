import { MapPin } from "lucide-react";

interface QuartoMapaProps {
  latitude: number | null;
  longitude: number | null;
  /** Cidade, UF ou endereço para o texto acima do mapa. */
  local?: string | null;
}

/**
 * Bloco "Onde você estará", inspirado no Airbnb: um texto curto de localização
 * e o mapa incorporado. Usa OpenStreetMap (mesmo embed do painel admin) para
 * não depender de chave/SDK do Google. Sem coordenadas, mostra um aviso suave
 * em vez de um mapa quebrado.
 */
export function QuartoMapa({ latitude, longitude, local }: QuartoMapaProps) {
  const latN = typeof latitude === "number" ? latitude : NaN;
  const lngN = typeof longitude === "number" ? longitude : NaN;
  const valido =
    Number.isFinite(latN) &&
    Number.isFinite(lngN) &&
    latN >= -90 &&
    latN <= 90 &&
    lngN >= -180 &&
    lngN <= 180;

  if (!valido) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        <MapPin className="mx-auto mb-2 h-5 w-5" />
        {local ? (
          <span>{local}</span>
        ) : (
          <span>Localização exata informada após a confirmação da reserva.</span>
        )}
      </div>
    );
  }

  const delta = 0.01;
  const bbox = `${lngN - delta},${latN - delta},${lngN + delta},${latN + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latN},${lngN}`;
  const linkOut = `https://www.openstreetmap.org/?mlat=${latN}&mlon=${lngN}#map=15/${latN}/${lngN}`;

  return (
    <div className="space-y-3">
      {local && (
        <p className="text-sm text-foreground/80 inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-secondary" /> {local}
        </p>
      )}
      <div className="rounded-2xl overflow-hidden border border-border aspect-[16/9] bg-muted">
        <iframe title="Localização no mapa" src={src} className="w-full h-full" loading="lazy" />
      </div>
      <a
        href={linkOut}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <MapPin className="h-3 w-3" /> Abrir no mapa
      </a>
    </div>
  );
}
