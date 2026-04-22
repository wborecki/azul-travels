/**
 * Fonte única de verdade para enums do schema.
 *
 * Todos os labels (PT-BR) e listas de opções para selects/filtros nascem
 * aqui — derivados diretamente de `Database["public"]["Enums"]` e
 * `Constants.public.Enums` (gerados pelo Supabase).
 *
 * Por que centralizar?
 *  - **Exaustividade**: cada label é `Record<EnumValue, string>`, sem
 *    `Record<string, string>` — o build quebra se o enum ganhar um valor
 *    novo no banco e a UI esquecer de traduzi-lo.
 *  - **Sem coerção**: helpers `is<Enum>` e `to<Enum>` substituem casts
 *    (`as Status`) com narrowing real em runtime.
 *  - **Sem duplicação**: não há mais arrays `["pendente", ...]` redigitados
 *    nos forms — tudo vem de `Constants.public.Enums.*`.
 *
 * Os guards em `types.guard.ts` travam o build se algum label divergir.
 */

import type { Database } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos derivados do schema
// ─────────────────────────────────────────────────────────────────────────────

export type EstabTipo = Database["public"]["Enums"]["estab_tipo"];
export type EstabStatus = Database["public"]["Enums"]["estab_status"];
export type ReservaStatus = Database["public"]["Enums"]["reserva_status"];
export type TeaNivel = Database["public"]["Enums"]["tea_nivel"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type ConteudoCategoria = Database["public"]["Enums"]["conteudo_categoria"];

// ─────────────────────────────────────────────────────────────────────────────
// Listas (readonly tuples) — use em forms, filtros, validações Zod
// ─────────────────────────────────────────────────────────────────────────────

/** Todos os tipos de estabelecimento, na ordem do enum do banco. */
export const ESTAB_TIPOS = Constants.public.Enums.estab_tipo;

/** Todos os status de estabelecimento, na ordem do enum do banco. */
export const ESTAB_STATUS = Constants.public.Enums.estab_status;

/** Todos os status de reserva, na ordem do enum do banco. */
export const RESERVA_STATUS = Constants.public.Enums.reserva_status;

/** Todos os níveis de TEA, na ordem do enum do banco. */
export const TEA_NIVEIS = Constants.public.Enums.tea_nivel;

/** Todos os roles, na ordem do enum do banco. */
export const APP_ROLES = Constants.public.Enums.app_role;

/** Todas as categorias de conteúdo, na ordem do enum do banco. */
export const CONTEUDO_CATEGORIAS = Constants.public.Enums.conteudo_categoria;

// ─────────────────────────────────────────────────────────────────────────────
// Labels (PT-BR) — exhaustive: build quebra se faltar valor
// ─────────────────────────────────────────────────────────────────────────────

export const ESTAB_TIPO_LABEL: Record<EstabTipo, string> = {
  hotel: "Hotel",
  pousada: "Pousada",
  resort: "Resort",
  restaurante: "Restaurante",
  parque: "Parque",
  atracoes: "Atração",
  agencia: "Agência",
  transporte: "Transporte",
};

export const ESTAB_STATUS_LABEL: Record<EstabStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  pendente: "Pendente",
};

export const RESERVA_STATUS_LABEL: Record<ReservaStatus, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  concluida: "Concluída",
};

export const TEA_NIVEL_LABEL: Record<TeaNivel, string> = {
  leve: "Leve",
  moderado: "Moderado",
  severo: "Severo",
};

export const APP_ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  user: "Usuário",
};

export const CONTEUDO_CATEGORIA_LABEL: Record<ConteudoCategoria, string> = {
  legislacao: "Legislação",
  dicas_viagem: "Dicas de viagem",
  boas_praticas: "Boas práticas",
  novidades: "Novidades",
  destinos: "Destinos",
};

// ─────────────────────────────────────────────────────────────────────────────
// Type guards (runtime narrowing — substituem `as EstabStatus` etc.)
// ─────────────────────────────────────────────────────────────────────────────

const ESTAB_TIPO_SET = new Set<string>(ESTAB_TIPOS);
const ESTAB_STATUS_SET = new Set<string>(ESTAB_STATUS);
const RESERVA_STATUS_SET = new Set<string>(RESERVA_STATUS);
const TEA_NIVEL_SET = new Set<string>(TEA_NIVEIS);
const APP_ROLE_SET = new Set<string>(APP_ROLES);
const CONTEUDO_CATEGORIA_SET = new Set<string>(CONTEUDO_CATEGORIAS);

export function isEstabTipo(v: unknown): v is EstabTipo {
  return typeof v === "string" && ESTAB_TIPO_SET.has(v);
}
export function isEstabStatus(v: unknown): v is EstabStatus {
  return typeof v === "string" && ESTAB_STATUS_SET.has(v);
}
export function isReservaStatus(v: unknown): v is ReservaStatus {
  return typeof v === "string" && RESERVA_STATUS_SET.has(v);
}
export function isTeaNivel(v: unknown): v is TeaNivel {
  return typeof v === "string" && TEA_NIVEL_SET.has(v);
}
export function isAppRole(v: unknown): v is AppRole {
  return typeof v === "string" && APP_ROLE_SET.has(v);
}
export function isConteudoCategoria(v: unknown): v is ConteudoCategoria {
  return typeof v === "string" && CONTEUDO_CATEGORIA_SET.has(v);
}

/**
 * Coerce com fallback — útil pra ler valores de URL/query string sem
 * recorrer a `as`. Se inválido, retorna `fallback`.
 */
export function toEstabStatus<F extends EstabStatus | undefined>(
  v: unknown,
  fallback: F,
): EstabStatus | F {
  return isEstabStatus(v) ? v : fallback;
}
export function toReservaStatus<F extends ReservaStatus | undefined>(
  v: unknown,
  fallback: F,
): ReservaStatus | F {
  return isReservaStatus(v) ? v : fallback;
}
export function toTeaNivel<F extends TeaNivel | undefined>(v: unknown, fallback: F): TeaNivel | F {
  return isTeaNivel(v) ? v : fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Listas para Selects (label + value) — atalho idiomático para `<Select>`
// ─────────────────────────────────────────────────────────────────────────────

export interface EnumOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

function makeOptions<T extends string>(
  values: ReadonlyArray<T>,
  labels: Record<T, string>,
): ReadonlyArray<EnumOption<T>> {
  return values.map((v) => ({ value: v, label: labels[v] }));
}

export const ESTAB_TIPO_OPTIONS = makeOptions(ESTAB_TIPOS, ESTAB_TIPO_LABEL);
export const ESTAB_STATUS_OPTIONS = makeOptions(ESTAB_STATUS, ESTAB_STATUS_LABEL);
export const RESERVA_STATUS_OPTIONS = makeOptions(RESERVA_STATUS, RESERVA_STATUS_LABEL);
export const TEA_NIVEL_OPTIONS = makeOptions(TEA_NIVEIS, TEA_NIVEL_LABEL);
export const CONTEUDO_CATEGORIA_OPTIONS = makeOptions(
  CONTEUDO_CATEGORIAS,
  CONTEUDO_CATEGORIA_LABEL,
);
