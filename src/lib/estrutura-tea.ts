import {
  Armchair,
  BedDouble,
  Car,
  ClipboardList,
  FastForward,
  GraduationCap,
  Headphones,
  HeartHandshake,
  LifeBuoy,
  Lightbulb,
  MapPin,
  MessageSquareText,
  Moon,
  Users,
  UtensilsCrossed,
  VolumeX,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { categoriaDoTipo, type EstabCategoria, type EstabTipo } from "@/lib/enums";

/**
 * Itens de estrutura de acolhimento, declarados **por categoria**.
 *
 * Persistidos como `estabelecimento_profiles.estrutura` (jsonb
 * `{ [key]: boolean }`) e espelhados em `estabelecimentos.estrutura` para
 * leitura pública. Como é jsonb, mudar as chaves aqui não exige migration.
 *
 * Duas invariantes moram na forma do módulo, não em convenção:
 *
 *  - **Um rótulo por chave.** As listas de categoria referenciam chaves do
 *    `CATALOGO`, então `equipe_treinada_tea` lê igual num hotel e numa van.
 *    Chave compartilhada entre categorias é proposital.
 *  - **Nenhuma categoria sem lista.** `Record<EstabCategoria, ...>` quebra o
 *    build quando uma categoria nova entra em `enums.ts` - que é o que impede
 *    a lista de hotel de vazar por omissão para um restaurante.
 *
 * A leitura é sempre pela lista da categoria, nunca pelas chaves do jsonb
 * gravado. Um local que marcou algo antes desta separação mantém o dado, mas
 * só exibe o que pertence à sua categoria. Nada é apagado.
 */

export interface EstruturaItem {
  key: string;
  label: string;
  icon: LucideIcon;
  /**
   * O item descreve o quarto, não o estabelecimento. A página do quarto já
   * descreve o quarto por outros meios, então lá ele não se repete.
   */
  doQuarto?: boolean;
}

const CATALOGO = {
  // Comuns a mais de uma categoria
  equipe_treinada_tea: { label: "Equipe com algum treinamento em TEA", icon: GraduationCap },
  comunicacao_visual: { label: "Comunicação visual no local", icon: MessageSquareText },
  area_escape_sensorial: { label: "Área de descanso/escape sensorial", icon: Moon },
  entrada_sem_filas: { label: "Entrada sem filas disponível", icon: FastForward },
  cardapio_seletividade: { label: "Cardápio com opções para seletividade", icon: UtensilsCrossed },
  ambiente_ruido_controlado: { label: "Ambiente com ruído controlado", icon: VolumeX },
  roteiro_visual_antecipado: {
    label: "Roteiro visual enviado com antecedência",
    icon: ClipboardList,
  },

  // Hospedagem
  quartos_silenciosos: {
    label: "Quartos silenciosos disponíveis",
    icon: BedDouble,
    doQuarto: true,
  },
  iluminacao_regulavel: {
    label: "Iluminação regulável nos quartos",
    icon: Lightbulb,
    doQuarto: true,
  },
  piscina_horarios_reservados: { label: "Área de piscina com horários reservados", icon: Waves },

  // Gastronomia
  mesa_afastada_fluxo: { label: "Mesa afastada do fluxo, a pedido", icon: Armchair },

  // Passeios
  grupo_reduzido: { label: "Grupos reduzidos ou horário exclusivo", icon: Users },
  protetor_auricular: { label: "Protetor auricular disponível no local", icon: Headphones },

  // Transporte
  veiculo_exclusivo: { label: "Veículo exclusivo para a família", icon: Car },
  paradas_sob_demanda: { label: "Paradas extras sob demanda", icon: MapPin },

  // Planejamento
  conversa_previa_familia: { label: "Conversa prévia com a família", icon: HeartHandshake },
  acompanhamento_na_viagem: { label: "Acompanhamento durante a viagem", icon: LifeBuoy },
} satisfies Record<string, Omit<EstruturaItem, "key">>;

export type EstruturaKey = keyof typeof CATALOGO;

const POR_CATEGORIA: Record<EstabCategoria, readonly EstruturaKey[]> = {
  hospedagem: [
    "quartos_silenciosos",
    "iluminacao_regulavel",
    "area_escape_sensorial",
    "cardapio_seletividade",
    "comunicacao_visual",
    "entrada_sem_filas",
    "piscina_horarios_reservados",
    "equipe_treinada_tea",
  ],
  gastronomia: [
    "ambiente_ruido_controlado",
    "mesa_afastada_fluxo",
    "cardapio_seletividade",
    "area_escape_sensorial",
    "comunicacao_visual",
    "entrada_sem_filas",
    "equipe_treinada_tea",
  ],
  passeios: [
    "grupo_reduzido",
    "roteiro_visual_antecipado",
    "protetor_auricular",
    "area_escape_sensorial",
    "comunicacao_visual",
    "entrada_sem_filas",
    "equipe_treinada_tea",
  ],
  transporte: [
    "veiculo_exclusivo",
    "paradas_sob_demanda",
    "ambiente_ruido_controlado",
    "comunicacao_visual",
    "equipe_treinada_tea",
  ],
  planejamento: [
    "conversa_previa_familia",
    "roteiro_visual_antecipado",
    "acompanhamento_na_viagem",
    "equipe_treinada_tea",
  ],
};

function montar(keys: readonly EstruturaKey[]): readonly EstruturaItem[] {
  return keys.map((key) => ({ key, ...CATALOGO[key] }));
}

/** Itens de acolhimento visíveis para cada categoria, na ordem de exibição. */
export const ESTRUTURA_ITEMS: Record<EstabCategoria, readonly EstruturaItem[]> = {
  hospedagem: montar(POR_CATEGORIA.hospedagem),
  gastronomia: montar(POR_CATEGORIA.gastronomia),
  passeios: montar(POR_CATEGORIA.passeios),
  transporte: montar(POR_CATEGORIA.transporte),
  planejamento: montar(POR_CATEGORIA.planejamento),
};

/** Atalho para quem tem o tipo do estabelecimento em mãos, não a categoria. */
export function estruturaDoTipo(tipo: EstabTipo): readonly EstruturaItem[] {
  return ESTRUTURA_ITEMS[categoriaDoTipo(tipo)];
}

/**
 * Os itens marcados que devem aparecer na página do **quarto** - a lista da
 * categoria menos o que já é dito pelo próprio quarto.
 */
export function estruturaDoQuarto(
  tipo: EstabTipo,
  estrutura: Record<string, boolean>,
): readonly EstruturaItem[] {
  return estruturaDoTipo(tipo).filter((i) => !i.doQuarto && estrutura[i.key]);
}

/** Os itens marcados que aparecem na página do **estabelecimento**. */
export function estruturaAtiva(
  tipo: EstabTipo,
  estrutura: Record<string, boolean>,
): readonly EstruturaItem[] {
  return estruturaDoTipo(tipo).filter((i) => estrutura[i.key]);
}
