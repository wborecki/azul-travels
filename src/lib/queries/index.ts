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
  fetchEstabelecimentoPorId,
  fetchEstabelecimentoDetalhe,
  fetchEstabelecimentoDoOwner,
  fetchNomeResponsavelDoEstabelecimento,
  fetchEstabelecimentoProfile,
  fetchEstabelecimentoFullDoOwner,
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
  type EstabelecimentoDoOwner,
  type EstabelecimentoView,
  type EstabelecimentosViewFilters,
  type EstabelecimentosViewPage,
  type ResolvedPagination,
  type SeloFlag,
  type RecursoFlag,
  type Estabelecimento, // deprecated alias
  type EstabelecimentoCard, // deprecated alias
} from "./estabelecimentos";

// Helpers únicos de mídia (galeria + Tour 360°) - mesmo shape em
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
  fetchReservasDaFamiliaPorEstabelecimento,
  fetchReservaDaFamiliaPorId,
  criarReserva,
  vincularPerfisAReserva,
  perfisDaReserva,
  buildReservaPayload,
  type Reserva,
  type ReservaInsert,
  type ReservaComContexto,
  type ReservaFormInput,
  type PerfilDaReserva,
} from "./reservas";

export {
  fetchPerfisDaFamilia,
  fetchPerfisCompletos,
  criarPerfilSensorial,
  atualizarPerfilSensorial,
  excluirPerfilSensorial,
  uploadFotoPerfil,
  fetchNomeResponsavelDaFamilia,
  fetchTemPerfilSensorial,
  type PerfilSensorial,
  type PerfilSensorialInsert,
  type PerfilSensorialUpdate,
  type PerfilOption,
} from "./perfis";

// Camada do estabelecimento - reservas recebidas pelo local (dono).
export {
  fetchReservasDoEstabelecimento,
  fetchReservaDoEstabelecimentoPorId,
  atualizarStatusReservaEstabelecimento,
  registrarAuditoriaReservaEstabelecimento,
  perfisSensoriaisDaReservaEstab,
  type ReservaEstabelecimentoRow,
} from "./reservas-estabelecimento";

// Itens reserváveis do estabelecimento (quarto de hotel) - Fase 1.
export {
  fetchItensDoEstabelecimento,
  fetchItensAtivosDoEstabelecimento,
  fetchItemReservavelPorId,
  criarItemReservavel,
  atualizarItemReservavel,
  excluirItemReservavel,
  type ItemReservavel,
  type ItemReservavelInsert,
  type ItemReservavelUpdate,
} from "./itens-reservaveis";

// Disponibilidade pública do item (dias bloqueados/lotados) para o calendário.
export { fetchDatasIndisponiveisItem } from "./disponibilidade";

// Períodos em que um item reservável fica manualmente indisponível (manutenção etc.).
export {
  fetchBloqueiosDoItem,
  criarItemReservavelBloqueio,
  excluirItemReservavelBloqueio,
  type ItemReservavelBloqueio,
  type ItemReservavelBloqueioInsert,
} from "./item-reservavel-bloqueios";

// Thread de mensagens por reserva (estabelecimento ↔ família) - Fase 3.
export {
  fetchMensagensDaReserva,
  enviarMensagemReserva,
  marcarMensagensComoLidas,
  fetchContagemNaoLidasPorReservas,
  fetchUltimasMensagensPorReservas,
  type ReservaMensagemRow,
} from "./reserva-mensagens";

// Mapeadores Row → ViewModel - fonte única de derivações para a UI.
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

// Camada admin - listagens/joins do painel + dashboard counts.
// Toda leitura admin importa daqui (writes ficam inline nas rotas).
export {
  fetchEstabelecimentosAdmin,
  fetchEstabelecimentosAdminView,
  fetchEstabelecimentosAdminViewPaginated,
  fetchEstabelecimentoAdminPorId,
  fetchEstabelecimentoAdminDetalhe,
  fetchConteudosAdmin,
  fetchConteudosAdminPaginated,
  fetchConteudoAdminPorId,
  fetchReservasAdmin,
  fetchReservasAdminPaginated,
  fetchReservasAdminStatusCounts,
  fetchAuditoriaPorReserva,
  fetchUltimaObservacaoPorReservas,
  fetchAuditoriaAdminPaginated,
  fetchAuditoriaPorEstabelecimento,
  fetchEstabAuditoriaAdminPaginated,
  fetchPerfisSensoriaisDaFamilia,
  fetchAdminCounts,
  fetchDashboardStats,
  ESTAB_ADMIN_VIEW_SELECT,
  type EstabAdminRow,
  type EstabelecimentoAdminView,
  type EstabelecimentosAdminPage,
  type ConteudoAdminRow,
  type ConteudosAdminFilters,
  type ConteudosAdminPage,
  type ReservaAdminRow,
  type ReservasAdminFilters,
  type ReservasAdminPage,
  type AuditoriaRow,
  type AuditoriaAdminFilters,
  type AuditoriaAdminPage,
  type EstabAuditoriaRow,
  type EstabAuditoriaAdminFilters,
  type EstabAuditoriaAdminPage,
  type PerfilSensorialRow,
  type AdminCounts,
  type DashboardStats,
} from "./admin";

// Filtros padrão de exploração - preferências por usuário (1:1).
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
export { obterOuCriarLinkCurto, resolverLinkCurto, type LinkCurto } from "./links-curtos";
