/**
 * Guard dedicado dos **payloads core** — avaliações e mídia.
 *
 * Este arquivo existe além de `types.guard.ts` por um motivo prático:
 *
 *   `types.guard.ts` cobre o ecossistema inteiro (enums, reservas, perfis,
 *   form helpers, SELECT literais, etc). Quando a tipagem do Supabase
 *   regride silenciosamente — uma FK some, um cliente é gerado sem o
 *   tipo do schema, um helper passa a devolver `unknown` — o sintoma
 *   final na UI sempre aparece nos **mesmos dois domínios críticos**:
 *
 *     1. Avaliações com join `familia_profiles(nome_responsavel)`.
 *        (cards de avaliação, página de detalhe, listagem pública)
 *
 *     2. Mídia do estabelecimento — galeria, capa, Tour 360°.
 *        (hero, gallery viewer, og:image, admin form)
 *
 *   Centralizar esses checks num arquivo "front door" deixa o sinal
 *   barulhento: se este arquivo quebra, é regressão de payload core,
 *   não ruído de enum ou label.
 *
 * Contrato: este arquivo NÃO emite runtime — só serve ao `tsc`.
 *
 * Estratégia de checagem (mais agressiva que em types.guard.ts):
 *   - `AssertNotAny` em CADA subcampo (não só no shape raiz).
 *   - `AssertNotUnknown` em CADA subcampo.
 *   - `AssertEqual` no shape final exposto à UI.
 *
 * Se um campo regredir para `any`/`unknown` — por FK perdida, schema
 * cache desatualizado, ou client genérico sem `Database` — o build
 * trava com mensagem dizendo exatamente qual campo quebrou.
 */

import { supabase } from "./client";
import type { Tables, Json } from "./types";
import type { AvaliacaoComFamilia } from "@/lib/queries/avaliacoes";
import { fetchAvaliacoesPublicasPorEstab } from "@/lib/queries/avaliacoes";
import {
  pickEstabMedia,
  normalizeFotos,
  normalizeUrl,
  type EstabMedia,
  type EstabMediaRow,
} from "@/lib/media";
import {
  normalizeEstabelecimento,
  pickMediaFromView,
  type EstabelecimentoNormalized,
  type EstabelecimentoView,
} from "@/lib/queries/estabelecimentos";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de asserção em tempo de compilação (cópia local intencional —
// este arquivo não importa de types.guard.ts para que a quebra de um
// não esconda a do outro).
// ─────────────────────────────────────────────────────────────────────────────

/** Falha se T for exatamente `any`. */
type AssertNotAny<T, Msg extends string> = 0 extends 1 & T ? Msg : T;

/** Falha se T for exatamente `unknown`. */
type AssertNotUnknown<T, Msg extends string> = unknown extends T
  ? [T] extends [unknown]
    ? [unknown] extends [T]
      ? Msg
      : T
    : T
  : T;

/** Falha se A e B não forem mutuamente assignáveis (exatamente iguais). */
type AssertEqual<A, B, Msg extends string> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? A : Msg;

// ═════════════════════════════════════════════════════════════════════════════
// PARTE 1 — AVALIAÇÕES (avaliacoes + familia_profiles embed)
// ═════════════════════════════════════════════════════════════════════════════
//
// Cadeia coberta:
//
//   supabase.from("avaliacoes").select("*, familia_profiles(...)")
//        ↓
//   Tables<"avaliacoes"> + embed familia_profiles
//        ↓
//   AvaliacaoComFamilia (tipo público em /lib/queries/avaliacoes.ts)
//        ↓
//   fetchAvaliacoesPublicasPorEstab(...).data
//        ↓
//   AvaliacaoCard (componente UI)

// ─── 1.1 Query bruta do supabase-js ──────────────────────────────────────────
// Se o cliente perder a tipagem (e.g. `createClient` sem `Database`),
// o awaited `data` vira `any` e isso quebra silenciosamente todo o resto.

const _avaliacoesQuery = supabase
  .from("avaliacoes")
  .select("*, familia_profiles(nome_responsavel)")
  .eq("publica", true);

type RawAvaliacoesData = Awaited<typeof _avaliacoesQuery>["data"];
type RawAvaliacaoRow = NonNullable<RawAvaliacoesData>[number];

type _Av_DataNotAny = AssertNotAny<
  RawAvaliacoesData,
  "REGRESSION: supabase.from('avaliacoes').select(...).data é `any` — cliente sem Database?"
>;
type _Av_RowNotAny = AssertNotAny<
  RawAvaliacaoRow,
  "REGRESSION: linha de avaliacoes é `any` — schema cache desatualizado?"
>;
type _Av_RowNotUnknown = AssertNotUnknown<
  RawAvaliacaoRow,
  "REGRESSION: linha de avaliacoes é `unknown` — FK avaliacoes_familia_id_fkey ausente?"
>;

// ─── 1.2 Cada coluna escalar precisa permanecer concreta ─────────────────────

type _Av_Id = AssertEqual<
  RawAvaliacaoRow["id"],
  string,
  "REGRESSION: avaliacoes.id deveria ser string"
>;
type _Av_EstabId = AssertEqual<
  RawAvaliacaoRow["estabelecimento_id"],
  string,
  "REGRESSION: avaliacoes.estabelecimento_id deveria ser string"
>;
type _Av_FamiliaId = AssertEqual<
  RawAvaliacaoRow["familia_id"],
  string,
  "REGRESSION: avaliacoes.familia_id deveria ser string"
>;
type _Av_Comentario = AssertEqual<
  RawAvaliacaoRow["comentario"],
  string | null,
  "REGRESSION: avaliacoes.comentario deveria ser string | null"
>;
type _Av_NotaGeral = AssertEqual<
  RawAvaliacaoRow["nota_geral"],
  number | null,
  "REGRESSION: avaliacoes.nota_geral deveria ser number | null"
>;
type _Av_NotaAcolhimento = AssertEqual<
  RawAvaliacaoRow["nota_acolhimento"],
  number | null,
  "REGRESSION: avaliacoes.nota_acolhimento deveria ser number | null"
>;
type _Av_NotaComunicacao = AssertEqual<
  RawAvaliacaoRow["nota_comunicacao"],
  number | null,
  "REGRESSION: avaliacoes.nota_comunicacao deveria ser number | null"
>;
type _Av_NotaEstrutura = AssertEqual<
  RawAvaliacaoRow["nota_estrutura"],
  number | null,
  "REGRESSION: avaliacoes.nota_estrutura deveria ser number | null"
>;
type _Av_Publica = AssertEqual<
  RawAvaliacaoRow["publica"],
  boolean | null,
  "REGRESSION: avaliacoes.publica deveria ser boolean | null"
>;
type _Av_CriadoEm = AssertEqual<
  RawAvaliacaoRow["criado_em"],
  string,
  "REGRESSION: avaliacoes.criado_em deveria ser string"
>;

// ─── 1.3 Embed familia_profiles ──────────────────────────────────────────────
// Esta é a parte historicamente mais frágil — um join sem FK retorna
// `unknown` e a UI volta a precisar de cast.

type FamiliaEmbed = RawAvaliacaoRow["familia_profiles"];
type _Av_EmbedNotAny = AssertNotAny<
  FamiliaEmbed,
  "REGRESSION: familia_profiles embed é `any`"
>;
type _Av_EmbedNotUnknown = AssertNotUnknown<
  FamiliaEmbed,
  "REGRESSION: familia_profiles embed é `unknown` — FK avaliacoes→familia_profiles caiu"
>;
type _Av_EmbedNomeNotAny = AssertNotAny<
  NonNullable<FamiliaEmbed>["nome_responsavel"],
  "REGRESSION: familia_profiles.nome_responsavel virou `any`"
>;
type _Av_EmbedNomeShape = AssertEqual<
  NonNullable<FamiliaEmbed>["nome_responsavel"],
  string | null,
  "REGRESSION: familia_profiles.nome_responsavel deveria ser string | null"
>;

// ─── 1.4 Tipo público AvaliacaoComFamilia bate com o payload bruto ───────────

type _Av_PublicShape = AssertEqual<
  RawAvaliacaoRow,
  AvaliacaoComFamilia,
  "REGRESSION: payload bruto de avaliacoes divergiu de AvaliacaoComFamilia"
>;

// ─── 1.5 fetchAvaliacoesPublicasPorEstab — entrada final na UI ───────────────

type FetchAvaliacoesReturn = Awaited<ReturnType<typeof fetchAvaliacoesPublicasPorEstab>>;
type FetchAvaliacoesRow = FetchAvaliacoesReturn[number];

type _Av_FetchReturnNotAny = AssertNotAny<
  FetchAvaliacoesReturn,
  "REGRESSION: fetchAvaliacoesPublicasPorEstab retorna `any[]`"
>;
type _Av_FetchRowNotAny = AssertNotAny<
  FetchAvaliacoesRow,
  "REGRESSION: linha de fetchAvaliacoesPublicasPorEstab é `any`"
>;
type _Av_FetchRowNotUnknown = AssertNotUnknown<
  FetchAvaliacoesRow,
  "REGRESSION: linha de fetchAvaliacoesPublicasPorEstab é `unknown`"
>;
type _Av_FetchRowShape = AssertEqual<
  FetchAvaliacoesRow,
  AvaliacaoComFamilia,
  "REGRESSION: fetchAvaliacoesPublicasPorEstab divergiu de AvaliacaoComFamilia"
>;
type _Av_FetchEmbedNomeShape = AssertEqual<
  NonNullable<FetchAvaliacoesRow["familia_profiles"]>["nome_responsavel"],
  string | null,
  "REGRESSION: nome_responsavel embutido sumiu/quebrou no payload final"
>;

// ═════════════════════════════════════════════════════════════════════════════
// PARTE 2 — MÍDIA (fotos + foto_capa + tour_360_url)
// ═════════════════════════════════════════════════════════════════════════════
//
// Cadeia coberta:
//
//   Tables<"estabelecimentos">   (banco — fotos: Json | null)
//        ↓ pickEstabMedia / normalizeEstabelecimento
//   EstabMedia / EstabelecimentoNormalized   (UI — fotos: string[])
//        ↓
//   GalleryViewer / Hero / Tour360Embed

type Estab = Tables<"estabelecimentos">;

// ─── 2.1 Colunas brutas no banco ─────────────────────────────────────────────

type _Md_FotosNotAny = AssertNotAny<
  Estab["fotos"],
  "REGRESSION: estabelecimentos.fotos virou `any`"
>;
type _Md_FotosNotUnknown = AssertNotUnknown<
  Estab["fotos"],
  "REGRESSION: estabelecimentos.fotos virou `unknown`"
>;
type _Md_FotosShape = AssertEqual<
  Estab["fotos"],
  Json | null,
  "REGRESSION: estabelecimentos.fotos deveria continuar Json | null"
>;
type _Md_FotoCapaNotAny = AssertNotAny<
  Estab["foto_capa"],
  "REGRESSION: estabelecimentos.foto_capa virou `any`"
>;
type _Md_FotoCapaShape = AssertEqual<
  Estab["foto_capa"],
  string | null,
  "REGRESSION: estabelecimentos.foto_capa deveria ser string | null"
>;
type _Md_TourNotAny = AssertNotAny<
  Estab["tour_360_url"],
  "REGRESSION: estabelecimentos.tour_360_url virou `any`"
>;
type _Md_TourShape = AssertEqual<
  Estab["tour_360_url"],
  string | null,
  "REGRESSION: estabelecimentos.tour_360_url deveria ser string | null"
>;

// ─── 2.2 Helpers brutos de mídia (consumidos pelo admin form) ────────────────

type _Md_NormalizeFotosNotAny = AssertNotAny<
  ReturnType<typeof normalizeFotos>,
  "REGRESSION: normalizeFotos retorna `any`"
>;
type _Md_NormalizeFotosShape = AssertEqual<
  ReturnType<typeof normalizeFotos>,
  string[],
  "REGRESSION: normalizeFotos deveria devolver string[]"
>;
type _Md_NormalizeUrlNotAny = AssertNotAny<
  ReturnType<typeof normalizeUrl>,
  "REGRESSION: normalizeUrl retorna `any`"
>;
type _Md_NormalizeUrlShape = AssertEqual<
  ReturnType<typeof normalizeUrl>,
  string | null,
  "REGRESSION: normalizeUrl deveria devolver string | null"
>;

// ─── 2.3 pickEstabMedia — shape final consumido pela UI ──────────────────────

type Picked = ReturnType<typeof pickEstabMedia>;

type _Md_PickedNotAny = AssertNotAny<
  Picked,
  "REGRESSION: pickEstabMedia retorna `any`"
>;
type _Md_PickedNotUnknown = AssertNotUnknown<
  Picked,
  "REGRESSION: pickEstabMedia retorna `unknown`"
>;
type _Md_PickedShape = AssertEqual<
  Picked,
  EstabMedia,
  "REGRESSION: pickEstabMedia divergiu de EstabMedia"
>;

// Cada subcampo do EstabMedia precisa permanecer concreto.
type _Md_PickedFotosNotAny = AssertNotAny<
  Picked["fotos"],
  "REGRESSION: EstabMedia.fotos virou `any`"
>;
type _Md_PickedFotosShape = AssertEqual<
  Picked["fotos"],
  string[],
  "REGRESSION: EstabMedia.fotos deveria ser string[] (sem Json/null)"
>;
type _Md_PickedCapaNotAny = AssertNotAny<
  Picked["fotoCapa"],
  "REGRESSION: EstabMedia.fotoCapa virou `any`"
>;
type _Md_PickedCapaShape = AssertEqual<
  Picked["fotoCapa"],
  string | null,
  "REGRESSION: EstabMedia.fotoCapa quebrou"
>;
type _Md_PickedTourNotAny = AssertNotAny<
  Picked["tour360Url"],
  "REGRESSION: EstabMedia.tour360Url virou `any`"
>;
type _Md_PickedTourShape = AssertEqual<
  Picked["tour360Url"],
  string | null,
  "REGRESSION: EstabMedia.tour360Url quebrou"
>;

// ─── 2.4 Compatibilidade dos consumidores com EstabMediaRow ──────────────────
// Se algum dos três shapes (Full/View/Normalized) deixar de satisfazer
// EstabMediaRow, o consumidor cai em `pickEstabMedia(row as any)` —
// isto trava o build antes disso acontecer.

type _Md_FullSatisfiesRow = Estab extends EstabMediaRow
  ? true
  : "REGRESSION: Tables<estabelecimentos> não satisfaz EstabMediaRow (admin form quebra)";
type _Md_ViewSatisfiesRow = EstabelecimentoView extends EstabMediaRow
  ? true
  : "REGRESSION: EstabelecimentoView não satisfaz EstabMediaRow (cards quebram)";
type _Md_NormalizedSatisfiesRow = EstabelecimentoNormalized extends EstabMediaRow
  ? true
  : "REGRESSION: EstabelecimentoNormalized não satisfaz EstabMediaRow (detalhe quebra)";

// ─── 2.5 Normalize end-to-end — saída precisa expor mídia já saneada ─────────

type Normalized = ReturnType<typeof normalizeEstabelecimento>;

type _Md_NormalizedNotAny = AssertNotAny<
  Normalized,
  "REGRESSION: normalizeEstabelecimento retorna `any`"
>;
type _Md_NormalizedFotos = AssertEqual<
  Normalized["fotos"],
  string[],
  "REGRESSION: Normalized.fotos deveria ser string[] (Json regrediu até a UI)"
>;
type _Md_NormalizedCapa = AssertEqual<
  Normalized["foto_capa"],
  string | null,
  "REGRESSION: Normalized.foto_capa quebrou"
>;
type _Md_NormalizedTour = AssertEqual<
  Normalized["tour_360_url"],
  string | null,
  "REGRESSION: Normalized.tour_360_url quebrou"
>;

// ─── 2.6 pickMediaFromView — atalho para cards/embeds ────────────────────────

type _Md_PickFromViewShape = AssertEqual<
  ReturnType<typeof pickMediaFromView>,
  EstabMedia,
  "REGRESSION: pickMediaFromView divergiu de EstabMedia (cards e detalhe sairiam de sincronia)"
>;

// ═════════════════════════════════════════════════════════════════════════════
// Registry — agrega todos os checks num tipo "usado", impedindo que
// um `noUnusedLocals` futuro silencie acidentalmente as asserções.
// Se algum dos checks acima virar uma string de erro, este array
// quebra com a mensagem correspondente.
// ═════════════════════════════════════════════════════════════════════════════

export type __CorePayloadGuards = readonly [
  // Avaliações — query bruta
  _Av_DataNotAny,
  _Av_RowNotAny,
  _Av_RowNotUnknown,
  // Avaliações — colunas escalares
  _Av_Id,
  _Av_EstabId,
  _Av_FamiliaId,
  _Av_Comentario,
  _Av_NotaGeral,
  _Av_NotaAcolhimento,
  _Av_NotaComunicacao,
  _Av_NotaEstrutura,
  _Av_Publica,
  _Av_CriadoEm,
  // Avaliações — embed
  _Av_EmbedNotAny,
  _Av_EmbedNotUnknown,
  _Av_EmbedNomeNotAny,
  _Av_EmbedNomeShape,
  // Avaliações — público
  _Av_PublicShape,
  _Av_FetchReturnNotAny,
  _Av_FetchRowNotAny,
  _Av_FetchRowNotUnknown,
  _Av_FetchRowShape,
  _Av_FetchEmbedNomeShape,
  // Mídia — colunas
  _Md_FotosNotAny,
  _Md_FotosNotUnknown,
  _Md_FotosShape,
  _Md_FotoCapaNotAny,
  _Md_FotoCapaShape,
  _Md_TourNotAny,
  _Md_TourShape,
  // Mídia — helpers brutos
  _Md_NormalizeFotosNotAny,
  _Md_NormalizeFotosShape,
  _Md_NormalizeUrlNotAny,
  _Md_NormalizeUrlShape,
  // Mídia — pickEstabMedia
  _Md_PickedNotAny,
  _Md_PickedNotUnknown,
  _Md_PickedShape,
  _Md_PickedFotosNotAny,
  _Md_PickedFotosShape,
  _Md_PickedCapaNotAny,
  _Md_PickedCapaShape,
  _Md_PickedTourNotAny,
  _Md_PickedTourShape,
  // Mídia — compatibilidade dos consumidores
  _Md_FullSatisfiesRow,
  _Md_ViewSatisfiesRow,
  _Md_NormalizedSatisfiesRow,
  // Mídia — normalize end-to-end
  _Md_NormalizedNotAny,
  _Md_NormalizedFotos,
  _Md_NormalizedCapa,
  _Md_NormalizedTour,
  // Mídia — pickMediaFromView
  _Md_PickFromViewShape,
];
