import { Building2, Images, Phone, ShieldCheck, Sparkles, Text, type LucideIcon } from "lucide-react";
import { estruturaDoTipo, type EstruturaItem } from "@/lib/estrutura-tea";
import { isEstabTipo } from "@/lib/enums";
import type { RecursoTeaKey } from "@/lib/recursos-tea";

/**
 * O modelo do formulário de perfil do estabelecimento.
 *
 * Fica aqui, e não junto do componente, porque a rota também consome `SECOES`
 * para calcular o progresso no painel - e porque a declaração de seções é o
 * lugar onde se responde "o que ainda falta preencher" sem abrir tela nenhuma.
 *
 * Um rascunho único cobre duas tabelas: o questionário do Selo Azul mora em
 * `estabelecimento_profiles`, o conteúdo público em `estabelecimentos`, e
 * "Identidade" escreve nas duas. Quem faz esse roteamento é `salvarSecao` em
 * `meu-estabelecimento.index.tsx`; aqui só se declara o que cada seção contém.
 */

export type SecaoId =
  | "identidade"
  | "descricao"
  | "fotos"
  | "contato"
  | "acolhimento"
  | "certificacao";

export type Estrutura = Record<string, boolean>;
export type RecursosTea = Record<RecursoTeaKey, boolean>;

export interface PerfilDraft {
  nome: string;
  tipo: string;
  endereco: string;
  cidade: string;
  estado: string;
  latitude: string;
  longitude: string;
  website: string;
  num_colaboradores: string;
  descricao: string;
  descricao_tea: string;
  telefone: string;
  email: string;
  tour_360_url: string;
  recebe_grupos_escolares_tea: boolean;
  /** Galeria pública. A posição 0 é a capa. */
  fotos: string[];
  estrutura: Estrutura;
  /** Colunas filtráveis - só editáveis com Selo Azul ativo. */
  recursos: RecursosTea;
  tem_beneficio_tea: boolean;
  beneficio_tea_descricao: string;
  iniciativa_atual: string;
  num_capacitacao: string;
  contato_preferido: string;
  observacoes: string;
}

const RECURSOS_VAZIOS: RecursosTea = {
  tem_sala_sensorial: false,
  tem_concierge_tea: false,
  tem_checkin_antecipado: false,
  tem_fila_prioritaria: false,
  tem_cardapio_visual: false,
  tem_caa: false,
};

export const EMPTY_DRAFT: PerfilDraft = {
  nome: "",
  tipo: "",
  endereco: "",
  cidade: "",
  estado: "",
  latitude: "",
  longitude: "",
  website: "",
  num_colaboradores: "",
  descricao: "",
  descricao_tea: "",
  telefone: "",
  email: "",
  tour_360_url: "",
  recebe_grupos_escolares_tea: false,
  fotos: [],
  estrutura: {},
  recursos: { ...RECURSOS_VAZIOS },
  tem_beneficio_tea: false,
  beneficio_tea_descricao: "",
  iniciativa_atual: "",
  num_capacitacao: "",
  contato_preferido: "",
  observacoes: "",
};

export const COLAB_OPTS = ["1-5", "6-15", "16-30", "31-50", "50+"];

export const INICIATIVA_OPTS: Array<[string, string]> = [
  ["estruturado", "Sim, temos algo estruturado"],
  ["informal", "Temos adaptações informais"],
  ["queremos_comecar", "Ainda não, mas queremos começar"],
  ["sem_direcao", "Não sei por onde começar"],
];

export const CONTATO_OPTS: Array<[string, string]> = [
  ["whatsapp", "WhatsApp"],
  ["email", "E-mail"],
  ["ligacao", "Ligação"],
];

export interface SecaoInfo {
  id: SecaoId;
  label: string;
  icon: LucideIcon;
  /** O que a seção é, em uma linha - vira o subtítulo do cabeçalho. */
  ajuda: string;
  /** Valor atual, mostrado no rail para o dono não precisar abrir a seção. */
  resumo: (d: PerfilDraft) => string;
  pendente: (d: PerfilDraft) => boolean;
  /** Campos do rascunho - usados para detectar alteração não salva. */
  campos: ReadonlyArray<keyof PerfilDraft>;
  /**
   * Seções que gravam em `estabelecimentos` só funcionam depois que a linha
   * existe, e ela nasce no primeiro salvamento de "Identidade".
   */
  exigeEstab: boolean;
}

/**
 * A lista de acolhimento depende da categoria, e a categoria vem do tipo. Antes
 * do tipo escolhido não há lista - o que só acontece com "Identidade" ainda
 * pendente, então a seção já aparece incompleta pelo motivo certo.
 */
export function estruturaDoDraft(d: PerfilDraft): readonly EstruturaItem[] {
  return isEstabTipo(d.tipo) ? estruturaDoTipo(d.tipo) : [];
}

function contaEstrutura(d: PerfilDraft): number {
  return estruturaDoDraft(d).filter((i) => d.estrutura[i.key]).length;
}

export const SECOES: readonly SecaoInfo[] = [
  {
    id: "identidade",
    label: "Identidade",
    icon: Building2,
    ajuda: "Nome, tipo e onde você fica. É o que a família vê primeiro na busca.",
    resumo: (d) => d.nome.trim() || "Sem nome",
    pendente: (d) =>
      !d.nome.trim() ||
      !d.tipo ||
      !d.endereco.trim() ||
      !d.cidade.trim() ||
      !d.estado.trim() ||
      !d.latitude.trim() ||
      !d.longitude.trim(),
    campos: [
      "nome",
      "tipo",
      "endereco",
      "cidade",
      "estado",
      "latitude",
      "longitude",
      "website",
      "num_colaboradores",
    ],
    exigeEstab: false,
  },
  {
    id: "descricao",
    label: "Descrição",
    icon: Text,
    ajuda: "O texto que apresenta o local e o que vocês fazem por famílias atípicas.",
    resumo: (d) =>
      d.descricao.trim() ? `${d.descricao.trim().length} caracteres` : "Nada preenchido",
    pendente: (d) => !d.descricao.trim(),
    campos: ["descricao", "descricao_tea"],
    exigeEstab: true,
  },
  {
    id: "fotos",
    label: "Fotos",
    icon: Images,
    ajuda: "A galeria pública do local. A primeira foto é a capa do seu card.",
    resumo: (d) =>
      d.fotos.length === 0
        ? "Nenhuma foto"
        : `${d.fotos.length} ${d.fotos.length === 1 ? "foto" : "fotos"}`,
    pendente: (d) => d.fotos.length === 0,
    campos: ["fotos", "tour_360_url"],
    exigeEstab: true,
  },
  {
    id: "contato",
    label: "Contato",
    icon: Phone,
    ajuda: "Como a família fala com vocês quando não há reserva pela plataforma.",
    resumo: (d) => d.telefone.trim() || d.email.trim() || "Sem telefone",
    pendente: (d) => !d.telefone.trim() && !d.email.trim(),
    campos: ["telefone", "email", "contato_preferido"],
    exigeEstab: true,
  },
  {
    id: "acolhimento",
    label: "Acolhimento TEA",
    icon: ShieldCheck,
    ajuda: "O que o local oferece de fato para receber uma pessoa autista.",
    resumo: (d) => {
      const total = estruturaDoDraft(d).length;
      return total === 0 ? "Escolha o tipo primeiro" : `${contaEstrutura(d)} de ${total} itens`;
    },
    pendente: (d) => contaEstrutura(d) === 0,
    campos: [
      "estrutura",
      "recursos",
      "tem_beneficio_tea",
      "beneficio_tea_descricao",
      "recebe_grupos_escolares_tea",
    ],
    exigeEstab: true,
  },
  {
    id: "certificacao",
    label: "Certificação",
    icon: Sparkles,
    ajuda: "Suas respostas para a equipe do Selo Azul. Não aparecem na página pública.",
    resumo: (d) => INICIATIVA_OPTS.find(([v]) => v === d.iniciativa_atual)?.[1] ?? "Não respondido",
    pendente: (d) => !d.iniciativa_atual,
    campos: ["iniciativa_atual", "num_capacitacao", "observacoes"],
    exigeEstab: true,
  },
];
