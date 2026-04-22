/**
 * Props tipadas de componentes — derivadas dos View Models centrais.
 *
 * Esta camada existe para que **nenhum componente declare suas próprias
 * props ad-hoc** quando o dado vem de um payload do Supabase. Em vez
 * disso, derivamos as props diretamente de `AvaliacaoVM`, `EstabCardVM`,
 * `ReservaVM` (de `./mappers`).
 *
 * Vantagens:
 *  - Você nunca passa um campo que o VM não tem (TS rejeita).
 *  - Renomear um campo no mapper quebra TODOS os componentes que o
 *    consomem — em build, não em produção.
 *  - Componentes "Banner"/"Modal" novos podem usar `Pick`/`Omit` em
 *    cima do VM e ganhar tipagem forte de graça.
 *
 * Regra: se a prop é **apenas dado** vinda do banco, ela vem daqui.
 * Props de UI (`className`, `onClick`, `variant`, etc.) continuam
 * sendo declaradas localmente em cada componente.
 */

import type { AvaliacaoVM, EstabCardVM, ReservaVM } from "./mappers";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

/** Slot opcional para handlers/callbacks comuns a vários componentes. */
export interface WithRetry {
  onRetry?: () => void;
}

/** Slot opcional para componentes que controlam abertura (modal/dialog). */
export interface WithOpenChange {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Cards
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Props do `EstabCard` — exige o VM completo. Não aceitar a row crua
 * evita que um caller esqueça de chamar `mapEstabCard` antes.
 */
export interface EstabCardProps {
  vm: EstabCardVM;
  /** Quantos badges de recurso exibir (default: 3). */
  maxRecursos?: number;
}

/**
 * Props de um item de avaliação dentro de listas (card por avaliação).
 * Vem direto do VM — `AvaliacaoCardProps["avaliacao"]` === `AvaliacaoVM`.
 */
export interface AvaliacaoCardProps {
  avaliacao: AvaliacaoVM;
}

/** Props da linha/card de reserva no painel da família. */
export interface ReservaCardProps {
  reserva: ReservaVM;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Banners (faixas horizontais com CTA)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Banner de destaque para um estabelecimento (hero, faixa promocional).
 * Usa apenas o subset visível em formato banner — não precisa dos
 * recursos sensoriais nem dos selos secundários.
 */
export type EstabBannerProps = Pick<
  EstabCardVM,
  "id" | "slug" | "nome" | "tipoLabel" | "localidade" | "media" | "temBeneficioTea"
>;

/**
 * Banner de erro genérico (carregamento de avaliações, lista de estabs,
 * etc.). Compatível com `WithRetry`.
 */
export interface ErrorBannerProps extends WithRetry {
  /** Título curto do erro (ex.: "Não foi possível carregar"). */
  title: string;
  /** Mensagem detalhada — geralmente `error.message`. */
  message: string;
}

/** Banner vazio — usado quando uma listagem retorna 0 itens. */
export interface EmptyBannerProps {
  /** Mensagem amigável para o usuário. */
  message: string;
  /** Texto opcional do CTA (ex.: "Explorar destinos"). */
  ctaLabel?: string;
  /** Handler do CTA (omitido = sem botão). */
  onCtaClick?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Modais
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Modal de confirmação de cancelamento de reserva. Recebe o VM
 * inteiro para exibir nome do estab + período no corpo do modal.
 */
export interface CancelarReservaModalProps extends WithOpenChange {
  reserva: ReservaVM;
  onConfirm: (reservaId: string) => void | Promise<void>;
}

/**
 * Modal de detalhe de avaliação (expand do card). VM completo —
 * permite mostrar comentário longo + nota + responsável.
 */
export interface AvaliacaoDetalheModalProps extends WithOpenChange {
  avaliacao: AvaliacaoVM;
}

/**
 * Modal de pré-visualização rápida de um estabelecimento (hover/click
 * no mapa, por exemplo). Subset enxuto do card.
 */
export type EstabPreviewModalProps = WithOpenChange &
  Pick<EstabCardVM, "id" | "slug" | "nome" | "tipoLabel" | "localidade" | "media">;
