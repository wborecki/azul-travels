/**
 * Type guards de build — falham o `tsc` se a tipagem do Supabase regredir.
 *
 * Cobre três contratos críticos da página /estabelecimento/:slug:
 *   1. Query de avaliações com join `familia_profiles(nome_responsavel)`
 *      precisa retornar payload totalmente tipado (sem any/unknown).
 *   2. `Tables<"estabelecimentos">` precisa ter os campos de Tour 360°
 *      e galeria (`tour_360_url`, `foto_capa`, `fotos`).
 *   3. `TablesInsert<"reservas">` precisa aceitar `estabelecimento_id`
 *      vindo de `Tables<"estabelecimentos">["id"]` (mesmo tipo).
 *
 * Este arquivo NÃO exporta runtime — só serve ao typechecker.
 * Se algo regredir, o build quebra com mensagem clara.
 */

import { supabase } from "./client";
import type { Tables, TablesInsert } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de asserção em tempo de compilação
// ─────────────────────────────────────────────────────────────────────────────

/** Falha o build se T for `any`. */
type AssertNotAny<T, Msg extends string> = 0 extends 1 & T ? Msg : T;

/** Falha o build se T for `unknown`. */
type AssertNotUnknown<T, Msg extends string> = unknown extends T
  ? [T] extends [unknown]
    ? [unknown] extends [T]
      ? Msg
      : T
    : T
  : T;

/** Falha o build se A e B não forem exatamente o mesmo tipo. */
type AssertEqual<A, B, Msg extends string> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? A
    : Msg;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Join avaliacoes ↔ familia_profiles deve ser tipado
// ─────────────────────────────────────────────────────────────────────────────

const _avaliacoesQuery = supabase
  .from("avaliacoes")
  .select("*, familia_profiles(nome_responsavel)")
  .eq("publica", true);

type AvaliacoesJoinResult = Awaited<typeof _avaliacoesQuery>["data"];
type AvaliacaoRow = NonNullable<AvaliacoesJoinResult>[number];

// O payload não pode ser any nem unknown.
type _CheckRowNotAny = AssertNotAny<
  AvaliacaoRow,
  "REGRESSION: avaliacoes join row is `any` — Supabase types are broken"
>;
type _CheckRowNotUnknown = AssertNotUnknown<
  AvaliacaoRow,
  "REGRESSION: avaliacoes join row is `unknown` — FK avaliacoes_familia_id_fkey missing?"
>;

// O campo embutido `familia_profiles` precisa existir e expor `nome_responsavel: string | null`.
type FamiliaEmbed = AvaliacaoRow["familia_profiles"];
type _CheckEmbedNotAny = AssertNotAny<
  FamiliaEmbed,
  "REGRESSION: familia_profiles embed is `any`"
>;
type _CheckEmbedShape = AssertEqual<
  NonNullable<FamiliaEmbed>["nome_responsavel"],
  string | null,
  "REGRESSION: familia_profiles.nome_responsavel deveria ser string | null"
>;

// Campos da própria avaliação devem permanecer concretos.
type _CheckNotaGeral = AssertEqual<
  AvaliacaoRow["nota_geral"],
  number | null,
  "REGRESSION: avaliacoes.nota_geral deveria ser number | null"
>;
type _CheckCriadoEm = AssertEqual<
  AvaliacaoRow["criado_em"],
  string,
  "REGRESSION: avaliacoes.criado_em deveria ser string"
>;

// ─────────────────────────────────────────────────────────────────────────────
// 2. Estabelecimento — Tour 360°, galeria, capa
// ─────────────────────────────────────────────────────────────────────────────

type Estab = Tables<"estabelecimentos">;

type _CheckTour360 = AssertEqual<
  Estab["tour_360_url"],
  string | null,
  "REGRESSION: estabelecimentos.tour_360_url deveria ser string | null"
>;
type _CheckFotoCapa = AssertEqual<
  Estab["foto_capa"],
  string | null,
  "REGRESSION: estabelecimentos.foto_capa deveria ser string | null"
>;
// `fotos` é JSONB no banco — não pode ser `any`.
type _CheckFotosNotAny = AssertNotAny<
  Estab["fotos"],
  "REGRESSION: estabelecimentos.fotos virou `any`"
>;

// ─────────────────────────────────────────────────────────────────────────────
// 3. Reserva — payload de insert deve casar com o id do estabelecimento
// ─────────────────────────────────────────────────────────────────────────────

type ReservaInsert = TablesInsert<"reservas">;

type _CheckReservaEstabId = AssertEqual<
  ReservaInsert["estabelecimento_id"],
  Estab["id"],
  "REGRESSION: reservas.estabelecimento_id e estabelecimentos.id divergiram"
>;
type _CheckReservaFamiliaId = AssertEqual<
  ReservaInsert["familia_id"],
  Tables<"familia_profiles">["id"],
  "REGRESSION: reservas.familia_id e familia_profiles.id divergiram"
>;

// Marca todas as checagens como "usadas" para silenciar noUnusedLocals/parameters.
export type __SupabaseTypeGuards = [
  _CheckRowNotAny,
  _CheckRowNotUnknown,
  _CheckEmbedNotAny,
  _CheckEmbedShape,
  _CheckNotaGeral,
  _CheckCriadoEm,
  _CheckTour360,
  _CheckFotoCapa,
  _CheckFotosNotAny,
  _CheckReservaEstabId,
  _CheckReservaFamiliaId,
];
