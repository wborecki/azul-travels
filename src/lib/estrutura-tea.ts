import {
  Moon,
  UtensilsCrossed,
  MessageSquareText,
  FastForward,
  Waves,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

/**
 * Itens de estrutura sensorial editáveis em `/meu-estabelecimento` (seção
 * "Estrutura física"). Persistidos como `estabelecimento_profiles.estrutura`
 * (jsonb `{ [key]: boolean }`) e espelhados em `estabelecimentos.estrutura`
 * para leitura pública (ver `ESTRUTURA_PUBLICA` abaixo).
 */
export const ESTRUTURA_ITEMS: Array<[string, string]> = [
  ["quartos_silenciosos", "Quartos silenciosos disponíveis"],
  ["iluminacao_regulavel", "Iluminação regulável nos quartos"],
  ["area_escape_sensorial", "Área de descanso/escape sensorial"],
  ["cardapio_seletividade", "Cardápio com opções para seletividade"],
  ["comunicacao_visual", "Comunicação visual no estabelecimento"],
  ["entrada_sem_filas", "Entrada sem filas disponível"],
  ["piscina_horarios_reservados", "Área de piscina com horários reservados"],
  ["equipe_treinada_tea", "Equipe com algum treinamento em TEA"],
];

export interface EstruturaPublicaItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Subconjunto de `ESTRUTURA_ITEMS` exibido publicamente na página do quarto -
 * itens que falam do estabelecimento como um todo (não do quarto em si),
 * por isso "quartos_silenciosos" e "iluminacao_regulavel" ficam de fora.
 */
export const ESTRUTURA_PUBLICA: EstruturaPublicaItem[] = [
  { key: "area_escape_sensorial", label: "Área de descanso/escape sensorial", icon: Moon },
  {
    key: "cardapio_seletividade",
    label: "Cardápio com opções para seletividade",
    icon: UtensilsCrossed,
  },
  {
    key: "comunicacao_visual",
    label: "Comunicação visual no estabelecimento",
    icon: MessageSquareText,
  },
  { key: "entrada_sem_filas", label: "Entrada sem filas disponível", icon: FastForward },
  { key: "piscina_horarios_reservados", label: "Área de piscina com horários reservados", icon: Waves },
  { key: "equipe_treinada_tea", label: "Equipe com treinamento em TEA", icon: GraduationCap },
];
