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

export {
  fetchAvaliacoesPublicasPorEstab,
  type AvaliacaoComFamilia,
} from "./avaliacoes";

export {
  fetchEstabelecimentoPorSlug,
  fetchEstabelecimentosView,
  fetchEstabelecimentosCards, // deprecated alias
  applyEstabelecimentosViewFilters,
  ESTAB_VIEW_SELECT,
  type EstabelecimentoFull,
  type EstabelecimentoView,
  type EstabelecimentosViewFilters,
  type SeloFlag,
  type RecursoFlag,
  type Estabelecimento, // deprecated alias
  type EstabelecimentoCard, // deprecated alias
} from "./estabelecimentos";

export {
  fetchReservasDaFamilia,
  criarReserva,
  type Reserva,
  type ReservaInsert,
  type ReservaComContexto,
} from "./reservas";

export {
  fetchPerfisDaFamilia,
  fetchPerfisCompletos,
  type PerfilSensorial,
  type PerfilSensorialInsert,
  type PerfilOption,
} from "./perfis";
