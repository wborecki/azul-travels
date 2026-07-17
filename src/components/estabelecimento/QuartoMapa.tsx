import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

const QuartoMapaLeaflet = lazy(() =>
  import("./QuartoMapaLeaflet").then((m) => ({ default: m.QuartoMapaLeaflet })),
);

interface QuartoMapaProps {
  latitude: number | null;
  longitude: number | null;
  local?: string | null;
}

export function QuartoMapa({ latitude, longitude, local }: QuartoMapaProps) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

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

  const linkOut = `https://www.openstreetmap.org/?mlat=${latN}&mlon=${lngN}#map=15/${latN}/${lngN}`;

  return (
    <div className="space-y-3">
      {local && (
        <p className="text-sm text-foreground/80 inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-secondary" /> {local}
        </p>
      )}
      <div className="rounded-2xl overflow-hidden border border-border aspect-[16/9] bg-muted">
        {montado ? (
          <Suspense fallback={<MapaSkeleton />}>
            <QuartoMapaLeaflet latitude={latN} longitude={lngN} />
          </Suspense>
        ) : (
          <MapaSkeleton />
        )}
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

function MapaSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}
