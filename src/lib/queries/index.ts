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
  fetchEstabelecimentosViewPaginated,
  fetchEstabelecimentosCards, // deprecated alias
  applyEstabelecimentosViewFilters,
  resolvePagination,
  normalizeEstabelecimento,
  pickMediaFromView,
  ESTAB_VIEW_SELECT,
  ESTAB_PAGE_SIZE_DEFAULT,
  ESTAB_PAGE_SIZE_MAX,
  type EstabelecimentoFull,
  type EstabelecimentoNormalized,
  type EstabelecimentoDetalhe,
  type EstabelecimentoView,
  type EstabelecimentosViewFilters,
  type EstabelecimentosViewPage,
  type ResolvedPagination,
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

// Props tipadas de componentes (Card/Banner/Modal) derivadas dos VMs.
// Importe daqui ao tipar componentes que consomem dados do banco.
export type {
  EstabCardProps,
  AvaliacaoCardProps,
  ReservaCardProps,
  EstabBannerProps,
  ErrorBannerProps,
  EmptyBannerProps,
  CancelarReservaModalProps,
  AvaliacaoDetalheModalProps,
  EstabPreviewModalProps,
  WithRetry,
  WithOpenChange,
} from "./component-props";

// Camada admin — listagens/joins do painel + dashboard counts.
// Toda leitura admin importa daqui (writes ficam inline nas rotas).
export {
  fetchEstabelecimentosAdmin,
  fetchEstabelecimentosAdminView,
  fetchEstabelecimentoAdminPorId,
  fetchConteudosAdmin,
  fetchConteudoAdminPorId,
  fetchReservasAdmin,
  fetchAuditoriaPorReserva,
  fetchPerfisSensoriaisDaFamilia,
  fetchAdminCounts,
  ESTAB_ADMIN_VIEW_SELECT,
  type EstabAdminRow,
  type EstabelecimentoAdminView,
  type ConteudoAdminRow,
  type ReservaAdminRow,
  type AuditoriaRow,
  type PerfilSensorialRow,
  type AdminCounts,
} from "./admin";

// Filtros padrão de exploração — preferências por usuário (1:1).
export {
  fetchFiltrosPadrao,
  salvarFiltrosPadrao,
  limparFiltrosPadrao,
  temFiltrosSalvos,
  type FiltrosPadraoUI,
  type ExplorarFiltrosPadrao,
  type ExplorarFiltrosPadraoInsert,
} from "./explorar-filtros";

// Encurtador de URLs do /explorar.
export {
  obterOuCriarLinkCurto,
  resolverLinkCurto,
  type LinkCurto,
} from "./links-curtos";
