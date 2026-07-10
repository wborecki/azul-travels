export const ESTADOS_BR = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
] as const;

/**
 * @deprecated Re-exporta `ESTAB_TIPO_LABEL` de `@/lib/enums` para
 * compatibilidade. Em código novo, importe direto de `@/lib/enums`:
 *
 *   import { ESTAB_TIPO_LABEL } from "@/lib/enums";
 *
 * O tipo agora é `Record<EstabTipo, string>` (exhaustive), não
 * `Record<string, string>`.
 */
export { ESTAB_TIPO_LABEL as TIPO_LABEL } from "./enums";

export function formatDateBR(date: string | Date | null | undefined) {
  if (!date) return "";
  // Strings "yyyy-MM-dd" (colunas `date` do Postgres, sem hora) são
  // interpretadas pelo `new Date(string)` nativo como meia-noite UTC - em
  // fusos negativos (Brasil, UTC-3) isso volta um dia ao converter para
  // local, exibindo 19/07 para um check-in de 20/07. `parseDataISO`
  // constrói a data em hora local, então usamos ela para esse caso.
  const local = typeof date === "string" ? parseDataISO(date) : null;
  if (local) return local.toLocaleDateString("pt-BR");
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

/**
 * Faz o parse de uma data "yyyy-MM-dd" (formato usado em query params de
 * URL) para `Date`, validando que a string é bem formada e representa uma
 * data real (rejeita "2026-02-30", por exemplo, em vez de deixar o
 * `Date` fazer o rollover automático para março).
 */
export function parseDataISO(valor: string | undefined | null): Date | null {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }
  return data;
}

export function formatDataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Inteiro vindo de um query param (número ou string), maior ou igual a `minimo`, senão `undefined`. */
export function parseInteiroUrl(valor: unknown, minimo: number): number | undefined {
  const n = typeof valor === "number" ? valor : typeof valor === "string" ? Number(valor) : NaN;
  return Number.isInteger(n) && n >= minimo ? n : undefined;
}
