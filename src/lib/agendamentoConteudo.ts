/**
 * Helpers para o agendamento de publicação de artigos.
 *
 * O admin escolhe data/hora **no fuso de Brasília (America/Sao_Paulo)**
 * — independente do fuso do navegador. Convertemos para UTC ISO antes
 * de gravar em `conteudo_tea.publicar_em` e voltamos para o input local
 * BRT ao editar.
 *
 * Implementação: derivamos o offset atual de São Paulo via Intl
 * (`-03:00` em horário padrão; futuramente `-02:00` se voltar o DST).
 */

const ZONE = "America/Sao_Paulo";

/** Offset (minutos) de America/Sao_Paulo em relação ao UTC para uma data. */
function spOffsetMinutes(date: Date): number {
  // Usa Intl para extrair os componentes locais em SP, depois recria como UTC
  // e compara com o instante real → diferença = offset em minutos.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) % 24,
    Number(map.minute),
    Number(map.second),
  );
  return Math.round((asUtc - date.getTime()) / 60000);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Converte um instante UTC (ISO) para o formato `YYYY-MM-DDTHH:mm`
 * **no fuso de Brasília**, pronto para `<input type="datetime-local">`.
 */
export function isoToBrtInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const offsetMin = spOffsetMinutes(d);
  const local = new Date(d.getTime() + offsetMin * 60000);
  return [
    local.getUTCFullYear(),
    "-",
    pad(local.getUTCMonth() + 1),
    "-",
    pad(local.getUTCDate()),
    "T",
    pad(local.getUTCHours()),
    ":",
    pad(local.getUTCMinutes()),
  ].join("");
}

/**
 * Converte o valor do `<input type="datetime-local">` (interpretado em
 * BRT) para um ISO UTC pronto para gravar em `publicar_em`.
 *
 * Retorna `null` se a string for vazia/inválida.
 */
export function brtInputValueToIso(value: string): string | null {
  if (!value) return null;
  // value = "YYYY-MM-DDTHH:mm" — interpretamos como horário local de SP.
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  // Trata como UTC primeiro, depois subtrai o offset de SP no instante alvo.
  const naiveUtc = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    0,
  );
  // O offset depende do próprio instante; iteramos uma vez para estabilizar.
  let offset = spOffsetMinutes(new Date(naiveUtc));
  let real = naiveUtc - offset * 60000;
  // Reavalia (cobre virada de DST, raríssimo em SP atualmente).
  const offset2 = spOffsetMinutes(new Date(real));
  if (offset2 !== offset) {
    offset = offset2;
    real = naiveUtc - offset * 60000;
  }
  return new Date(real).toISOString();
}

/** Formata um ISO para exibição amigável no fuso de Brasília. */
export function formatBrtDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Estados possíveis de publicação para um artigo. */
export type PublicacaoEstado = "rascunho" | "agendado" | "publicado";

export function derivarEstado(args: {
  publicado: boolean;
  publicar_em: string | null;
}): PublicacaoEstado {
  if (args.publicado) return "publicado";
  if (args.publicar_em && new Date(args.publicar_em).getTime() > Date.now()) {
    return "agendado";
  }
  return "rascunho";
}
