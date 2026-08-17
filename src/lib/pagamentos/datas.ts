/**
 * Datas "yyyy-MM-dd" no fuso de quem viaja.
 *
 * O servidor roda em UTC (Cloudflare Workers), então `new Date()` vira o dia
 * seguinte a partir das 21h de Brasília. Uma reserva feita às 22h de hoje
 * seria recusada como "data no passado" e a cobrança venceria um dia antes do
 * pretendido — por isso tudo aqui passa por America/Sao_Paulo.
 */

const FUSO_BRASIL = "America/Sao_Paulo";

const formatador = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_BRASIL,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Hoje no Brasil, como "yyyy-MM-dd". */
export function hojeNoBrasil(agora: Date = new Date()): string {
  return formatador.format(agora);
}

export function somarDias(iso: string, dias: number): string {
  const base = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(base)) throw new RangeError(`data inválida: ${iso}`);
  return new Date(base + dias * 86_400_000).toISOString().slice(0, 10);
}

/** Diárias entre check-in e check-out, ambos "yyyy-MM-dd". Zero ou negativo se invertidos. */
export function contarNoites(checkIn: string, checkOut: string): number {
  const inicio = Date.parse(`${checkIn}T00:00:00Z`);
  const fim = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(inicio) || Number.isNaN(fim)) return 0;
  return Math.round((fim - inicio) / 86_400_000);
}

/** `true` se a string é "yyyy-MM-dd" e representa um dia que existe. */
export function ehDataISOValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const t = Date.parse(`${valor}T00:00:00Z`);
  if (Number.isNaN(t)) return false;
  return new Date(t).toISOString().slice(0, 10) === valor;
}
