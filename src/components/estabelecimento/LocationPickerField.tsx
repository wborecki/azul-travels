import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

const LocationPicker = lazy(() =>
  import("./LocationPicker").then((m) => ({ default: m.LocationPicker })),
);

interface LocationPickerFieldProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function LocationPickerField({ latitude, longitude, onChange }: LocationPickerFieldProps) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  return (
    <div className="space-y-1.5">
      <div className="h-64 w-full overflow-hidden rounded-xl border">
        {montado ? (
          <Suspense fallback={<MapaSkeleton />}>
            <LocationPicker latitude={latitude} longitude={longitude} onChange={onChange} />
          </Suspense>
        ) : (
          <MapaSkeleton />
        )}
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-foreground/50">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        {latitude != null && longitude != null
          ? `Coordenadas: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          : "Clique no mapa ou preencha o endereço para posicionar o pino."}
      </p>
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
