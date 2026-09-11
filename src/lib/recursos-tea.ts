import { Home, Brain, DoorOpen, FastForward, Utensils, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Os recursos TEA verificados de um estabelecimento.
 *
 * Declaração única, consumida pela página pública (`/estabelecimento/:slug`) e
 * pelo painel do dono. Diferente de `estrutura-tea.ts`, que é jsonb de
 * exibição, cada chave aqui é **coluna** de `estabelecimentos` - porque a busca
 * filtra por elas (ver `FILTROS_RECURSOS` em `explorar-search.ts`).
 *
 * É por serem filtro que a edição pelo dono só é liberada com Selo Azul ativo,
 * regra travada na trigger `protect_estabelecimentos_admin_columns`
 * (migration 20260804150000) e não apenas na tela.
 */
export interface RecursoTeaInfo {
  key: RecursoTeaKey;
  label: string;
  /** O que o local precisa ter de fato para marcar isto. */
  ajuda: string;
  icon: LucideIcon;
}

export type RecursoTeaKey =
  | "tem_sala_sensorial"
  | "tem_concierge_tea"
  | "tem_checkin_antecipado"
  | "tem_fila_prioritaria"
  | "tem_cardapio_visual"
  | "tem_caa";

export const RECURSOS_TEA: readonly RecursoTeaInfo[] = [
  {
    key: "tem_sala_sensorial",
    label: "Sala sensorial",
    ajuda: "Ambiente reservado, com pouco estímulo, para quem precisa se recuperar de uma crise.",
    icon: Home,
  },
  {
    key: "tem_concierge_tea",
    label: "Concierge TEA",
    ajuda: "Alguém da equipe treinado para acompanhar a família durante toda a visita.",
    icon: Brain,
  },
  {
    key: "tem_checkin_antecipado",
    label: "Check-in antecipado",
    ajuda: "Entrada fora do horário padrão para evitar o momento de maior movimento.",
    icon: DoorOpen,
  },
  {
    key: "tem_fila_prioritaria",
    label: "Fila prioritária",
    ajuda: "Atendimento sem espera em fila, sem precisar apresentar laudo a cada visita.",
    icon: FastForward,
  },
  {
    key: "tem_cardapio_visual",
    label: "Cardápio visual",
    ajuda: "Cardápio com fotos de cada item, usável por quem não lê ou não fala.",
    icon: Utensils,
  },
  {
    key: "tem_caa",
    label: "Comunicação alternativa (CAA)",
    ajuda: "Pranchas, cartões ou aplicativo de comunicação disponíveis no local.",
    icon: MessageSquare,
  },
];
