/**
 * Camada central de payloads tipados.
 *
 * Toda página/componente da aplicação importa daqui:
 *
 *   import {
 *     fetchEstabelecimentoPorSlug,
 *     fetchEstabelecimentosView,
 *     fetchAvaliacoesPublicasPorEstab,
 *     type EstabelecimentoView,
 *     type EstabelecimentoFull,
 *     type AvaliacaoComFamilia,
 *   } from "@/lib/queries";
 *
 * Garante shape único, sem `any`/`unknown`. Os guards em
 * `src/integrations/supabase/types.guard.ts` travam o build se
 * qualquer um destes payloads regredir.
 */

export { fetchAvaliacoesPublicasPorEstab, type AvaliacaoComFamilia } from "./avaliacoes";

export {
  fetchEstabelecimentoPorSlug,
  fetchEstabelecimentoDetalhe,
  fetchEstabelecimentosView,
  fetchEstabelecimentosCards, // deprecated alias
  applyEstabelecimentosViewFilters,
  normalizeEstabelecimento,
  pickMediaFromView,
  ESTAB_VIEW_SELECT,
  type EstabelecimentoFull,
  type EstabelecimentoNormalized,
  type EstabelecimentoDetalhe,
  type EstabelecimentoView,
  type EstabelecimentosViewFilters,
  type SeloFlag,
  type RecursoFlag,
  type Estabelecimento, // deprecated alias
  type EstabelecimentoCard, // deprecated alias
} from "./estabelecimentos";

// Helpers únicos de mídia (galeria + Tour 360°) — mesmo shape em
// página de detalhe, card de listagem, form admin e embeds.
export {
  pickEstabMedia,
  normalizeFotos,
  normalizeUrl,
  type EstabMedia,
  type EstabMediaRow,
} from "../media";

export {
  fetchReservasDaFamilia,
  criarReserva,
  buildReservaPayload,
  type Reserva,
  type ReservaInsert,
  type ReservaComContexto,
  type ReservaFormInput,
} from "./reservas";

export {
  fetchPerfisDaFamilia,
  fetchPerfisCompletos,
  type PerfilSensorial,
  type PerfilSensorialInsert,
  type PerfilOption,
} from "./perfis";

// Mapeadores Row → ViewModel — fonte única de derivações para a UI.
export {
  mapAvaliacao,
  mapAvaliacoes,
  mapEstabCard,
  mapEstabCards,
  mapReserva,
  mapReservas,
  type AvaliacaoVM,
  type EstabCardVM,
  type ReservaVM,
  type RecursoKey,
} from "./mappers";

// Camada admin — listagens/joins do painel + dashboard counts.
// Toda leitura admin importa daqui (writes ficam inline nas rotas).
export {
  fetchEstabelecimentosAdmin,
  fetchEstabelecimentoAdminPorId,
  fetchConteudosAdmin,
  fetchConteudoAdminPorId,
  fetchReservasAdmin,
  fetchAuditoriaPorReserva,
  fetchPerfisSensoriaisDaFamilia,
  fetchAdminCounts,
  type EstabAdminRow,
  type ConteudoAdminRow,
  type ReservaAdminRow,
  type AuditoriaRow,
  type PerfilSensorialRow,
  type AdminCounts,
} from "./admin";
