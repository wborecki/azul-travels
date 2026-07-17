import { ESTADOS_BR } from "@/lib/brazil";

export interface GeocodeInput {
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface GeocodeResultado {
  lat: number;
  lng: number;
}

export async function geocodeEndereco(input: GeocodeInput): Promise<GeocodeResultado | null> {
  const endereco = input.endereco?.trim() ?? "";
  const cidade = input.cidade?.trim() ?? "";
  const estado = input.estado?.trim() ?? "";
  const cep = input.cep?.trim() ?? "";
  if (!endereco && !cidade && !cep) return null;

  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "0",
    limit: "1",
    countrycodes: "br",
  });
  if (endereco) params.set("street", endereco);
  if (cidade) params.set("city", cidade);
  if (estado) params.set("state", estado);
  if (cep) params.set("postalcode", cep);

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;
  const lat = Number(data[0].lat);
  const lng = Number(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export interface ReverseGeocodeResultado {
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
}

const DIACRITICOS = new RegExp(String.fromCharCode(0x5b, 0x300, 0x2d, 0x36f, 0x5d), "g");

function normalizar(s: string): string {
  return s.normalize("NFD").replace(DIACRITICOS, "").toLowerCase().trim();
}

const NOME_PARA_SIGLA = new Map(ESTADOS_BR.map((e) => [normalizar(e.nome), e.sigla]));

function siglaDoEstado(address: Record<string, string>): string | null {
  const iso = address["ISO3166-2-lvl4"];
  if (iso?.startsWith("BR-")) return iso.slice(3);
  const nome = address.state;
  if (!nome) return null;
  return NOME_PARA_SIGLA.get(normalizar(nome)) ?? null;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResultado | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    addressdetails: "1",
    zoom: "18",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { address?: Record<string, string> };
  const address = data.address;
  if (!address) return null;

  const rua = address.road ?? address.pedestrian ?? "";
  const numero = address.house_number ?? "";
  const endereco = [rua, numero].filter(Boolean).join(", ") || null;
  const cidade = address.city ?? address.town ?? address.village ?? address.municipality ?? null;
  const estado = siglaDoEstado(address);

  return { endereco, cidade, estado };
}
