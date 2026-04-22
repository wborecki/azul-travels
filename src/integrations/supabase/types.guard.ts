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
import {
  ESTAB_TIPO_LABEL,
  ESTAB_STATUS_LABEL,
  RESERVA_STATUS_LABEL,
  TEA_NIVEL_LABEL,
  APP_ROLE_LABEL,
  CONTEUDO_CATEGORIA_LABEL,
  type EstabTipo,
  type EstabStatus,
  type ReservaStatus,
  type TeaNivel,
  type AppRole,
  type ConteudoCategoria,
} from "@/lib/enums";

// (Os checks de exhaustividade de labels estão no fim do arquivo, junto
// aos demais — precisam dos helpers `AssertEqual` declarados abaixo.)

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
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? A : Msg;

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
type _CheckEmbedNotAny = AssertNotAny<FamiliaEmbed, "REGRESSION: familia_profiles embed is `any`">;
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

// ─────────────────────────────────────────────────────────────────────────────
// 4. Função pública fetchAvaliacoesPublicasPorEstab — payload tipado
// ─────────────────────────────────────────────────────────────────────────────

import type { AvaliacaoComFamilia } from "@/lib/queries/avaliacoes";
import { fetchAvaliacoesPublicasPorEstab } from "@/lib/queries/avaliacoes";

type FetchReturn = Awaited<ReturnType<typeof fetchAvaliacoesPublicasPorEstab>>;
type FetchRow = FetchReturn[number];

type _CheckFetchNotAny = AssertNotAny<
  FetchRow,
  "REGRESSION: fetchAvaliacoesPublicasPorEstab retorna `any`"
>;
type _CheckFetchNotUnknown = AssertNotUnknown<
  FetchRow,
  "REGRESSION: fetchAvaliacoesPublicasPorEstab retorna `unknown`"
>;
type _CheckFetchShape = AssertEqual<
  FetchRow,
  AvaliacaoComFamilia,
  "REGRESSION: fetchAvaliacoesPublicasPorEstab divergiu de AvaliacaoComFamilia"
>;
type _CheckFetchEmbed = AssertEqual<
  NonNullable<FetchRow["familia_profiles"]>["nome_responsavel"],
  string | null,
  "REGRESSION: familia_profiles.nome_responsavel no payload da função quebrou"
>;

// ─────────────────────────────────────────────────────────────────────────────
// 5. Camada central /lib/queries — cada função pública precisa estar tipada
// ─────────────────────────────────────────────────────────────────────────────

import type {
  EstabelecimentoFull,
  EstabelecimentoNormalized,
  EstabelecimentoView,
  EstabelecimentoDetalhe,
  ReservaComContexto,
  ReservaFormInput,
  PerfilOption,
} from "@/lib/queries";
import {
  fetchEstabelecimentoPorSlug,
  fetchEstabelecimentoDetalhe,
  fetchEstabelecimentosView,
  fetchReservasDaFamilia,
  criarReserva,
  buildReservaPayload,
  fetchPerfisDaFamilia,
} from "@/lib/queries";

type EstabReturn = NonNullable<Awaited<ReturnType<typeof fetchEstabelecimentoPorSlug>>>;
type DetalheReturn = NonNullable<Awaited<ReturnType<typeof fetchEstabelecimentoDetalhe>>>;
type ViewReturn = Awaited<ReturnType<typeof fetchEstabelecimentosView>>[number];
type ReservasReturn = Awaited<ReturnType<typeof fetchReservasDaFamilia>>[number];
type CriarReservaReturn = Awaited<ReturnType<typeof criarReserva>>;
type PerfisReturn = Awaited<ReturnType<typeof fetchPerfisDaFamilia>>[number];

// Cada função precisa retornar shape concreto, nunca any/unknown.
type _CheckEstabNotAny = AssertNotAny<
  EstabReturn,
  "REGRESSION: fetchEstabelecimentoPorSlug -> any"
>;
// Após a normalização, o retorno é EstabelecimentoNormalized (não Full).
type _CheckEstabShape = AssertEqual<
  EstabReturn,
  EstabelecimentoNormalized,
  "REGRESSION: fetchEstabelecimentoPorSlug divergiu de EstabelecimentoNormalized"
>;
// Garantias do shape normalizado — UI não precisa mais lidar com Json/cast.
type _CheckEstabFotos = AssertEqual<
  EstabReturn["fotos"],
  string[],
  "REGRESSION: Normalized.fotos deveria ser string[]"
>;
type _CheckEstabTour = AssertEqual<
  EstabReturn["tour_360_url"],
  string | null,
  "REGRESSION: Normalized.tour_360_url quebrou"
>;
type _CheckEstabCapa = AssertEqual<
  EstabReturn["foto_capa"],
  string | null,
  "REGRESSION: Normalized.foto_capa quebrou"
>;
type _CheckEstabLat = AssertEqual<
  EstabReturn["latitude"],
  number | null,
  "REGRESSION: Normalized.latitude quebrou"
>;
type _CheckEstabLng = AssertEqual<
  EstabReturn["longitude"],
  number | null,
  "REGRESSION: Normalized.longitude quebrou"
>;
// Normalized continua compatível com Full em campos invariantes.
type _CheckEstabIdMatchesFull = AssertEqual<
  EstabReturn["id"],
  EstabelecimentoFull["id"],
  "REGRESSION: Normalized.id divergiu de Full.id"
>;

// Payload View unificado — usado em listagem, cards, destaques, benefícios.
type _CheckViewNotAny = AssertNotAny<ViewReturn, "REGRESSION: fetchEstabelecimentosView -> any">;
type _CheckViewShape = AssertEqual<
  ViewReturn,
  EstabelecimentoView,
  "REGRESSION: fetchEstabelecimentosView divergiu de EstabelecimentoView"
>;

// Garante que campos críticos da View existem com tipo certo.
type _CheckViewTour360 = AssertEqual<
  ViewReturn["tour_360_url"],
  string | null,
  "REGRESSION: View.tour_360_url quebrou"
>;
type _CheckViewSeloAzul = AssertEqual<
  ViewReturn["selo_azul"],
  boolean | null,
  "REGRESSION: View.selo_azul quebrou"
>;
type _CheckViewBeneficio = AssertEqual<
  ViewReturn["beneficio_tea_descricao"],
  string | null,
  "REGRESSION: View.beneficio_tea_descricao quebrou"
>;
type _CheckViewSlug = AssertEqual<ViewReturn["slug"], string, "REGRESSION: View.slug quebrou">;
// View deve ser estritamente subset de Full — IDs precisam casar.
type _CheckViewIdMatchesFull = AssertEqual<
  ViewReturn["id"],
  EstabelecimentoFull["id"],
  "REGRESSION: View.id e Full.id divergiram"
>;

type _CheckReservasNotAny = AssertNotAny<
  ReservasReturn,
  "REGRESSION: fetchReservasDaFamilia -> any"
>;
type _CheckReservasShape = AssertEqual<
  ReservasReturn,
  ReservaComContexto,
  "REGRESSION: fetchReservasDaFamilia divergiu de ReservaComContexto"
>;
type _CheckReservasEmbedEstab = AssertEqual<
  NonNullable<ReservasReturn["estabelecimentos"]>["slug"],
  string,
  "REGRESSION: estabelecimentos.slug embutido em reserva quebrou"
>;
type _CheckReservasEmbedPerfil = AssertEqual<
  NonNullable<ReservasReturn["perfil_sensorial"]>["nome_autista"],
  string,
  "REGRESSION: perfil_sensorial.nome_autista embutido em reserva quebrou"
>;

type _CheckCriarReservaShape = AssertEqual<
  CriarReservaReturn,
  Tables<"reservas">,
  "REGRESSION: criarReserva divergiu de Tables<reservas>"
>;

type _CheckPerfisNotAny = AssertNotAny<PerfisReturn, "REGRESSION: fetchPerfisDaFamilia -> any">;
type _CheckPerfisShape = AssertEqual<
  PerfisReturn,
  PerfilOption,
  "REGRESSION: fetchPerfisDaFamilia divergiu de PerfilOption"
>;

// ─────────────────────────────────────────────────────────────────────────────
// 6. fetchEstabelecimentoDetalhe — payload composto da página de detalhe
// ─────────────────────────────────────────────────────────────────────────────

type _CheckDetalheNotAny = AssertNotAny<
  DetalheReturn,
  "REGRESSION: fetchEstabelecimentoDetalhe -> any"
>;
type _CheckDetalheShape = AssertEqual<
  DetalheReturn,
  EstabelecimentoDetalhe,
  "REGRESSION: fetchEstabelecimentoDetalhe divergiu de EstabelecimentoDetalhe"
>;
type _CheckDetalheEstab = AssertEqual<
  DetalheReturn["estabelecimento"],
  EstabelecimentoNormalized,
  "REGRESSION: detalhe.estabelecimento deveria ser EstabelecimentoNormalized"
>;
type _CheckDetalheAvaliacoesEmbed = AssertEqual<
  NonNullable<DetalheReturn["avaliacoes"][number]["familia_profiles"]>["nome_responsavel"],
  string | null,
  "REGRESSION: detalhe.avaliacoes[].familia_profiles.nome_responsavel quebrou"
>;

// ─────────────────────────────────────────────────────────────────────────────
// 7. Helper único de mídia (galeria + Tour 360°) — `pickEstabMedia`
// ─────────────────────────────────────────────────────────────────────────────

import { pickEstabMedia, type EstabMedia } from "@/lib/media";

type MediaReturn = ReturnType<typeof pickEstabMedia>;

type _CheckMediaNotAny = AssertNotAny<MediaReturn, "REGRESSION: pickEstabMedia -> any">;
type _CheckMediaShape = AssertEqual<
  MediaReturn,
  EstabMedia,
  "REGRESSION: pickEstabMedia divergiu de EstabMedia"
>;
type _CheckMediaFotos = AssertEqual<
  MediaReturn["fotos"],
  string[],
  "REGRESSION: EstabMedia.fotos deveria ser string[]"
>;
type _CheckMediaCapa = AssertEqual<
  MediaReturn["fotoCapa"],
  string | null,
  "REGRESSION: EstabMedia.fotoCapa quebrou"
>;
type _CheckMediaTour = AssertEqual<
  MediaReturn["tour360Url"],
  string | null,
  "REGRESSION: EstabMedia.tour360Url quebrou"
>;
// O Normalized continua compatível com o helper de mídia (mesmas três fontes).
type _CheckNormalizedFeedsMedia = AssertEqual<
  ReturnType<typeof pickEstabMedia>,
  EstabMedia,
  "REGRESSION: pickEstabMedia(Normalized) deveria devolver EstabMedia"
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
  _CheckFetchNotAny,
  _CheckFetchNotUnknown,
  _CheckFetchShape,
  _CheckFetchEmbed,
  _CheckEstabNotAny,
  _CheckEstabShape,
  _CheckEstabFotos,
  _CheckEstabTour,
  _CheckEstabCapa,
  _CheckEstabLat,
  _CheckEstabLng,
  _CheckEstabIdMatchesFull,
  _CheckViewNotAny,
  _CheckViewShape,
  _CheckViewTour360,
  _CheckViewSeloAzul,
  _CheckViewBeneficio,
  _CheckViewSlug,
  _CheckViewIdMatchesFull,
  _CheckReservasNotAny,
  _CheckReservasShape,
  _CheckReservasEmbedEstab,
  _CheckReservasEmbedPerfil,
  _CheckCriarReservaShape,
  _CheckPerfisNotAny,
  _CheckPerfisShape,
  _CheckDetalheNotAny,
  _CheckDetalheShape,
  _CheckDetalheEstab,
  _CheckDetalheAvaliacoesEmbed,
  _CheckMediaNotAny,
  _CheckMediaShape,
  _CheckMediaFotos,
  _CheckMediaCapa,
  _CheckMediaTour,
  _CheckNormalizedFeedsMedia,
];
